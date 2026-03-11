"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { gsap } from "gsap";
import lottie from "lottie-web";
import {
  UploadCloud, Wand2, Loader2, Play, Square, Download,
  MousePointer2, Pause, Plus, Trash2, X
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type TransitionType = "none" | "fade" | "flash" | "swipe_left";

interface Target { x: number; y: number; w: number; h: number; }

interface Moment {
  id: string;
  target: Target;
  camScale: number;
  camPanX: number;
  camPanY: number;
  label: string;    // Texto de narración / subtítulo
  duration: number; // Duración mínima en segundos
  easing?: string;
  aiFocusPoint?: { x: number; y: number }; // Debug point from AI (%)
}

interface Screen {
  id: string;
  file: File;
  url: string;
  base64: string;
  moments: Moment[];
  bgColor?: string;
  transitionAfter: TransitionType;
}


const uid = () => Math.random().toString(36).substring(7);

type AspectRatio = "9:16" | "1:1" | "16:9";

// Virtual world — content is always authored in this coordinate space
const WORLD_W = 1080;
const WORLD_H = 1920;

const ASPECT_CONFIG: Record<AspectRatio, { w: number; h: number; label: string }> = {
  "9:16": { w: 1080, h: 1920, label: "Vertical (9:16)"  },
  "1:1":  { w: 1080, h: 1080, label: "Cuadrado (1:1)"  },
  "16:9": { w: 1920, h: 1080, label: "Horizontal (16:9)" },
};


interface CanvasState {
  scale: number;
  panX: number;
  panY: number;
  cursorX: number;
  cursorY: number;
  cursorVisible: boolean;
  clickRipple: number;
  highlightRect: Target | null;
  highlightAlpha: number;
  typedText: string;
  typedRect: Target | null;
  typedAlpha: number;
  subtitleText: string;
  subtitleVisible: boolean;
  subtitleScale: number;
  subtitleActiveIdx: number;
  
  // Transition state
  currentScreenIdx: number;
  nextScreenIdx: number;
  transitionProgress: number;
  transitionType: TransitionType;

  // Contextual icon
  iconVisible: boolean;
  iconType: string;
  iconAlpha: number;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestFfmpgPage() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [language, setLanguage] = useState("es");
  const [pickingMoment, setPickingMoment] = useState<boolean>(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [wordsPerSecond, setWordsPerSecond] = useState(2.5);
  const [dragStart, setDragStart] = useState<{x: number, y: number, panX: number, panY: number} | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [maxAiZoom, setMaxAiZoom] = useState(2.4);
  const lottieDataRef = useRef<any>(null);
  const lottieFrameRef = useRef(0);

  const { w: CANVAS_W, h: CANVAS_H } = ASPECT_CONFIG[aspectRatio];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const imgCache = useRef<Record<string, HTMLImageElement>>({});
  const csRef = useRef<CanvasState>({
    scale: 1, panX: 0, panY: 0,
    cursorX: 540, cursorY: 960,
    cursorVisible: false, clickRipple: 0,
    highlightRect: null, highlightAlpha: 0,
    typedText: "", typedRect: null, typedAlpha: 0,
    subtitleText: "", subtitleVisible: false, subtitleScale: 1, subtitleActiveIdx: -1,
    currentScreenIdx: 0, nextScreenIdx: 0, transitionProgress: 0, transitionType: "none",
    iconVisible: false, iconType: "sparkles", iconAlpha: 0
  });

  const activeScreen = screens.find(s => s.id === activeScreenId) ?? null;
  const selectedMoment = activeScreen?.moments.find(m => m.id === selectedMomentId) ?? null;

  // ── Lottie manual rendering fallback is used in renderFrame ───────────────
  // (We don't fetch .lottie files directly as JSON because they are binary ZIPs)

  // ── File handling ──────────────────────────────────────────────────────────

  const loadFile = async (file: File): Promise<Screen> => {
    const url = URL.createObjectURL(file);
    const base64 = await new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
    });
    const screen: Screen = { id: uid(), file, url, base64, moments: [], bgColor: "#000000", transitionAfter: "none" };
    // Preload image into cache immediately
    const img = new Image();
    img.src = url;
    img.onload = () => { 
      imgCache.current[url] = img; 
      renderFrame(); 
    };
    return screen;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    const newScreens = await Promise.all(arr.map(loadFile));
    setScreens(prev => {
      const updated = [...prev, ...newScreens];
      if (!activeScreenId && updated.length) setActiveScreenId(updated[0].id);
      return updated;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  // ── AI Analysis ────────────────────────────────────────────────────────────

  const analyzeWithAI = async () => {
    if (!activeScreen) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/video/analyze-moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, images: [{ id: activeScreen.id, base64: activeScreen.base64 }] }),
      });
      if (!res.ok) throw new Error("Error en el análisis IA");
      const { results } = await res.json();
      const found = results?.find((r: any) => r.id === activeScreen.id);
      if (found?.moments?.length) {
        setScreens(prev => prev.map(s => s.id === activeScreen.id
          ? {
              ...s,
              moments: found.moments.map((m: any) => {
                // Clamp camScale to allowed range using the custom maxAiZoom
                const camScale = Math.min(maxAiZoom, Math.max(0.9, m.camScale ?? 1));
                
                // Convert focusPoint (0–100%) → camPanX/Y
                // fp.x = 0..100
                const fp = m.focusPoint ?? { x: 50, y: 50 };

                // Corrected Math:
                // camPanX: (fp.x / 100) - 0.5 --> 0% becomes -0.5, 100% becomes 0.5
                // camPanY: must account for image aspect ratio because WORLD_W is the unit
                const img = imgCache.current[activeScreen.url];
                const imgAspect = img ? img.width / img.height : 9/16;
                const camPanX = (fp.x / 100) - 0.5;
                const camPanY = ((fp.y / 100) - 0.5) / imgAspect;

                return {
                  id: uid(),
                  target: { x: 20, y: 20, w: 60, h: 20 },
                  camScale,
                  camPanX,
                  camPanY,
                  label: m.label ?? "",
                  duration: m.duration ?? 2.5,
                  aiFocusPoint: fp,
                };
              })
            }
          : s
        ));
      }
    } catch (e: any) { alert(e.message); }
    setIsAnalyzing(false);
  };

  // ── Moment management ──────────────────────────────────────────────────────

  const addMoment = () => {
    const screen = screens.find(s => s.id === activeScreenId);
    const lastM = screen?.moments[screen.moments.length - 1];

    const newM: Moment = {
      id: uid(),
      target: { x: 20, y: 20, w: 60, h: 20 },
      camScale: lastM ? lastM.camScale : 1,
      camPanX: lastM ? lastM.camPanX : 0,
      camPanY: lastM ? lastM.camPanY : 0,
      label: "",
      duration: 2,
    };
    setScreens(prev => prev.map(s => s.id === activeScreenId
      ? { ...s, moments: [...s.moments, newM] } : s));
    setSelectedMomentId(newM.id);
  };

  const updateMoment = (id: string, patch: Partial<Moment>) => {
    setScreens(prev => prev.map(s => s.id === activeScreenId
      ? { ...s, moments: s.moments.map(m => m.id === id ? { ...m, ...patch } : m) }
      : s));
  };

  const deleteMoment = (id: string) => {
    setScreens(prev => prev.map(s => s.id === activeScreenId
      ? { ...s, moments: s.moments.filter(m => m.id !== id) }
      : s));
    if (selectedMomentId === id) setSelectedMomentId(null);
  };

  // ── Canvas rendering ───────────────────────────────────────────────────────

  const getImg = (url: string): HTMLImageElement | null => imgCache.current[url] ?? null;

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cs = csRef.current;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // ── WORLD TRANSFORM ─────────────────────────────────────────────────────
    // Content is always authored in WORLD_W × WORLD_H (1080×1920).
    // We shift so world-center maps to canvas-center — aspect ratio change
    // just crops more/less around that fixed center point.
    ctx.save();
    ctx.translate(CANVAS_W / 2 - WORLD_W / 2, CANVAS_H / 2 - WORLD_H / 2);

    const drawSingleScreen = (screen: Screen, alpha: number = 1, offsetX: number = 0, offsetY: number = 0) => {
      const img = imgCache.current[screen.url];
      if (!img) return;

      const imgAspect = img.width / img.height;
      const baseW = WORLD_W;
      const baseH = WORLD_W / imgAspect;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(offsetX, offsetY);

      // Background fills the WHOLE canvas (even outside WORLD area)
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // No scaling/offset for background
      ctx.globalAlpha = alpha;
      ctx.fillStyle = screen.bgColor || "#0d0d0d";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();

      // Camera (pivot at WORLD center)
      ctx.save();
      const fx = WORLD_W / 2 + cs.panX * WORLD_W;
      const fy = WORLD_H / 2 + cs.panY * WORLD_W;
      ctx.translate(WORLD_W / 2, WORLD_H / 2);
      ctx.scale(cs.scale, cs.scale);
      ctx.translate(-fx, -fy);

      // Draw image centered in world
      const drawX = WORLD_W / 2 - baseW / 2;
      const drawY = WORLD_H / 2 - baseH / 2;
      ctx.drawImage(img, drawX, drawY, baseW, baseH);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 10; i++) {
        ctx.beginPath(); ctx.moveTo(drawX + i * baseW/10, drawY); ctx.lineTo(drawX + i * baseW/10, drawY + baseH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(drawX, drawY + i * baseH/10); ctx.lineTo(drawX + baseW, drawY + i * baseH/10); ctx.stroke();
      }

      // Highlight (pinned to image)
      if (cs.highlightRect && cs.highlightAlpha > 0) {
        const hr = cs.highlightRect;
        ctx.globalAlpha = cs.highlightAlpha * alpha;
        ctx.strokeStyle = "#facc15"; ctx.lineWidth = 6 / cs.scale;
        const rx = drawX + (hr.x/100)*baseW, ry = drawY + (hr.y/100)*baseH;
        const rw = (hr.w/100)*baseW, rh = (hr.h/100)*baseH;
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillStyle = "rgba(250,204,21,0.12)"; ctx.fillRect(rx, ry, rw, rh);
      }

      // Typed text (pinned to image)
      if (cs.typedRect && cs.typedText && cs.typedAlpha > 0) {
        const tr = cs.typedRect;
        ctx.globalAlpha = cs.typedAlpha * alpha;
        ctx.font = `${Math.max(28, (tr.h/100)*baseH*0.5) / cs.scale}px Inter, sans-serif`;
        ctx.fillStyle = "#1e293b";
        ctx.fillText(cs.typedText, drawX + (tr.x/100)*baseW + 10, drawY + (tr.y/100)*baseH + (tr.h/100)*baseH*0.7);
      }

      ctx.restore(); // camera
      ctx.restore(); // alpha/offset
    };

    // Transitions
    const curr = screens[cs.currentScreenIdx];
    const next = screens[cs.nextScreenIdx];

    if (cs.transitionProgress > 0 && curr && next && cs.transitionType !== "none") {
      const p = cs.transitionProgress;
      if (cs.transitionType === "fade") {
        drawSingleScreen(curr, 1 - p);
        drawSingleScreen(next, p);
      } else if (cs.transitionType === "flash") {
        if (p < 0.5) { drawSingleScreen(curr); ctx.fillStyle = "white"; ctx.globalAlpha = p*2; ctx.fillRect(0, 0, WORLD_W, WORLD_H); }
        else          { drawSingleScreen(next); ctx.fillStyle = "white"; ctx.globalAlpha = (1-p)*2; ctx.fillRect(0, 0, WORLD_W, WORLD_H); }
        ctx.globalAlpha = 1;
      } else if (cs.transitionType === "swipe_left") {
        drawSingleScreen(curr, 1, -p * WORLD_W, 0);
        drawSingleScreen(next, 1, WORLD_W - p * WORLD_W, 0);
      }
    } else {
      const dispScreen = isPlaying ? curr : activeScreen;
      if (dispScreen) drawSingleScreen(dispScreen);
    }

    // Cursor — in WORLD coords
    if (cs.cursorVisible) {
      const cx = cs.cursorX, cy = cs.cursorY;
      if (cs.clickRipple > 0) {
        ctx.beginPath(); ctx.arc(cx, cy, cs.clickRipple * 40, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(59,130,246,${1-cs.clickRipple})`; ctx.lineWidth = 3; ctx.stroke();
      }
      ctx.save();
      ctx.fillStyle = "white"; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx+10,cy+16); ctx.lineTo(cx+13,cy+12); ctx.lineTo(cx+20,cy+24); ctx.lineTo(cx+23,cy+22);
      ctx.lineTo(cx+16,cy+10); ctx.lineTo(cx+22,cy+8);
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }

    // End WORLD transform
    ctx.restore();

    // ── CONTEXTUAL ICON (100x100 animado) ───────────────────────────────────
    if (cs.iconVisible && cs.iconAlpha > 0) {
      ctx.save();
      const floatY = Math.sin(Date.now() / 300) * 10;
      const centerX = CANVAS_W / 2;
      const centerY = CANVAS_H / 2 - 100 + floatY; // Un poco por encima del centro real
      
      ctx.globalAlpha = cs.iconAlpha;
      ctx.translate(centerX, centerY);
      
      // Glow/Background subtle (Restored)
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 80);
      grad.addColorStop(0, "rgba(249, 115, 22, 0.4)");
      grad.addColorStop(1, "rgba(249, 115, 22, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill();

      // Icon paths (simplified Lucide-like)
      ctx.strokeStyle = "white";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(249, 115, 22, 0.8)";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      
      if (cs.iconType === "receipt") {
        ctx.strokeRect(-30, -40, 60, 80);
        ctx.moveTo(-15, -15); ctx.lineTo(15, -15);
        ctx.moveTo(-15, 5); ctx.lineTo(15, 5);
        ctx.moveTo(-15, 20); ctx.lineTo(5, 20);
      } else if (cs.iconType === "download") {
        ctx.moveTo(0, -35); ctx.lineTo(0, 25);
        ctx.moveTo(-20, 5); ctx.lineTo(0, 25); ctx.lineTo(20, 5);
        ctx.moveTo(-30, 35); ctx.lineTo(30, 35);
      } else if (cs.iconType === "mouse") {
        ctx.moveTo(0, -40); ctx.arcTo(25, -40, 25, 40, 25); ctx.arcTo(25, 40, -25, 40, 25);
        ctx.arcTo(-25, 40, -25, -40, 25); ctx.arcTo(-25, -40, 0, -40, 25);
        ctx.moveTo(0, -40); ctx.lineTo(0, 0);
        ctx.moveTo(-25, 0); ctx.lineTo(25, 0);
        ctx.stroke();
      } else {
        // High quality animated stars representing stars points.lottie
        ctx.save();
        const time = Date.now() / 1000;
        const drawStar = (x: number, y: number, size: number, rot: number) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rot);
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.moveTo(0, -size);
            ctx.quadraticCurveTo(0, 0, size, 0);
            ctx.quadraticCurveTo(0, 0, 0, size);
            ctx.quadraticCurveTo(0, 0, -size, 0);
            ctx.quadraticCurveTo(0, 0, 0, -size);
          }
          ctx.fillStyle = "white";
          // Shadow from parent scope will be used
          ctx.fill();
          ctx.restore();
        };

        // Twinkling stars
        drawStar(0, 0, 30 * (0.8 + Math.sin(time * 5) * 0.2), time * 0.5);
        drawStar(-40, -35, 14 * (0.7 + Math.cos(time * 4) * 0.3), -time * 0.3);
        drawStar(45, -20, 18 * (0.7 + Math.sin(time * 6) * 0.3), time * 0.7);
        drawStar(15, 50, 12 * (0.7 + Math.cos(time * 3) * 0.3), -time * 1.1);
        ctx.restore();
      }
      
      ctx.restore();
    }

    // Subtitles — anchored at 65% of CANVAS height (35% from bottom)
    if (cs.subtitleVisible && cs.subtitleText) {
      ctx.save();
      const aspectScale = CANVAS_W / WORLD_W; 
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const words = cs.subtitleText.split(" ");
      const sx = CANVAS_W / 2;
      const sy = CANVAS_H * 0.65; 
      ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 15;
      ctx.lineWidth = 14 * aspectScale; ctx.strokeStyle = "rgba(0,0,0,0.9)";

      // 1. Calculate STATIC properties for layout (no animation scale here)
      const allowedW = CANVAS_W * 0.6; // 20% margin
      let fontSize = 120 * aspectScale;
      ctx.font = `italic 900 ${fontSize}px "Inter", sans-serif`;
      let currentW = ctx.measureText(cs.subtitleText).width;
      if (currentW > allowedW) fontSize = (allowedW / currentW) * fontSize;
      const maxFontSize = 180 * aspectScale;
      if (fontSize > maxFontSize) fontSize = maxFontSize;

      const wordStats = words.map((word, i) => {
        const cleanWord = word.replace(/[.,]/g, "").toUpperCase();
        const isRelevant = cleanWord.length >= 6 || ["FACTURA", "COMPRA", "PAGO", "GESTIÓN", "CLIENTE", "AQUÍ", "AHORA"].includes(cleanWord);
        const relScale = isRelevant ? 1.1 : 1.0;
        
        ctx.font = `italic 900 ${fontSize * relScale}px "Inter", sans-serif`;
        const width = ctx.measureText(word + " ").width;
        
        const isCurrent = i === cs.subtitleActiveIdx;
        const wordAnimScale = isCurrent ? cs.subtitleScale : 1.0;
        
        return { word, relScale, isRelevant, width, wordAnimScale, baseFontSize: fontSize * relScale };
      });

      const totalW = wordStats.reduce((acc, s) => acc + s.width, 0);
      let curX = sx - totalW / 2;

      // 2. Render Words at FIXED positions but with ANIMATED scale
      wordStats.forEach((s) => {
        const wordCX = curX + s.width / 2;
        ctx.save();
        ctx.translate(wordCX - 5, sy);
        ctx.scale(s.wordAnimScale, s.wordAnimScale);

        ctx.font = `italic 900 ${s.baseFontSize}px "Inter", sans-serif`;
        
        // Stroke
        ctx.strokeText(s.word, 0, 0);
        
        // Fill
        ctx.fillStyle = s.isRelevant ? "#facc15" : "white";
        ctx.fillText(s.word, 0, 0);
        
        ctx.restore();
        curX += s.width;
      });
      
      ctx.restore();
    }

    const preview = previewCanvasRef.current;
    if (preview) {
      const pCtx = preview.getContext("2d");
      if (pCtx) { pCtx.clearRect(0, 0, preview.width, preview.height); pCtx.drawImage(canvas, 0, 0, preview.width, preview.height); }
    }
  }, [screens, isPlaying, activeScreen, CANVAS_W, CANVAS_H]);

  // Keep refs for renderFrame to avoid closures
  const activeScreenRef = useRef<Screen | null>(null);
  const selectedMomentIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  const currentUrl = activeScreen?.url;
  const currentBgColor = activeScreen?.bgColor;
  
  useEffect(() => { 
    activeScreenRef.current = activeScreen; 
    renderFrame();
  }, [activeScreen]);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // Aplica la cámara del momento seleccionado al canvas
  const applyMomentCamera = useCallback((momentId: string | null) => {
    if (!momentId) return;
    // Busca en el estado más fresco de screens (a través de ref)
    const allScreens = screensRef.current;
    const m = allScreens.flatMap(s => s.moments).find(x => x.id === momentId);
    if (m) {
      csRef.current.scale = m.camScale;
      csRef.current.panX  = m.camPanX;
      csRef.current.panY  = m.camPanY;
      csRef.current.highlightRect  = null;
      csRef.current.highlightAlpha = 0;
      renderFrame();
    }
  }, [renderFrame]);

  const screensRef = useRef<Screen[]>([]);
  useEffect(() => { screensRef.current = screens; }, [screens]);

  useEffect(() => { 
    selectedMomentIdRef.current = selectedMomentId;
    applyMomentCamera(selectedMomentId);
  }, [selectedMomentId, applyMomentCamera]);

  // Cuando se edita un momento (slider/drag), re-aplica la cámara si sigue seleccionado
  useEffect(() => {
    if (selectedMomentId && !isPlaying) {
      applyMomentCamera(selectedMomentId);
    }
  }, [screens, selectedMomentId, isPlaying, applyMomentCamera]);

  // Redraw & Reset camera ONLY on screen change
  useEffect(() => {
    const cs = csRef.current;
    cs.scale = 1; cs.panX = 0; cs.panY = 0;
    cs.cursorVisible = false; cs.highlightRect = null;
    cs.typedText = ""; cs.typedRect = null;
    
    // Ensure image is loaded when selected
    if (currentUrl) {
      const img = new Image();
      img.src = currentUrl;
      img.onload = () => {
        imgCache.current[currentUrl] = img;
        renderFrame();
      };
      if (imgCache.current[currentUrl]) renderFrame();
    } else {
      renderFrame();
    }
  }, [currentUrl]);

  // Redraw when aspect ratio or speed changes and rebuild timeline
  useEffect(() => {
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = buildTimeline();
      tlRef.current.pause();
      tlRef.current.progress(0);
      setIsPlaying(false);
      setAnimationProgress(0);
    }
    renderFrame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio, wordsPerSecond]);

  // ── Keyboard Controls ─────────────────────────────────────────────────────

  useEffect(() => {
    const handleKD = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const t = e.target as HTMLElement;
        const isTextInput =
          (t.tagName === "INPUT" && !["range", "checkbox", "radio", "color", "button", "submit"].includes((t as HTMLInputElement).type)) ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable;

        if (isTextInput) return;
        
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener("keydown", handleKD);
    return () => window.removeEventListener("keydown", handleKD);
  }, [isPlaying, screens]);

  // ── GSAP Timeline ──────────────────────────────────────────────────────────

  const targetToCanvas = (t: Target) => {
    // Focal point is the center of the target box (0-100 of CANVAS)
    const fx = (t.x / 100) * CANVAS_W + (t.w / 100) * CANVAS_W / 2;
    const fy = (t.y / 100) * CANVAS_H + (t.h / 100) * CANVAS_H / 2;
    // Panning offset is relative to canvas center
    const panX = (CANVAS_W / 2 - fx) / CANVAS_W;
    const panY = (CANVAS_H / 2 - fy) / CANVAS_H;
    return { panX, panY };
  };

  const buildTimeline = () => {
    const tl = gsap.timeline({ 
      onUpdate: () => {
        renderFrame();
        if (tlRef.current) setAnimationProgress(tlRef.current.progress());
      }, 
      onComplete: () => {
        tlRef.current = null;
        renderFrame();
        setIsPlaying(false);
      }
    });
    const cs = csRef.current;


    // Reset initial state
    const firstM = screens[0]?.moments[0];
    Object.assign(cs, {
      scale: firstM ? firstM.camScale : 1, 
      panX: firstM ? firstM.camPanX : 0, 
      panY: firstM ? firstM.camPanY : 0,
      cursorVisible: false, highlightRect: null, 
      typedText: "", subtitleText: "", 
      currentScreenIdx: 0, nextScreenIdx: 0, transitionProgress: 0, transitionType: "none",
      iconVisible: false, iconAlpha: 0, iconType: "sparkles"
    });

    for (let sIdx = 0; sIdx < screens.length; sIdx++) {
      const screen = screens[sIdx];
      const screenLabel = `screen_${sIdx}`;
      tl.addLabel(screenLabel);

      // Moments for this screen
      for (let mIdx = 0; mIdx < screen.moments.length; mIdx++) {
        const m = screen.moments[mIdx];
        const momentLabel = `s${sIdx}_m${mIdx}`;
        tl.addLabel(momentLabel);

        // Word count for duration - including 1.5s gap ONLY at the end of the paragraph
        // PLUS 1.5s additional for each period (.) and 1.0s for each comma (,)
        const words = m.label ? m.label.split(/\s+/).filter(Boolean) : [];
        const dotsCount = words.filter(w => w.endsWith('.')).length;
        const commaCount = words.filter(w => w.endsWith(',')).length;
        const wordDur = 1 / wordsPerSecond;
        const textDuration = words.length > 0 ? (words.length * wordDur + 1.5 + (dotsCount * 1.5) + (commaCount * 1.0)) : 0;
        const d = Math.max(m.duration, textDuration);
        
        const ease = m.easing ?? "power2.inOut";
        const panX = m.camPanX;
        const panY = m.camPanY;
        const scale = m.camScale;

        // Determine icon based on label keywords
        let iconType = "sparkles";
        const labelLower = (m.label || "").toLowerCase();
        if (labelLower.includes("factura") || labelLower.includes("recibo")) iconType = "receipt";
        else if (labelLower.includes("descarga") || labelLower.includes("pdf") || labelLower.includes("bajar")) iconType = "download";
        else if (labelLower.includes("clic") || labelLower.includes("botón") || labelLower.includes("presiona")) iconType = "mouse";

        // Sync current index
        tl.set(cs, { currentScreenIdx: sIdx, iconType }, momentLabel);

        // Camera movement
        if (sIdx === 0 && mIdx === 0) {
          // Si es el primer momento, establece instantáneamente por si gsap se descuadra
          tl.set(cs, { scale, panX, panY }, momentLabel);
        } else {
          tl.to(cs, { scale, panX, panY, duration: d * 0.4, ease }, momentLabel);
        }

        // Show icon after camera settles
        tl.to(cs, { iconVisible: true, iconAlpha: 1, duration: 0.5 }, `${momentLabel}+=${d * 0.3}`)
          .to(cs, { iconAlpha: 0, duration: 0.5, iconVisible: false }, `${momentLabel}+=${d - 0.5}`);

        // Hold for duration with no element animation
        tl.to({}, { duration: d }, momentLabel);

        if (m.label) {
          const allWords = m.label.split(/\s+/).filter(Boolean);
          const wordDur = 1 / wordsPerSecond;
          let accTime = 0;
          
          // Improved grouping: Max 2 words OR break at punctuation
          const chunks: string[][] = [];
          let currentChunk: string[] = [];
          
          allWords.forEach((word) => {
            currentChunk.push(word);
            const hasPunctuation = word.endsWith(',') || word.endsWith('.');
            if (currentChunk.length >= 2 || hasPunctuation) {
              chunks.push(currentChunk);
              currentChunk = [];
            }
          });
          if (currentChunk.length > 0) chunks.push(currentChunk);

          chunks.forEach((chunkWords, cIdx) => {
            const isLastChunk = cIdx === chunks.length - 1;
            
            // 1. Show the whole line first
            tl.set(cs, { 
              subtitleVisible: true, 
              subtitleText: chunkWords.join(" ").toUpperCase(), 
              subtitleActiveIdx: -1, 
              subtitleScale: 1
            }, `${momentLabel}+=${accTime}`);

            // 2. Animate each word within the line one by one
            let wordInChunkOffset = 0;
            chunkWords.forEach((_, wInChunkIdx) => {
              const wordStartTime = accTime + wordInChunkOffset;
              tl.to(cs, { 
                subtitleActiveIdx: wInChunkIdx,
                subtitleScale: 1.3, // Bounce scale for active word
                duration: 0.05 
              }, `${momentLabel}+=${wordStartTime}`)
                .to(cs, { subtitleScale: 1, duration: 0.15, ease: "back.out(2)" }, ">");
              
              wordInChunkOffset += wordDur;
            });

            const chunkDuration = chunkWords.length * wordDur;
            const hideTime = accTime + chunkDuration;

            // Punctuation logic based on internal words or last word
            let chunkPause = 0;
            chunkWords.forEach(w => {
              if (w.endsWith('.')) chunkPause += 1.5;
              else if (w.endsWith(',')) chunkPause += 1.0;
            });

            const nextLineStartTime = accTime + chunkDuration + chunkPause;
            
            if (isLastChunk || hideTime < nextLineStartTime) {
              const finalHide = Math.min(d - 0.05, hideTime);
              tl.set(cs, { subtitleVisible: false }, `${momentLabel}+=${finalHide}`);
            }

            accTime += chunkDuration + chunkPause;
          });
        }
        
        tl.set({}, {}, `${momentLabel}+=${d}`);
      }

      // 4. Transition to next screen
      if (sIdx < screens.length - 1 && screen.transitionAfter !== "none") {
        const transLabel = `trans_${sIdx}`;
        const nextScreen = screens[sIdx + 1];
        const nextFirstM = nextScreen?.moments[0];
        
        // Target camera for the next screen
        const nextScale = nextFirstM ? nextFirstM.camScale : 1;
        const nextPanX = nextFirstM ? nextFirstM.camPanX : 0;
        const nextPanY = nextFirstM ? nextFirstM.camPanY : 0;

        tl.addLabel(transLabel);
        tl.set(cs, { 
          currentScreenIdx: sIdx, 
          nextScreenIdx: sIdx + 1, 
          transitionType: screen.transitionAfter,
          subtitleVisible: false, cursorVisible: false, highlightAlpha: 0,
          iconVisible: false, iconAlpha: 0
        }, transLabel);

        // Smoothly bridge camera from current last moment to next screen's first moment
        tl.to(cs, { 
          transitionProgress: 1, 
          scale: nextScale,
          panX: nextPanX,
          panY: nextPanY,
          duration: 1, 
          ease: "power2.inOut" 
        }, transLabel);

        tl.set(cs, { transitionProgress: 0, currentScreenIdx: sIdx + 1 }, ">");
      }
    }


    return tl;
  };

  // ── Playback controls ──────────────────────────────────────────────────────

  // Preload objects then play
  const handlePlayFromStart = () => {
    if (screens.length === 0) return;
    handleStop(); // Reset everything
    
    setIsPlaying(true);
    isPlayingRef.current = true;

    const tl = buildTimeline();
    tlRef.current = tl;
    tl.play();
  };

  const togglePlayPause = () => {
    if (screens.length === 0) return;
    if (isPlaying) {
      tlRef.current?.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      if (tlRef.current && tlRef.current.progress() < 1) {
        tlRef.current.resume();
        setIsPlaying(true);
        isPlayingRef.current = true;
      } else {
        handlePlayFromStart();
      }
    }
  };

  const handleStop = () => {
    if (tlRef.current) { 
      tlRef.current.kill(); 
      tlRef.current = null; 
    }
    setIsPlaying(false);
    setAnimationProgress(0);
    // reset global state cleanly
    const cs = csRef.current;
    Object.assign(cs, { 
      scale: 1, panX: 0, panY: 0, 
      cursorVisible: false, clickRipple: 0,
      highlightRect: null, highlightAlpha: 0, 
      typedText: "", typedRect: null, typedAlpha: 0,
      subtitleText: "", subtitleVisible: false, subtitleScale: 1,
      iconVisible: false, iconAlpha: 0, iconType: "sparkles"
    });
    renderFrame();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const progress = parseFloat(e.target.value);
    setAnimationProgress(progress);
    
    if (!tlRef.current) {
      const tl = buildTimeline();
      tlRef.current = tl;
      tl.pause();
    }
    
    if (tlRef.current) {
      tlRef.current.pause();
      setIsPlaying(false);
      tlRef.current.progress(progress);
    }
  };

  // ── Recording + FFmpeg export ──────────────────────────────────────────────

  const handleRecord = async () => {
    if (!activeScreen || !canvasRef.current) return;

    setIsRecording(true);
    setVideoBlob(null);
    chunksRef.current = [];

    const stream = canvasRef.current.captureStream(30);
    const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 8_000_000 });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    mr.onstop = async () => {
      const webm = new Blob(chunksRef.current, { type: "video/webm" });
      setIsRecording(false);
      setIsExporting(true);
      setExportProgress("Cargando FFmpeg…");

      try {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { fetchFile } = await import("@ffmpeg/util");
        const ff = new FFmpeg();
        ff.on("log", ({ message }) => setExportProgress(`FFmpeg: ${message.slice(0, 80)}`));
        await ff.load();
        setExportProgress("Convirtiendo WebM → MP4…");
        await ff.writeFile("input.webm", await fetchFile(webm));
        await ff.exec(["-i", "input.webm", "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p", "output.mp4"]);
        const data = await ff.readFile("output.mp4");
        const mp4Blob = new Blob([data instanceof Uint8Array ? data.buffer.slice(0) as ArrayBuffer : data as unknown as ArrayBuffer], { type: "video/mp4" });
        setVideoBlob(mp4Blob);
        setExportProgress("¡MP4 listo!");
      } catch (e: any) {
        setExportProgress(`Error: ${e.message}`);
      }
      setIsExporting(false);
    };

    mr.start(100);

    // Play animation while recording
    if (tlRef.current) tlRef.current.kill();
    const tl = buildTimeline();
    tlRef.current = tl;
    tl.play().then(() => {
      setTimeout(() => { mr.stop(); setIsRecording(false); }, 500);
    });
  };

  const downloadVideo = () => {
    if (!videoBlob) return;
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    a.href = url; a.download = "tutorial.mp4"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── BBox picker on preview ─────────────────────────────────────────────────

  const handlePreviewClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pickingMoment || !selectedMomentId || !activeScreen) return;
    const img = imgCache.current[activeScreen.url];
    if (!img) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const canvasX = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const canvasY = ((e.clientY - rect.top) / rect.height) * CANVAS_H;

    const baseW = 1080;
    const baseH = 1080 / (img.width / img.height);
    const drawX = CANVAS_W / 2 - baseW / 2;
    const drawY = CANVAS_H / 2 - baseH / 2;

    // Convert canvas click to image-relative coords
    const imgX = (canvasX - drawX) / baseW * 100;
    const imgY = (canvasY - drawY) / baseH * 100;
    
    updateMoment(selectedMomentId, {
      target: { x: Math.max(0, imgX - 15), y: Math.max(0, imgY - 8), w: 30, h: 16 },
    });
    setPickingMoment(false);
  };

  const handlePreviewMouseDown = (e: React.MouseEvent) => {
    if (!selectedMoment || isPlaying || pickingMoment) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width);
    const py = ((e.clientY - rect.top) / rect.height);
    setDragStart({ 
      x: px, 
      y: py, 
      panX: selectedMoment.camPanX ?? 0, 
      panY: selectedMoment.camPanY ?? 0 
    });
  };

  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only pan if mouse button is still held (e.buttons & 1)
    if (!dragStart || !selectedMoment || isPlaying || pickingMoment || !(e.buttons & 1)) {
      if (dragStart && !(e.buttons & 1)) setDragStart(null); // safety clear
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top)  / rect.height;
    
    const scale = selectedMoment.camScale;
    const panX = dragStart.panX - (px - dragStart.x) * (CANVAS_W / WORLD_W) / scale;
    const panY = dragStart.panY - (py - dragStart.y) * (CANVAS_H / WORLD_H) / scale;
    
    updateMoment(selectedMoment.id, { camPanX: panX, camPanY: panY });
    csRef.current.panX = panX;
    csRef.current.panY = panY;
    renderFrame();
  };

  const handlePreviewMouseUp = () => {
    setDragStart(null);
  };

  // Global mouseup — ensures dragStart is cleared even if mouse released outside canvas
  useEffect(() => {
    const onGlobalUp = () => setDragStart(null);
    window.addEventListener('mouseup', onGlobalUp);
    return () => window.removeEventListener('mouseup', onGlobalUp);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">

      {/* Header */}
      <div className="border-b border-neutral-800 px-6 py-4 flex items-center gap-4 shrink-0">
        <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl">
          <Play className="w-5 h-5 fill-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">GSAP Studio</h1>
          <p className="text-xs text-neutral-500">Tutorial animado en HTML · Canvas → MP4</p>
        </div>
        <div className="ml-auto flex items-center gap-6">
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(Object.keys(ASPECT_CONFIG) as AspectRatio[]).map(r => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${aspectRatio === r ? "bg-orange-600 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Velocidad Texto</span>
            <input 
              type="range" min="1" max="10" step="0.5" 
              value={wordsPerSecond} 
              onInput={e => setWordsPerSecond(parseFloat((e.target as HTMLInputElement).value))}
              onChange={e => setWordsPerSecond(parseFloat(e.target.value))}
              onPointerUp={e => (e.target as HTMLElement).blur()}
              className="w-32 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-xs font-mono text-orange-400 w-10 text-right">{wordsPerSecond}w/s</span>
          </div>

          <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider text-nowrap">Max Zoom IA</span>
            <input 
              type="range" min="1.0" max="5.0" step="0.1" 
              value={maxAiZoom} 
              onInput={e => setMaxAiZoom(parseFloat((e.target as HTMLInputElement).value))}
              onChange={e => setMaxAiZoom(parseFloat(e.target.value))}
              onPointerUp={e => (e.target as HTMLElement).blur()}
              className="w-24 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-xs font-mono text-orange-400 w-10 text-right">{maxAiZoom.toFixed(1)}x</span>
          </div>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none">
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Screen list ─────────────────────────────────────────── */}
        <div className="w-48 border-r border-neutral-800 flex flex-col bg-neutral-950 overflow-y-auto shrink-0">
          <div
            className={`m-3 border-2 border-dashed rounded-xl p-3 flex flex-col items-center cursor-pointer transition-all ${isDraggingOver ? "border-orange-500 bg-orange-500/10" : "border-neutral-800 hover:border-neutral-600"}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
          >
            <UploadCloud className="w-6 h-6 text-neutral-500 mb-1" />
            <span className="text-xs text-neutral-500 text-center">Sube screenshots</span>
            <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*"
              onChange={e => e.target.files && handleFiles(e.target.files)} />
          </div>

          {screens.map((s, i) => (
            <div key={s.id} className="relative group mx-2 mb-2">
              <button onClick={() => { setActiveScreenId(s.id); setSelectedMomentId(null); }}
                className={`w-full relative rounded-xl overflow-hidden border-2 transition-all ${s.id === activeScreenId ? "border-orange-500" : "border-transparent hover:border-neutral-700"}`}>
                <img src={s.url} alt="" className="w-full object-contain max-h-40 bg-neutral-900" />
                <div className="absolute top-1.5 left-1.5 text-xs bg-orange-600 text-white rounded-md px-1.5 py-0.5 font-bold">{i + 1}</div>
                <div className="absolute bottom-1.5 right-1.5 text-xs text-neutral-400 bg-black/70 rounded px-1">{s.moments.length}m</div>
              </button>
              
              {/* Transition selector */}
              {i < screens.length - 1 && (
                <div className="mt-1 mb-3 px-2">
                  <select 
                    value={s.transitionAfter || "none"} 
                    onChange={e => setScreens(prev => prev.map(x => x.id === s.id ? { ...x, transitionAfter: e.target.value as TransitionType } : x))}
                    className="w-full bg-neutral-900 border border-neutral-800 text-[10px] rounded px-1 py-0.5 text-orange-400 font-bold uppercase"
                  >
                    <option value="none">Sin transición</option>
                    <option value="fade">Fade In/Out</option>
                    <option value="flash">Flash Blanco</option>
                    <option value="swipe_left">Swipe Left</option>
                  </select>
                </div>
              )}

              <button onClick={e => { e.stopPropagation(); setScreens(prev => prev.filter(x => x.id !== s.id)); if (activeScreenId === s.id) setActiveScreenId(screens[0]?.id ?? null); }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-900/80 text-red-300 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center z-10">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* ── CENTER: Canvas Preview ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center bg-neutral-900 relative overflow-hidden">
          {/* Hidden full-res render canvas */}
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="hidden" />

          {activeScreen ? (
            <>
              {/* Visible preview canvas */}
              <div 
                className="relative bg-black transition-all duration-300" 
                style={{ 
                  height: aspectRatio === "16:9" ? "auto" : "calc(100vh - 180px)",
                  width: aspectRatio === "16:9" ? "min(800px, 90%)" : "auto",
                  aspectRatio: aspectRatio.replace(":", "/"),
                  maxHeight: "75vh"
                }}
              >
                <canvas
                  ref={previewCanvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className={`w-full h-full shadow-2xl shadow-black/80 border border-neutral-800 transition-all ${pickingMoment || selectedMomentId ? "cursor-move" : ""}`}
                  onClick={handlePreviewClick}
                  onMouseDown={handlePreviewMouseDown}
                  onMouseMove={handlePreviewMouseMove}
                  onMouseUp={handlePreviewMouseUp}
                  onMouseLeave={handlePreviewMouseUp}
                />
                {pickingMoment && (
                  <div className="absolute inset-0 border-2 border-orange-500 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                      Haz clic en el elemento
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline Slider */}
              <div className="w-full max-w-[380px] mt-4 px-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-neutral-500 font-mono">0%</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.001" 
                    value={animationProgress} 
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono">100%</span>
                </div>
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-3 mt-4">
                {!isPlaying ? (
                  <button onClick={togglePlayPause}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-neutral-200 transition-all">
                    <Play className="w-4 h-4 fill-black" /> {tlRef.current && tlRef.current.progress() > 0 ? "Continuar" : "Preview Global"}
                  </button>
                ) : (
                  <button onClick={togglePlayPause}
                    className="flex items-center gap-2 bg-neutral-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-neutral-700 transition-all">
                    <Pause className="w-4 h-4 fill-white" /> Pausar
                  </button>
                )}
                {isPlaying || (tlRef.current && tlRef.current.progress() > 0) ? (
                  <button onClick={handleStop}
                    className="flex items-center gap-2 bg-red-950/30 text-red-500 border border-red-950 px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-red-950/50 transition-all">
                    <Square className="w-4 h-4 fill-red-500" /> Detener
                  </button>
                ) : null}
                <button onClick={handleRecord} disabled={isRecording || isExporting || isPlaying}
                  className="flex items-center gap-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-orange-500 disabled:opacity-50 transition-all">
                  {isRecording ? <><span className="w-3 h-3 bg-white rounded-full animate-pulse" /> Grabando…</> : "⏺ Grabar MP4"}
                </button>
                {videoBlob && (
                  <button onClick={downloadVideo}
                    className="flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-green-600">
                    <Download className="w-4 h-4" /> Descargar
                  </button>
                )}
              </div>
              {(isExporting || exportProgress) && (
                <div className="mt-2 text-xs text-neutral-500 max-w-xs text-center">{exportProgress}</div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center">
                <UploadCloud className="w-8 h-8 text-neutral-600" />
              </div>
              <p className="text-neutral-400 font-medium">Sube una captura de pantalla</p>
              <p className="text-neutral-600 text-sm max-w-xs">Arrastra un screenshot de tu app en el panel izquierdo para comenzar</p>
            </div>
          )}
        </div>

        {/* ── RIGHT: Moment Editor ──────────────────────────────────────── */}
        <div className="w-80 border-l border-neutral-800 flex flex-col bg-neutral-950 overflow-hidden shrink-0">

          {activeScreen && (
            <>
              {/* Screen Settings */}
              <div className="p-4 border-b border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Color de fondo</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={activeScreen.bgColor || "#000000"} 
                      onInput={e => {
                        const val = (e.target as HTMLInputElement).value;
                        setScreens(prev => prev.map(s => s.id === activeScreenId ? { ...s, bgColor: val } : s));
                      }}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                    />
                    <input 
                      type="text" 
                      value={activeScreen.bgColor || "#000000"} 
                      onChange={e => {
                        const val = e.target.value;
                        setScreens(prev => prev.map(s => s.id === activeScreenId ? { ...s, bgColor: val } : s));
                      }}
                      className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-300 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* AI + Add Moment toolbar */}
              <div className="p-4 border-b border-neutral-800 space-y-3">
                <button onClick={analyzeWithAI} disabled={isAnalyzing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:opacity-90 text-white px-4 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 transition-all">
                  {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analizando…</> : <><Wand2 className="w-4 h-4" /> Analizar con IA</>}
                </button>
                <button onClick={addMoment}
                  className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition-all border border-neutral-700 hover:border-orange-500/40">
                  <Plus className="w-4 h-4 text-orange-400" /> Añadir Momento
                </button>

              </div>

              {/* Moment list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activeScreen.moments.length === 0 ? (
                  <div className="text-center text-neutral-600 text-xs mt-8">
                    Usa "Analizar con IA" o añade momentos manualmente con los botones de arriba
                  </div>
                ) : activeScreen.moments.map((m, i) => {
                  const isSelected = m.id === selectedMomentId;
                  return (
                    <div key={m.id}
                      className={`border rounded-xl p-3 cursor-pointer transition-all ${isSelected ? "border-orange-500/60 bg-orange-950/20" : "border-neutral-800 hover:border-neutral-700 bg-neutral-900/30"}`}
                      onClick={() => setSelectedMomentId(isSelected ? null : m.id)}>
                      <div className="flex items-start gap-2">
                        <span className="w-7 h-7 rounded-lg bg-orange-600/20 border border-orange-600/30 text-orange-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-medium text-white truncate">
                              {m.label ? m.label.slice(0, 30) + (m.label.length > 30 ? "…" : "") : `Momento ${i + 1}`}
                            </span>
                            <span className="text-xs text-neutral-600 ml-auto">{m.duration}s</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mt-0.5">{m.camScale.toFixed(1)}x &middot; pan ({m.camPanX.toFixed(2)}, {m.camPanY.toFixed(2)})</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); deleteMoment(m.id); }}
                          className="text-neutral-700 hover:text-red-400 flex-shrink-0 mt-0.5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Inline editor when selected */}
                      {isSelected && (
                        <div className="mt-3 space-y-3 border-t border-neutral-800 pt-3" onClick={e => e.stopPropagation()}>

                          {/* Narration text */}
                          <div>
                            <label className="text-xs text-neutral-500 block mb-1">Naración / Subtítulo</label>
                            <textarea value={m.label}
                              onChange={e => {
                                const val = e.target.value;
                                updateMoment(m.id, { label: val });
                                if (!isPlaying) {
                                  csRef.current.subtitleVisible = true;
                                  csRef.current.subtitleText = val.toUpperCase();
                                  renderFrame();
                                }
                              }}
                              onFocus={() => {
                                if (!isPlaying) {
                                  csRef.current.subtitleVisible = true;
                                  csRef.current.subtitleText = m.label.toUpperCase();
                                  renderFrame();
                                }
                              }}
                              onBlur={() => {
                                if (!isPlaying) {
                                  csRef.current.subtitleVisible = false;
                                  renderFrame();
                                }
                              }}
                              placeholder="Texto que aparecerá como subtítulo..."
                              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-neutral-200 resize-none focus:outline-none focus:border-orange-500/50"
                              rows={3} />
                          </div>

                          {/* Duration */}
                          <div>
                            <label className="text-xs text-neutral-500 block mb-1">Duración mínima (s)</label>
                            <input type="number" step="0.5" min="0.5" max="30" value={m.duration}
                              onChange={e => updateMoment(m.id, { duration: parseFloat(e.target.value) || 2 })}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-orange-500/50" />
                            <p className="text-[10px] text-neutral-600 mt-1">Si la narración es más larga, se ampliará automáticamente.</p>
                          </div>

                          {/* Camera zoom */}
                          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
                            <style jsx>{`
                              .zoom-slider-custom {
                                -webkit-appearance: none;
                                appearance: none;
                                background: linear-gradient(to right, #f97316 0%, #f97316 ${((m.camScale - 0.1) / (5 - 0.1) * 100)}%, #262626 ${((m.camScale - 0.1) / (5 - 0.1) * 100)}%, #262626 100%);
                                border-radius: 99px;
                                height: 8px;
                                outline: none;
                                cursor: pointer;
                                width: 100%;
                              }
                              .zoom-slider-custom::-webkit-slider-thumb {
                                -webkit-appearance: none;
                                appearance: none;
                                width: 24px;
                                height: 24px;
                                background: #f97316;
                                cursor: grab;
                                border-radius: 50%;
                                border: 3px solid #000;
                                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                              }
                              .zoom-slider-custom::-webkit-slider-thumb:active {
                                cursor: grabbing;
                                transform: scale(0.9);
                                background: #fb923c;
                              }
                              .zoom-slider-custom::-moz-range-thumb {
                                width: 24px;
                                height: 24px;
                                background: #f97316;
                                cursor: grab;
                                border-radius: 50%;
                                border: 3px solid #000;
                                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                              }
                              .zoom-slider-custom::-moz-range-progress {
                                background: #f97316;
                                border-radius: 99px;
                                height: 8px;
                              }
                            `}</style>
                            <div>
                              <div className="flex justify-between items-end mb-3">
                                <div className="flex flex-col">
                                  <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">Zoom de Cámara</label>
                                  <span className="text-[10px] text-neutral-700 italic">0.1x &mdash; 5x</span>
                                </div>
                                <span className="text-xs font-mono text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">{m.camScale.toFixed(2)}x</span>
                              </div>
                              <div className="relative flex items-center py-2">
                                <input 
                                  type="range" min="0.1" max="5" step="0.01" 
                                  value={m.camScale} 
                                  onChange={e => {
                                    const scale = parseFloat(e.target.value);
                                    updateMoment(m.id, { camScale: scale });
                                  }}
                                  onMouseDown={e => e.stopPropagation()}
                                  onPointerDown={e => {
                                    e.stopPropagation();
                                    setDragStart(null); // clear canvas pan if active
                                  }}
                                  onPointerUp={e => (e.target as HTMLElement).blur()}
                                  className="zoom-slider-custom w-full"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-neutral-950/50 rounded-lg border border-neutral-800 transition-all hover:bg-neutral-900">
                              <MousePointer2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                              <span className="text-[11px] text-neutral-500 leading-tight">
                                Arrastra la <span className="text-neutral-300 font-medium">imagen</span> para el paneo.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Duration summary */}
              {activeScreen.moments.length > 0 && (
                <div className="p-3 border-t border-neutral-800 text-xs text-neutral-500 flex justify-between">
                  <span>{activeScreen.moments.length} momentos</span>
                  <span>~{activeScreen.moments.reduce((a, m) => a + m.duration, 0).toFixed(1)}s total</span>
                </div>
              )}
            </>
          )}

          {!activeScreen && (
            <div className="flex-1 flex items-center justify-center text-neutral-700 text-sm text-center p-6">
              Selecciona una pantalla para editar los momentos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
