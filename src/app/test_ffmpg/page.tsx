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
  subtitleAlpha: number;
  
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
  const [wordsPerSecond, setWordsPerSecond] = useState(3.0);
  const [dragStart, setDragStart] = useState<{x: number, y: number, panX: number, panY: number} | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [maxAiZoom, setMaxAiZoom] = useState(2.4);
  
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
    subtitleText: "", subtitleVisible: false, subtitleScale: 1, subtitleActiveIdx: -1, subtitleAlpha: 0,
    currentScreenIdx: 0, nextScreenIdx: 0, transitionProgress: 0, transitionType: "none",
    iconVisible: false, iconType: "sparkles", iconAlpha: 0
  });

  const activeScreen = screens.find(s => s.id === activeScreenId) ?? null;
  const selectedMoment = activeScreen?.moments.find(m => m.id === selectedMomentId) ?? null;

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
                const camScale = Math.min(maxAiZoom, Math.max(0.9, m.camScale ?? 1));
                const fp = m.focusPoint ?? { x: 50, y: 50 };
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

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cs = csRef.current;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

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

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0); 
      ctx.globalAlpha = alpha;
      ctx.fillStyle = screen.bgColor || "#0d0d0d";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();

      ctx.save();
      const fx = WORLD_W / 2 + cs.panX * WORLD_W;
      const fy = WORLD_H / 2 + cs.panY * WORLD_W;
      ctx.translate(WORLD_W / 2, WORLD_H / 2);
      ctx.scale(cs.scale, cs.scale);
      ctx.translate(-fx, -fy);

      const drawX = WORLD_W / 2 - baseW / 2;
      const drawY = WORLD_H / 2 - baseH / 2;
      ctx.drawImage(img, drawX, drawY, baseW, baseH);
      ctx.restore(); 
      ctx.restore(); 
    };

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

    if (cs.cursorVisible) {
      const cx = cs.cursorX, cy = cs.cursorY;
      ctx.save();
      ctx.fillStyle = "white"; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx+10,cy+16); ctx.lineTo(cx+13,cy+12); ctx.lineTo(cx+20,cy+24); ctx.lineTo(cx+23,cy+22);
      ctx.lineTo(cx+16,cy+10); ctx.lineTo(cx+22,cy+8);
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.restore();

    if (cs.iconVisible && cs.iconAlpha > 0) {
      ctx.save();
      const floatY = Math.sin(Date.now() / 300) * 10;
      const centerX = CANVAS_W / 2;
      const centerY = CANVAS_H / 2 - 100 + floatY;
      ctx.globalAlpha = cs.iconAlpha;
      ctx.translate(centerX, centerY);
      
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 80);
      grad.addColorStop(0, "rgba(249, 115, 22, 0.4)");
      grad.addColorStop(1, "rgba(249, 115, 22, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = "white";
      ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(249, 115, 22, 0.8)"; ctx.shadowBlur = 15;
      ctx.beginPath();
      
      if (cs.iconType === "receipt") {
        ctx.strokeRect(-30, -40, 60, 80);
        ctx.moveTo(-15, -15); ctx.lineTo(15, -15);
        ctx.moveTo(-15, 5); ctx.lineTo(15, 5);
      } else if (cs.iconType === "download") {
        ctx.moveTo(0, -35); ctx.lineTo(0, 25);
        ctx.moveTo(-20, 5); ctx.lineTo(0, 25); ctx.lineTo(20, 5);
        ctx.moveTo(-30, 35); ctx.lineTo(30, 35);
      } else if (cs.iconType === "mouse") {
        ctx.strokeRect(-25, -40, 50, 80);
        ctx.moveTo(0, -40); ctx.lineTo(0, 0);
      } else {
        const time = Date.now() / 1000;
        const drawStar = (x: number, y: number, size: number) => {
          ctx.save(); ctx.translate(x, y); ctx.beginPath();
          for(let i=0; i<4; i++){ ctx.rotate(Math.PI/2); ctx.moveTo(0,-size); ctx.quadraticCurveTo(0,0,size,0); ctx.quadraticCurveTo(0,0,0,size); ctx.quadraticCurveTo(0,0,-size,0); ctx.quadraticCurveTo(0,0,0,-size); }
          ctx.fillStyle = "white"; ctx.fill(); ctx.restore();
        };
        drawStar(0, 0, 30 * (0.8 + Math.sin(time * 5) * 0.2));
      }
      ctx.stroke();
      ctx.restore();
    }

    if (cs.subtitleVisible && cs.subtitleText) {
      ctx.save();
      const aspectScale = CANVAS_W / WORLD_W; 
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const words = cs.subtitleText.split(" ");
      const sx = CANVAS_W / 2;
      const sy = CANVAS_H * 0.65; 
      ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 15;
      ctx.lineWidth = 14 * aspectScale; ctx.strokeStyle = "rgba(0,0,0,0.9)";

      const allowedW = CANVAS_W * 0.6;
      let fontSize = 120 * aspectScale;
      ctx.font = `italic 900 ${fontSize}px "Inter", sans-serif`;
      let currentW = ctx.measureText(cs.subtitleText).width;
      if (currentW > allowedW) fontSize = (allowedW / currentW) * fontSize;
      const maxFontSize = 180 * aspectScale;
      if (fontSize > maxFontSize) fontSize = maxFontSize;

      const wordStats = words.map((word, i) => {
        const cleanWord = word.replace(/[.,]/g, "").toUpperCase();
        const isRelevant = cleanWord.length >= 6 || ["FACTURA", "COMPRA", "PAGO", "GESTIÓN", "CLIENTE"].includes(cleanWord);
        const relScale = isRelevant ? 1.1 : 1.0;
        ctx.font = `italic 900 ${fontSize * relScale}px "Inter", sans-serif`;
        const width = ctx.measureText(word + " ").width;
        return { word, relScale, isRelevant, width, baseFontSize: fontSize * relScale };
      });

      const totalW = wordStats.reduce((acc, s) => acc + s.width, 0);
      let curX = sx - totalW / 2;

      wordStats.forEach((s, i) => {
        const wordDur = 1 / 3.0; 
        const animIndexDuration = 0.6 / wordDur; 
        let progress = (cs.subtitleActiveIdx - i) / animIndexDuration;
        progress = Math.max(0, Math.min(1, progress));
        const easedProgress = 1 - Math.pow(1 - progress, 2);
        const wordAlpha = easedProgress;
        const wordAnimScale = 0.4 + 0.6 * easedProgress;

        if (wordAlpha > 0) {
          const wordCX = curX + s.width / 2;
          ctx.save();
          ctx.globalAlpha = wordAlpha;
          ctx.translate(wordCX, sy);
          ctx.scale(wordAnimScale, wordAnimScale);
          ctx.font = `italic 900 ${s.baseFontSize}px "Inter", sans-serif`;
          ctx.strokeText(s.word, 0, 0);
          ctx.fillStyle = s.isRelevant ? "#facc15" : "white";
          ctx.fillText(s.word, 0, 0);
          ctx.restore();
        }
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

  const screensRef = useRef<Screen[]>([]);
  useEffect(() => { screensRef.current = screens; }, [screens]);

  const applyMomentCamera = useCallback((momentId: string | null) => {
    if (!momentId) return;
    const m = screensRef.current.flatMap(s => s.moments).find(x => x.id === momentId);
    if (m) {
      csRef.current.scale = m.camScale; csRef.current.panX = m.camPanX; csRef.current.panY = m.camPanY;
      csRef.current.highlightAlpha = 0; renderFrame();
    }
  }, [renderFrame]);

  useEffect(() => { applyMomentCamera(selectedMomentId); }, [selectedMomentId, applyMomentCamera]);
  useEffect(() => { renderFrame(); }, [aspectRatio, wordsPerSecond, renderFrame]);

  const togglePlayPause = () => {
    if (screens.length === 0) return;
    if (isPlaying) { tlRef.current?.pause(); setIsPlaying(false); }
    else {
      if (tlRef.current && tlRef.current.progress() < 1) { tlRef.current.resume(); setIsPlaying(true); }
      else handlePlayFromStart();
    }
  };

  const handlePlayFromStart = () => {
    handleStop(); setIsPlaying(true);
    const tl = buildTimeline(); tlRef.current = tl; tl.play();
  };

  const handleStop = () => {
    if (tlRef.current) { tlRef.current.kill(); tlRef.current = null; }
    setIsPlaying(false); setAnimationProgress(0);
    Object.assign(csRef.current, { scale: 1, panX: 0, panY: 0, cursorVisible: false, iconVisible: false, subtitleVisible: false });
    renderFrame();
  };

  const buildTimeline = () => {
    const tl = gsap.timeline({ 
      onUpdate: () => { renderFrame(); if (tlRef.current) setAnimationProgress(tlRef.current.progress()); }, 
      onComplete: () => { setIsPlaying(false); }
    });
    const cs = csRef.current;

    for (let sIdx = 0; sIdx < screens.length; sIdx++) {
      const screen = screens[sIdx];
      for (let mIdx = 0; mIdx < screen.moments.length; mIdx++) {
        const m = screen.moments[mIdx];
        const momentLabel = `s${sIdx}_m${mIdx}`;
        tl.addLabel(momentLabel);

        const words = m.label ? m.label.split(/\s+/).filter(Boolean) : [];
        const wordDur = 1 / wordsPerSecond;
        const lineChunks: string[][] = [];
        let temp: string[] = [];
        words.forEach(w => { temp.push(w); if (temp.length >= 2 || w.endsWith(',') || w.endsWith('.')) { lineChunks.push(temp); temp = []; } });
        if (temp.length > 0) lineChunks.push(temp);

        let textDuration = 0;
        lineChunks.forEach(chunk => {
          textDuration += (chunk.length * wordDur) + 1.0;
          chunk.forEach(w => { if (w.endsWith('.')) textDuration += 1.5; else if (w.endsWith(',')) textDuration += 1.0; });
        });
        const d = Math.max(m.duration, textDuration + 0.5);

        let iconType = "sparkles";
        const labelL = (m.label || "").toLowerCase();
        if (labelL.includes("factura")) iconType = "receipt";
        else if (labelL.includes("descarga")) iconType = "download";
        else if (labelL.includes("clic")) iconType = "mouse";

        tl.set(cs, { currentScreenIdx: sIdx, iconType }, momentLabel);
        if (sIdx === 0 && mIdx === 0) tl.set(cs, { scale: m.camScale, panX: m.camPanX, panY: m.camPanY }, momentLabel);
        else tl.to(cs, { scale: m.camScale, panX: m.camPanX, panY: m.camPanY, duration: 1.0, ease: "power2.out" }, momentLabel);

        tl.to(cs, { iconVisible: true, iconAlpha: 1, duration: 0.5 }, `${momentLabel}+=${d * 0.3}`)
          .to(cs, { iconAlpha: 0, duration: 0.5, iconVisible: false }, `${momentLabel}+=${d - 0.5}`);

        if (m.label) {
          let acc = 0;
          lineChunks.forEach((chunk, i) => {
            tl.set(cs, { subtitleVisible: true, subtitleText: chunk.join(" ").toUpperCase(), subtitleActiveIdx: -1 }, `${momentLabel}+=${acc}`);
            const dur = chunk.length * wordDur;
            tl.to(cs, { subtitleActiveIdx: chunk.length, duration: dur + 0.5, ease: "none" }, ">");
            
            let pause = 1.0;
            chunk.forEach(w => { if (w.endsWith('.')) pause += 1.5; else if (w.endsWith(',')) pause += 1.0; });
            
            tl.set(cs, { subtitleVisible: false }, `${momentLabel}+=${acc + dur + 0.8}`);
            acc += dur + pause;
          });
        }
        tl.to({}, { duration: d }, momentLabel);
      }

      if (sIdx < screens.length - 1 && screen.transitionAfter !== "none") {
        const transLabel = `trans_${sIdx}`;
        const nextScreen = screens[sIdx + 1];
        const nextM = nextScreen.moments[0];
        tl.addLabel(transLabel);
        tl.set(cs, { currentScreenIdx: sIdx, nextScreenIdx: sIdx + 1, transitionType: screen.transitionAfter, subtitleVisible: false, iconVisible: false }, transLabel);
        tl.to(cs, { 
          transitionProgress: 1, 
          scale: nextM?.camScale ?? 1, 
          panX: nextM?.camPanX ?? 0, 
          panY: nextM?.camPanY ?? 0, 
          duration: 1, ease: "power2.inOut" 
        }, transLabel);
        tl.set(cs, { transitionProgress: 0, currentScreenIdx: sIdx + 1 }, ">");
      }
    }
    return tl;
  };

  const handleRecord = async () => {
    if (!activeScreen || !canvasRef.current) return;
    setIsRecording(true); setVideoBlob(null); chunksRef.current = [];
    const stream = canvasRef.current.captureStream(30);
    const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 8_000_000 });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const webm = new Blob(chunksRef.current, { type: "video/webm" });
      setIsExporting(true); setExportProgress("Procesando MP4...");
      try {
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { fetchFile } = await import("@ffmpeg/util");
        const ff = new FFmpeg(); await ff.load();
        await ff.writeFile("input.webm", await fetchFile(webm));
        await ff.exec(["-i", "input.webm", "-c:v", "libx264", "-pix_fmt", "yuv420p", "output.mp4"]);
        const data = await ff.readFile("output.mp4");
        setVideoBlob(new Blob([data], { type: "video/mp4" }));
        setExportProgress("Listo");
      } catch (e: any) { setExportProgress("Error exportación"); }
      setIsExporting(false); setIsRecording(false);
    };
    mr.start(100);
    const tl = buildTimeline(); tlRef.current = tl; await tl.play();
    setTimeout(() => { mr.stop(); }, 500);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = parseFloat(e.target.value); setAnimationProgress(p);
    if (!tlRef.current) tlRef.current = buildTimeline();
    tlRef.current.pause(); setIsPlaying(false); tlRef.current.progress(p);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <div className="border-b border-neutral-800 px-6 py-4 flex items-center gap-4 shrink-0">
        <Play className="w-5 h-5 text-orange-500" />
        <h1 className="text-xl font-bold tracking-tight">GSAP Studio</h1>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
            {["9:16", "1:1", "16:9"].map(r => (
              <button key={r} onClick={() => setAspectRatio(r as AspectRatio)} className={`px-2 py-1 text-[10px] rounded ${aspectRatio === r ? "bg-orange-600 text-white" : "text-neutral-500"}`}>{r}</button>
            ))}
          </div>
          <input type="range" min="1" max="6" step="0.5" value={wordsPerSecond} onChange={e => setWordsPerSecond(parseFloat(e.target.value))} className="w-24 accent-orange-500" />
          <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm">
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-48 border-r border-neutral-800 bg-neutral-950 overflow-y-auto p-3 space-y-3">
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-neutral-800 rounded-xl p-4 text-center cursor-pointer hover:border-neutral-600 transition-colors">
            <UploadCloud className="w-6 h-6 mx-auto mb-1 text-neutral-500" />
            <span className="text-[10px] text-neutral-500">Screen</span>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" multiple onChange={e => e.target.files && handleFiles(e.target.files)} />
          {screens.map((s, i) => (
            <div key={s.id} onClick={() => setActiveScreenId(s.id)} className={`relative rounded-lg overflow-hidden border-2 cursor-pointer ${s.id === activeScreenId ? "border-orange-500" : "border-transparent"}`}>
              <img src={s.url} alt="" className="w-full h-32 object-contain bg-neutral-900" />
              <div className="absolute top-1 left-1 bg-orange-600 text-[10px] px-1 rounded font-bold">{i+1}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-neutral-900 flex flex-col items-center justify-center p-8 relative">
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="hidden" />
          {activeScreen ? (
            <div className="flex flex-col items-center max-h-full max-w-full">
              <canvas ref={previewCanvasRef} width={CANVAS_W} height={CANVAS_H} className="h-[70vh] w-auto shadow-2xl bg-black border border-neutral-800" onMouseDown={e => {
                if (selectedMoment) {
                  const r = e.currentTarget.getBoundingClientRect();
                  setDragStart({ x: (e.clientX-r.left)/r.width, y: (e.clientY-r.top)/r.height, panX: selectedMoment.camPanX, panY: selectedMoment.camPanY });
                }
              }} onMouseMove={e => {
                if (dragStart && selectedMoment && (e.buttons & 1)) {
                  const r = e.currentTarget.getBoundingClientRect();
                  const px = (e.clientX-r.left)/r.width; const py = (e.clientY-r.top)/r.height;
                  const dx = (px - dragStart.x) * (CANVAS_W/WORLD_W) / selectedMoment.camScale;
                  const dy = (py - dragStart.y) * (CANVAS_H/WORLD_H) / selectedMoment.camScale;
                  updateMoment(selectedMoment.id, { camPanX: dragStart.panX - dx, camPanY: dragStart.panY - dy });
                }
              }} onMouseUp={() => setDragStart(null)} />
              
              <div className="w-full max-w-sm mt-6 flex flex-col items-center gap-4">
                <input type="range" min="0" max="1" step="0.001" value={animationProgress} onChange={handleSeek} className="w-full accent-orange-500 h-1 bg-neutral-800 rounded-lg appearance-none" />
                <div className="flex gap-2">
                  <button onClick={togglePlayPause} className="bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-neutral-200">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-black" />}
                  </button>
                  <button onClick={handleRecord} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-xs">
                    {isRecording ? "Grabando..." : "Exportar MP4"}
                  </button>
                  {videoBlob && <button onClick={() => { const a = document.createElement("a"); a.href=URL.createObjectURL(videoBlob); a.download="video.mp4"; a.click(); }} className="bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-xs"><Download className="w-4 h-4" /></button>}
                </div>
                {exportProgress && <span className="text-[10px] text-neutral-500">{exportProgress}</span>}
              </div>
            </div>
          ) : <div className="text-neutral-600">Sube una imagen para empezar</div>}
        </div>

        <div className="w-80 border-l border-neutral-800 bg-neutral-950 flex flex-col overflow-hidden">
          {activeScreen && (
            <div className="p-4 flex flex-col h-full">
              <button onClick={analyzeWithAI} disabled={isAnalyzing} className="w-full bg-orange-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 mb-3">
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Analizar Screenshot
              </button>
              <button onClick={addMoment} className="w-full bg-neutral-900 border border-neutral-800 py-2 rounded-lg text-xs font-bold mb-4">+ Momento</button>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {activeScreen.moments.map((m, i) => (
                  <div key={m.id} onClick={() => setSelectedMomentId(m.id)} className={`p-3 rounded-xl border transition-all ${m.id === selectedMomentId ? "border-orange-500 bg-orange-950/20" : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-orange-500">MOMENTO {i+1}</span>
                      <button onClick={e => { e.stopPropagation(); deleteMoment(m.id); }} className="text-neutral-600 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                    {m.id === selectedMomentId ? (
                      <div className="space-y-3" onClick={e => e.stopPropagation()}>
                        <textarea value={m.label} onChange={e => { updateMoment(m.id, { label: e.target.value.toUpperCase() }); csRef.current.subtitleText = e.target.value.toUpperCase(); csRef.current.subtitleVisible = true; renderFrame(); }} className="w-full bg-black border border-neutral-800 rounded p-2 text-xs text-white" rows={3} placeholder="Subtítulo..." />
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-neutral-500">Zoom</span>
                          <input type="range" min="0.1" max="4" step="0.1" value={m.camScale} onChange={e => updateMoment(m.id, { camScale: parseFloat(e.target.value) })} className="w-24" />
                          <span className="text-orange-500 font-mono">{m.camScale.toFixed(1)}x</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-neutral-500">Duración</span>
                          <input type="number" step="0.5" value={m.duration} onChange={e => updateMoment(m.id, { duration: parseFloat(e.target.value) })} className="w-12 bg-black border border-neutral-800 rounded px-1" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-400 truncate italic">{m.label || "Sin texto"}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
