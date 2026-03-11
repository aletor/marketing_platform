import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { BBox, MotionPlan } from "@/lib/motion-planner";

// ── BackgroundBlur ────────────────────────────────────────────────────────────

const BackgroundBlur: React.FC<{ src: string }> = ({ src }) => (
  <AbsoluteFill
    style={{ overflow: "hidden", filter: "blur(40px)", transform: "scale(1.12)", opacity: 0.75 }}
  >
    <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  </AbsoluteFill>
);

// ── VirtualCamera ─────────────────────────────────────────────────────────────

const VirtualCamera: React.FC<{
  src: string;
  plan: MotionPlan;
  frameInStep: number;
  totalFrames: number;
  fps: number;
}> = ({ src, plan, frameInStep, totalFrames, fps }) => {
  const introFrames = Math.round(plan.introSec * fps);
  const moveEnd = introFrames + Math.round(plan.moveSec * fps);
  const outroStart = totalFrames - Math.round(plan.outroSec * fps);

  const easing = Easing.out(Easing.cubic);

  const scale =
    frameInStep < introFrames
      ? plan.zoomStart
      : frameInStep < moveEnd
      ? interpolate(frameInStep, [introFrames, moveEnd], [plan.zoomStart, plan.zoomEnd], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : frameInStep > outroStart
      ? interpolate(frameInStep, [outroStart, totalFrames], [plan.zoomEnd, 1.0], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : plan.zoomEnd;

  const px =
    frameInStep < introFrames
      ? plan.panXStart
      : frameInStep < moveEnd
      ? interpolate(frameInStep, [introFrames, moveEnd], [plan.panXStart, plan.panXEnd], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : frameInStep > outroStart
      ? interpolate(frameInStep, [outroStart, totalFrames], [plan.panXEnd, 0], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : plan.panXEnd;

  const py =
    frameInStep < introFrames
      ? plan.panYStart
      : frameInStep < moveEnd
      ? interpolate(frameInStep, [introFrames, moveEnd], [plan.panYStart, plan.panYEnd], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : frameInStep > outroStart
      ? interpolate(frameInStep, [outroStart, totalFrames], [plan.panYEnd, 0], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" })
      : plan.panYEnd;

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Img
        src={src}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          transform: `translate(${px * 100}%, ${py * 100}%) scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
    </AbsoluteFill>
  );
};

// ── HighlightRing ─────────────────────────────────────────────────────────────

const HighlightRing: React.FC<{
  bbox: BBox;
  type: "ring" | "glow" | "none";
  frameInStep: number;
  showAt: number;
  fps: number;
}> = ({ bbox, type, frameInStep, showAt, fps }) => {
  if (type === "none" || frameInStep < showAt) return null;

  const fadeIn = Math.round(0.2 * fps);
  const opacity = interpolate(frameInStep, [showAt, showAt + fadeIn], [0, 1], { extrapolateRight: "clamp" });
  const color = type === "ring" ? "#00ffcc" : "#ffd700";
  const shadow = type === "glow" ? `0 0 22px 8px ${color}66` : "none";

  return (
    <div style={{
      position: "absolute",
      left: `${bbox.x}%`, top: `${bbox.y}%`,
      width: `${bbox.w}%`, height: `${bbox.h}%`,
      border: `3px solid ${color}`,
      borderRadius: 10,
      boxShadow: shadow,
      opacity,
      pointerEvents: "none",
    }} />
  );
};

// ── CursorOverlay ─────────────────────────────────────────────────────────────

const CursorOverlay: React.FC<{
  bbox: BBox;
  doClick: boolean;
  frameInStep: number;
  introFrames: number;
  moveEnd: number;
  fps: number;
}> = ({ bbox, doClick, frameInStep, introFrames, moveEnd, fps }) => {
  const tx = bbox.x + bbox.w / 2;
  const ty = bbox.y + bbox.h / 2;
  const easing = Easing.out(Easing.cubic);

  const cx = interpolate(frameInStep, [introFrames, moveEnd], [50, tx], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cy = interpolate(frameInStep, [introFrames, moveEnd], [50, ty], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const clickAt = moveEnd + Math.round(0.1 * fps);
  const clickScale = doClick && frameInStep >= clickAt
    ? interpolate(frameInStep, [clickAt, clickAt + Math.round(0.15 * fps)], [1, 0.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;

  const pulse = doClick && frameInStep >= clickAt
    ? interpolate(frameInStep, [clickAt, clickAt + Math.round(0.3 * fps)], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  if (frameInStep < introFrames) return null;

  return (
    <div style={{ position: "absolute", left: `${cx}%`, top: `${cy}%`, width: 28, height: 28, transform: `translate(-50%,-50%) scale(${clickScale})`, pointerEvents: "none", zIndex: 100 }}>
      <svg viewBox="0 0 24 24" width="28" height="28">
        <path d="M5 3l14 9-8 1.5L7 21z" fill="white" stroke="black" strokeWidth="1.5" />
      </svg>
      {pulse > 0 && (
        <div style={{
          position: "absolute", inset: -10, borderRadius: "50%",
          border: "2px solid #00ffcc",
          opacity: 1 - pulse,
          transform: `scale(${0.5 + pulse * 2})`,
        }} />
      )}
    </div>
  );
};

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TutorialStep {
  screenUrl: string;
  audioUrl: string;
  instruction: string;
  bbox: BBox;
  plan: MotionPlan;
}

export interface TutorialCompositionProps extends Record<string, unknown> {
  steps: TutorialStep[];
  format: "16:9" | "9:16";
}

// ── Main Composition ──────────────────────────────────────────────────────────

export const TutorialComposition: React.FC<TutorialCompositionProps> = ({ steps }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  // Build per-step frame ranges
  const ranges: Array<{ start: number; total: number }> = [];
  let offset = 0;
  for (const step of steps) {
    const total = Math.round((step.plan.introSec + step.plan.moveSec + step.plan.holdSec + step.plan.outroSec) * fps);
    ranges.push({ start: offset, total });
    offset += total;
  }

  // Find active step
  let activeIdx = -1;
  for (let i = 0; i < steps.length; i++) {
    if (frame >= ranges[i].start && frame < ranges[i].start + ranges[i].total) {
      activeIdx = i;
      break;
    }
  }

  if (activeIdx < 0) return <AbsoluteFill style={{ background: "#0d0d0d" }} />;

  const step = steps[activeIdx];
  const plan = step.plan;
  const frameInStep = frame - ranges[activeIdx].start;
  const totalFrames = ranges[activeIdx].total;
  const introFrames = Math.round(plan.introSec * fps);
  const moveEnd = introFrames + Math.round(plan.moveSec * fps);

  return (
    <AbsoluteFill style={{ background: "#0d0d0d", overflow: "hidden" }}>
      <BackgroundBlur src={step.screenUrl} />
      <VirtualCamera src={step.screenUrl} plan={plan} frameInStep={frameInStep} totalFrames={totalFrames} fps={fps} />
      <HighlightRing bbox={step.bbox} type={plan.highlight} frameInStep={frameInStep} showAt={moveEnd} fps={fps} />
      {plan.cursor && (
        <CursorOverlay bbox={step.bbox} doClick={plan.cursorClick} frameInStep={frameInStep} introFrames={introFrames} moveEnd={moveEnd} fps={fps} />
      )}
      {frameInStep >= introFrames && step.instruction && (
        <div style={{
          position: "absolute", bottom: "5%", left: "8%", right: "8%",
          background: "rgba(0,0,0,0.68)", color: "#fff",
          borderRadius: 14, padding: "14px 28px",
          fontSize: 26, fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 500, lineHeight: 1.4, textAlign: "center",
        }}>
          {step.instruction}
        </div>
      )}
      {step.audioUrl && <Audio src={step.audioUrl} />}
    </AbsoluteFill>
  );
};
