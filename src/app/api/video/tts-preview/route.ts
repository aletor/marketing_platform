import { NextResponse } from "next/server";

// ElevenLabs voices available for selection
export const ELEVENLABS_VOICES: Record<string, Array<{ id: string; name: string; gender: string }>> = {
  es: [
    { id: "pMsXgVXv3BLzUgSXRplE", name: "Mateo (España)", gender: "Hombre" },
    { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger (España)", gender: "Hombre" },
    { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice (España)", gender: "Mujer" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", gender: "Mujer" },
  ],
  en: [
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "Woman" },
    { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "Man" },
    { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", gender: "Woman" },
    { id: "bIHbv24MWmeRgasZH58o", name: "Will", gender: "Man" },
  ],
  fr: [
    { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", gender: "Femme" },
    { id: "zcAOhNBS3c14rBihAFp1", name: "Giovanni", gender: "Homme" },
  ],
  de: [
    { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "Mann" },
    { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "Frau" },
  ],
};

const PREVIEW_TEXTS: Record<string, string> = {
  es: "Hola, así es como suena mi voz en este tutorial.",
  en: "Hello, this is how my voice sounds in this tutorial.",
  fr: "Bonjour, voici comment ma voix sonne dans ce tutoriel.",
  de: "Hallo, so klingt meine Stimme in diesem Tutorial.",
};

export async function POST(req: Request) {
  const { voiceId, language = "es" } = await req.json();

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 503 });
  }

  const text = PREVIEW_TEXTS[language] || PREVIEW_TEXTS["es"];

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[TTS Preview] ElevenLabs Error:", err, "VoiceId:", voiceId);
    return NextResponse.json({ error: `ElevenLabs error: ${err}` }, { status: res.status });
  }

  // Return as base64 audio so the browser can play it inline
  const audioBuffer = Buffer.from(await res.arrayBuffer());
  const base64Audio = audioBuffer.toString("base64");

  return NextResponse.json({
    audio: `data:audio/mpeg;base64,${base64Audio}`,
  });
}
