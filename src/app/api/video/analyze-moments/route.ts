import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  const { images, language = "es" } = await req.json();

  if (!images?.length) return NextResponse.json({ error: "No images provided" }, { status: 400 });

  const langName = language === "es" ? "Spanish" : language === "en" ? "English" : language === "fr" ? "French" : "Spanish";

  const results = [];

  for (const img of images) {
    const base64 = img.base64.replace(/^data:image\/\w+;base64,/, "");
    const prompt = `You are an expert UI/UX analyst. Analyze this app screenshot and identify interactive elements for a TikTok-style tutorial video.

Return a JSON array of "moments" — animation steps the video will play in sequence.

For each moment specify:
- type: one of "zoom_in" | "zoom_out" | "cursor_click" | "cursor_hover" | "text_type" | "highlight" | "fullscreen"  
- target: { x, y, w, h } as percentages (0-100) of image dimensions (x,y = top-left corner of element)
- label: narration text in ${langName} explaining what this element does (natural, tutorial-style)
- duration: seconds (1.5–4.0)
- value: (only for text_type) example text to type into the field

Rules:
- Start with a "fullscreen" moment to introduce the screen (duration: 2)
- For EACH input field: use "text_type" with a realistic example value
- For EACH button/CTA: use "cursor_click"
- For important labels/sections: use "highlight"
- End with "zoom_out" to fullscreen (duration: 1.5)
- Maximum 8 moments total
- Labels must be engaging and instructional, like a real tutorial narrator

Return ONLY valid JSON array, no markdown, no explanation:
[
  { "type": "fullscreen", "target": { "x": 0, "y": 0, "w": 100, "h": 100 }, "label": "...", "duration": 2 },
  ...
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}`, detail: "high" } },
            { type: "text", text: prompt },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    let moments = [];
    try {
      const raw = response.choices[0].message.content ?? "[]";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      moments = JSON.parse(cleaned);
    } catch {
      moments = [];
    }

    results.push({ id: img.id, moments });
  }

  return NextResponse.json({ results });
}
