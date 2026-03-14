import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import Replicate from 'replicate';
import axios from 'axios';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      image, 
      expansion = 0, 
      feather = 0.6,
      threshold = 0.9 // Default to 0.9 as requested
    } = body;

    if (!image) {
      return NextResponse.json({ error: 'Missing image input' }, { status: 400 });
    }

    console.log(`--- BACKGROUND REMOVER START ---`);

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN is not configured' }, { status: 500 });
    }

    // 1. ML Inference: Professional Matting (851-labs/background-remover)
    let maskUrl: string;
    let bbox = [0, 0, 0, 0];
    
    try {
      const output: any = await replicate.run(
        "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
        { 
          input: { 
            image,
            threshold: Number(threshold),
            reverse: false
          } 
        }
      );
      maskUrl = Array.isArray(output) ? output[0] : output.toString();
    } catch (mlErr: any) {
      console.error("[Background Remover] ML Error:", mlErr);
      return NextResponse.json({ error: `ML Engine failed: ${mlErr.message}` }, { status: 500 });
    }

    // 2. Fetch Mask and Image
    const [maskResponse, imageResponse] = await Promise.all([
      axios.get(maskUrl, { responseType: 'arraybuffer' }),
      image.startsWith('http') 
        ? axios.get(image, { responseType: 'arraybuffer' }).then(r => r.data)
        : Promise.resolve(Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64'))
    ]);

    const maskBuffer = Buffer.from(maskResponse.data);
    const imageBuffer = Buffer.from(imageResponse);

    const imgMetadata = await sharp(imageBuffer).metadata();
    const w = imgMetadata.width || 1920;
    const h = imgMetadata.height || 1080;

    // 3. Extract Alpha and Refine
    let maskProcessor = sharp(maskBuffer)
      .resize(w, h)
      .ensureAlpha()
      .extractChannel('alpha');

    // Expansion (Dilate)
    if (expansion !== 0) {
      const sigma = Math.max(0.3, Math.abs(expansion) / 2);
      maskProcessor = maskProcessor.blur(sigma).threshold(expansion > 0 ? 128 : 200);
    }

    // Feather (Gaussian Blur)
    if (feather > 0) {
      maskProcessor = maskProcessor.blur(Math.max(0.3, feather));
    }

    const finalMaskBuffer = await maskProcessor.png().toBuffer();

    // 4. Calculate BBox from mask
    const { data: maskPixels } = await sharp(finalMaskBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (maskPixels[y * w + x] > 128) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if (found) {
      bbox = [minX, minY, maxX - minX, maxY - minY];
    } else {
      bbox = [0, 0, w, h]; // Fallback if no person found
    }

    // 5. Compose Cutout
    const rgbaBuffer = await sharp(imageBuffer)
      .ensureAlpha()
      .joinChannel(finalMaskBuffer)
      .png()
      .toBuffer();

    return NextResponse.json({
      mask: `data:image/png;base64,${finalMaskBuffer.toString('base64')}`,
      rgba_image: `data:image/png;base64,${rgbaBuffer.toString('base64')}`,
      bbox,
      metadata: {
        engine: '851-labs',
        threshold,
        expansion,
        feather,
        resolution: `${w}x${h}`
      }
    });

  } catch (error: any) {
    console.error('[Background Remover] CRITICAL ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
