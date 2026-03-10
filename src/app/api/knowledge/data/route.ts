import { NextResponse } from "next/server";
import { getDb } from "@/lib/knowledge-db";

export async function GET() {
  try {
    const db = getDb();
    // Reorder documents to show the newest first
    const sortedDocs = [...db.documents].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({
      documents: sortedDocs,
      corporateContext: db.corporateContext,
    });
  } catch (error) {
    console.error("Data route error:", error);
    return NextResponse.json(
      { error: "Failed to read database." },
      { status: 500 }
    );
  }
}
