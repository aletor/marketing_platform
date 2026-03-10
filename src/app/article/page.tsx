"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Copy, CheckCircle2, Download, FileText, Image as ImageIcon } from "lucide-react";
import { generateArticleAction } from "@/app/actions/generate";
import "./page.css";

function ArticleGeneratorContent() {
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<null | any>(null);
  const [activeTab, setActiveTab] = useState("article");
  const [isCopied, setIsCopied] = useState(false);

  // Form State
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("general");
  const [tone, setTone] = useState("profesional");
  const [length, setLength] = useState("medium");
  const [network, setNetwork] = useState("linkedin");

  useEffect(() => {
    const topicParam = searchParams.get("topic");
    if (topicParam) {
      setTopic(topicParam);
    }
  }, [searchParams]);

  const handleGenerate = async () => {
    if (!topic) return;
    
    setIsGenerating(true);
    setResult(null);

    try {
      // Llamada real al Server Action de OpenAI
      const response = await generateArticleAction({ topic, audience, tone, length, network });
      setResult(response);
    } catch (error) {
      console.error("Error generating article:", error);
      alert("Error al generar el contenido con IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    let textToCopy = result[activeTab];
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="generator-layout">
      {/* LEFT: FORM PANEL */}
      <div className="generator-form-panel">
        <h2 className="panel-title">Parámetros del Artículo</h2>
        
        <div className="form-group">
          <label className="form-label">Tema o Concepto Clave *</label>
          <textarea 
            className="form-textarea" 
            placeholder="Ej: Cómo la facturación automatizada reduce un 30% los errores contables..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Audiencia Objetivo</label>
          <select className="form-select" value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="general">Público General / Principiantes</option>
            <option value="tecnica">Perfil Técnico / Especialistas</option>
            <option value="directiva">Perfil Directivo (C-Level)</option>
            <option value="clientes">Clientes Actuales</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Tono de Voz</label>
          <select className="form-select" value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="profesional">Profesional y Educativo</option>
            <option value="cercano">Cercano y Empático</option>
            <option value="persuasivo">Persuasivo (Marketing)</option>
            <option value="directo">Directo y Conciso</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Longitud</label>
          <select className="form-select" value={length} onChange={(e) => setLength(e.target.value)}>
            <option value="short">Corto (~500 palabras)</option>
            <option value="medium">Medio (~1000 palabras)</option>
            <option value="long">Guía Larga (+1500 palabras)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Red Social Destino</label>
          <select className="form-select" value={network} onChange={(e) => setNetwork(e.target.value)}>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">X (Twitter)</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleGenerate}
          disabled={!topic || isGenerating}
        >
          <Sparkles size={20} />
          {isGenerating ? "Generando con IA..." : "Generar Artículo"}
        </button>
      </div>

      {/* RIGHT: RESULTS PANEL */}
      <div className="generator-results-panel">
        {!isGenerating && !result && (
          <div className="results-empty-state">
            <div className="empty-icon">
              <FileText size={32} />
            </div>
            <p>Define los parámetros y pulsa en generar para crear<br/>tu contenido automáticamente.</p>
          </div>
        )}

        {isGenerating && (
          <div className="loading-skeleton">
            <div className="skeleton-line skeleton-title"></div>
            <br/>
            <div className="skeleton-line skeleton-text-1"></div>
            <div className="skeleton-line skeleton-text-2"></div>
            <div className="skeleton-line skeleton-text-3"></div>
            <br/>
            <div className="skeleton-line skeleton-title" style={{ width: '30%', height: '1.5rem'}}></div>
            <div className="skeleton-line skeleton-text-2"></div>
            <div className="skeleton-line skeleton-text-4"></div>
          </div>
        )}

        {result && !isGenerating && (
          <>
            <div className="results-tabs">
              <button className={`tab-btn ${activeTab === 'article' ? 'active' : ''}`} onClick={() => setActiveTab('article')}>
                Artículo Completo
              </button>
              <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                Resumen Ejecutivo
              </button>
              <button className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`} onClick={() => setActiveTab('social')}>
                Post {network.charAt(0).toUpperCase() + network.slice(1)}
              </button>
              <button className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>
                <ImageIcon size={16} style={{display: 'inline-block', marginRight: '5px'}}/> Imagen Destacada
              </button>
            </div>

            <div className="results-content">
              {activeTab === 'image' ? (
                <div style={{ textAlign: 'center' }}>
                  {result.imageUrl ? (
                    <img src={result.imageUrl} alt="Generada" style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }} />
                  ) : (
                    <p>No se pudo generar la imagen o está deshabilitada por seguridad sin API Key.</p>
                  )}
                </div>
              ) : (
                // Simple generic render logic. In a real app we'd parse markdown.
                result[activeTab]?.split('\n').map((paragraph: string, idx: number) => {
                  if (paragraph.startsWith('### ')) return <h3 key={idx}>{paragraph.replace('### ', '')}</h3>;
                  if (paragraph.startsWith('## ')) return <h2 key={idx}>{paragraph.replace('## ', '')}</h2>;
                  if (paragraph.startsWith('# ')) return <h1 key={idx}>{paragraph.replace('# ', '')}</h1>;
                  if (paragraph.trim() === '') return <br key={idx} />;
                  return <p key={idx}>{paragraph}</p>;
                })
              )}
            </div>

            <div className="results-actions">
              <button className="btn-secondary">
                <Download size={16} /> Exportar DOCX
              </button>
              <button className="btn-secondary" onClick={handleCopy}>
                {isCopied ? <CheckCircle2 size={16} className="logo-highlight" /> : <Copy size={16} />}
                {isCopied ? "Copiado!" : "Copiar Texto"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ArticleGenerator() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ArticleGeneratorContent />
    </Suspense>
  );
}
