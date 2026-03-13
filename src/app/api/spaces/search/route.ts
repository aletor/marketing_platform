import { NextRequest, NextResponse } from 'next/server';
const { image_search } = require('duckduckgo-images-api');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

    console.log(`[Search API] Searching images for: ${query}...`);
    
    // Perform search (limit to 10 for speed and stability)
    const results = await image_search({ query, moderate: true });
    
    // Filter and map to simple URLs
    const urls = results
      .slice(0, 10)
      .map((r: any) => r.image)
      .filter((u: string) => u && u.startsWith('http'));

    console.log(`[Search API] Found ${urls.length} images.`);

    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error('[Search API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
