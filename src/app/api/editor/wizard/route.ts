import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/knowledge-db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const { stepIndex, content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "Missing content" }, { status: 400 });
    }

    const db = getDb();
    const corporateContext = db.corporateContext || "Sin contexto corporativo.";

    let systemInstructions = `Eres un Copywriter Senior operando el "Methodology Wizard" de NeuralMarketing OS. 
El usuario te va a pasar un borrador. Tu misión es aplicar ESTRICTAMENTE UNA técnica de mejora basándote en el paso en el que nos encontramos.
Devuelve ÚNICAMENTE el texto mejorado, sin introducciones ni comentarios explicativos. Respeta el formato original (si es markdown, devuélvelo en markdown).`;

    let stepPrompt = "";

    switch (stepIndex) {
      case 0: // 1. Hook Killer
        stepPrompt = `Paso 1: Hook Killer. Analiza el inicio del texto. Reescribe los 2 o 3 primeros párrafos para que el "hook" de entrada sea devastadoramente atractivo, provocador o polémico, diseñado para enganchar a un directivo B2B. Mantén el resto del artículo intacto.`;
        break;
      case 1: // 2. Claridad Brutal
        stepPrompt = `Paso 2: Claridad Brutal. Elimina toda la paja, frases redundantes y palabras corporativas vacías ("sinergias", "líderes"). Acorta las frases largas. Que quede un texto un 20% más corto pero el doble de impactante.`;
        break;
      case 2: // 3. Estructura Profesional
        stepPrompt = `Paso 3: Estructura Profesional. Organiza el texto para que sea "escaneable". Asegúrate de que haya buenos subtitulares H2 y H3 atractivos. Si hay listas pesadas de texto, conviértelas en bullet points impactantes.`;
        break;
      case 3: // 4. Autoridad
        stepPrompt = `Paso 4: Autoridad. Usando el ADN del contexto: (${corporateContext.substring(0, 1000)}...), infunde sutilmente un dato estadístico, un ejemplo o un mini caso real que dé credibilidad al relato.`;
        break;
      case 4: // 5. Conversión
        stepPrompt = `Paso 5: Conversión. Añade al final del texto un Call to Action (CTA) magnético o una pregunta abierta que incite inevitablemente a comentar o a contactar, pero sin parecer desesperado por vender.`;
        break;
      case 5: // 6. Distribución (Derivados) -> Este suele devolver un JSON, pero para el Editor lo añadiremos al bottom line.
        stepPrompt = `Paso 6: Distribución Social. Añade al final de este texto, separado por una línea "---", 2 ideas geniales de Posts para LinkedIn basados en este mismo artículo.`;
        break;
      case 6: // 7. SEO Base
        stepPrompt = `Paso 7: SEO. Optimiza el texto para buscadores B2B de forma natural. Asegúrate de que el titular contiene la palabra clave principal al inicio y mejora sutilmente la densidad semántica del resto del texto.`;
        break;
      default:
        stepPrompt = `Mejora el texto.`;
    }

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemInstructions },
        { role: "user", content: `BORRADOR ORIGINAL:\n${content}\n\nREQUISITO DEL PASO ACTUAL:\n${stepPrompt}` }
      ],
      model: "gpt-5.2", // El Wizard Profesional debe usar el modelo insignia para calidad maestra
      temperature: 0.7,
    });

    const modifiedText = completion.choices[0]?.message?.content || content;

    return NextResponse.json({ success: true, text: modifiedText });

  } catch (error) {
    console.error("Wizard Step Error:", error);
    return NextResponse.json({ error: "Failed to run wizard step" }, { status: 500 });
  }
}
