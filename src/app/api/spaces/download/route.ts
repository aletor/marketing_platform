import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Handle both JSON and Form Data (forms send URL-encoded/form-data)
    let base64, filename, format;
    
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      base64 = body.base64;
      filename = body.filename;
      format = body.format;
    } else {
      const formData = await req.formData();
      base64 = formData.get('base64') as string;
      filename = formData.get('filename') as string;
      format = formData.get('format') as string;
    }

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
