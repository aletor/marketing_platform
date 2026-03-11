import { NextResponse } from "next/server";
import { uploadToS3, getPresignedUrl } from "@/lib/s3-utils";

const HEYGEN_BASE = "https://api.heygen.com";

export type LayoutStyle = "corner" | "split" | "fullscreen";

interface SceneInput {
  screenBase64: string;
  script: string;
}

interface RenderInput {
  scenes: SceneInput[];
  avatarId: string;
  avatarStyle?: string;
  voiceId: string;
  layout: LayoutStyle;
  format: "16:9" | "9:16";
  language?: string;
}

function buildVideoInput(
  scene: { script: string; bgUrl: string },
  avatarId: string,
  avatarStyle: string,
  voiceId: string,
  layout: LayoutStyle,
  format: "16:9" | "9:16"
) {
  // Avatar position based on layout
  const avatarScale = layout === "fullscreen" ? 1.0 : layout === "corner" ? 0.28 : 0.42;
  const avatarPos = layout === "fullscreen"
    ? { x: 0.5, y: 0.5 }
    : layout === "corner"
    ? { x: 0.15, y: 0.82 }  // corner bottom-left
    : { x: 0.23, y: 0.5 };  // split left

  const character: Record<string, unknown> = {
    type: "avatar",
    avatar_id: avatarId,
    avatar_style: avatarStyle || "normal",
    scale: avatarScale,
    avatar_style_position: {
      x: avatarPos.x,
      y: avatarPos.y,
    },
  };

  const voice: Record<string, unknown> = {
    type: "text",
    input_text: scene.script,
    voice_id: voiceId,
    speed: 1.0,
  };

  const background: Record<string, unknown> =
    layout === "fullscreen"
      ? { type: "color", value: "#0d0d0d" }
      : { type: "image", url: scene.bgUrl };

  return { character, voice, background };
}

export async function POST(req: Request) {
  const body: RenderInput = await req.json();
  const { scenes, avatarId, avatarStyle = "normal", voiceId, layout = "corner", format = "16:9", language = "es" } = body;

  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "HEYGEN_API_KEY not set" }, { status: 503 });
  if (!scenes?.length) return NextResponse.json({ error: "No scenes provided" }, { status: 400 });
  if (!avatarId) return NextResponse.json({ error: "avatarId required" }, { status: 400 });
  if (!voiceId) return NextResponse.json({ error: "voiceId required" }, { status: 400 });

  // 1. Upload all screenshots to S3
  console.log(`[HeyGen] Uploading ${scenes.length} screenshots to S3...`);
  const bgUrls: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const base64 = scenes[i].screenBase64.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(base64, "base64");
    const key = await uploadToS3(`heygen-bg-${Date.now()}-${i}.jpg`, buf, "image/jpeg");
    // Need a permanent public URL (HeyGen downloads it from S3)
    // Use presigned URL valid for 1 hour — enough for render
    const url = await getPresignedUrl(key);
    bgUrls.push(url);
  }

  // 2. Build video_inputs array
  const video_inputs = scenes.map((scene, i) =>
    buildVideoInput(
      { script: scene.script, bgUrl: bgUrls[i] },
      avatarId,
      avatarStyle,
      voiceId,
      layout,
      format
    )
  );

  // 3. Determine dimensions
  const dimension = format === "9:16"
    ? { width: 720, height: 1280 }
    : { width: 1280, height: 720 };

  const payload = {
    video_inputs,
    dimension,
    aspect_ratio: format,
  };

  console.log(`[HeyGen] Creating video with ${scenes.length} scenes, layout=${layout}, format=${format}...`);

  // 4. Create video
  const heyRes = await fetch(`${HEYGEN_BASE}/v2/video/generate`, {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!heyRes.ok) {
    const err = await heyRes.text();
    console.error("[HeyGen] Error creating video:", err);
    return NextResponse.json({ error: `HeyGen error: ${err}` }, { status: heyRes.status });
  }

  const data = await heyRes.json();
  const videoId = data.data?.video_id;

  if (!videoId) {
    return NextResponse.json({ error: "HeyGen did not return a video_id" }, { status: 500 });
  }

  console.log(`[HeyGen] Video created. video_id: ${videoId}`);
  return NextResponse.json({ videoId });
}
