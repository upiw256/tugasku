'use server'

import * as cheerio from 'cheerio';

export async function getLinkMetadataAction(url: string) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const response = await fetch(url, { 
        next: { revalidate: 3600 },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') || 
                  $('title').text() || 
                  $('meta[name="twitter:title"]').attr('content');
                  
    const description = $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="description"]').attr('content') ||
                        $('meta[name="twitter:description"]').attr('content');
                        
    const image = $('meta[property="og:image"]').attr('content') || 
                  $('meta[name="twitter:image"]').attr('content');

    return { 
        title: title?.substring(0, 100), 
        description: description?.substring(0, 200), 
        image,
        url
    };
  } catch (error) {
    console.error("Metadata error:", error);
    return null;
  }
}
