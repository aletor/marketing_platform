"use server";

import OpenAI from 'openai';
import { getDb, saveDb } from "@/lib/knowledge-db";
import { addToGeneratedDb } from "@/lib/generated-db";
import { logUsage } from "@/lib/usage-db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function generateMarketingStrategyAction() {
  const db = getDb();
  const corporateContext = db.corporateContext;

  if (!corporateContext || corporateContext.trim() === "" || corporateContext.includes("No hay context")) {
    throw new Error("No hay suficiente conocimiento en la Base de Conocimiento para generar una estrategia. Por favor, sube y analiza algunos documentos primero.");
  }

  try {
    const systemPrompt = `Eres un Director de Marketing (CMO) experto en estrategia B2B y captación de leads.
Tu objetivo es analizar el CONTEXTO CORPORATIVO de una empresa y generar una ESTRATEGIA DE MARKETING DE CONTENIDOS detallada, orientada a la conversión y estructurada en 4 PILARES FUNDAMENTALES: Captación, Educativo, Confianza y Conversión.

Debes extraer y definir:
1. Perfil del Negocio: Tipo de producto/servicio y funcionalidades clave.
2. Propuesta de Valor: Problemas que resuelve y ventajas competitivas.
3. Buyer Persona: Perfil de usuario ideal.
4. Ejes de Contenido: Temas principales mapeados a los 4 pilares.

Responde ESTRICTAMENTE en JSON con esta estructura:
{
  "businessProfile": {
    "type": "string",
    "features": ["string"],
    "problemsSolved": ["string"],
    "advantages": ["string"]
  },
  "targetAudience": {
    "profile": "string",
    "useCases": ["string"]
  },
  "contentStrategy": {
    "pillars": {
      "captacion": ["string (ideas para atraer tráfico)"],
      "educativo": ["string (ideas para resolver problemas del cliente)"],
      "confianza": ["string (ideas basadas en casos/datos reales de la empresa)"],
      "conversion": ["string (ideas enfocadas a la venta)"]
    },
    "opportunities": ["string"]
  }
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analiza este contexto corporativo y genera la estrategia:\n\n${corporateContext}` }
      ],
      model: "gpt-5.2",
      response_format: { type: "json_object" },
    });

    logUsage("gpt-5.2", completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0);

    const strategy = JSON.parse(completion.choices[0].message.content || "{}");
    
    addToGeneratedDb({
      campaignId: "draft",
      type: "marketing",
      title: "Estrategia de Marketing",
      preview: `Estrategia generada para perfil: ${strategy.businessProfile?.type}`,
      content: strategy
    });

    return strategy;
  } catch (error) {
    console.error("Marketing Strategy Error:", error);
    throw new Error("Error al generar la estrategia de marketing.");
  }
}

export async function generateEditorialPlanAction(strategy: any) {
  try {
    const systemPrompt = `Eres un Content Manager experto. Basándote en la ESTRATEGIA DE MARKETING proporcionada, genera un PLAN EDITORIAL de 4 semanas.
El objetivo es atraer leads mediante contenido educativo y estratégico. Cada semana debe tener 1 artículo de blog y 1 post de LinkedIn.

CRÍTICO: Debes asegurar un balance entre los 4 PILARES de contenido. Etiqueta cada pieza de contenido con su pilar correspondiente usando el campo "pillar", que SOLO puede tener uno de estos 4 valores:
- "captacion" (Atraer nuevo tráfico)
- "educativo" (Resolver problemas reales)
- "confianza" (Casos de éxito, datos reales de la empresa)
- "conversion" (Orientado a la venta/lead)

Responde ESTRICTAMENTE en JSON con esta estructura:
{
  "weeks": [
    {
      "week": 1,
      "items": [
        { "type": "article", "title": "string", "description": "string", "pillar": "captacion|educativo|confianza|conversion" },
        { "type": "social", "title": "string", "description": "string", "pillar": "captacion|educativo|confianza|conversion" }
      ]
    }
    // ... hasta semana 4
  ]
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Genera un plan editorial para esta estrategia:\n\n${JSON.stringify(strategy)}` }
      ],
      model: "gpt-5.2",
      response_format: { type: "json_object" },
    });

    logUsage("gpt-5.2", completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0);

    const plan = JSON.parse(completion.choices[0].message.content || "{}");

    addToGeneratedDb({
      campaignId: "draft",
      type: "marketing",
      title: "Plan Editorial (4 Semanas)",
      preview: "Planificación de contenidos educativos y redes sociales.",
      content: plan
    });

    return plan;
  } catch (error) {
    console.error("Editorial Plan Error:", error);
    throw new Error("Error al generar el plan editorial.");
  }
}

export async function getQuickRecommendationsAction(query?: string, count: number = 6) {
  const db = getDb();
  const corporateContext = db.corporateContext;

  if (!corporateContext || corporateContext.trim() === "") {
    return [];
  }

  try {
    const systemPrompt = `Eres el Motor Estratégico de un NeuralMarketing OS. Tu objetivo es detectar y sugerir exactamente ${count} "Oportunidades de Campaña" accionables, basadas ESTRICTAMENTE en el ADN corporativo (problemas del cliente, funcionalidades y propuesta de valor).
    
Debes proponer temas (titles) que resuelvan un problema directo documentado en el contexto corporativo.
Tipos de contenido permitidos (type): "Article", "Social", "Tutorial", "Use Case".

${query ? `El usuario ha solicitado ideas específicamente sobre: "${query}".` : 'Genera ideas basadas en los dolores urgentes de la audiencia y casos de uso del producto.'}

Responde ESTRICTAMENTE en JSON con esta estructura:
{
  "recommendations": [
    { "id": number, "title": "string (Tema de la campaña/contenido)", "type": "Article|Social|Tutorial|Use Case", "match": "90-99% ROI" }
  ]
}`;

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Contexto Corporativo (ADN):\n\n${corporateContext}` }
      ],
      model: "gpt-5.2",
      response_format: { type: "json_object" },
    });

    logUsage("gpt-5.2", completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0);

    const data = JSON.parse(completion.choices[0].message.content || '{"recommendations": []}');
    return data.recommendations;
  } catch (error) {
    console.error("Recommendations Error:", error);
    return [];
  }
}
