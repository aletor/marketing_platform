import { NextRequest, NextResponse } from "next/server";
import { uploadToS3, getPresignedUrl } from "@/lib/s3-utils";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  console.log("[Gemini REST] Request received");
  try {
    const { prompt, image, aspect_ratio, resolution } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const startTime = Date.now();
    const modelId = "gemini-3.1-flash-image-preview";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

    const parts: any[] = [];

    if (image) {
      try {
        let base64Data = "";
        let mimeType = "image/png";

        if (image.startsWith('data:')) {
          const splitParts = image.split(';base64,');
          mimeType = splitParts[0].split(':')[1];
          base64Data = splitParts[1];
        } else if (image.startsWith('http')) {
          console.log(`[Gemini REST] Fetching external image: ${image}`);
          const imgRes = await fetch(image, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status} ${imgRes.statusText}`);
          const buffer = await imgRes.arrayBuffer();
          base64Data = Buffer.from(buffer).toString('base64');
          mimeType = imgRes.headers.get('content-type') || 'image/png';
          console.log(`[Gemini REST] External image fetched successfully: ${mimeType}`);
        }

        if (base64Data) {
          parts.push({
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          });
          console.log(`[Gemini REST] Image parts added (${mimeType})`);
        }
      } catch (imgErr: any) {
        console.warn("[Gemini REST] Image processing failed:", imgErr.message);
      }
    }

    parts.push({ text: prompt });

    // Map resolution to imageSize and handle casing/units
    let imageSize = "1K";
    const resInput = (resolution || "1k").toLowerCase();
    
    if (resInput === "0.5k") {
      imageSize = "512";
    } else {
      // Convert 1k -> 1K, 2k -> 2K, 4k -> 4K
      imageSize = resInput.toUpperCase();
    }

    const payload = {
      contents: [{
        role: "user",
        parts: parts
      }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: aspect_ratio || "1:1",
          imageSize: imageSize
        }
      }
    };

    console.log(`[Gemini REST] Calling ${modelId}...`);
    let response;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      const apiStart = Date.now();
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const apiEnd = Date.now();
      
      if (response.status === 429 && attempts < maxAttempts) {
        console.warn(`[Gemini REST] Quota hit (429). Attempt ${attempts}/${maxAttempts}. Waiting 5s before retry...`);
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      
      console.log(`[Gemini REST] Response Status: ${response.status} (${apiEnd - apiStart}ms)`);
      break;
    }

    if (!response) throw new Error("No response from Gemini API");

    const data = await response.json();
    console.log("[Gemini REST] Full Raw Data:", JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error("[Gemini REST] API ERROR Payload:", JSON.stringify(data, null, 2));
      const isQuota = response.status === 429;
      return NextResponse.json({ 
        error: isQuota ? "Google API Quota Reached (429)" : `Gemini REST Error (${response.status})`,
        details: data.error?.message || JSON.stringify(data)
      }, { status: response.status || 500 });
    }

    const candidate = data.candidates?.[0];
    const finishReason = candidate?.finishReason || data.promptFeedback?.blockReason || "UNKNOWN";
    const safetyRatings = candidate?.safetyRatings;
    
    console.log(`[Gemini REST] Finish Reason: ${finishReason}`);
    if (safetyRatings) {
      console.log("[Gemini REST] Safety Ratings:", JSON.stringify(safetyRatings, null, 2));
    }

    let imageBuffer: Buffer | null = null;
    const responseParts = candidate?.content?.parts || [];

    for (const part of responseParts) {
      // Check both snake_case and camelCase and different possible structures
      const inlineData = part.inline_data || part.inlineData || part.inline_data_preview;
      if (inlineData?.data) {
        console.log("[Gemini REST] Image detected in parts");
        imageBuffer = Buffer.from(inlineData.data, "base64");
        break;
      }
    }

    if (!imageBuffer) {
      const textResponse = responseParts.find((p: any) => p.text)?.text || "";
      console.warn("[Gemini REST] No image parts found. Text:", textResponse || "None");
      const isBlocked = finishReason === "SAFETY" || finishReason === "BLOCKLIST" || finishReason === "OTHER";
      let errorMessage = "No image was generated. Please try a different prompt.";
      if (finishReason === "SAFETY") errorMessage = "Safety violation: Prompt or content blocked.";
      if (finishReason === "OTHER") errorMessage = "Content Intercepted: This might be due to copyright filters or advanced safety triggers. Try a more general prompt.";
      
      return NextResponse.json({ 
        error: errorMessage,
        details: textResponse || `Finish Reason: ${finishReason}`
      }, { status: 500 });
    }

    console.log("[Gemini REST] Saving to S3...");
    const filename = `gemini_${crypto.randomUUID()}.png`;
    const key = await uploadToS3(filename, imageBuffer, "image/png");
    const url = await getPresignedUrl(key);

    return NextResponse.json({ 
      output: url,
      key: key,
      time: Date.now() - startTime
    });
  } catch (error: any) {
    console.error("[Gemini REST] Global Exception:", error.message);
    return NextResponse.json({ error: `Server Exception: ${error.message}` }, { status: 500 });
  }
}
