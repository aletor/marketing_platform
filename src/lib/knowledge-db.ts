import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "knowledge-db.json");

export interface DocumentRecord {
  id: string;
  filename: string;
  s3Path: string;
  type: "document" | "image";
  format: "pdf" | "docx" | "txt" | "url" | "image";
  status: "Subido" | "Analizado" | "Error";
  uploadedAt: string;
  extractedContext?: string;
  originalSourceUrl?: string;
}

interface Database {
  documents: DocumentRecord[];
  corporateContext: string;
}

function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultData: Database = { documents: [], corporateContext: "" };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
  }
}

export function getDb(): Database {
  initDb();
  const data = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(data);
}

export function saveDb(data: Database) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
