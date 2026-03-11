import { NextResponse } from "next/server";

const HEYGEN_BASE = "https://api.heygen.com";

export async function GET(req: Request) {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "HEYGEN_API_KEY not set" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("video_id");
  if (!videoId) return NextResponse.json({ error: "Missing video_id" }, { status: 400 });

  const res = await fetch(`${HEYGEN_BASE}/v1/video_status.get?video_id=${videoId}`, {
    headers: { "X-Api-Key": apiKey, "Accept": "application/json" },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const info = data.data ?? {};

  return NextResponse.json({
    status: info.status,           // processing | completed | failed | waiting
    video_url: info.video_url ?? null,
    duration: info.duration ?? null,
    error: info.error ?? null,
  });
}
