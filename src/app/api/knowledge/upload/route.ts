import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3-utils";
import { getDb, saveDb } from "@/lib/knowledge-db";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Support multiple files or a single file
    const files = formData.getAll("file") as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded." },
        { status: 400 }
      );
    }

    const db = getDb();
    const uploadedDocs = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = file.name;
      const contentType = file.type || "application/octet-stream";

      // Upload to S3
      const s3Key = await uploadToS3(filename, buffer, contentType);

      // Determine type
      const isImage = contentType.startsWith("image/");
      const type = isImage ? "image" : "document";

      // Determine format
      let format: "pdf" | "docx" | "txt" | "image" = "txt";
      if (isImage) format = "image";
      else if (filename.toLowerCase().endsWith(".pdf")) format = "pdf";
      else if (filename.toLowerCase().endsWith(".docx")) format = "docx";
      else if (filename.toLowerCase().endsWith(".txt")) format = "txt";

      // Create record
      const docRecord = {
        id: uuidv4(),
        filename,
        s3Path: s3Key,
        type: type as any,
        format,
        status: (isImage ? "Analizado" : "Subido") as any,
        uploadedAt: new Date().toISOString(),
      };

      db.documents.push(docRecord);
      uploadedDocs.push(docRecord);
    }
    
    saveDb(db);

    return NextResponse.json({
      message: `Successfully uploaded ${uploadedDocs.length} file(s)`,
      documents: uploadedDocs,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file(s)." },
      { status: 500 }
    );
  }
}
