import { NextRequest, NextResponse } from "next/server";
import { createCanvas, loadImage } from "@napi-rs/canvas";

// Cheapest Gemini model with vision capability (text output only)
const VISION_MODEL = "gemini-2.5-flash";

interface AreaChange {
  color: string;       // color name, e.g. "azul"
  description: string; // what the user wants to do in this area
  posX?: number | null;
  posY?: number | null;
  paintData?: string | null; // data:image/png;base64,... of the paint stroke
  assignedColorHex?: string; // hex color assigned to this change e.g. "#ff0000"
}

async function parseImage(image: string): Promise<{ data: string; mimeType: string } | null> {
  if (!image) return null;
  if (image.startsWith("data:")) {
    const [meta, data] = image.split(";base64,");
    return { data, mimeType: meta.split(":")[1] };
  }
  if (image.startsWith("http")) {
    try {
      const res = await fetch(image, { headers: { "User-Agent": "Mozilla/5.0" } });
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

// Server-side composite: draw base image then each paint stroke (tinted with assigned hex color)
async function buildMarkedImage(
  baseImageData: { data: string; mimeType: string },
  changes: AreaChange[]
): Promise<string | null> {
  try {
    // Load base image
    const baseBuffer = Buffer.from(baseImageData.data, "base64");
    const base = await loadImage(baseBuffer);
    const W = base.width;
    const H = base.height;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // Draw base image
    ctx.drawImage(base, 0, 0, W, H);

    // Overlay each change stroke
    for (const change of changes) {
      if (!change.paintData || !change.assignedColorHex) continue;
      try {
        const [, b64] = change.paintData.split(";base64,");
        const strokeBuffer = Buffer.from(b64, "base64");
        const strokeImg = await loadImage(strokeBuffer);

        // Draw stroke to temp canvas for pixel manipulation
        const tmp = createCanvas(W, H);
        const tc = tmp.getContext("2d");
        tc.drawImage(strokeImg, 0, 0, W, H);
        const id = tc.getImageData(0, 0, W, H);

        // Parse hex color
        const hex = change.assignedColorHex.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        // Tint painted pixels
        for (let i = 0; i < id.data.length; i += 4) {
          if (id.data[i + 3] > 30) {
            id.data[i] = r; id.data[i + 1] = g; id.data[i + 2] = b;
            id.data[i + 3] = Math.min(230, id.data[i + 3] * 3);
          }
        }
        tc.putImageData(id, 0, 0);

        // Composite onto base
        ctx.globalAlpha = 0.85;
        ctx.drawImage(tmp, 0, 0);
        ctx.globalAlpha = 1;
      } catch (e) {
        console.warn("[analyze-areas] Failed to overlay stroke for", change.color, e);
      }
    }

    const buf = canvas.toBuffer("image/jpeg");
    return buf.toString("base64");
  } catch (e: any) {
    console.warn("[analyze-areas] buildMarkedImage failed:", e.message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      baseImage,
      colorMapImage,
      changes,
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    if (!changes?.length) return NextResponse.json({ error: "No changes provided" }, { status: 400 });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent?key=${apiKey}`;

    const parts: any[] = [];

    // 1. Base image (always)
    const parsedBase = baseImage ? await parseImage(baseImage) : null;
    if (parsedBase) {
      parts.push({ inline_data: { mime_type: parsedBase.mimeType, data: parsedBase.data } });
    }

    // 2. Try to build server-side composite (base + paint strokes overlaid)
    //    Falls back to abstract color map if canvas lib not available or build fails
    let markedImageData: string | null = null;
    let useMarked = false;

    if (parsedBase) {
      try {
        markedImageData = await buildMarkedImage(parsedBase, changes as AreaChange[]);
        useMarked = !!markedImageData;
      } catch {
        useMarked = false;
      }
    }

    if (useMarked && markedImageData) {
      // Send the marked image (base + colored paint overlays) as IMAGEN 2
      parts.push({ inline_data: { mime_type: "image/jpeg", data: markedImageData } });
    } else {
      // Fallback: abstract color map
      const parsedMap = colorMapImage ? await parseImage(colorMapImage) : null;
      if (parsedMap) parts.push({ inline_data: { mime_type: parsedMap.mimeType, data: parsedMap.data } });
    }

    // 3. Build prompt
    const changeList = (changes as AreaChange[])
      .map(c => {
        const pos = (c.posX != null && c.posY != null)
          ? ` (posición aproximada: ${c.posX}% desde la izquierda, ${c.posY}% desde arriba)`
          : "";
        return `- Área ${c.color}${pos}: ${c.description}`;
      })
      .join("\n");

    const imagenDesc = useMarked
      ? "- IMAGEN 2: la MISMA imagen base con trazos de pintura de colores encima. Cada trazo coloreado indica EXACTAMENTE el elemento que el usuario quiere modificar."
      : "- IMAGEN 2: mapa de colores abstracto. Las manchas de color sobre fondo negro indican las áreas seleccionadas. Usa las coordenadas de posición para identificar el elemento en la IMAGEN 1.";

    const systemPrompt = `Eres un asistente experto en prompts para generación de imágenes con IA.

Se te proporcionan dos imágenes:
- IMAGEN 1: la imagen original/base
${imagenDesc}

El usuario quiere hacer los siguientes cambios:
${changeList}

Tu tarea:
1. Para cada área, identifica en la IMAGEN 1 el objeto concreto que corresponde al área pintada ${useMarked ? "(busca el trazo de color en la IMAGEN 2 y mira qué elemento de la IMAGEN 1 queda debajo/encima)" : "(usa las coordenadas y el mapa de la IMAGEN 2)"}.
2. Sé MUY específico: no "el sujeto" sino "la persona tumbada en la arena a la izquierda", "el chico rubio en skate", "el pato grande con gafas de la derecha", etc.
3. Genera un prompt en español para NanaBanana con este formato exacto:

REFERENCIA 1: imagen base. Mantén todo lo que no se indica cambiar, conservando composición, iluminación y estilo.
REFERENCIA 2: mapa de colores con áreas de cambio.

[Una línea por cambio: "En el área [color] de la referencia 2 (donde está [objeto identificado con precisión]): [instrucción]"]

CRÍTICO: Identifica el elemento MÁS PEQUEÑO Y ESPECÍFICO en esa zona, no el más grande o dominante de la escena.

Devuelve SOLO el prompt, sin explicaciones ni texto adicional.`;

    parts.push({ text: systemPrompt });

    const payload = {
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.2 },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("[analyze-areas] Gemini response status:", response.status, "| marked:", useMarked);
    if (data.error) {
      console.error("[analyze-areas] Gemini API error:", JSON.stringify(data.error));
      return NextResponse.json({ error: data.error.message || "Gemini error" }, { status: 500 });
    }

    const text = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || "";
    if (!text) return NextResponse.json({ error: "No text response from AI" }, { status: 500 });

    return NextResponse.json({ prompt: text.trim() });

  } catch (error: any) {
    console.error("[analyze-areas] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
