import { NextRequest, NextResponse } from "next/server";

// Cheapest Gemini model with vision capability (text output only)
// gemini-2.0-flash is deprecated for new users — use gemini-2.5-flash
const VISION_MODEL = "gemini-2.5-flash";

interface AreaChange {
  color: string;       // color name, e.g. "azul"
  description: string; // what the user wants to do in this area
  posX?: number | null; // center X as % of image width (0-100)
  posY?: number | null; // center Y as % of image height (0-100)
}

async function parseImage(image: string): Promise<{ data: string; mimeType: string } | null> {
  if (!image) return null;
  // data URL (paint canvas output)
  if (image.startsWith("data:")) {
    const [meta, data] = image.split(";base64,");
    return { data, mimeType: meta.split(":")[1] };
  }
  // Remote URL (S3 presigned URL for generated images)
  if (image.startsWith("http")) {
    try {
      const res = await fetch(image, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!res.ok) { console.warn("[analyze-areas] Failed to fetch image:", res.status); return null; }
      const buffer = await res.arrayBuffer();
      return {
        data: Buffer.from(buffer).toString("base64"),
        mimeType: res.headers.get("content-type") || "image/jpeg",
      };
    } catch (e: any) {
      console.warn("[analyze-areas] Error fetching image URL:", e.message);
      return null;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const {
      baseImage,    // data URL — the current generated/connected image
      colorMapImage, // data URL — the color-coded areas map
      changes,      // AreaChange[] — [{color, description}]
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    if (!changes?.length) return NextResponse.json({ error: "No changes provided" }, { status: 400 });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${apiKey}`;

    const parts: any[] = [];

    // 1. Base image
    if (baseImage) {
      const parsed = await parseImage(baseImage);
      if (parsed) parts.push({ inline_data: { mime_type: parsed.mimeType, data: parsed.data } });
    }

    // 2. Color map image
    if (colorMapImage) {
      const parsed = await parseImage(colorMapImage);
      if (parsed) parts.push({ inline_data: { mime_type: parsed.mimeType, data: parsed.data } });
    }

    // 3. Analysis prompt — include position data for spatial accuracy
    const changeList = (changes as AreaChange[])
      .map(c => {
        const pos = (c.posX != null && c.posY != null)
          ? ` (posición en la imagen: ${c.posX}% desde la izquierda, ${c.posY}% desde arriba)`
          : "";
        return `- Área ${c.color}${pos}: ${c.description}`;
      })
      .join("\n");

    const systemPrompt = `Eres un asistente experto en prompts para generación de imágenes con IA.

Se te proporcionan dos imágenes:
- IMAGEN 1: la imagen original/base
- IMAGEN 2: la MISMA imagen con trazos de pintura de colores encima. Cada trazo de color indica el ÁREA EXACTA que el usuario quiere modificar.

El usuario quiere hacer los siguientes cambios (el color del trazo corresponde al nombre indicado):
${changeList}

Tu tarea:
1. Mira la IMAGEN 2: localiza EXACTAMENTE el trazo de color indicado (${(changes as AreaChange[]).map(c => c.color).join(', ')})
2. Identifica qué objeto concreto hay DEBAJO/EN ESE TRAZO en la imagen — sé MUY específico y preciso. El trazo está pintado directamente sobre el elemento a cambiar.
   Ejemplos de buena identificación: "la persona tumbada en la arena a la izquierda", "el chico en skate en la rampa", "el pato grande de la derecha con gafas"
   Ejemplos INCORRECTOS: "el sujeto", "el objeto", "el elemento de la izquierda"
3. Genera un prompt en español para NanaBanana con este formato exacto:

REFERENCIA 1: imagen base. Mantén todo lo que no se indica cambiar, conservando composición, iluminación y estilo.
REFERENCIA 2: mapa de colores con áreas de cambio.

[Una línea por cambio: "En el área [color] de la referencia 2 (donde está [objeto identificado con precisión]): [instrucción]"]

CRÍTICO: El trazo de pintura en la IMAGEN 2 indica el elemento EXACTO. No elijas el elemento más grande o más llamativo de la zona — elige el que tiene el trazo encima.

Devuelve SOLO el prompt, sin explicaciones ni texto adicional.`;

    parts.push({ text: systemPrompt });

    const payload = {
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        // No responseModalities — text-only models don't need it (it's for image generation)
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("[analyze-areas] Gemini response status:", response.status);
    if (data.error) {
      console.error("[analyze-areas] Gemini API error:", JSON.stringify(data.error));
      return NextResponse.json({ error: data.error.message || "Gemini error" }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || "";
    console.log("[analyze-areas] Got text response, length:", text.length);
    if (!text) return NextResponse.json({ error: "No text response from AI" }, { status: 500 });

    return NextResponse.json({ prompt: text.trim() });

  } catch (error: any) {
    console.error("[analyze-areas] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
