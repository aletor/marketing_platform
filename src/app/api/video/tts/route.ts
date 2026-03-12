import { NextResponse } from 'next/server';
import { getTtsAudioUrl } from '@/lib/tts-utils';

// ElevenLabs voice IDs by language (best native voices)
const ELEVENLABS_VOICES: Record<string, string> = {
  es: "pMsXgVXv3BLzUgSXRplE", // Mateo - Spanish native male, clear
  en: "EXAVITQu4vr4xnSDxMaL", // Sarah - English native female
  fr: "XB0fDUnXU5powFXDhCwa", // Charlotte - French native
  de: "IKne3meq5aSn9XLyUdCD", // Charlie - German native
};

// Fallback to the Free tier model
const ELEVENLABS_MODEL = "eleven_multilingual_v2";

export async function POST(req: Request) {
  try {
    const { text, language = "es", sceneId, subIndex } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const voiceId = ELEVENLABS_VOICES[language] || ELEVENLABS_VOICES["es"];

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    console.log(`[ElevenLabs TTS] Generating voice for scene ${sceneId}, sub ${subIndex} (lang: ${language})...`);

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL,
        voice_settings: {
          stability: 0.50,
          similarity_boost: 0.80,
          style: 0.10,
          use_speaker_boost: true
        }
      })
    });

    if (!elevenRes.ok) {
      const err = await elevenRes.text();
      console.error("ElevenLabs Error:", err);
      throw new Error(`ElevenLabs API error: ${elevenRes.status}`);
    }

    // Generate audio and measure duration
    const { audioUrl, durationMs } = await getTtsAudioUrl(
      text,
      language,
      sceneId,
      subIndex
    );
    
    return NextResponse.json({ audioUrl, durationMs });

  } catch (error: any) {
    console.error("ElevenLabs TTS error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
