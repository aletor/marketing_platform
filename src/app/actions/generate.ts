"use server";

import OpenAI from 'openai';
import { getDb } from "@/lib/knowledge-db";
import { addToGeneratedDb } from "@/lib/generated-db";
import { logUsage } from "@/lib/usage-db";
import { getEmbedding, cosineSimilarity } from "@/lib/vector-utils";
import { getSemanticCache, setSemanticCache } from "@/lib/cache-utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", // Defaults to standard ENV var
});

export async function generateArticleAction(params: {
  topic: string;
  audience: string;
  tone: string;
  length: string;
  network: string;
}) {
  const { topic, audience, tone, length, network } = params;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  try {
    // 0. Get knowledge from the database using RAG
    const db = getDb();
    let corporateContext = "";
    try {
      const analyzedDocs = db.documents.filter(d => d.status === "Analizado" && d.extractedContext);
      
      if (analyzedDocs.length > 0) {
        // 1. Get embedding for the explicit topic
        const topicEmbedding = await getEmbedding(topic);
        
        // 2. Score docs by semantic similarity
        const scoredDocs = analyzedDocs.map(doc => {
          let score = 0;
          if (doc.embedding && doc.embedding.length > 0) {
            score = cosineSimilarity(topicEmbedding, doc.embedding);
          }
          return { doc, score };
        });
        
        scoredDocs.sort((a, b) => b.score - a.score);
        
        // 3. Take Top K
        const topDocs = scoredDocs.slice(0, 3).map(s => s.doc);
        
        // 4. Assemble surgical context
        corporateContext = topDocs.map(d => {
          try {
             const parsed = JSON.parse(d.extractedContext!);
             return `### Fuente Relevante: ${d.filename}\n**Empresa:** ${parsed.empresa?.propuesta_valor || ''}\n**Diferencial:** ${parsed.diferencial_competitivo || ''}\n**Audiencia:** ${parsed.audiencia?.perfil_cliente || ''}\n**Producto:** ${(parsed.producto?.beneficios || []).join(', ')}`;
          } catch {
             return `### Fuente Relevante: ${d.filename}\n${d.extractedContext}`;
          }
        }).join("\n\n");
      } else {
        corporateContext = db.corporateContext || "No hay contexto corporativo específico acumulado aún.";
      }
    } catch (ragError) {
      console.warn("RAG Pipeline failed, falling back to legacy global context:", ragError);
      corporateContext = db.corporateContext || "No hay contexto corporativo específico acumulado aún.";
    }

    // 1. Generate Content with GPT-4o
    const systemPrompt = `Eres un World-Class Copywriter y estratega de marketing operando dentro de NeuralMarketing OS, especializado en tecnología y negocios B2B. 
Tu estilo es provocador, directo y moderno. Escribes como un insider del sector.

IMPORTANTE: Utiliza el siguiente CONTEXTO CORPORATIVO EXTRAÍDO DE DOCUMENTOS REALES como fuente principal de verdad para el tono, datos técnicos y estrategias:
---
${corporateContext}
---

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

Genera contenido sobre el tema dado aplicando TODAS las reglas indicadas.
Debes devolver la respuesta estrictamente en JSON (sin formato Markdown adicional envolviéndolo) con las siguientes propiedades:
"article": El artículo completo en Markdown (longitud definida por parámetro, aplicando estilo provocador).
"summary": Un resumen ejecutivo de 1 o 2 párrafos impactante.
"social": Un post optimizado para la red social especificada, incluyendo emojis, ritmo ágil y foco en generar conversación.`;

    const userPrompt = `
Parámetros:
- Tema: ${topic}
- Audiencia: ${audience}
- Tono: ${tone} (además de tu tono base insider/ágil)
- Longitud (Artículo): ${length}
- Red Social Destino: ${network}
`;

    let resultText = getSemanticCache("gpt-5.2", systemPrompt, userPrompt);

    if (!resultText) {
      console.log(`[Adhoc Gen] Calling GPT-5.2 for Article -> Topic: ${topic}`);
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "gpt-5.2",
        temperature: 0.85,
        response_format: { type: "json_object" },
      });

      logUsage("gpt-5.2", completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0);

      resultText = completion.choices[0].message.content;
      if (!resultText) throw new Error("No content generated");

      setSemanticCache("gpt-5.2", systemPrompt, userPrompt, resultText);
    } else {
      // Dummy usage log for cache hit to keep track of avoided costs if desired
      // Or we can just log nothing, assuming $0 cost.
      console.log("[Adhoc Gen] Cache Hit! $0 token cost.");
    }

    const parsedResult = JSON.parse(resultText);

    // 2. Generate Image with DALL-E 3 for the article
    let imageUrl = null;
    try {
      const imagePrompt = `Una imagen premium corporativa, estilo flat design moderno o fotografia hiperrealista sin texto, sobre este tema: ${topic.substring(0, 100)}`;
      
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      });
      
      imageUrl = imageResponse?.data?.[0]?.url || null;
    } catch (imageError) {
      console.error("Error generating image via DALL-E:", imageError);
      // We don't fail the whole action if just the image fails
    }

    const generatedItem = {
      campaignId: "draft",
      type: "article" as const,
      title: topic,
      preview: parsedResult.summary,
      content: {
        article: parsedResult.article,
        summary: parsedResult.summary,
        social: parsedResult.social,
        imageUrl: imageUrl
      },
      metadata: { audience, tone, length, network }
    };

    addToGeneratedDb(generatedItem);

    return generatedItem.content;

  } catch (error) {
    console.error("OpenAI Error:", error);
    throw new Error("Failed to generate content");
  }
}

export async function generateImageAction(topic: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  try {
    const imagePrompt = `Una imagen premium corporativa, estilo flat design moderno o fotografia hiperrealista sin texto, sobre este tema: ${topic.substring(0, 100)}`;
    
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
    });
    
    logUsage("dall-e-3", 0, 0); // DALL-E 3 usage is per-image
    
    const imageUrl = imageResponse?.data?.[0]?.url || null;
    
    if (imageUrl) {
      addToGeneratedDb({
        campaignId: "draft",
        type: "image",
        title: `Imagen: ${topic.substring(0, 30)}...`,
        preview: "Imagen generada por IA",
        content: imageUrl
      });
    }

    return imageUrl;
  } catch (error) {
    console.error("Error generating image via DALL-E:", error);
    throw new Error("Failed to generate image");
  }
}
