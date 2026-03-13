import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are an expert AI workflow architect for "AI Spaces Studio".
Your task is to translate a user's natural language request into a node-based workflow.

### Available Node Types:
- mediaInput: Universal input for Video, Image, or Audio files/URLs. (Rose color)
- promptInput: Node where users enter text prompts. (Blue color)
- runwayProcessor: Executes RunwayML Gen-3 for video generation. (Rose color)
- grokProcessor: Executes Grok Imagine for image generation. (Pink color)
- concatenator: Merges multiple prompt inputs into one string. (Blue-Gray)
- enhancer: Uses OpenAI to refine and optimize a prompt. (Vibrant Blue)
- nanoBanana: Generates images via Nano Banana 2. (Pink color)
- maskExtraction: Extracts masks/mattes from images or videos. (Cyan color)

### Rules:
1. Return ONLY a valid JSON object.
2. The JSON must contain:
   - "nodes": Array of nodes with { id, type, position: {x, y}, data: { label, value } }
   - "edges": Array of edges with { id, source, target, type: 'buttonEdge', animated: true }
3. Handles:
   - mediaInput: output is "video", "image", "sound", "pdf", "txt", or "url" (pick the one that matches best)
   - promptInput: output is "prompt"
   - runwayProcessor: inputs are "video", "prompt", output is "video"
   - grokProcessor: input is "prompt", output is "image"
   - concatenator: inputs are "p1", "p2", ..., output is "prompt"
   - enhancer: input is "prompt", output is "prompt"
   - nanoBanana: inputs are "image", "prompt", output is "image"
   - maskExtraction: input is "media", output is "mask"
4. Layout: Space nodes reasonably (e.g., 400px apart).
5. Connections: Ensure connections match the handle types.

### Output Example:
{
  "nodes": [
    { "id": "n1", "type": "promptInput", "position": { "x": 100, "y": 100 }, "data": { "label": "Prompt", "value": "A futuristic city" } },
    { "id": "n2", "type": "runwayProcessor", "position": { "x": 500, "y": 100 }, "data": { "label": "RunwayML", "value": "" } }
  ],
  "edges": [
    { "id": "e1-2", "source": "n1", "target": "n2", "type": "buttonEdge", "animated": true }
  ]
}
`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Assistant API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
