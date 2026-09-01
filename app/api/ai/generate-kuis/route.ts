import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';
import { SystemSetting } from '@/models';
import { connectDB } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topik, jumlahSoal = 5 } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GROQ_API_KEY belum dikonfigurasi di .env.local' 
      }, { status: 500 });
    }

    if (!topik) {
      return NextResponse.json({ error: 'Topik wajib diisi' }, { status: 400 });
    }

    await connectDB();
    const modelSetting = await SystemSetting.findOne({ key: 'ai_text_model' }).lean() as any;
    const textModel = modelSetting?.value || 'groq/compound';

    const prompt = `Buatlah ${jumlahSoal} soal pilihan ganda tentang "${topik}" dalam format JSON murni. 
    Setiap soal harus memiliki field: 
    - id (string unik)
    - pertanyaan (string)
    - opsi (objek dengan field A, B, C, D, E)
    - jawaban_benar (karakter A/B/C/D/E)
    
    Pastikan output hanya berupa array JSON saja, tanpa markdown code block, tanpa penjelasan tambahan.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: textModel,
        messages: [
          { role: "system", content: "You are a teacher assistant that output valid JSON arrays of multiple choice questions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        stream: false,
        response_format: {
          type: "json_object"
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API Error:', data);
      return NextResponse.json({ 
        error: `Groq API Error: ${data.error?.message || 'Unknown error'}` 
      }, { status: response.status });
    }

    let textOutput = data.choices?.[0]?.message?.content;

    if (!textOutput) {
      throw new Error('Groq tidak memberikan respon yang valid');
    }

    // Bersihkan kemungkinan code block markdown jika ada
    const jsonString = textOutput.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(jsonString);
    
    // Groq dengan json_object sering membungkus dalam key tertentu atau langsung array
    const questions = Array.isArray(parsedData) ? parsedData : (parsedData.questions || parsedData.soal || Object.values(parsedData)[0]);

    if (!Array.isArray(questions)) {
        throw new Error('Format JSON dari AI tidak sesuai (harus Array)');
    }

    return NextResponse.json(questions);
  } catch (error: any) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/ai/generate-kuis/route.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    console.error('AI Generate error:', error);
    return NextResponse.json({ error: 'Gagal membuat soal otomatis: ' + error.message }, { status: 500 });
  }
}
