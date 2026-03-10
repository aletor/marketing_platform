import { NextRequest, NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3-utils";
import { getDb, saveDb } from "@/lib/knowledge-db";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // 1. Fetch content
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    // 2. Extract text with Cheerio
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $("script, style, nav, footer, header").remove();
    
    const title = $("title").text() || url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    if (bodyText.length < 50) {
      return NextResponse.json({ error: "Could not extract enough content from the URL." }, { status: 400 });
    }

    // 3. Save as text to S3
    const filename = `URL-${Date.now()}.txt`;
    const buffer = Buffer.from(bodyText);
    const s3Key = await uploadToS3(filename, buffer, "text/plain");

    // 4. Update DB
    const db = getDb();
    const docRecord = {
      id: uuidv4(),
      filename: `[URL] ${title}`,
      s3Path: s3Key,
      type: "document" as const,
      format: "url" as const,
      status: "Subido" as const,
      uploadedAt: new Date().toISOString(),
      originalSourceUrl: url,
    };

    db.documents.push(docRecord);
    saveDb(db);

    return NextResponse.json({
      message: "URL added successfully",
      document: docRecord,
    });
  } catch (error) {
    console.error("URL extraction error:", error);
    return NextResponse.json({ error: "Failed to extract content from URL." }, { status: 500 });
  }
}
