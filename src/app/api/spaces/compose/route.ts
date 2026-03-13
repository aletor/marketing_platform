import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import axios from 'axios';

export async function POST(req: NextRequest) {
  let layersJson = '[]';
  try {
    const body = await req.formData();
    layersJson = body.get('layers') as string;
    const format = (body.get('format') as string) || 'png';
    const filename = (body.get('filename') as string) || `Composition_${Date.now()}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    const width = parseInt(body.get('width') as string) || 1920;
    const height = parseInt(body.get('height') as string) || 1080;

    console.log("--- COMPOSE ENGINE START ---");
    console.log(`Dimensions: ${width}x${height}, Format: ${format}`);
    // ... rest of logic
    console.log(`Layers JSON length: ${layersJson?.length || 0}`);

    const layers = JSON.parse(layersJson || '[]');
    console.log(`Active Layers Count: ${layers.length}`);

    // 1. Create base image (solid black instead of transparent to verify visibility)
    let canvas = sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Reverted to transparent base
      }
    });

    const compositeInputs = [];

    // Coordinate remapping ratio
    const previewWidth = parseInt(body.get('previewWidth') as string) || width;
    const ratio = width / previewWidth;
    console.log(`Coordinate Mapping Ratio: ${ratio} (Canvas: ${width} / Preview: ${previewWidth})`);

    // 2. Process layers
    for (const [idx, layer] of layers.entries()) {
      console.log(`[Layer ${idx}] Type: ${layer.type}, HasValue: ${!!layer.value}, Color: ${layer.color}`);
      
      const layerX = Math.round((layer.x || 0) * ratio);
      const layerY = Math.round((layer.y || 0) * ratio);
      const layerScale = layer.scale || 1;

      if (layer.color) {
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
          let imageBuffer: Buffer;

          if (layer.value.startsWith('data:')) {
            console.log(`[Layer ${idx}] Processing Base64 data...`);
            const base64Data = layer.value.split(',')[1];
            imageBuffer = Buffer.from(base64Data, 'base64');
          } else {
            console.log(`[Layer ${idx}] Fetching URL: ${layer.value}`);
            // Use axios with a real-looking User-Agent to avoid blocks
            const res = await axios.get(layer.value, { 
              responseType: 'arraybuffer',
              timeout: 10000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            });
            imageBuffer = Buffer.from(res.data);
          }
          
          // Determine Target Width
          let targetWidth = width;
          
          // Background types or index 0 usually take full width if not scaled
          const isBackground = layer.type === 'background' || (idx === 0 && layerScale === 1 && layerX === 0 && layerY === 0);
          
          if (!isBackground) {
            // Assets follow the Editor logic: 40% of canvas width * scale
            targetWidth = Math.round((width * 0.4) * layerScale);
          }

          // Resize carefully: only provide width to let Sharp calculate height proportionally
          const resizedImage = await sharp(imageBuffer)
            .resize(targetWidth) 
            .png()
            .toBuffer();
             
          compositeInputs.push({ input: resizedImage, top: layerY, left: layerX });
          console.log(`[Layer ${idx}] Success: x=${layerX}, y=${layerY}, w=${targetWidth} (isBG: ${isBackground})`);
        } catch (err: any) {
          console.error(`[Layer ${idx}] FETCH ERROR for ${layer.value}:`, err.message);
          // If a layer fails, we continue to prevent breaking the whole export
        }
      }
    }

    console.log(`Final composition with ${compositeInputs.length} inputs...`);
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

    console.log(`[Compose API] SUCCESS: Exported ${safeFilename} (${Math.round(outputBuffer.length / 1024)} KB)`);

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': outputBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error: any) {
    console.error('[Compose API] CRITICAL ERROR:', error);
    let layersCount = 0;
    try { layersCount = JSON.parse(layersJson || '[]').length; } catch(e) {}
    
    return NextResponse.json({ 
      error: error.message || 'Unknown composition error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      layersCount
    }, { status: 500 });
  }
}
