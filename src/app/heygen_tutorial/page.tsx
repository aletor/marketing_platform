"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  UploadCloud, Play, Loader2, Wand2, ArrowRight, User,
  Mic, Monitor, LayoutTemplate, RefreshCw, Download, X
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Scene {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  script: string;
}

interface HeyGenAvatar {
  id: string;
  name: string;
  gender: string;
  thumbnail: string | null;
  style: string;
}

interface HeyGenVoice {
  id: string;
  name: string;
  language: string;
  gender: string;
  preview: string | null;
}

type LayoutStyle = "corner" | "split" | "fullscreen";

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).substring(7); }

// ── Layout Option Component ───────────────────────────────────────────────────

const LAYOUTS: Array<{ id: LayoutStyle; label: string; desc: string; icon: React.ReactNode }> = [
  {
    id: "corner",
    label: "Esquina",
    desc: "Avatar en esquina sobre el screenshot",
    icon: (
      <div className="w-16 h-10 bg-neutral-700 rounded relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/20" />
        <div className="absolute bottom-1 left-1 w-4 h-4 bg-blue-500 rounded-full" />
      </div>
    ),
  },
  {
    id: "split",
    label: "División",
    desc: "Avatar a la izquierda, screenshot a la derecha",
    icon: (
      <div className="w-16 h-10 bg-neutral-700 rounded relative overflow-hidden flex">
        <div className="w-1/2 bg-blue-500/30 flex items-center justify-center">
          <div className="w-4 h-6 bg-blue-500/60 rounded" />
        </div>
        <div className="w-1/2 bg-neutral-600" />
      </div>
    ),
  },
  {
    id: "fullscreen",
    label: "Pantalla completa",
    desc: "Solo el avatar, sin screenshot de fondo",
    icon: (
      <div className="w-16 h-10 bg-neutral-700 rounded relative overflow-hidden flex items-center justify-center">
        <div className="w-5 h-7 bg-blue-500/60 rounded" />
      </div>
    ),
  },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HeyGenTutorialPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [avatars, setAvatars] = useState<HeyGenAvatar[]>([]);
  const [voices, setVoices] = useState<HeyGenVoice[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [layout, setLayout] = useState<LayoutStyle>("corner");
  const [format, setFormat] = useState<"16:9" | "9:16">("16:9");
  const [language, setLanguage] = useState("es");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [avatarSearch, setAvatarSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load avatars and voices on mount
  useEffect(() => {
    loadAssets();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    loadVoices();
  }, [language]);

  const loadAssets = async () => {
    setLoadingAssets(true);
    try {
      const [avatarRes] = await Promise.all([
        fetch("/api/heygen/avatars"),
      ]);
      if (avatarRes.ok) {
        const data = await avatarRes.json();
        setAvatars(data.avatars ?? []);
        if (data.avatars?.length) setSelectedAvatarId(data.avatars[0].id);
      }
    } catch { /* ignore */ }
    setLoadingAssets(false);
    loadVoices();
  };

  const loadVoices = async () => {
    try {
      const res = await fetch(`/api/heygen/voices?language=${language}`);
      if (res.ok) {
        const data = await res.json();
        setVoices(data.voices ?? []);
        if (data.voices?.length) setSelectedVoiceId(data.voices[0].id);
      }
    } catch { /* ignore */ }
  };

  // ── File Upload ────────────────────────────────────────────────────────────

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    const newScenes: Scene[] = [];
    for (const file of files) {
      const base64 = await toBase64(file);
      newScenes.push({ id: uid(), file, previewUrl: URL.createObjectURL(file), base64, script: "" });
    }
    setScenes(prev => [...prev, ...newScenes]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => res(reader.result as string);
      reader.onerror = rej;
    });

  // ── AI Analysis ────────────────────────────────────────────────────────────

  const analyzeWithAI = async () => {
    if (!scenes.length) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/video/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, images: scenes.map(s => ({ id: s.id, base64: s.base64 })) }),
      });
      if (!res.ok) throw new Error("Error en el análisis IA");
      const data = await res.json();
      setScenes(prev => prev.map(scene => {
        const ai = data.scripts?.find((d: any) => d.id === scene.id);
        if (!ai) return scene;
        // Concatenate all subscene scripts into one narration
        const fullScript = (ai.subScenes ?? []).map((ss: any) => ss.script).join(" ").trim();
        return { ...scene, script: fullScript || scene.script };
      }));
    } catch (e: any) { alert(e.message); }
    setIsAnalyzing(false);
  };

  // ── Generate Video ─────────────────────────────────────────────────────────

  const generateVideo = async () => {
    if (!selectedAvatarId || !selectedVoiceId) {
      alert("Selecciona un avatar y una voz primero.");
      return;
    }
    if (scenes.some(s => !s.script.trim())) {
      alert("Todos los pasos deben tener texto para el narrador.");
      return;
    }

    setIsRendering(true);
    setRenderStatus("Subiendo screenshots a S3…");
    setVideoUrl(null);

    try {
      const avatar = avatars.find(a => a.id === selectedAvatarId);
      const res = await fetch("/api/heygen/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: scenes.map(s => ({ screenBase64: s.base64, script: s.script })),
          avatarId: selectedAvatarId,
          avatarStyle: avatar?.style ?? "normal",
          voiceId: selectedVoiceId,
          layout,
          format,
          language,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear el vídeo");
      }
      const { videoId } = await res.json();
      setRenderStatus("Vídeo enviado a HeyGen, procesando…");
      startPolling(videoId);
    } catch (err: any) {
      alert(err.message);
      setIsRendering(false);
      setRenderStatus(null);
    }
  };

  const startPolling = (videoId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/heygen/status?video_id=${videoId}`);
        const data = await res.json();
        if (data.status === "completed" && data.video_url) {
          clearInterval(pollRef.current!);
          setVideoUrl(data.video_url);
          setRenderStatus("¡Vídeo completado!");
          setIsRendering(false);
        } else if (data.status === "failed") {
          clearInterval(pollRef.current!);
          setRenderStatus(`Error: ${data.error || "Fallo en HeyGen"}`);
          setIsRendering(false);
        } else {
          setRenderStatus(`Procesando en HeyGen… (${data.status})`);
        }
      } catch { /* keep polling */ }
    }, 5000);
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredAvatars = avatarSearch
    ? avatars.filter(a => a.name.toLowerCase().includes(avatarSearch.toLowerCase()))
    : avatars;

  const canGenerate = selectedAvatarId && selectedVoiceId && scenes.length > 0 && scenes.every(s => s.script.trim());

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans">
      {/* Header */}
      <div className="border-b border-neutral-800 px-8 py-5 flex items-center gap-4">
        <div className="p-2 bg-violet-600/20 text-violet-400 rounded-xl">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">HeyGen Tutorial Lab</h1>
          <p className="text-neutral-500 text-sm">Tutorial con presentador IA • Avatar generativo</p>
        </div>
        <div className="ml-auto flex items-center gap-1 bg-violet-500/10 border border-violet-500/30 rounded-full px-3 py-1 text-xs text-violet-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Powered by HeyGen API v2
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT PANEL: Config ────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Settings */}
          <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-sm text-neutral-400 uppercase tracking-wider">Configuración</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Idioma</label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm">
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Formato</label>
                <select value={format} onChange={e => setFormat(e.target.value as "16:9" | "9:16")}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm">
                  <option value="16:9">Horizontal 16:9</option>
                  <option value="9:16">Vertical 9:16</option>
                </select>
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" /> Layout del presentador
            </h2>
            <div className="space-y-2">
              {LAYOUTS.map(l => (
                <button key={l.id} onClick={() => setLayout(l.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${layout === l.id ? "border-violet-500/60 bg-violet-950/20" : "border-neutral-800 hover:border-neutral-700"}`}>
                  {l.icon}
                  <div>
                    <div className="text-sm font-medium">{l.label}</div>
                    <div className="text-xs text-neutral-500">{l.desc}</div>
                  </div>
                  {layout === l.id && <div className="ml-auto w-2 h-2 rounded-full bg-violet-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Selector */}
          <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" /> Avatar
            </h2>
            {loadingAssets ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando avatares…
              </div>
            ) : (
              <>
                <input value={avatarSearch} onChange={e => setAvatarSearch(e.target.value)}
                  placeholder="Buscar avatar…"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm placeholder-neutral-600" />
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {filteredAvatars.slice(0, 30).map(a => (
                    <button key={a.id} onClick={() => setSelectedAvatarId(a.id)}
                      title={a.name}
                      className={`rounded-xl overflow-hidden border-2 transition-all aspect-square relative ${selectedAvatarId === a.id ? "border-violet-500" : "border-transparent hover:border-neutral-600"}`}>
                      {a.thumbnail
                        ? <img src={a.thumbnail} alt={a.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-neutral-700 flex items-center justify-center text-neutral-500 text-xs">{a.name[0]}</div>
                      }
                      {selectedAvatarId === a.id && (
                        <div className="absolute inset-0 bg-violet-500/20 flex items-end justify-center pb-1">
                          <span className="text-[9px] text-white font-bold bg-violet-600 px-1 rounded">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedAvatarId && (
                  <p className="text-xs text-neutral-500">
                    🎭 {avatars.find(a => a.id === selectedAvatarId)?.name}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Voice Selector */}
          <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Mic className="w-4 h-4" /> Voz
            </h2>
            {voices.length === 0 ? (
              <div className="text-sm text-neutral-500">Selecciona un idioma para cargar voces.</div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {voices.slice(0, 20).map(v => (
                  <button key={v.id} onClick={() => setSelectedVoiceId(v.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all border ${selectedVoiceId === v.id ? "border-violet-500/50 bg-violet-950/20 text-white" : "border-transparent text-neutral-400 hover:text-neutral-300 hover:bg-neutral-800/50"}`}>
                    <span className="text-xs">{v.gender === "male" ? "👨" : v.gender === "female" ? "👩" : "🎙"}</span>
                    <span className="flex-1 truncate">{v.name}</span>
                    {v.preview && (
                      <button onClick={e => { e.stopPropagation(); new Audio(v.preview!).play(); }}
                        className="text-neutral-600 hover:text-violet-400 ml-1 flex-shrink-0" title="Escuchar preview">
                        ▶
                      </button>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Scenes + Generate ───────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Dropzone */}
          <div onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-700 hover:border-violet-600/50 hover:bg-neutral-800/20 transition-all rounded-2xl p-10 flex flex-col items-center cursor-pointer text-center group">
            <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-violet-900/20 transition-all">
              <UploadCloud className="w-7 h-7 text-neutral-400 group-hover:text-violet-400" />
            </div>
            <p className="font-medium text-neutral-300">Sube capturas de pantalla</p>
            <p className="text-neutral-600 text-sm mt-1">JPG, PNG — múltiples archivos</p>
            <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
          </div>

          {/* Scenes */}
          {scenes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">
                  Pantallas <span className="text-neutral-500 font-normal text-sm">({scenes.length})</span>
                </h2>
                <button onClick={analyzeWithAI} disabled={isAnalyzing}
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white px-4 py-2 rounded-xl font-medium text-sm disabled:opacity-50">
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {isAnalyzing ? "Analizando…" : "Generar guión con IA"}
                </button>
              </div>

              {scenes.map((scene, i) => (
                <div key={scene.id} className="bg-neutral-800/20 border border-neutral-700/50 rounded-2xl overflow-hidden flex gap-0">
                  {/* Thumbnail */}
                  <div className="w-40 flex-shrink-0 relative bg-neutral-950">
                    <img src={scene.previewUrl} alt="" className="w-full h-full object-contain" />
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
                    <button onClick={() => setScenes(prev => prev.filter(s => s.id !== scene.id))}
                      className="absolute top-2 right-2 w-6 h-6 bg-neutral-900/80 hover:bg-red-900/80 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {/* Script */}
                  <div className="flex-1 p-4">
                    <label className="text-xs text-neutral-500 font-medium uppercase tracking-wide block mb-2">
                      Narración del presentador — Pantalla {i + 1}
                    </label>
                    <textarea
                      value={scene.script}
                      onChange={e => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, script: e.target.value } : s))}
                      placeholder="¿Qué dirá el presentador en esta escena? La IA puede generarlo automáticamente."
                      className="w-full bg-transparent text-sm text-neutral-200 placeholder-neutral-700 resize-none focus:outline-none leading-relaxed min-h-[80px]"
                      rows={4}
                    />
                  </div>
                </div>
              ))}

              {/* Generate button */}
              <div className="flex flex-col items-center gap-4 pt-4">
                <button onClick={generateVideo} disabled={!canGenerate || isRendering}
                  className="flex items-center gap-3 bg-white text-black hover:bg-neutral-100 px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-white/5">
                  {isRendering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-black" />}
                  {isRendering ? "Generando…" : "Producir Vídeo con Avatar"}
                  {!isRendering && <ArrowRight className="w-4 h-4" />}
                </button>
                {!canGenerate && !isRendering && (
                  <p className="text-xs text-neutral-600">
                    {!selectedAvatarId ? "Selecciona un avatar" :
                     !selectedVoiceId ? "Selecciona una voz" :
                     "Añade narración a todas las pantallas"}
                  </p>
                )}
                {renderStatus && (
                  <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 text-neutral-300 px-5 py-3 rounded-xl text-sm">
                    {isRendering && <Loader2 className="w-4 h-4 animate-spin text-violet-400" />}
                    {renderStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {scenes.length === 0 && (
            <div className="bg-neutral-800/10 border border-neutral-800 rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
              <Monitor className="w-12 h-12 text-neutral-700" />
              <div>
                <p className="font-medium text-neutral-400">Sube capturas de pantalla para comenzar</p>
                <p className="text-sm text-neutral-600 mt-1">El presentador IA narrará cada pantalla de tu app</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Result Modal */}
      {videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="max-w-4xl w-full bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <h2 className="font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-violet-400" /> Tutorial con Presentador Generado
              </h2>
              <button onClick={() => { setVideoUrl(null); setRenderStatus(null); }}
                className="text-neutral-500 hover:text-white text-sm bg-neutral-800 px-3 py-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <video src={videoUrl} controls autoPlay className="w-full bg-black" />
            <div className="flex justify-between px-6 py-4 border-t border-neutral-800">
              <button onClick={() => { setVideoUrl(null); setRenderStatus(null); setScenes([]); }}
                className="text-neutral-500 hover:text-white text-sm flex items-center gap-1">
                <RefreshCw className="w-4 h-4" /> Nuevo vídeo
              </button>
              <a href={videoUrl} download target="_blank"
                className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                <Download className="w-4 h-4" /> Descargar MP4
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
