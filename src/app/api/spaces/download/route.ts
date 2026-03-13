import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { base64, filename, format } = await req.json();

    if (!base64) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Extract the actual base64 data (strip the prefix)
    const base64Data = base64.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const finalFilename = filename || `AI_Composition_${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;

    return new Response(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${finalFilename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Download API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
