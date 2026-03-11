import { NextResponse } from "next/server";

const HEYGEN_BASE = "https://api.heygen.com";

export async function GET() {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "HEYGEN_API_KEY not set" }, { status: 503 });

  const res = await fetch(`${HEYGEN_BASE}/v2/avatars`, {
    headers: { "X-Api-Key": apiKey, "Accept": "application/json" },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  // Filter to public avatars only (non-custom) with a thumbnail
  const avatars = (data.data?.avatars ?? []).map((a: any) => ({
    id: a.avatar_id,
    name: a.avatar_name,
    gender: a.gender ?? "N/A",
    thumbnail: a.preview_image_url ?? a.preview_video_url ?? null,
    style: a.default_avatar_style ?? "normal",
  })).filter((a: any) => a.id && a.name);

  return NextResponse.json({ avatars });
}
