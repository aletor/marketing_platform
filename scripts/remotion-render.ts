#!/usr/bin/env node
/**
 * scripts/remotion-render.ts
 * 
 * Standalone Node.js script to render a Remotion tutorial video.
 * Called by /api/video/remotion-render via child_process.spawn.
 * 
 * Input: JSON via stdin with shape: { steps, format, totalDurationInFrames }
 * Output: writes rendered video to /tmp/remotion-output-<jobId>.mp4
 *         then prints the output path to stdout (last line)
 */

import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { TutorialCompositionProps } from "../src/remotion/TutorialComposition";

async function main() {
  let inputJson = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    inputJson += chunk;
  }

  const { steps, format, totalDurationInFrames, jobId } = JSON.parse(inputJson) as {
    steps: TutorialCompositionProps["steps"];
    format: "16:9" | "9:16";
    totalDurationInFrames: number;
    jobId: string;
  };

  const compositionId = format === "9:16" ? "TutorialVertical" : "TutorialLandscape";
  const entryPoint = path.join(process.cwd(), "src/remotion/index.ts");
  const outputPath = path.join("/tmp", `remotion-output-${jobId}.mp4`);

  console.error(`[remotion-render] Bundling from ${entryPoint}...`);
  const bundled = await bundle({ entryPoint, webpackOverride: (c) => c });

  const inputProps: TutorialCompositionProps = { steps, format };

  console.error(`[remotion-render] Selecting composition ${compositionId} (${totalDurationInFrames} frames)...`);
  const composition = await selectComposition({
    serveUrl: bundled,
    id: compositionId,
    inputProps: { ...inputProps, durationInFrames: totalDurationInFrames },
  });

  console.error(`[remotion-render] Rendering to ${outputPath}...`);
  await renderMedia({
    composition: { ...composition, durationInFrames: totalDurationInFrames },
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
    imageFormat: "jpeg",
    jpegQuality: 90,
    concurrency: 2,
    onProgress: ({ progress }) => {
      console.error(`[remotion-render] Progress: ${Math.round(progress * 100)}%`);
    },
  });

  // Print only the output path on stdout (the API route reads this)
  process.stdout.write(outputPath + "\n");
}

main().catch((err) => {
  console.error("[remotion-render] FATAL:", err.message);
  process.exit(1);
});
