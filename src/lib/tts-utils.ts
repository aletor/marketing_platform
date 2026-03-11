import { uploadToS3, getPresignedUrl } from '@/lib/s3-utils';
import { parseBuffer } from 'music-metadata';

// ElevenLabs voice IDs by language (best native voices)
const ELEVENLABS_VOICES: Record<string, string> = {
  es: "pMsXgVXv3BLzUgSXRplE", // Mateo — Spanish native male
  en: "EXAVITQu4vr4xnSDxMaL", // Sarah — English native female
  fr: "XB0fDUnXU5powFXDhCwa", // Charlotte — French native
  de: "IKne3meq5aSn9XLyUdCD", // Charlie — German native
};

const ELEVENLABS_MODEL = "eleven_turbo_v2_5";

/** 
 * Generate audio from ElevenLabs and return the S3 URL + real measured duration.
 * NO FALLBACK. If ElevenLabs fails, this throws. Do not degrade quality.
 */
export async function getTtsAudioUrl(
  text: string,
  language: string,
  sceneId: string,
  subIndex: number,
  voiceId?: string
): Promise<{ audioUrl: string; durationMs: number }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set. Cannot generate premium audio.");
  }

  const finalVoiceId = voiceId || ELEVENLABS_VOICES[language] || ELEVENLABS_VOICES["es"];

  console.log(`[TTS V4] Generating audio scene=${sceneId} sub=${subIndex} (${language}, voice=${finalVoiceId})`);

  const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: {
        stability: 0.48,
        similarity_boost: 0.82,
        style: 0.08,
        use_speaker_boost: true
      }
    })
  });

  if (!elevenRes.ok) {
    const errBody = await elevenRes.text();
    throw new Error(`ElevenLabs API error (${elevenRes.status}): ${errBody}`);
  }

  // Read the MP3 buffer
  const audioBuffer = Buffer.from(await elevenRes.arrayBuffer());

  // --- Measure real duration ---
  let durationMs = 0;
  try {
    const metadata = await parseBuffer(audioBuffer, { mimeType: "audio/mpeg" });
    durationMs = Math.round((metadata.format.duration ?? 0) * 1000);
  } catch (parseErr) {
    console.warn("[TTS V4] Could not parse audio duration, estimating from text length:", parseErr);
    // Fallback estimate (words / 2.5 words per second)
    const wordCount = text.split(/\s+/).length;
    durationMs = Math.round((wordCount / 2.5) * 1000);
  }

  console.log(`[TTS V4] Audio generated: ${durationMs}ms for "${text.slice(0, 40)}..."`);

  // Upload to S3 and return pre-signed URL
  const s3Key = await uploadToS3(`tts-v4-${sceneId}-${subIndex}.mp3`, audioBuffer, "audio/mpeg");
  const audioUrl = await getPresignedUrl(s3Key);

  return { audioUrl, durationMs };
}
