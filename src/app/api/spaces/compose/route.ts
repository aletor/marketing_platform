import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const layersJson = body.get('layers') as string;
    const format = (body.get('format') as string) || 'png';
    const filename = (body.get('filename') as string) || `Composition_${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    const width = parseInt(body.get('width') as string) || 1920;
    const height = parseInt(body.get('height') as string) || 1080;

    const layers = JSON.parse(layersJson);

    console.log(`[Compose API] Building ${width}x${height} image with ${layers.length} layers...`);

    // 1. Create base image
    let canvas = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    });

    const compositeInputs = [];

    // 2. Process layers
    for (const layer of layers) {
      if (layer.color) {
        // Create a solid color buffer
        const colorLayer = await sharp({
          create: {
            width,
            height,
            channels: 4,
            background: layer.color
          }
        }).png().toBuffer();
        
        compositeInputs.push({ input: colorLayer, top: 0, left: 0 });
      } else if (layer.value) {
        try {
          // Fetch image buffer
          const response = await axios.get(layer.value, { responseType: 'arraybuffer' });
          const imageBuffer = Buffer.from(response.data);
          
          // Resize image to "contain" within the canvas
          const resizedImage = await sharp(imageBuffer)
            .resize({
              width,
              height,
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();
            
          compositeInputs.push({ input: resizedImage, top: 0, left: 0 });
        } catch (err) {
          console.error(`[Compose API] Failed to fetch layer image: ${layer.value}`, err);
        }
      }
    }

    // 3. Composite everything
    let result = canvas.composite(compositeInputs);

    // 4. Set format
    if (format === 'jpeg') {
      result = result.jpeg({ quality: 90 });
    } else {
      result = result.png();
    }

    const outputBuffer = await result.toBuffer();
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    
    // Sanitize filename
    const safeFilename = filename.replace(/[^a-z0-9.]/gi, '_');

    console.log(`[Compose API] Done. Serving ${safeFilename} (${Math.round(outputBuffer.length / 1024)} KB)`);

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        'Content-Length': outputBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error: any) {
    console.error('[Compose API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
