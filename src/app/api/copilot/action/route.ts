import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/knowledge-db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const { action, currentContent, customPrompt } = await req.json();

    if (!currentContent) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const db = getDb();
    
    // We fetch corporate DNA to maintain the tone and data in the fast actions
    const corporateContext = db.corporateContext || "No corporate context available.";

    let systemInstructions = `Eres un asistente Copilot experto en NeuralMarketing OS. 
Se te proporcionará un texto en crudo y tu objetivo es reescribirlo EXCLUSIVAMENTE basándote en la orden solicitada.
MANTÉN siempre el estilo provocador, B2B y directo. 
Responde ÚNICAMENTE con el texto modificado, sin formatos extra y sin confirmaciones como "Aquí tienes".`;

    let userInstruction = "";

    switch (action) {
      case 'hook':
        userInstruction = "Modifica los dos primeros párrafos para que contengan un 'Hook Killer'. Tiene que ser provocador, hacer una afirmación contundente o romper una expectativa B2B. Mantén el resto del texto.";
        break;
      case 'shorter':
        userInstruction = "Haz este texto un 30% más corto. Ve directo al grano, elimina redundancias, elimina lenguaje corporativo vacío y conviértelo en algo conciso, potente y fácil de escanear.";
        break;
      case 'storytelling':
        userInstruction = "Inyecta ritmo narrativo (storytelling). Usa frases cortas estilo LinkedIn. Que no parezca un panfleto corporativo, sino una reflexión interna de un líder del sector.";
        break;
      case 'cta':
        userInstruction = "Añade al final del texto un Call to Action (CTA) sutil pero magnético. Invita a descubrir más o a una demo sin sonar a vendedor desesperado.";
        break;
      case 'seo':
        userInstruction = "Revisa este texto e infúndele mejores hooks SEO (encabezados H2, negritas en palabras clave clave, sin perder la naturalidad).";
        break;
      case 'custom':
        userInstruction = customPrompt || "Mejora el texto.";
        break;
      default:
        userInstruction = "Mejora el texto en general (claridad y ritmo).";
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemInstructions },
        { role: "user", content: `CONTEXTO ADN: ${corporateContext}\n\nTEXTO ORIGINAL:\n${currentContent}\n\nINSTRUCCIÓN: ${userInstruction}` }
      ],
      model: "gpt-4o-mini", // Model Tiering: Usamos mini para acciones rápidas de edición
      temperature: 0.6,
    });

    const modifiedText = completion.choices[0]?.message?.content || currentContent;

    return NextResponse.json({ success: true, text: modifiedText });

  } catch (error) {
    console.error("Copilot Fast Action Error:", error);
    return NextResponse.json({ error: "Failed to run copilot action" }, { status: 500 });
  }
}
