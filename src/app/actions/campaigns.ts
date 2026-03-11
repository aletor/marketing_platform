"use server";

import OpenAI from 'openai';
import { getDb } from "@/lib/knowledge-db";
import { addToGeneratedDb } from "@/lib/generated-db";
import { createCampaign } from "@/lib/campaigns-db";
import { getEmbedding, cosineSimilarity } from "@/lib/vector-utils";
import { getSemanticCache, setSemanticCache } from "@/lib/cache-utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function generateCampaignAction(theme: string) {
  const db = getDb();
  
  // RAG Pipeline (Retrieval-Augmented Generation)
  let corporateContext = "";
  try {
    const analyzedDocs = db.documents.filter(d => d.status === "Analizado" && d.extractedContext);
    
    if (analyzedDocs.length > 0) {
      // 1. Get embedding for the user's explicit theme
      const themeEmbedding = await getEmbedding(theme);
      
      // 2. Score all documents based on semantic similarity to the theme
      const scoredDocs = analyzedDocs.map(doc => {
        let score = 0;
        if (doc.embedding && doc.embedding.length > 0) {
          score = cosineSimilarity(themeEmbedding, doc.embedding);
        }
        return { doc, score };
      });
      
      // 3. Sort by highest score first
      scoredDocs.sort((a, b) => b.score - a.score);
      
      // 4. Take Top K relevant documents (e.g., top 3) to prevent token bloat
      const topDocs = scoredDocs.slice(0, 3).map(s => s.doc);
      
      // 5. Assemble exact surgical context
      corporateContext = topDocs.map(d => {
        try {
           const parsed = JSON.parse(d.extractedContext!);
           return `### Fuente Relevante: ${d.filename}\n**Empresa:** ${parsed.empresa?.propuesta_valor || ''}\n**Diferencial:** ${parsed.diferencial_competitivo || ''}\n**Audiencia:** ${parsed.audiencia?.perfil_cliente || ''}\n**Producto:** ${(parsed.producto?.beneficios || []).join(', ')}`;
        } catch {
           return `### Fuente Relevante: ${d.filename}\n${d.extractedContext}`;
        }
      }).join("\n\n");
    } else {
      corporateContext = db.corporateContext || "No corporate context provided.";
    }
  } catch (ragError) {
    console.warn("RAG Pipeline failed, falling back to legacy global context:", ragError);
    corporateContext = db.corporateContext || "No corporate context provided.";
  }

  try {
    // PASO 1: Core Generation (gpt-5.2) - High cost, High quality
    const tier1SystemPrompt = `Eres un World-Class Copywriter y estratega de marketing operando dentro de NeuralMarketing OS, especializado en tecnología y negocios B2B. 
Tu estilo es provocador, directo y moderno. Escribes como un insider del sector.

Tu misión es escribir un ARTÍCULO PRINCIPAL de campaña de alto impacto combinando el TEMA proporcionado con el ADN Corporativo.

REGLAS DE ESCRITURA ESTRICTAS:
- Hook inicial MUY FUERTE que obligue a seguir leyendo.
- Frases cortas. Un ritmo narrativo ágil.
- Tono inteligente pero ligeramente canalla o muy directo.
- CERO LENGUAJE CORPORATIVO ABURRIDO. Evita palabras vacías como "sinergia", "líderes del sector".
- Usa párrafos muy cortos (1-2 líneas), estilo LinkedIn de alto impacto.

EJEMPLO DE ESTILO Y RITMO NARRATIVO REQUERIDO:
###
"Durante décadas, ir a un estadio ha funcionado igual.

Compras una entrada.
La enseñas.
Te escanean un código.

Fin de la historia.

Pero el deporte profesional está entrando en otra liga."
###

El TEMA EXACTO SOBRE EL QUE DEBES ESCRIBIR ES: "${theme}"

Genera ESTRICTAMENTE un JSON con la siguiente estructura:
{
  "theme": "string (El tema original)",
  "article": {
    "title": "string (Título hook y SEO)",
    "content": "string (Markdown format, long-form 800+ words, aplicando TODAS las reglas de estilo y ritmo)"
  }
}`;

    const tier1UserPrompt = `CONTEXTO EMPRESARIAL (ADN Corporativo):\n\n${corporateContext}\n\n=== RECUERDA ===\nEscribe el artículo principal con impacto brutal sobre: "${theme}".`;

    let coreResultText = getSemanticCache("gpt-5.2", tier1SystemPrompt, tier1UserPrompt);

    if (!coreResultText) {
      console.log(`[Campaign Gen] Calling GPT-5.2 for Core Article -> Theme: ${theme}`);
      const completionTier1 = await openai.chat.completions.create({
        messages: [
          { role: "system", content: tier1SystemPrompt },
          { role: "user", content: tier1UserPrompt }
        ],
        model: "gpt-5.2",
        temperature: 0.85,
        response_format: { type: "json_object" },
      });
      coreResultText = completionTier1.choices[0].message.content || "{}";
      
      setSemanticCache("gpt-5.2", tier1SystemPrompt, tier1UserPrompt, coreResultText);
    }

    const coreData = JSON.parse(coreResultText);

    // PASO 2: Derivative Generation (gpt-4o-mini) - Low cost, Parsing focused
    const tier2SystemPrompt = `Eres un Asistente Ejecutivo de Marketing operando en NeuralMarketing OS.
Se te va a proporcionar un ARTÍCULO PRINCIPAL ya redactado por un experto, además del ADN Corporativo.
Tu misión es extraer y generar los contenidos secundarios de la campaña (Social Posts, Casos de Uso, Imágenes) basándote FIELMENTE en el artículo y en el estilo directo original.

Genera ESTRICTAMENTE un JSON con:
{
  "socialPosts": [
    { "platform": "LinkedIn", "objective": "Problem Awareness", "content": "string (Post provocador, párrafos de 1 línea, resumiendo el problema del artículo)" },
    { "platform": "LinkedIn", "objective": "Solution/Educational", "content": "string (Explicación brillante basada en la solución del artículo)" },
    { "platform": "LinkedIn", "objective": "Trust/Case Study", "content": "string (Historia de éxito alineada con el artículo)" }
  ],
  "useCase": {
    "title": "string",
    "content": "string (Markdown format de un story corto sobre el problema y la solución)"
  },
  "imagePrompts": [
    "string (Midjourney prompt to illustrate the main article, in english)",
    "string (Midjourney prompt for social posts, in english)"
  ]
}`;

    const tier2UserPrompt = `CONTEXTO DE CAMPAÑA:\nADN Corporativo:\n${corporateContext}\n\nARTÍCULO PRINCIPAL GENERADO:\nTÍTULO: ${coreData.article?.title}\nCONTENIDO: ${coreData.article?.content}\n\nExtrae los derivados ahora.`;

    let derivativeResultText = getSemanticCache("gpt-4o-mini", tier2SystemPrompt, tier2UserPrompt);

    if (!derivativeResultText) {
      console.log(`[Campaign Gen] Calling GPT-4o-mini for Derivatives -> Theme: ${theme}`);
      const completionTier2 = await openai.chat.completions.create({
        messages: [
          { role: "system", content: tier2SystemPrompt },
          { role: "user", content: tier2UserPrompt }
        ],
        model: "gpt-4o-mini", // Token Cost Optimization Tiering
        temperature: 0.7, 
        response_format: { type: "json_object" },
      });
      derivativeResultText = completionTier2.choices[0].message.content || "{}";
      
      setSemanticCache("gpt-4o-mini", tier2SystemPrompt, tier2UserPrompt, derivativeResultText);
    }

    const derivativeData = JSON.parse(derivativeResultText);

    // Consolidate Campaign Data
    const campaignData = {
      ...coreData,
      ...derivativeData
    };
    
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
