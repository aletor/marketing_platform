// Motion Planner V4 — Simplified Spanish camera modes
// Deterministic business logic, no AI decisions here.

export type ElementType =
  | "button" | "icon_button" | "input" | "dropdown" | "sidebar_item"
  | "tab" | "card" | "modal" | "chart" | "hero_text" | "toggle"
  | "checkbox" | "alert" | "table" | "list_item";

export type CameraMode = "detail" | "fullscreen";

export interface BBox {
  x: number; y: number; w: number; h: number; // all % of frame
}

export interface MotionPlanInput {
  bbox: BBox;
  type: ElementType;
  cameraMode: CameraMode;
  durationMs: number;
  aspectRatio: "16:9" | "9:16";
  showHighlight: boolean;
  // For smart pan logic: previous step's camera end state
  prevZoom?: number;
  prevPanX?: number;
  prevPanY?: number;
}

export interface MotionPlan {
  zoomStart: number;
  zoomEnd: number;
  panXStart: number;
  panYStart: number;
  panXEnd: number;
  panYEnd: number;
  introSec: number;
  moveSec: number;
  holdSec: number;
  outroSec: number;
  highlight: "ring" | "glow" | "none";
  cursor: boolean;
  cursorClick: boolean;
  cameraMode: CameraMode;
}

// ── Zoom formula ──────────────────────────────────────────────────────────────

/**
 * Calculate zoom so the element fills ~32% of the frame.
 * Clamped to [1.1, 4.0].
 */
function calcZoom(bbox: BBox): number {
  const zoomX = 0.32 / Math.max(bbox.w / 100, 0.01);
  const zoomY = 0.32 / Math.max(bbox.h / 100, 0.01);
  return parseFloat(Math.min(Math.max(Math.max(zoomX, zoomY), 1.1), 4.0).toFixed(2));
}

/**
 * Convert bbox center to pan offset.
 * Remotion pan: -0.5 (left/top) to +0.5 (right/bottom).
 * We invert so the element is centred.
 */
function calcPan(bbox: BBox): { panX: number; panY: number } {
  const cx = bbox.x + bbox.w / 2;
  const cy = bbox.y + bbox.h / 2;
  return {
    panX: parseFloat((-((cx / 100) - 0.5)).toFixed(3)),
    panY: parseFloat((-((cy / 100) - 0.5)).toFixed(3)),
  };
}

// ── Type-based overlay rules ──────────────────────────────────────────────────

const OVERLAY_RULES: Record<string, Pick<MotionPlan, "highlight" | "cursor" | "cursorClick">> = {
  button:      { highlight: "ring", cursor: true,  cursorClick: true  },
  icon_button: { highlight: "ring", cursor: true,  cursorClick: true  },
  input:       { highlight: "glow", cursor: true,  cursorClick: false },
  dropdown:    { highlight: "ring", cursor: true,  cursorClick: true  },
  tab:         { highlight: "ring", cursor: true,  cursorClick: true  },
  card:        { highlight: "glow", cursor: false, cursorClick: false },
  chart:       { highlight: "none", cursor: false, cursorClick: false },
  modal:       { highlight: "none", cursor: false, cursorClick: false },
  hero_text:   { highlight: "none", cursor: false, cursorClick: false },
  table:       { highlight: "glow", cursor: false, cursorClick: false },
};

const DEFAULT_OVERLAY = { highlight: "ring" as const, cursor: true, cursorClick: false };

// ── Main export ───────────────────────────────────────────────────────────────

export function planMotion(input: MotionPlanInput): MotionPlan {
  const { bbox, type, cameraMode, durationMs, showHighlight, prevZoom, prevPanX, prevPanY } = input;
  const overlay = { ...DEFAULT_OVERLAY, ...(OVERLAY_RULES[type] ?? {}) };
  const holdSec = Math.max(1.2, (durationMs / 1000) + 0.3);

  if (cameraMode === "fullscreen") {
    return {
      zoomStart: prevZoom ?? 1.0,
      zoomEnd: 1.0,
      panXStart: prevPanX ?? 0,
      panYStart: prevPanY ?? 0,
      panXEnd: 0,
      panYEnd: 0,
      introSec: 0.2,
      moveSec: 0.7,
      holdSec,
      outroSec: 0.2,
      highlight: "none",
      cursor: false,
      cursorClick: false,
      cameraMode,
    };
  }

  // "detail" mode
  const zoomEnd = calcZoom(bbox);
  const { panX: panXEnd, panY: panYEnd } = calcPan(bbox);

  // Smart pan: if previous was also a detail, animate FROM the previous position
  const hasPrevState = prevZoom !== undefined && prevZoom > 1.05;
  const zoomStart = hasPrevState ? prevZoom! : 1.0;
  const panXStart = hasPrevState ? prevPanX! : 0;
  const panYStart = hasPrevState ? prevPanY! : 0;

  // Move duration: longer if panning a large distance
  const panDistance = Math.sqrt((panXEnd - panXStart) ** 2 + (panYEnd - panYStart) ** 2);
  const moveSec = Math.max(0.5, Math.min(panDistance * 3, 1.2));

  return {
    zoomStart,
    zoomEnd,
    panXStart,
    panYStart,
    panXEnd,
    panYEnd,
    introSec: hasPrevState ? 0 : 0.4,  // no pause if panning from prev detail
    moveSec,
    holdSec,
    outroSec: 0.3,
    highlight: showHighlight ? overlay.highlight : "none",
    cursor: overlay.cursor,
    cursorClick: overlay.cursorClick,
    cameraMode,
  };
}
