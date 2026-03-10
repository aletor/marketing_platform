"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Download, ImageIcon, RefreshCw, Share2 } from "lucide-react";
import { generateImageAction } from "@/app/actions/generate";
import "./page.css";

function ImageGeneratorContent() {
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  // Form State
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("corporate");
  const [format, setFormat] = useState("landscape");

  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      setTopic(topicParam);
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    setResultImage(null);

    try {
      const imageUrl = await generateImageAction(topic);
      setResultImage(imageUrl);
    } catch (error) {
      console.error(error);
      alert("Error generating image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="generator-layout">
      {/* LEFT: FORM PANEL */}
      <div className="generator-form-panel">
        <h2 className="panel-title">Parámetros de Imagen</h2>
        
        <div className="form-group">
          <label className="form-label">Tema o Concepto a Ilustrar *</label>
          <textarea 
            className="form-textarea" 
            placeholder="Ej: Un equipo de trabajo moderno colaborando frente a pantallas holográficas..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Estilo Visual</label>
          <select className="form-select" value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="corporate">Corporativo Limpio (Fotografía)</option>
            <option value="minimal">Ilustración Minimalista Vectorial</option>
            <option value="3d">Render 3D Premium</option>
            <option value="abstract">Arte Abstracto / Texturas</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Formato (Aspect Ratio)</label>
          <select className="form-select" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="landscape">Banner Blog (16:9)</option>
            <option value="square">Post Instagram / LinkedIn (1:1)</option>
            <option value="portrait">Stories / Reels (9:16)</option>
          </select>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleGenerate}
          disabled={!topic || isGenerating}
        >
          <Sparkles size={20} />
          {isGenerating ? "Renderizando Imagen..." : "Generar Imagen"}
        </button>
      </div>

      {/* RIGHT: RESULTS PANEL */}
      <div className="generator-results-panel">
        {!isGenerating && !resultImage && (
          <div className="results-empty-state">
            <div className="empty-icon">
              <ImageIcon size={32} />
            </div>
            <p>Describe la imagen que necesitas y <br/>la IA la diseñará en segundos.</p>
          </div>
        )}

        {isGenerating && (
          <div className="image-preview-container">
             <div className="image-skeleton">
                <RefreshCw size={40} className="logo-highlight" style={{ animation: "spin 2s linear infinite" }} />
                <p style={{ fontWeight: 500 }}>Procesando píxeles...</p>
             </div>
          </div>
        )}

        {resultImage && !isGenerating && (
          <>
            <div className="image-preview-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultImage} alt="Generated visual" className="generated-image" />
              
              <div className="image-overlay-actions">
                <a href={resultImage} target="_blank" rel="noopener noreferrer" className="overlay-btn">
                  <Download size={18} /> Ver HD
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ImageGenerator() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ImageGeneratorContent />
    </Suspense>
  );
}
