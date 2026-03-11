import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { images, language = "es" } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    console.log(`[V4 Analyze] Processing ${images.length} images via GPT-4o Vision — returning bbox`);

    const langName: Record<string, string> = {
      es: "Spanish", en: "English", fr: "French", de: "German"
    };
    const voiceLang = langName[language] || "Spanish";

    const contentPayload: any[] = [
      {
        type: "text",
        text: `You are an expert UX Analyst, UI Vision Model, and Camera Director for tutorial videos.

I will provide ${images.length} chronological screenshots of an app. Your task is to:
  1. Identify the most important interactive UI elements on each screen.
  2. For each element, return a bounding box as percentages of the image dimensions.
  3. Assign a camera intent (how the camera should move to this element).
  4. Write a short, professional narration in **${voiceLang}** for each element.

### BOUNDING BOX FORMAT
- 'x' = left edge (0–100% of image width)
- 'y' = top edge (0–100% of image height)
- 'w' = width (% of image width)
- 'h' = height (% of image height)
- Example: a button occupying the top-right 10% of the screen: { "x": 88, "y": 2, "w": 10, "h": 6 }

### ELEMENT TYPES
Use one of: button, icon_button, input, dropdown, sidebar_item, tab, card, modal, chart, hero_text, toggle, checkbox, alert, table, list_item

### CAMERA INTENTS
Use one of: full_context, context_then_push, push_direct, pan_to, hold_detail

### NARRATION RULES
- Max 15 words per sub-scene script
- One clear action or concept per sentence
- Natural spoken tone in ${voiceLang}
- Name UI elements naturally (do not reference coordinates)

### IMPORTANCE SCORE
- 0.0 to 1.0. Elements with higher importance appear first or get more focus time.

### RESPONSE FORMAT (strict JSON only, no markdown)
{
  "scripts": [
    {
      "id": "<image_id>",
      "subScenes": [
        {
          "script": "Narration text in ${voiceLang}.",
          "type": "button",
          "cameraIntent": "context_then_push",
          "importance": 0.95,
          "bbox": { "x": 45, "y": 10, "w": 18, "h": 8 }
        }
      ]
    }
  ]
}`
      }
    ];

    // Push each image into the prompt
    for (const img of images) {
      contentPayload.push({ type: "text", text: `Image ID: ${img.id}` });
      contentPayload.push({
        type: "image_url",
        image_url: { url: img.base64, detail: "high" }
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: contentPayload }],
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });

    const resultText = completion.choices[0].message.content || "{}";
    const data = JSON.parse(resultText);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("[V4 Analyze] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
