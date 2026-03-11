import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/knowledge-db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { id, context } = await req.json();

    if (!id || !context) {
      return NextResponse.json({ error: "Missing id or context" }, { status: 400 });
    }

    const db = getDb();
    const doc = db.documents.find(d => d.id === id);

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Actualizamos el contexto
    const contextString = typeof context === 'string' ? context : JSON.stringify(context, null, 2);
    doc.extractedContext = contextString;

    // Calculamos el nuevo embedding
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: contextString,
      });
      doc.embedding = embeddingResponse.data[0].embedding;
    } catch (embErr) {
      console.error("No se pudo calcular el embedding durante la actualización:", embErr);
    }

    // Reconstruir el corporateContext global clásico por compatibilidad (opcional, el RAG ahora usará los docs)
    // Extraemos de todos los docs analizados
    const allReadable = db.documents
      .filter(d => d.status === "Analizado" && d.extractedContext)
      .map(d => {
        try {
           const parsed = JSON.parse(d.extractedContext!);
           return `### Document: ${d.filename}\n**Empresa:** ${parsed.empresa?.propuesta_valor || ''}\n**Diferencial:** ${parsed.diferencial_competitivo || ''}\n**Tono:** ${parsed.tono_marca || ''}\n**Audiencia:** ${parsed.audiencia?.perfil_cliente || ''}\n**Producto:** ${(parsed.producto?.beneficios || []).join(', ')}`;
        } catch {
           return `### Document: ${d.filename}\n${d.extractedContext}`;
        }
      })
      .join("\n\n");
      
    db.corporateContext = allReadable;

    saveDb(db);

    return NextResponse.json({ success: true, message: "Contexto actualizado correctamente" });
  } catch (error) {
    console.error("Error updating context:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
