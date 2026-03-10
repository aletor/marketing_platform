"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, MessageSquare, ThumbsUp, MessageCircle, Share, Send, Copy, CheckCircle2 } from "lucide-react";
import { generateArticleAction } from "@/app/actions/generate";
import "./page.css";

function SocialGeneratorContent() {
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Form State
  const [topic, setTopic] = useState("");
  const [network, setNetwork] = useState("linkedin");
  const [tone, setTone] = useState("profesional");

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
      // Reuse the article generator since it also returns social content
      const response = await generateArticleAction({ 
        topic, 
        audience: "general", 
        tone, 
        length: "short", 
        network 
      });
      
      setResult({
        text: response.social,
        hashtags: "", // Usually included in the social text from the prompt
        cta: ""
      });
    } catch (error) {
      console.error(error);
      alert("Error generating social post");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="generator-layout">
      {/* LEFT: FORM PANEL */}
      <div className="generator-form-panel">
        <h2 className="panel-title">Parámetros del Post</h2>
        
        <div className="form-group">
          <label className="form-label">¿De qué quieres hablar? *</label>
          <textarea 
            className="form-textarea" 
            placeholder="Ej: Los beneficios que hemos logrado al digitalizar la firma de contratos..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Red Social</label>
          <select className="form-select" value={network} onChange={(e) => setNetwork(e.target.value)}>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">X (Twitter)</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Tono de Voz</label>
          <select className="form-select" value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="profesional">Profesional (Networking)</option>
            <option value="inspiracional">Inspiracional / Liderazgo</option>
            <option value="polemico">Disruptivo / Polémico</option>
            <option value="humor">Informal / Divertido</option>
          </select>
        </div>

        <button 
          className="btn-primary" 
          onClick={handleGenerate}
          disabled={!topic || isGenerating}
        >
          <Sparkles size={20} />
          {isGenerating ? "Redactando Post..." : "Generar Post Social"}
        </button>
      </div>

      {/* RIGHT: RESULTS PANEL */}
      <div className="generator-results-panel" style={{ backgroundColor: 'var(--surface-hover)' }}>
        {!isGenerating && !result && (
          <div className="results-empty-state">
            <div className="empty-icon">
              <MessageSquare size={32} />
            </div>
            <p>Genera publicaciones listas para copiar<br/>y pegar en tus redes sociales.</p>
          </div>
        )}

        {isGenerating && (
          <div className="loading-skeleton">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-text-1"></div>
            <div className="skeleton-line skeleton-text-3"></div>
            <br/>
            <div className="skeleton-line skeleton-text-2"></div>
            <div className="skeleton-line skeleton-text-4"></div>
          </div>
        )}

        {result && !isGenerating && (
          <div className="social-preview-card">
            <div className="social-header">
              <div className="social-avatar">AU</div>
              <div className="social-meta">
                <span className="social-name">Admin User</span>
                <span className="social-title">Experto en B2B & Software</span>
                <span className="social-time">Justo ahora • 🌎</span>
              </div>
              <button 
                className="ml-auto p-2 hover:bg-neutral-800 rounded-lg text-neutral-400"
                onClick={handleCopy}
              >
                {isCopied ? <CheckCircle2 size={18} className="text-secondary" /> : <Copy size={18} />}
              </button>
            </div>
            
            <div className="social-content whitespace-pre-wrap">
              {result.text}
            </div>

            <div className="social-footer">
              <div className="social-action"><ThumbsUp size={16}/> Recomendar</div>
              <div className="social-action"><MessageCircle size={16}/> Comentar</div>
              <div className="social-action"><Share size={16}/> Compartir</div>
              <div className="social-action"><Send size={16}/> Enviar</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SocialGenerator() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SocialGeneratorContent />
    </Suspense>
  );
}
