import { NextResponse } from 'next/server';
const gis = require('g-i-s');

const searchGoogleImages = (query: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.warn(`[Search API] Search timeout for: "${query}"`);
      resolve([]);
    }, 8000);

    gis(query, (error: any, results: any[]) => {
      clearTimeout(timer);
      if (error) {
        console.error(`[Search API] GIS Error for "${query}":`, error);
        resolve([]);
      } else {
        resolve(results || []);
      }
    });
  });
};

export async function POST(req: Request) {
  try {
    const { query, limit = 5 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log(`[Search API] Searching for: "${query}" (limit: ${limit})`);
    const searchResults = await searchGoogleImages(query);
    
    const urls = searchResults
      .map((r: any) => r.url)
      .filter((u: any) => {
        if (!u || typeof u !== 'string') return false;
        return u.startsWith('http') && !u.includes('lookaside.fbsbx.com');
      })
      .slice(0, limit);

    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
