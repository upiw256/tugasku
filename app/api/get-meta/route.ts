import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logAktivitasSiswa } from '@/lib/log-aktivitas';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });

  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(data);

    const meta = {
      title: $('meta[property="og:title"]').attr('content') || $('title').text(),
      description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content'),
      image: $('meta[property="og:image"]').attr('content'),
      url: url
    };

    return NextResponse.json(meta);
  } catch (error) {
    await logAktivitasSiswa({ aksi: `System Error (${'D:/Js/tugasku/app/api/get-meta/route.ts'}): ${(error as any)?.message || String(error)}`, tipe: 'error' }).catch(() => {});

    return NextResponse.json({ error: 'Failed to fetch meta' }, { status: 500 });
  }
}