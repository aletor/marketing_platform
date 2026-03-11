"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { UploadCloud, Play, Loader2, Wand2, ArrowRight, Plus, Trash2, Volume2 } from "lucide-react";
import { ELEVENLABS_VOICES } from "@/app/api/video/tts-preview/route";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BBox { x: number; y: number; w: number; h: number; }
type ElementType = "button" | "icon_button" | "input" | "dropdown" | "sidebar_item" | "tab" | "card" | "modal" | "chart" | "hero_text" | "toggle" | "checkbox" | "alert" | "table" | "list_item";
type CameraMode = "detail" | "fullscreen";

interface SubScene {
  id: string;
  script: string;
  bbox: BBox;
  type: ElementType;
  cameraMode: CameraMode;
  showHighlight: boolean;
}

interface Scene {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  subScenes: SubScene[];
}

type HandleType = "tl" | "t" | "tr" | "r" | "br" | "b" | "bl" | "l";

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_ELEMENT_TYPES: ElementType[] = ["button", "icon_button", "input", "dropdown", "sidebar_item", "tab", "card", "modal", "chart", "hero_text", "toggle", "checkbox", "alert", "table", "list_item"];
const DEFAULT_BBOX: BBox = { x: 35, y: 35, w: 30, h: 20 };
const STEP_COLORS = ["#3b82f6", "#8b5cf6", "#ef4444", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#f97316"];

// ── BBox Resizable Overlay ────────────────────────────────────────────────────

function BBoxOverlay({
  bbox, color, isActive, label,
  onBBoxChange, imageRef,
}: {
  bbox: BBox; color: string; isActive: boolean; label: string;
  onBBoxChange: (bbox: BBox) => void;
  imageRef: React.RefObject<HTMLDivElement | null>;
}) {
  const dragRef = useRef<{ handle: HandleType; startX: number; startY: number; origBbox: BBox } | null>(null);

  const pct = useCallback((px: number, total: number) => Math.max(0, Math.min(100, (px / total) * 100)), []);

  const onHandleMouseDown = (e: React.MouseEvent, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { handle, startX: e.clientX, startY: e.clientY, origBbox: { ...bbox } };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current || !imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - dragRef.current.startX) / rect.width) * 100;
      const dy = ((ev.clientY - dragRef.current.startY) / rect.height) * 100;
      const ob = dragRef.current.origBbox;
      let { x, y, w, h } = ob;
      const MIN = 5;
      const h_ = dragRef.current.handle;

      if (h_ === "tl" || h_ === "l" || h_ === "bl") { x = Math.min(ob.x + dx, ob.x + ob.w - MIN); w = ob.w - (x - ob.x); }
      if (h_ === "tr" || h_ === "r" || h_ === "br") { w = Math.max(ob.w + dx, MIN); }
      if (h_ === "tl" || h_ === "t" || h_ === "tr") { y = Math.min(ob.y + dy, ob.y + ob.h - MIN); h = ob.h - (y - ob.y); }
      if (h_ === "bl" || h_ === "b" || h_ === "br") { h = Math.max(ob.h + dy, MIN); }

      x = Math.max(0, x); y = Math.max(0, y);
      w = Math.min(w, 100 - x); h = Math.min(h, 100 - y);
      onBBoxChange({ x, y, w, h });
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handles: Array<{ handle: HandleType; style: React.CSSProperties }> = [
    { handle: "tl", style: { top: -5, left: -5, cursor: "nw-resize" } },
    { handle: "t",  style: { top: -5, left: "50%", transform: "translateX(-50%)", cursor: "n-resize" } },
    { handle: "tr", style: { top: -5, right: -5, cursor: "ne-resize" } },
    { handle: "r",  style: { top: "50%", right: -5, transform: "translateY(-50%)", cursor: "e-resize" } },
    { handle: "br", style: { bottom: -5, right: -5, cursor: "se-resize" } },
    { handle: "b",  style: { bottom: -5, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" } },
    { handle: "bl", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
    { handle: "l",  style: { top: "50%", left: -5, transform: "translateY(-50%)", cursor: "w-resize" } },
  ];

  return (
    <div style={{
      position: "absolute",
      left: `${bbox.x}%`, top: `${bbox.y}%`,
      width: `${bbox.w}%`, height: `${bbox.h}%`,
      border: `2px solid ${color}`,
      backgroundColor: `${color}12`,
      borderRadius: 6,
      boxShadow: isActive ? `0 0 0 1px ${color}55, 0 0 14px ${color}44` : undefined,
      opacity: isActive ? 1 : 0.55,
      transition: "opacity 0.15s",
    }}>
      {/* Label */}
      <div style={{
        position: "absolute", top: -22, left: 0,
        backgroundColor: color, color: "white",
        fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap",
      }}>{label}</div>

      {/* 8 resize handles */}
      {handles.map(({ handle, style }) => (
        <div key={handle} onMouseDown={(e) => onHandleMouseDown(e, handle)}
          style={{
            position: "absolute", width: 10, height: 10,
            backgroundColor: "white", border: `2px solid ${color}`,
            borderRadius: 2, zIndex: 10, ...style,
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function VideoTutorialTestPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"16:9" | "9:16">("16:9");
  const [language, setLanguage] = useState<string>("es");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [activeSub, setActiveSub] = useState<{ sceneId: string; subId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});

  // Initialize default voice on language change
  useEffect(() => {
    const voices = ELEVENLABS_VOICES[language] ?? [];
    if (voices.length > 0) setSelectedVoiceId(voices[0].id);
  }, [language]);

  const getImageRef = (id: string) => {
    if (!imageRefs.current[id]) imageRefs.current[id] = React.createRef<HTMLDivElement>();
    return imageRefs.current[id];
  };

  // ── File Upload ──────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const newFiles = Array.from(e.target.files);
    const newScenes: Scene[] = [];
    for (const file of newFiles) {
      const { base64, isVertical } = await convertBase64(file);
      if (scenes.length === 0 && newScenes.length === 0) setOrientation(isVertical ? "9:16" : "16:9");
      newScenes.push({
        id: uid(), file, previewUrl: URL.createObjectURL(file), base64,
        subScenes: [{ id: uid(), script: "", bbox: { ...DEFAULT_BBOX }, type: "button", cameraMode: "detail", showHighlight: true }],
      });
    }
    setScenes(prev => [...prev, ...newScenes]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const convertBase64 = (file: File): Promise<{ base64: string; isVertical: boolean }> =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const img = new Image();
        img.onload = () => res({ base64, isVertical: img.height > img.width });
        img.onerror = () => res({ base64, isVertical: false });
        img.src = base64;
      };
      reader.onerror = rej;
    });

  // ── AI Analysis ──────────────────────────────────────────────────────────────

  const analyzeWithAI = async () => {
    if (!scenes.length) return;
    try {
      setIsAnalyzing(true);
      const res = await fetch("/api/video/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, images: scenes.map(s => ({ id: s.id, base64: s.base64 })) }),
      });
      if (!res.ok) throw new Error("Error en análisis");
      const data = await res.json();
      setScenes(scenes.map(scene => {
        const ai = data.scripts?.find((d: any) => d.id === scene.id);
        if (!ai?.subScenes) return scene;
        return {
          ...scene,
          subScenes: (ai.subScenes as any[]).map(ss => ({
            id: uid(),
            script: ss.script || "",
            bbox: ss.bbox || { ...DEFAULT_BBOX },
            type: ss.type || "button",
            cameraMode: "detail" as CameraMode,
            showHighlight: true,
          }))
        };
      }));
    } catch (e: any) { alert(e.message); }
    finally { setIsAnalyzing(false); }
  };

  // ── SubScene CRUD ────────────────────────────────────────────────────────────

  const updateSub = (sceneId: string, subId: string, updates: Partial<SubScene>) => {
    setScenes(prev => prev.map(s => s.id !== sceneId ? s : {
      ...s, subScenes: s.subScenes.map(ss => ss.id === subId ? { ...ss, ...updates } : ss)
    }));
  };

  const addSub = (sceneId: string) => {
    setScenes(prev => prev.map(s => s.id !== sceneId ? s : {
      ...s, subScenes: [...s.subScenes, { id: uid(), script: "", bbox: { ...DEFAULT_BBOX }, type: "button", cameraMode: "detail", showHighlight: true }]
    }));
  };

  const removeSub = (sceneId: string, subId: string) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== sceneId || s.subScenes.length <= 1) return s;
      return { ...s, subScenes: s.subScenes.filter(ss => ss.id !== subId) };
    }));
  };

  // ── Voice Preview ─────────────────────────────────────────────────────────────

  const previewVoice = async () => {
    if (!selectedVoiceId || isPreviewingVoice) return;
    try {
      setIsPreviewingVoice(true);
      const res = await fetch("/api/video/tts-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceId: selectedVoiceId, language }),
      });
      if (!res.ok) throw new Error("Error en preview de voz");
      const { audio } = await res.json();
      const a = new Audio(audio);
      a.play();
      a.onended = () => setIsPreviewingVoice(false);
    } catch (e: any) {
      alert(e.message);
      setIsPreviewingVoice(false);
    }
  };

  // ── Generate Video ────────────────────────────────────────────────────────────

  const generateVideo = async () => {
    try {
      setIsGenerating(true);
      setRenderStatus("Generando audio con ElevenLabs…");
      const steps = scenes.flatMap(scene =>
        scene.subScenes.map(ss => ({
          screenBase64: scene.base64,
          instruction: ss.script,
          script: ss.script,
          bbox: ss.bbox,
          type: ss.type,
          cameraMode: ss.cameraMode,
          showHighlight: ss.showHighlight,
          voiceId: selectedVoiceId || undefined,
        }))
      );
      setRenderStatus("Renderizando con Remotion…");
      const res = await fetch("/api/video/remotion-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, format: orientation, language }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error en el render");
      }
      const data = await res.json();
      setRenderStatus("¡Vídeo completado!");
      setVideoUrl(data.videoUrl);
    } catch (err: any) {
      alert(err.message || "Error al generar el vídeo");
      setRenderStatus(null);
    } finally { setIsGenerating(false); }
  };

  // ── Rendering ────────────────────────────────────────────────────────────────

  const voices = ELEVENLABS_VOICES[language] ?? [];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="border-b border-neutral-800 pb-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="p-2 bg-blue-600/20 text-blue-400 rounded-lg"><Play className="w-6 h-6" /></span>
            Video Tutorial AI Lab
            <span className="text-sm font-normal text-neutral-500 ml-1">V4</span>
          </h1>
        </div>

        {/* Settings Bar */}
        <div className="bg-neutral-800/40 border border-neutral-700 rounded-2xl px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Encuadre */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Encuadre</label>
              <select value={orientation} onChange={e => setOrientation(e.target.value as "16:9" | "9:16")}
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-200">
                <option value="16:9">Horizontal (16:9)</option>
                <option value="9:16">Vertical (9:16)</option>
              </select>
            </div>
            {/* Idioma */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Idioma</label>
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-200">
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>

          {/* Voice Selector */}
          <div className="flex flex-wrap items-end gap-3 pt-1 border-t border-neutral-700/50">
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-neutral-400">Voz del Locutor</label>
              <div className="flex gap-2 flex-wrap">
                {voices.map(v => (
                  <button key={v.id}
                    onClick={() => setSelectedVoiceId(v.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      selectedVoiceId === v.id
                        ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                        : "bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-600"
                    }`}>
                    {v.name}
                    <span className="ml-1.5 text-[10px] text-neutral-500">{v.gender}</span>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={previewVoice} disabled={!selectedVoiceId || isPreviewingVoice}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 border border-neutral-700 hover:border-neutral-500 rounded-xl text-sm font-medium disabled:opacity-50 transition-all">
              {isPreviewingVoice
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Volume2 className="w-4 h-4 text-blue-400" />}
              {isPreviewingVoice ? "Reproduciendo…" : "Probar voz"}
            </button>
          </div>
        </div>

        {/* Dropzone */}
        <div onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-700 hover:border-blue-600/50 hover:bg-neutral-800/30 transition-all rounded-2xl p-10 flex flex-col items-center cursor-pointer text-center group">
          <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-blue-900/20 transition-all">
            <UploadCloud className="w-7 h-7 text-neutral-400 group-hover:text-blue-400" />
          </div>
          <p className="font-medium text-neutral-300">Sube capturas de pantalla</p>
          <p className="text-neutral-600 text-sm mt-1">JPG, PNG — múltiples archivos</p>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept="image/*" />
        </div>

        {/* Storyboard */}
        {scenes.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Storyboard
                <span className="text-neutral-500 font-normal text-sm ml-2">({scenes.length} pantallas)</span>
              </h2>
              <button onClick={analyzeWithAI} disabled={isAnalyzing || isGenerating}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-lg disabled:opacity-50">
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {isAnalyzing ? "Analizando con IA…" : "Auto-Completar con IA"}
              </button>
            </div>

            {scenes.map((scene, sceneIdx) => (
              <div key={scene.id} className="bg-neutral-800/20 border border-neutral-700/50 rounded-3xl overflow-hidden">
                {/* Scene header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm font-bold">{sceneIdx + 1}</div>
                    <span className="font-medium">Pantalla {sceneIdx + 1}</span>
                    <span className="text-xs text-neutral-600 font-mono">{scene.subScenes.length} paso{scene.subScenes.length !== 1 ? "s" : ""}</span>
                  </div>
                  <button onClick={() => setScenes(prev => prev.filter(s => s.id !== scene.id))}
                    className="text-neutral-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>

                <div className="flex flex-col xl:flex-row">
                  {/* Left: Image with BBox overlays */}
                  <div className="xl:w-[400px] flex-shrink-0 p-5 border-b xl:border-b-0 xl:border-r border-neutral-800">
                    <p className="text-[11px] text-neutral-500 mb-2">
                      Arrastra los <span className="text-white">■ manejadores blancos</span> para redimensionar el área. Clic en la imagen para reposicionar.
                    </p>
                    <div
                      ref={getImageRef(scene.id) as React.RefObject<HTMLDivElement>}
                      className="relative rounded-xl overflow-hidden cursor-crosshair border border-neutral-700 select-none"
                      onClick={(e) => {
                        const ref = getImageRef(scene.id).current;
                        if (!ref) return;
                        const rect = ref.getBoundingClientRect();
                        const cx = ((e.clientX - rect.left) / rect.width) * 100;
                        const cy = ((e.clientY - rect.top) / rect.height) * 100;
                        const subId = (activeSub?.sceneId === scene.id ? activeSub.subId : undefined) ?? scene.subScenes[0]?.id;
                        if (!subId) return;
                        const ss = scene.subScenes.find(s => s.id === subId);
                        if (!ss) return;
                        updateSub(scene.id, subId, {
                          bbox: {
                            x: Math.max(0, Math.min(100 - ss.bbox.w, cx - ss.bbox.w / 2)),
                            y: Math.max(0, Math.min(100 - ss.bbox.h, cy - ss.bbox.h / 2)),
                            w: ss.bbox.w, h: ss.bbox.h,
                          }
                        });
                      }}
                    >
                      <img src={scene.previewUrl} alt="" className="w-full h-auto object-contain bg-neutral-950 block pointer-events-none" />
                      {scene.subScenes.map((ss, sIdx) => (
                        <BBoxOverlay
                          key={ss.id}
                          bbox={ss.bbox}
                          color={STEP_COLORS[sIdx % STEP_COLORS.length]}
                          isActive={activeSub?.subId === ss.id}
                          label={`${sceneIdx + 1}.${sIdx + 1} ${ss.cameraMode === "fullscreen" ? "🖥" : "🔍"} ${ss.type}`}
                          onBBoxChange={(bbox) => updateSub(scene.id, ss.id, { bbox })}
                          imageRef={getImageRef(scene.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right: Steps panel */}
                  <div className="flex-1 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-neutral-400">Pasos</h4>
                      <button onClick={() => addSub(scene.id)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Añadir paso
                      </button>
                    </div>

                    {scene.subScenes.map((ss, sIdx) => {
                      const color = STEP_COLORS[sIdx % STEP_COLORS.length];
                      const isActive = activeSub?.subId === ss.id;
                      return (
                        <div key={ss.id} onClick={() => setActiveSub({ sceneId: scene.id, subId: ss.id })}
                          className={`rounded-xl border p-4 cursor-text transition-all ${isActive ? "border-blue-500/40 bg-blue-950/10 ring-1 ring-blue-500/20" : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"}`}>
                          
                          {/* Step Header */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold w-8" style={{ color }}>{sceneIdx + 1}.{sIdx + 1}</span>
                            
                            {/* Camera Mode — 2 options only */}
                            <div className="flex gap-1 flex-1">
                              {(["detail", "fullscreen"] as CameraMode[]).map(mode => (
                                <button key={mode} onClick={e => { e.stopPropagation(); updateSub(scene.id, ss.id, { cameraMode: mode }); }}
                                  className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all ${ss.cameraMode === mode ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-500 hover:text-neutral-300"}`}>
                                  {mode === "detail" ? "🔍 Ir a detalle" : "🖥 Pantalla completa"}
                                </button>
                              ))}
                            </div>

                            {/* Highlight toggle */}
                            <button onClick={e => { e.stopPropagation(); updateSub(scene.id, ss.id, { showHighlight: !ss.showHighlight }); }}
                              title={ss.showHighlight ? "Ocultar recuadro" : "Mostrar recuadro"}
                              className={`px-2 py-0.5 rounded-md text-xs transition-all border ${ss.showHighlight ? "border-yellow-500/50 text-yellow-300 bg-yellow-900/20" : "border-neutral-700 text-neutral-600 hover:text-neutral-400"}`}>
                              {ss.showHighlight ? "◻ Recuadro" : "— Sin recuadro"}
                            </button>

                            <button onClick={e => { e.stopPropagation(); removeSub(scene.id, ss.id); }} className="text-neutral-700 hover:text-red-400 ml-1">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Script */}
                          <textarea value={ss.script} onChange={e => updateSub(scene.id, ss.id, { script: e.target.value })}
                            placeholder="¿Qué dirá el locutor en este paso?"
                            className="w-full bg-transparent text-sm text-neutral-200 placeholder-neutral-700 resize-none focus:outline-none leading-relaxed"
                            rows={Math.max(2, ss.script.split("\n").length)} />

                          {/* Element type + bbox info */}
                          <div className="mt-2 pt-2 border-t border-neutral-800/60 flex flex-wrap items-center gap-2">
                            <select value={ss.type} onChange={e => updateSub(scene.id, ss.id, { type: e.target.value as ElementType })}
                              onClick={e => e.stopPropagation()}
                              className="bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-xs text-neutral-400">
                              {DEFAULT_ELEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <span className="text-[10px] text-neutral-600 font-mono">
                              x={Math.round(ss.bbox.x)}% y={Math.round(ss.bbox.y)}% w={Math.round(ss.bbox.w)}% h={Math.round(ss.bbox.h)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Generate Button */}
            <div className="flex flex-col items-center gap-4 pt-4 pb-20">
              <button onClick={generateVideo}
                disabled={isGenerating || scenes.some(s => s.subScenes.some(ss => !ss.script.trim()))}
                className="flex items-center gap-3 bg-white text-black hover:bg-neutral-100 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/10">
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-black" />}
                {isGenerating ? "Generando…" : "Producir Video Tutorial"}
                {!isGenerating && <ArrowRight className="w-4 h-4 ml-1" />}
              </button>
              {renderStatus && (
                <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 text-neutral-300 px-5 py-3 rounded-xl text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  {renderStatus}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video Result */}
      {videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="max-w-5xl w-full bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h2 className="font-bold text-white flex items-center gap-2"><Play className="w-5 h-5 text-blue-400" /> Video Tutorial Generado</h2>
              <button onClick={() => setVideoUrl(null)} className="text-neutral-500 hover:text-white text-sm bg-neutral-800 px-3 py-1 rounded-lg">Cerrar</button>
            </div>
            <video src={videoUrl} controls autoPlay className="w-full bg-black" />
            <div className="flex justify-end px-6 py-4 border-t border-neutral-800">
              <a href={videoUrl} download target="_blank" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium text-sm">Descargar MP4</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).substring(7); }
