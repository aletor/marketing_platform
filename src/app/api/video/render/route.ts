import { NextResponse } from 'next/server';
import { uploadToS3, getPresignedUrl } from '@/lib/s3-utils';
import { getTtsAudioUrl } from '@/lib/tts-utils';

const SHOTSTACK_API_KEY = "AopRzYcdrOvYEm15EpcEm5dIROxx7YZg8pSas8GT";

/**
 * V4 Zoom Formula: Derive scale from the element's bounding box size.
 * Target: the element should occupy ~30% of the frame after zoom.
 * Clamped between [1.2, 4.0].
 */
function calculateZoom(bbox: { x: number; y: number; w: number; h: number }): number {
  const targetCoverage = 0.30; // element should cover 30% of the frame
  const zoomX = targetCoverage / Math.max(bbox.w / 100, 0.01);
  const zoomY = targetCoverage / Math.max(bbox.h / 100, 0.01);
  // Use the larger axis to ensure the element is fully visible
  const rawZoom = Math.max(zoomX, zoomY);
  return parseFloat(Math.min(Math.max(rawZoom, 1.2), 4.0).toFixed(2));
}

/**
 * Convert bbox center to Shotstack offset.
 * Shotstack offset: -0.5 (left/top) to +0.5 (right/bottom) from frame center.
 * To show a point at (xPct, yPct), we shift the image in the opposite direction.
 */
function calculateOffset(bbox: { x: number; y: number; w: number; h: number }, scale: number) {
  // Center of the bbox
  const centerX = bbox.x + bbox.w / 2;
  const centerY = bbox.y + bbox.h / 2;

  // Map 0–100 → offset at scale 1.0 would be (-0.5 to +0.5)
  // But with zoom applied, the image is larger so the offset range expands.
  const offsetX = parseFloat((-(centerX / 100 - 0.5)).toFixed(3));
  const offsetY = parseFloat((-(centerY / 100 - 0.5)).toFixed(3));
  return { x: offsetX, y: offsetY };
}

export async function POST(req: Request) {
  try {
    const { scenes, orientation = "16:9", language = "es" } = await req.json();

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: "No scenes provided" }, { status: 400 });
    }

    console.log(`[Shotstack V4] Rendering ${scenes.length} screens | orientation: ${orientation}`);

    const imageClips: any[] = [];
    const blurClips: any[] = [];
    const audioClips: any[] = [];
    let currentTime = 0;

    // Safety: ensure ElevenLabs is configured
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({
        error: "ELEVENLABS_API_KEY not configured. Premium audio is required in V4."
      }, { status: 503 });
    }

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];

      // 1. Upload screenshot to S3
      const base64Data = scene.base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const s3Key = await uploadToS3(`shotstack-v4-${scene.id}.jpg`, buffer, "image/jpeg");
      const publicUrl = await getPresignedUrl(s3Key);

      // 2. Pre-generate all audio clips for this scene to get real durations
      const audioData: Array<{ audioUrl: string; durationMs: number }> = [];
      if (scene.subScenes && Array.isArray(scene.subScenes)) {
        for (let j = 0; j < scene.subScenes.length; j++) {
          const ss = scene.subScenes[j];
          if (ss.script?.trim()) {
            try {
              const audio = await getTtsAudioUrl(ss.script, language, scene.id, j);
              audioData.push(audio);
            } catch (ttsErr: any) {
              return NextResponse.json({
                error: `TTS generation failed for scene ${i + 1}, step ${j + 1}: ${ttsErr.message}`
              }, { status: 503 });
            }
          } else {
            audioData.push({ audioUrl: "", durationMs: 0 });
          }
        }
      }

      // 3. INTRO: 1.5s full overview
      imageClips.push({
        asset: { type: "image", src: publicUrl },
        fit: "contain",
        start: currentTime,
        length: 1.5,
        effect: "zoomIn",
        transition: { in: "fade" },
      });
      blurClips.push({
        asset: { type: "image", src: publicUrl },
        fit: "cover",
        start: currentTime,
        length: 1.5,
        filter: "blur",
        opacity: 0.65,
        scale: 1.1,
      });
      currentTime += 1.5;

      // 4. SubScenes with dynamic zoom from bbox
      if (scene.subScenes && Array.isArray(scene.subScenes)) {
        for (let j = 0; j < scene.subScenes.length; j++) {
          const ss = scene.subScenes[j];
          const audio = audioData[j];

          // Real duration from audio, padded with 0.4s breathing room
          const clipLen = Math.max(2.5, (audio.durationMs / 1000) + 0.4);

          // Dynamic zoom derived from bbox
          const bbox = ss.bbox ?? { x: 50 - 15, y: 50 - 10, w: 30, h: 20 }; // fallback center
          const scale = calculateZoom(bbox);
          const offset = calculateOffset(bbox, scale);

          imageClips.push({
            asset: { type: "image", src: publicUrl },
            fit: "contain",
            start: currentTime,
            length: clipLen,
            scale,
            offset,
            transition: j === 0 ? { in: "fade" } : undefined,
          });
          blurClips.push({
            asset: { type: "image", src: publicUrl },
            fit: "cover",
            start: currentTime,
            length: clipLen,
            filter: "blur",
            opacity: 0.6,
            scale: 1.1,
          });

          // Audio clip (ElevenLabs MP3 from S3)
          if (audio.audioUrl) {
            audioClips.push({
              asset: { type: "audio", src: audio.audioUrl },
              start: currentTime,
              length: clipLen,
            });
          }

          currentTime += clipLen;
        }
      }

      // 5. OUTRO: 1s back to full frame
      imageClips.push({
        asset: { type: "image", src: publicUrl },
        fit: "contain",
        start: currentTime,
        length: 1.0,
        scale: 1.0,
        transition: { out: "fade" },
      });
      blurClips.push({
        asset: { type: "image", src: publicUrl },
        fit: "cover",
        start: currentTime,
        length: 1.0,
        filter: "blur",
        opacity: 0.65,
        scale: 1.1,
      });
      currentTime += 1.0;
    }

    const payload = {
      timeline: {
        background: "#0d0d0d",
        tracks: [
          { clips: audioClips },  // Audio: ElevenLabs MP3s
          { clips: imageClips },  // Foreground: contain fit (no crop)
          { clips: blurClips },   // Background: blur fill
        ]
      },
      output: {
        format: "mp4",
        resolution: "hd",
        aspectRatio: orientation
      }
    };

    console.log(`[Shotstack V4] Dispatching ${imageClips.length} image clips, ${audioClips.length} audio clips`);

    const res = await fetch("https://api.shotstack.io/edit/stage/render", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": SHOTSTACK_API_KEY },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Shotstack V4] API Error:", errText);
      return NextResponse.json({
        error: `Shotstack API Error (${res.status}): ${errText}`,
        payload_debug: { imageClips: imageClips.length, audioClips: audioClips.length }
      }, { status: res.status });
    }

    const json = await res.json();
    return NextResponse.json({ renderId: json.response.id });

  } catch (error: any) {
    console.error("[Shotstack V4] Critical Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
