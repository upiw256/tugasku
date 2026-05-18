import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { topik, jumlahSoal = 5, imageBase64 } = body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GROQ_API_KEY belum dikonfigurasi di .env.local' 
      }, { status: 500 });
    }

    if (!topik) {
      return NextResponse.json({ error: 'Topik wajib diisi' }, { status: 400 });
    }

    // Instruksi sistem untuk model LLaMA Vision
    const prompt = `Buatlah ${jumlahSoal} soal pilihan ganda tentang "${topik}" (berdasarkan gambar terlampir jika ada). 
    PENTING: Jawab HANYA menggunakan array JSON murni. Jangan tambahkan kata pembuka/penutup.
    Setiap soal dalam array harus memiliki field berikut:
    {
      "id": "string unik",
      "pertanyaan": "string pertanyaan lengkap",
      "opsi": {
        "A": "string", "B": "string", "C": "string", "D": "string", "E": "string"
      },
      "jawaban_benar": "A", // Hanya satu karakter A/B/C/D/E
      "image_prompt": "Prompt bahasa inggris deskriptif untuk menghasilkan gambar ilustrasi soal (contoh: 'A realistic apple falling from a tree vector art'). Jika tidak perlu gambar, kosongkan."
    }`;

    // LLaMA Vision tidak men-support response_format: {"type":"json_object"} saat ini, 
    // Jadi kita gunakan prompt ketat.
    
    let messages: any[] = [];
    
    if (imageBase64) {
      // Jika ada gambar, format pesannya berbeda
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { 
              type: "image_url", 
              image_url: { 
                url: imageBase64 // "data:image/jpeg;base64,..."
              } 
            }
          ]
        }
      ];
    } else {
      messages = [
        { role: "system", content: "You are a teacher assistant that output valid JSON arrays." },
        { role: "user", content: prompt }
      ];
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: imageBase64 ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.5,
        stream: false,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Groq API Error:', data);
      return NextResponse.json({ 
        error: `API AI (Groq) Error: ${data.error?.message || 'Unknown error'}` 
      }, { status: response.status });
    }

    let textOutput = data.choices?.[0]?.message?.content;

    if (!textOutput) {
      throw new Error('AI tidak memberikan respon yang valid');
    }

    // Bersihkan code block markdown
    const jsonString = textOutput.substring(
       textOutput.indexOf('['),
       textOutput.lastIndexOf(']') + 1
    ) || textOutput.replace(/```json|```/g, '').trim();

    const parsedData = JSON.parse(jsonString || "[]");
    
    // Normalize hasil Groq menjadi array tunggal
    const questions = Array.isArray(parsedData) ? parsedData : (parsedData.questions || parsedData.soal || Object.values(parsedData)[0]);

    if (!Array.isArray(questions)) {
        throw new Error('Format JSON dari AI tidak sesuai, coba lagi.');
    }

    // Pastikan folder public/uploads ada
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Folder mungkin sudah ada
    }

    // Mengunduh dan menyimpan gambar secara asynchronous
    const finalQuestions = await Promise.all(questions.map(async (q: any) => {
      if (q.image_prompt && q.image_prompt.trim() !== '') {
        try {
          const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(q.image_prompt)}?width=800&height=400&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
          const imgRes = await fetch(pollinationsUrl);
          
          if (imgRes.ok) {
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            const uniqueName = `ai-img-${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;
            const filePath = path.join(uploadDir, uniqueName);
            
            await writeFile(filePath, buffer);
            q.gambar_url = `/uploads/${uniqueName}`;
          }
        } catch (e) {
          console.error("Gagal mendownload gambar AI:", e);
        }
      }
      return q;
    }));

    return NextResponse.json(finalQuestions);
  } catch (error: any) {
    console.error('AI Generate Vision error:', error);
    return NextResponse.json({ error: 'Gagal membuat soal otomatis: ' + error.message }, { status: 500 });
  }
}
