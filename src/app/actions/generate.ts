"use server";

import OpenAI from 'openai';
import { getDb } from "@/lib/knowledge-db";
import { addToGeneratedDb } from "@/lib/generated-db";
import { logUsage } from "@/lib/usage-db";

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
    // 0. Get knowledge from the database
    const db = getDb();
    const corporateContext = db.corporateContext || "No hay contexto corporativo específico acumulado aún.";

    // 1. Generate Content with GPT-4o
    const systemPrompt = `Eres un experto redactor de contenidos B2B y marketing corporativo. 

IMPORTANTE: Utiliza el siguiente CONTEXTO CORPORATIVO EXTRAÍDO DE DOCUMENTOS REALES como fuente principal de verdad para el tono, datos técnicos y estrategias:
---
${corporateContext}
---

Genera contenido sobre el tema dado. Debes devolver la respuesta estrictamente en JSON (sin formato Markdown adicional envolviéndolo) con las siguientes propiedades:
"article": El artículo completo en Markdown (longitud definida por parámetro).
"summary": Un resumen ejecutivo de 1 o 2 párrafos.
"social": Un post optimizado para la red social especificada, incluyendo hashtags.`;

    const userPrompt = `
Parámetros:
- Tema: ${topic}
- Audiencia: ${audience}
- Tono: ${tone}
- Longitud (Artículo): ${length}
- Red Social Destino: ${network}
`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" },
    });

    logUsage("gpt-4o", completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0);

    const resultText = completion.choices[0].message.content;
    if (!resultText) throw new Error("No content generated");

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
