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
    const prompt = `You are an expert tutorial video creator and UI/UX analyst. Analyze this app screenshot and generate a sequence of tutorial "moments" for a short-form vertical video (TikTok/Reels style).

Each moment focuses the camera on ONE relevant UI element or concept.
The video MUST always feel like it is zooming IN. 
Sequence rule: Start wide (Overview) and progress towards smaller, more detailed elements (Zoom-In). 
Avoid zooming out unless absolutely necessary for context reset after a full sequence of details.

For each moment return:
- label: Natural, engaging tutorial narration in ${langName}. Be specific about what the element does. Example: "Desde este botón podrás descargar todas tus facturas en PDF con un solo clic."
- duration: seconds this moment lasts (1.5–5.0)
- camScale: float between 0.95 and 2.4. Progressively INCREASE scale across moments.
- focusPoint: { x, y } as percentage (0–100) of the image. This is the point the camera will pan to center.

Rules:
- First moment MUST be a full-screen overview (camScale: 0.95, focusPoint: {x:50,y:50}).
- Then identify 3–6 key UI elements, aiming for a sequence that feels like zooming closer and closer.
- Last moment can be another overview if appropriate.
- Maximum 8 moments total.
- Labels must be natural, instructional and engaging, explaining the VALUE of each element, not just what it is.
- NEVER use bracket placeholders in labels. Always write complete sentences.

Return ONLY valid JSON array, no markdown, no explanation:
[
  { "label": "...", "duration": 2.5, "camScale": 0.95, "focusPoint": { "x": 50, "y": 50 } },
  { "label": "...", "duration": 2.0, "camScale": 1.3, "focusPoint": { "x": 72, "y": 45 } }
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
      max_tokens: 1800,
      temperature: 0.4,
    });

    let moments: any[] = [];
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
