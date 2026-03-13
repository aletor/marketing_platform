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
      target = 'person', 
      customPrompt = '', 
      expansion = 0, 
      feather = 5,
      edgeSmooth = 2,
      confidence = 0.5 
    } = body;

    if (!image) {
      return NextResponse.json({ error: 'Missing image input' }, { status: 400 });
    }

    console.log(`--- MATTE ENGINE START --- Target: ${target}`);

    // 1. Fetch Image
    let imageBuffer: Buffer;
    if (image.startsWith('http')) {
      const response = await axios.get(image, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data);
    } else {
      // Handle Base64
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN is not configured' }, { status: 500 });
    }

    // 2. ML Inference (Replicate)
    // We choose different models based on target
    let maskUrl: string;
    
    // NOTE: These are example model IDs on Replicate. In a real scenario, we'd pick the best ones.
    // SAM 2 is great for everything. MODNet for specialized hair/person.
    try {
      if (target === 'person' || target === 'hair') {
        // Example: Robust Video Matting or MODNet
        // Using a reliable matting model
        const output = await replicate.run(
          "cjwbw/robust-video-matting:7334d201d4ca6b8256af3923769c735d3262529341f531c3ced91bf39d1b0d2d",
          { input: { input_path: image } }
        );
        // This usually returns a dict/array
        maskUrl = Array.isArray(output) ? output[0] : (output as any).toString();
      } else {
        // Use SAM 2 for General Objects / Custom
        // facebook/sam-2
        const input: any = { image };
        if (target === 'custom' && customPrompt) {
          // GroundingDINO + SAM style (conceptually)
          // For now, let's use a versatile SAM2 implementation that accepts "target"
          input.mask_limit = 1;
        }

        const output = await replicate.run(
          "arielreid/segment-anything-2:4f1e913a1e944b3605c31f2fc55653528b1464c12662c6d4827c1cdb66f272a2",
          { input }
        );
        maskUrl = Array.isArray(output) ? output[0] : (output as any).toString();
      }
    } catch (mlErr: any) {
      console.error("[Matte API] ML Error:", mlErr);
      return NextResponse.json({ error: `ML Model failed: ${mlErr.message}` }, { status: 500 });
    }

    // 3. Fetch Generated Mask
    const maskResponse = await axios.get(maskUrl, { responseType: 'arraybuffer' });
    let maskBuffer = Buffer.from(maskResponse.data);

    // 4. Refinement with Sharp
    // 4.1 Normalize mask to Grayscale and resize to match original image
    const metadata = await sharp(imageBuffer).metadata();
    const w = metadata.width || 0;
    const h = metadata.height || 0;

    let maskProcessor = sharp(maskBuffer)
      .resize(w, h)
      .grayscale();

    // 4.2 Apply Refinements (Expansion / Erosion)
    if (expansion !== 0) {
      // Simulated expansion using blur + threshold
      maskProcessor = maskProcessor.blur(Math.abs(expansion))
        .threshold(expansion > 0 ? 128 : 200);
    }

    // 4.3 Apply Smoothing & Feathering
    if (edgeSmooth > 0) {
      maskProcessor = maskProcessor.blur(edgeSmooth);
    }
    
    if (feather > 0) {
      maskProcessor = maskProcessor.blur(feather);
    }

    const finalMaskBuffer = await maskProcessor.png().toBuffer();

    // 5. Alpha Composition (Join Channel)
    const rgbaBuffer = await sharp(imageBuffer)
      .ensureAlpha()
      .joinChannel(finalMaskBuffer)
      .png()
      .toBuffer();

    // 6. Final Outputs
    const rgbaBase64 = `data:image/png;base64,${rgbaBuffer.toString('base64')}`;
    const maskBase64 = `data:image/png;base64,${finalMaskBuffer.toString('base64')}`;

    console.log(`[Matte API] SUCCESS: Mask extracted and applied (${Math.round(rgbaBuffer.length / 1024)} KB)`);

    return NextResponse.json({
      rgba_image: rgbaBase64,
      mask: maskBase64,
      metadata: {
        confidence,
        target,
        resolution: `${w}x${h}`
      }
    });

  } catch (error: any) {
    console.error('[Matte API] CRITICAL ERROR:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown matte extraction error'
    }, { status: 500 });
  }
}
