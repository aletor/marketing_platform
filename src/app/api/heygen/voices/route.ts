import { NextResponse } from "next/server";

const HEYGEN_BASE = "https://api.heygen.com";

export async function GET(req: Request) {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "HEYGEN_API_KEY not set" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const language = searchParams.get("language") ?? "es";

  const res = await fetch(`${HEYGEN_BASE}/v2/voices`, {
    headers: { "X-Api-Key": apiKey, "Accept": "application/json" },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  const voices = (data.data?.voices ?? [])
    .filter((v: any) => !language || v.language?.toLowerCase()?.startsWith(language))
    .map((v: any) => ({
      id: v.voice_id,
      name: v.display_name ?? v.name,
      language: v.language,
      gender: v.gender ?? "N/A",
      preview: v.preview_audio ?? null,
    }));

  return NextResponse.json({ voices });
}
