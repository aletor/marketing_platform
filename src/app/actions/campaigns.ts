"use server";

import OpenAI from 'openai';
import { getDb } from "@/lib/knowledge-db";
import { addToGeneratedDb } from "@/lib/generated-db";
import { createCampaign } from "@/lib/campaigns-db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function generateCampaignAction(theme: string) {
  const db = getDb();
  const corporateContext = db.corporateContext || "No corporate context provided.";

  try {
    const systemPrompt = `Eres un World-Class Copywriter y estratega de marketing operando dentro de NeuralMarketing OS, especializado en tecnología y negocios B2B. 
Tu estilo es provocador, directo y moderno. Escribes como un insider del sector.

Tu misión EXCLUSIVA es tomar un TEMA ESPECÍFICO de campaña proporcionado por el usuario y generar una CAMPAÑA ESTRATÉGICA de alto impacto combinando MARAVILLOSAMENTE ese tema con el ADN Corporativo.

REGLAS DE ESCRITURA ESTRICTAS:
- Hook inicial MUY FUERTE que obligue a seguir leyendo.
- Frases cortas. Un ritmo narrativo ágil.
- Tono inteligente pero ligeramente canalla o muy directo.
- CERO LENGUAJE CORPORATIVO ABURRIDO. Evita palabras vacías como "sinergia", "líderes del sector", "soluciones integrales".
- Genera curiosidad y debate.
- Usa párrafos muy cortos (1-2 líneas), estilo LinkedIn de alto impacto.
- Explica ideas complejas de forma visual y simple.
- Termina siempre con una visión de futuro o conclusión muy potente.

EJEMPLO DE ESTILO Y RITMO NARRATIVO REQUERIDO:
###
"Durante décadas, ir a un estadio ha funcionado igual.

Compras una entrada.
La enseñas.
Te escanean un código.

Fin de la historia.

Pero el deporte profesional está entrando en otra liga."
###

REGLA DE TEMA COHERENTE: El tema proporcionado por el usuario ("El TEMA") es LA LEY. Todo (artículos, posts, casos de uso) DEBE girar en torno a ese tema, integrando de forma creativa el ADN Corporativo como respuesta o potenciador.

El TEMA EXACTO SOBRE EL QUE DEBES ESCRIBIR ES: "${theme}"

Genera ESTRICTAMENTE un JSON con la siguiente estructura y contenidos reales listos para publicar:
{
  "theme": "string (El tema original)",
  "article": {
    "title": "string (Título hook y SEO)",
    "content": "string (Markdown format, long-form 800+ words, value-driven, aplicando TODAS las reglas de estilo y ritmo)"
  },
  "socialPosts": [
    { "platform": "LinkedIn", "objective": "Problem Awareness", "content": "string (Post provocador con ritmo marcado, párrafos de 1 línea, emojis bien situados)" },
    { "platform": "LinkedIn", "objective": "Solution/Educational", "content": "string (Explicación brillante usando el ADN)" },
    { "platform": "LinkedIn", "objective": "Trust/Case Study", "content": "string (Historia de éxito directa al grano)" }
  ],
  "useCase": {
    "title": "string",
    "content": "string (Markdown format de un story corto sobre el problema y la solución)"
  },
  "imagePrompts": [
    "string (Midjourney prompt to illustrate the article, in english)",
    "string (Midjourney prompt for social posts, in english)"
  ]
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `CONTEXTO EMPRESARIAL (ADN Corporativo):\n\n${corporateContext}\n\n=== RECUERDA ===\nEscribe con impacto brutal sobre: "${theme}", impulsada por este ADN.` }
      ],
      model: "gpt-5.2",
      temperature: 0.85,
      response_format: { type: "json_object" },
    });

    const campaignData = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Create the central Campaign entity
    const newCampaign = createCampaign(theme, campaignData);
    
    // Auto-save the assets to the library with campaignId
    if (campaignData.article) {
      addToGeneratedDb({
        campaignId: newCampaign.id,
        type: "article",
        title: campaignData.article.title,
        preview: "Campaña: " + theme,
        content: {
          article: campaignData.article.content,
          summary: "Resumen generado automáticamente para " + theme
        }
      });
    }

    if (campaignData.socialPosts) {
      campaignData.socialPosts.forEach((post: any, i: number) => {
        addToGeneratedDb({
          campaignId: newCampaign.id,
          type: "social",
          title: `Post ${i+1}: ${theme}`,
          preview: post.objective,
          content: post.content
        });
      });
    }

    if (campaignData.useCase) {
      addToGeneratedDb({
        campaignId: newCampaign.id,
        type: "article", // Storing as article for now
        title: "Caso de Uso: " + campaignData.useCase.title,
        preview: "Campaña: " + theme,
        content: {
          article: campaignData.useCase.content,
          summary: "Caso de éxito relacionado con " + theme
        }
      });
    }

    return { ...campaignData, campaignId: newCampaign.id };
  } catch (error) {
    console.error("Campaign Generation Error:", error);
    throw new Error("Failed to generate campaign.");
  }
}
