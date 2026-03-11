import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import { readFile, unlink } from "fs/promises";
import { uploadToS3, getPresignedUrl } from "@/lib/s3-utils";
import { getTtsAudioUrl } from "@/lib/tts-utils";
import { planMotion } from "@/lib/motion-planner";
import type { BBox, ElementType, CameraMode } from "@/lib/motion-planner";
import type { TutorialStep } from "@/remotion/TutorialComposition";

type StepInput = {
  screenBase64: string;
  instruction: string;
  script: string;
  bbox: BBox;
  type: ElementType;
  cameraMode?: CameraMode;
  showHighlight?: boolean;
  voiceId?: string;
};

const FPS = 30;

/**
 * Run the Remotion render script as a child process.
 * This completely isolates Remotion's native Node.js binaries from Next.js.
 */
function spawnRemotion(payload: {
  steps: TutorialStep[];
  format: string;
  totalDurationInFrames: number;
  jobId: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), "scripts/remotion-render.ts");
    const tsxBin = path.join(process.cwd(), "node_modules/.bin/tsx");

    const proc = spawn(tsxBin, [scriptPath], {
      cwd: process.cwd(),
      env: process.env,
    });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      // Stream render progress to server logs
      process.stdout.write(d);
    });

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Remotion process exited with code ${code}:\n${stderr.slice(-2000)}`));
        return;
      }
      const outputPath = stdout.trim().split("\n").pop() ?? "";
      if (!outputPath) {
        reject(new Error("Remotion process did not return an output path"));
        return;
      }
      resolve(outputPath);
    });
  });
}

export async function POST(req: Request) {
  const { steps: stepInputs, format = "16:9", language = "es" }: {
    steps: StepInput[];
    format: "16:9" | "9:16";
    language: string;
  } = await req.json();

  if (!stepInputs?.length) {
    return NextResponse.json({ error: "No steps provided" }, { status: 400 });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY required" }, { status: 503 });
  }

  const jobId = Date.now().toString(36);

  try {
    // 1. Upload screenshots to S3
    console.log(`[Remotion Route] Uploading ${stepInputs.length} screenshots...`);
    const screenUrls: string[] = [];
    for (let i = 0; i < stepInputs.length; i++) {
      const base64 = stepInputs[i].screenBase64.replace(/^data:image\/\w+;base64,/, "");
      const buf = Buffer.from(base64, "base64");
      const s3Key = await uploadToS3(`remotion-screen-${jobId}-${i}.jpg`, buf, "image/jpeg");
      screenUrls.push(await getPresignedUrl(s3Key));
    }

    // 2. Generate ElevenLabs audio + measure duration
    console.log(`[Remotion Route] Generating ${stepInputs.length} audio clips...`);
    const audioResults: Array<{ audioUrl: string; durationMs: number }> = [];
    for (let i = 0; i < stepInputs.length; i++) {
      const result = await getTtsAudioUrl(stepInputs[i].script, language, `${jobId}-${i}`, 0, stepInputs[i].voiceId);
      audioResults.push(result);
    }

    // 3. Motion Planner: keyframes per step (with smart-pan prev state)
    const tutorialSteps: TutorialStep[] = [];
    for (let i = 0; i < stepInputs.length; i++) {
      const step = stepInputs[i];
      const prev = tutorialSteps[i - 1]?.plan;
      const plan = planMotion({
        bbox: step.bbox,
        type: step.type,
        cameraMode: step.cameraMode ?? "detail",
        showHighlight: step.showHighlight ?? true,
        durationMs: audioResults[i].durationMs,
        aspectRatio: format,
        // Smart pan: if previous was also a detail, start from its end state
        prevZoom: prev?.zoomEnd,
        prevPanX: prev?.panXEnd,
        prevPanY: prev?.panYEnd,
      });
      tutorialSteps.push({
        screenUrl: screenUrls[i],
        audioUrl: audioResults[i].audioUrl,
        instruction: step.instruction,
        bbox: step.bbox,
        plan,
      });
    }


    // 4. Calculate total duration
    const totalDurationInFrames = tutorialSteps.reduce((acc, s) => {
      const totalSec = s.plan.introSec + s.plan.moveSec + s.plan.holdSec + s.plan.outroSec;
      return acc + Math.round(totalSec * FPS);
    }, 0);

    console.log(`[Remotion Route] Spawning Remotion process (${totalDurationInFrames} frames)...`);

    // 5. Spawn Remotion as a child process (avoids Next.js bundler conflict)
    const outputPath = await spawnRemotion({ steps: tutorialSteps, format, totalDurationInFrames, jobId });

    // 6. Upload rendered video to S3
    console.log(`[Remotion Route] Uploading rendered video from ${outputPath}...`);
    const videoBuffer = await readFile(outputPath);
    const videoKey = await uploadToS3(`tutorial-${format}-${jobId}.mp4`, videoBuffer, "video/mp4");
    const videoUrl = await getPresignedUrl(videoKey);

    // Cleanup
    await unlink(outputPath).catch(() => {});

    return NextResponse.json({ videoUrl });

  } catch (err: any) {
    console.error("[Remotion Route] Error:", err.message);
    return NextResponse.json({ error: err.message || "Render failed" }, { status: 500 });
  }
}
