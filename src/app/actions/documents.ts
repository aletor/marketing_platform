"use server";

import { getDb, saveDb, DocumentRecord } from "@/lib/knowledge-db";
import { v4 as uuidv4 } from "uuid";

export async function addDocumentAction(filename: string, s3Path: string) {
  try {
    const db = getDb();
    const newDoc: DocumentRecord = {
      id: uuidv4(),
      filename,
      s3Path,
      type: "document", // default
      format: "pdf", // default or extract from filename
      status: "Subido",
      uploadedAt: new Date().toISOString(),
    };
    
    db.documents.push(newDoc);
    saveDb(db);
    return { success: true, document: newDoc };
  } catch (error) {
    console.error("Error adding document to DB:", error);
    return { success: false, error: "Error guardando registro del documento." };
  }
}

export async function getDocumentsAction() {
  try {
    return { success: true, documents: getDb().documents };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return { success: false, documents: [] };
  }
}

export async function deleteDocumentAction(id: string) {
  try {
    const db = getDb();
    db.documents = db.documents.filter(doc => doc.id !== id);
    // TODO: A futuro también borrar el archivo de S3
    saveDb(db);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
