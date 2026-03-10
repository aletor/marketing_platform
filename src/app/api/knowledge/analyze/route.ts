import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/knowledge-db";
import { getFromS3 } from "@/lib/s3-utils";
import { parseDocument } from "@/lib/parser-utils";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const pendingDocs = db.documents.filter((doc) => doc.status === "Subido" || doc.status === "Error");

    if (pendingDocs.length === 0) {
      return NextResponse.json({ message: "No pending documents to analyze." });
    }

    const analyzedDocs = [];

    for (const doc of pendingDocs) {
      if (doc.type === "image") continue; // Images don't need text analysis yet
      
      try {
        console.log(`Starting analysis for: ${doc.filename} (ID: ${doc.id})`);
        // 1. Download file from S3
        const fileBuffer = await getFromS3(doc.s3Path);
        
        // 2. Parse text based on file type (use s3Path to get extension)
        let textContent = await parseDocument(fileBuffer, doc.s3Path, "");

        // Limit the text if it's too large for a single prompt to avoid token limits
        // A simple truncation logic, for production this might need embeddings/chunking
        const MAX_CHARS = 30000;
        if (textContent.length > MAX_CHARS) {
           console.warn(`Text too long for ${doc.filename}, truncating to ${MAX_CHARS} characters.`);
           textContent = textContent.slice(0, MAX_CHARS);
        }

        // 3. Extract key information using OpenAI in structured JSON format
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an expert strategic marketing AI. Your goal is to extract the corporate DNA from the provided text into a strict JSON format.
You must return only a JSON object with the following structure:
{
  "empresa": { "propuesta_valor": "", "sector": "", "diferenciadores": [] },
  "audiencia": { "perfil_cliente": "", "problemas_principales": [], "necesidades": [] },
  "producto": { "funcionalidades": [], "beneficios": [] },
  "casos_uso": [ { "aplicacion": "", "sector": "" } ]
}
Do not hallucinate. If some information is not present, leave it empty or as an empty array.`,
            },
            {
              role: "user",
              content: `Extract the corporate DNA from the following document:\n\n${textContent}`,
            },
          ],
        });

        const extractedJsonString = completion.choices[0].message.content || "{}";
        
        let extractedData;
        try {
          extractedData = JSON.parse(extractedJsonString);
        } catch (e) {
          extractedData = { error: "Failed to parse JSON", raw: extractedJsonString };
        }

        // 4. Update Database Record
        doc.status = "Analizado";
        doc.extractedContext = JSON.stringify(extractedData, null, 2);
        
        // Ensure corporate context merges nicely
        const readableContext = `### Document: ${doc.filename}\n
**Empresa:** ${extractedData.empresa?.propuesta_valor || ''}
**Sector:** ${extractedData.empresa?.sector || ''}
**Audiencia / Problemas:** ${(extractedData.audiencia?.problemas_principales || []).join(', ')}
**Producto / Beneficios:** ${(extractedData.producto?.beneficios || []).join(', ')}`;

        db.corporateContext = db.corporateContext 
          ? `${db.corporateContext}\n\n${readableContext}`
          : readableContext;

        analyzedDocs.push(doc.id);

      } catch (docError) {
         console.error(`Failed to analyze doc ${doc.id}:`, docError);
         doc.status = "Error"; // Mark as error so we don't infinitely retry 
      }
    }

    // Save all changes to the DB
    saveDb(db);

    return NextResponse.json({
      message: `Analyzed ${analyzedDocs.length} documents.`,
      analyzedDocIds: analyzedDocs,
    });
  } catch (error) {
    console.error("Analysis route error:", error);
    return NextResponse.json(
      { error: "Failed to run analysis." },
      { status: 500 }
    );
  }
}
