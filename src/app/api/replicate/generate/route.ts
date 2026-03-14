import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { model, input } = await req.json();

    if (!model || !input) {
      return NextResponse.json({ error: "Model and input are required" }, { status: 400 });
    }

    console.log(`[Replicate] Running model: ${model}`);
    console.log(`[Replicate] Input:`, JSON.stringify(input, null, 2));
    
    // Replicate.run can return the output directly for many models
    const output = await replicate.run(
      model as any,
      { input }
    );

    console.log(`[Replicate] Output received successfully`);
    return NextResponse.json({ output });
  } catch (error: any) {
    console.error("Replicate Error Detail:", error.message);
    if (error.response) {
      console.error("Replicate API Response:", await error.response.text());
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
