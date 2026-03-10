import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/knowledge-db";
import { deleteFromS3 } from "@/lib/s3-utils";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "No ID provided" }, { status: 400 });
    }

    const db = getDb();
    const docIndex = db.documents.findIndex((doc) => doc.id === id);

    if (docIndex === -1) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const doc = db.documents[docIndex];

    // Delete from S3 if s3Path exists (URLs might not have s3Path if we only store URL)
    if (doc.s3Path) {
      try {
        await deleteFromS3(doc.s3Path);
      } catch (s3Error) {
        console.error("S3 Deletion error (ignoring to proceed with DB cleanup):", s3Error);
      }
    }

    // Remove from DB
    db.documents.splice(docIndex, 1);
    saveDb(db);

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
