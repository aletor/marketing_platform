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
    
    // Replicate.run can return the output directly for many models
    const output = await replicate.run(
      model as any,
      { input }
    );

    return NextResponse.json({ output });
  } catch (error: any) {
    console.error("Replicate Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
