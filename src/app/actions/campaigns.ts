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
    const systemPrompt = `Eres un Director de Marketing experto operando dentro de NeuralMarketing OS. 
Tu misión es tomar un TEMA de campaña y generar una CAMPAÑA ESTRATÉGICA unificada basándote en el ADN Corporativo.
Debes redactar el contenido final y detallado para múltiples canales.

El TEMA es: "${theme}"

Genera ESTRICTAMENTE un JSON con la siguiente estructura y contenidos reales listos para publicar:
{
  "theme": "string",
  "article": {
    "title": "string",
    "content": "string (Markdown format, long-form 800+ words, value-driven)",
    "seoKeywords": ["string"]
  },
  "socialPosts": [
    { "platform": "LinkedIn", "objective": "Problem Awareness", "content": "string ( engaging post with emojis and breaks)" },
    { "platform": "LinkedIn", "objective": "Solution/Educational", "content": "string" },
    { "platform": "LinkedIn", "objective": "Trust/Case Study", "content": "string" }
  ],
  "useCase": {
    "title": "string",
    "content": "string (Markdown format describing a realistic scenario, challenge, and solution using the product)"
  },
  "imagePrompts": [
    "string (Midjourney prompt to illustrate the article)",
    "string (Midjourney prompt for the social posts)"
  ]
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `ADN Corporativo:\n\n${corporateContext}` }
      ],
      model: "gpt-4o",
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
        content: campaignData.article.content
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
        content: campaignData.useCase.content
      });
    }

    return { ...campaignData, campaignId: newCampaign.id };
  } catch (error) {
    console.error("Campaign Generation Error:", error);
    throw new Error("Failed to generate campaign.");
  }
}
