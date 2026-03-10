"use client";

import { useState, useEffect } from "react";
import { 
  Upload, 
  FileText, 
  Bot, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Globe, 
  Plus, 
  Link as LinkIcon, 
  Sparkles,
  ChevronDown,
  Eye,
  ExternalLink,
  Image as ImageIcon,
  Edit3,
  Save,
  XIcon,
  ChevronUp,
  MessageSquare
} from "lucide-react";

export default function KnowledgeBasePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Edit ADN State
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const startEditing = (doc: any) => {
    setEditingDocId(doc.id);
    try {
      const parsed = JSON.parse(doc.extractedContext);
      setEditForm(parsed);
    } catch (e) {
      setEditForm({ raw: doc.extractedContext });
    }
  };

  const handleSaveAdn = async (docId: string) => {
    try {
      const updatedContextStr = JSON.stringify(editForm);
      setDocuments(docs => docs.map(d => d.id === docId ? { ...d, extractedContext: updatedContextStr } : d));
      // MVP Mock: En un entorno real, hacer un fetch PUT/PATCH.
      // await fetch(`/api/knowledge/update`, { method: 'POST', body: JSON.stringify({id: docId, context: editForm}) })
      setMessage({ text: "Cerebro Corporativo actualizado con éxito", type: "success" });
      setEditingDocId(null);
    } catch (e) {
      setMessage({ text: "Error guardando ADN", type: "error" });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedDocs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleOpenOriginal = async (doc: any) => {
    if (doc.format === 'url' && doc.originalSourceUrl) {
      window.open(doc.originalSourceUrl, '_blank');
      return;
    }
    
    try {
      const resp = await fetch(`/api/knowledge/view?key=${encodeURIComponent(doc.s3Path)}`);
      if (!resp.ok) throw new Error("Error generating view URL");
      const { url } = await resp.json();
      window.open(url, '_blank');
    } catch (e) {
      setMessage({ text: "No se pudo abrir el archivo original", type: "error" });
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setMessage({ text: "", type: "" });
    const formData = new FormData();
    files.forEach((f) => formData.append("file", f));
    try {
      const response = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Error subiendo archivos");
      const data = await response.json();
      setMessage({ text: data.message, type: "success" });
      setFiles([]);
      fetchData();
    } catch (error) {
      setMessage({ text: "Falló la subida de los archivos", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer.")) return;
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/knowledge/delete?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar el documento");
      setMessage({ text: "Documento eliminado con éxito", type: "success" });
      fetchData();
    } catch (error) {
      setMessage({ text: "No se pudo eliminar el documento", type: "error" });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleAddUrl = async () => {
    if (!url) return;
    setUploading(true);
    setMessage({ text: "Extrayendo contenido de la URL...", type: "info" });
    try {
      const response = await fetch("/api/knowledge/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage({ text: "URL añadida con éxito", type: "success" });
      setUrl("");
      fetchData();
    } catch (error: any) {
      setMessage({ text: error.message || "Error al procesar la URL", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setMessage({ text: "Analizando documentos con IA...", type: "info" });
    try {
      const response = await fetch("/api/knowledge/analyze", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage({ text: data.message, type: "success" });
      fetchData(); 
    } catch (error) {
      setMessage({ text: "Error analizando documentos.", type: "error" });
    } finally {
      setAnalyzing(false);
    }
  };

  const fetchData = async () => {
    try {
       const res = await fetch("/api/knowledge/data");
       if(res.ok) {
         const data = await res.json();
         setDocuments(data.documents || []);
       }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Filter out formats that don't exist in the current documents list
  const existingFormats = Array.from(new Set(documents.map(d => d.format).filter(Boolean)));
  const filterTabs = ['all', ...existingFormats];

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-6 lg:px-12 space-y-16 animate-in fade-in duration-1000 overflow-visible">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-neutral-200 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFBD1B]/10 border border-[#FFBD1B]/20 text-[#FFBD1B] text-[10px] font-black uppercase tracking-[0.2em]">
            <Sparkles size={12} fill="currentColor" /> Neural Core
          </div>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-[#1A1B1E]">
            Base de <span className="text-[#FFBD1B]">Conocimiento</span>
          </h1>
          <p className="text-[#8E8B88] text-xl font-medium max-w-xl leading-relaxed">
            Sincroniza documentos y URLs para alimentar el cerebro estratégico de tu IA.
          </p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className={`group flex items-center gap-4 px-10 py-6 rounded-3xl font-black transition-all duration-500 shadow-2xl ${
            analyzing 
              ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" 
              : "bg-[#1A1B1E] hover:bg-black text-white shadow-[#1A1B1E]/20 active:scale-95"
          }`}
        >
          {analyzing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
          {analyzing ? "Construyendo..." : "Extraer Conocimiento"}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="space-y-16">
        {/* Messages */}
        {message.text && (
          <div className={`p-8 rounded-[3rem] flex items-center gap-6 animate-in slide-in-from-top-4 duration-500 shadow-sm ${
            message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
            message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
            'bg-amber-50 text-amber-600 border border-amber-100'
          }`}>
            <div className="bg-white p-3 rounded-2xl shadow-sm">
              {message.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
            </div>
            <span className="text-sm font-black uppercase tracking-widest">{message.text}</span>
          </div>
        )}

        {/* Tools row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* File Upload Section */}
          <section className="bg-[#F9F6F2] p-10 rounded-[3rem] border border-[#EBE4DC] shadow-sm space-y-8 flex flex-col">
            <h2 className="text-[10px] font-black flex items-center gap-3 text-[#8E8B88] uppercase tracking-[0.2em]">
              <Upload className="w-4 h-4" />
              Ingesta de Archivos
            </h2>
            
            <div 
              className="relative flex-1"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
              }}
            >
              <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept=".pdf, .docx, .txt, .jpg, .png, .webp" multiple />
              <label htmlFor="file-upload" className={`cursor-pointer border-2 border-dashed rounded-[2.5rem] p-10 text-center flex flex-col items-center justify-center gap-4 transition-all h-full group ${
                  isDragging ? "border-[#FFBD1B] bg-[#FFBD1B]/5" : "border-[#EBE4DC] hover:border-[#FFBD1B] hover:bg-white"
                }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                  isDragging ? "bg-[#FFBD1B] border-[#FFBD1B] scale-110 shadow-lg text-white" : "bg-white border-[#EBE4DC] text-[#8E8B88]"
                }`}>
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-[#1A1B1E] uppercase tracking-tighter">Suelte archivos bibliográficos</span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="p-3 bg-white rounded-xl border border-[#EBE4DC] flex justify-between items-center group">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-[#FFBD1B] shrink-0" />
                        <span className="text-[10px] font-black truncate text-[#1A1B1E]">{f.name}</span>
                      </div>
                      <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-[#8E8B88] hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={handleUpload} disabled={uploading} className="w-full py-4 rounded-2xl bg-[#1A1B1E] text-white font-black text-[10px] hover:bg-black transition-all shadow-xl uppercase tracking-widest">
                  {uploading ? "Subiendo..." : "Sincronizar activos"}
                </button>
              </div>
            )}
          </section>

          {/* URL Ingestion Section */}
          <section className="bg-[#F9F6F2] p-10 rounded-[3rem] border border-[#EBE4DC] shadow-sm space-y-8 flex flex-col justify-center">
            <h2 className="text-[10px] font-black flex items-center gap-3 text-[#8E8B88] uppercase tracking-[0.2em]">
              <Globe className="w-4 h-4" />
              Ingesta de URL
            </h2>
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <LinkIcon className="h-4 w-4 text-[#8E8B88]" />
                </div>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://ejemplo.com/recursos"
                  className="w-full pl-12 pr-4 py-6 bg-white border border-[#EBE4DC] rounded-3xl text-sm font-bold focus:ring-1 focus:ring-[#FFBD1B] outline-none transition-all" />
              </div>
              <button 
                onClick={() => {
                  let nUrl = url.trim();
                  if (nUrl && !nUrl.startsWith('http')) nUrl = `https://${nUrl}`;
                  setUrl(nUrl);
                  handleAddUrl();
                }} 
                disabled={!url || uploading} 
                className="w-full py-6 bg-[#1A1B1E] hover:bg-black text-white rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/10"
              >
                Procesar URL Estratégica
              </button>
            </div>
          </section>
        </div>

        {/* Inventory Section */}
        <section className="bg-white p-12 rounded-[4rem] border border-[#EBE4DC] shadow-sm space-y-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-[#1A1B1E] tracking-tighter">Inventario de Sabiduría</h2>
              <p className="text-[#8E8B88] text-[10px] font-black uppercase tracking-widest">{documents.length} ACTIVOS TOTALES</p>
            </div>
            
            <div className="flex bg-[#F9F6F2] p-1.5 rounded-[1.5rem] border border-[#EBE4DC] overflow-x-auto no-scrollbar">
              {filterTabs.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeFilter === f 
                      ? "bg-white text-[#1A1B1E] shadow-sm border border-[#EBE4DC]" 
                      : "text-[#8E8B88] hover:text-[#1A1B1E]"
                  }`}
                >
                  {f === 'all' ? 'Todos' : f}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {documents.filter(d => activeFilter === 'all' || (d.format === activeFilter)).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-[#EBE4DC]">
                  <FileText size={80} strokeWidth={1} />
                  <p className="text-xl font-black uppercase tracking-widest mt-6">Bandeja Vacía</p>
                </div>
            ) : (
              documents
                .filter(d => activeFilter === 'all' || (d.format === activeFilter))
                .map((doc) => (
                <article key={doc.id} className="bg-[#F9F6F2] p-8 rounded-[3rem] border border-[#EBE4DC] hover:border-[#FFBD1B] hover:shadow-xl transition-all duration-500 group relative">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-6 min-w-0">
                          <div className={`p-4 rounded-2xl bg-white border border-[#EBE4DC] group-hover:scale-110 transition-transform duration-500 ${doc.status === 'Analizado' ? 'text-emerald-500' : 'text-[#8E8B88]'}`}>
                            {doc.format === 'image' ? <ImageIcon size={24} /> : 
                             doc.format === 'url' ? <Globe size={24} /> : 
                             <FileText size={24} />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="font-black text-lg text-[#1A1B1E] leading-tight truncate max-w-xl">{doc.filename}</h3>
                              <span className="px-3 py-1 bg-white border border-[#EBE4DC] rounded-lg text-[8px] font-black text-[#8E8B88] uppercase tracking-widest">
                                {doc.format || 'doc'}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#8E8B88] uppercase font-black tracking-widest mt-1">
                              {new Date(doc.uploadedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • Status: {doc.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleOpenOriginal(doc)} className="px-6 py-3 bg-white hover:bg-neutral-50 text-[#1A1B1E] border border-[#EBE4DC] rounded-2xl transition-all shadow-sm font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                             {doc.type === 'image' ? <Eye size={14} /> : <ExternalLink size={14} />} {doc.type === 'image' ? 'Imagen' : 'Original'}
                          </button>
                          {doc.status === 'Analizado' && doc.extractedContext && (
                            <button onClick={() => toggleExpand(doc.id)} className="px-6 py-3 bg-white hover:bg-[#1A1B1E] hover:text-white border border-[#EBE4DC] rounded-2xl transition-all shadow-sm text-[#1A1B1E] font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                              {expandedDocs.has(doc.id) ? <>Colapsar <ChevronUp size={14} /></> : <>Ver ADN <ChevronDown size={14} /></>}
                            </button>
                          )}
                          <button onClick={() => handleDelete(doc.id)} disabled={isDeleting === doc.id} className={`p-3 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-[#EBE4DC] rounded-2xl transition-all shadow-sm ${isDeleting === doc.id ? 'opacity-50' : ''}`}>
                             {isDeleting === doc.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Trash2 size={18} />}
                          </button>
                        </div>
                    </div>

                    {doc.status === 'Analizado' && doc.extractedContext && expandedDocs.has(doc.id) && (
                      <div className="pt-6 border-t border-[#EBE4DC] animate-in slide-in-from-top-4 duration-500">
                        {editingDocId === doc.id ? (
                          // ---------------- EDIT MODE ----------------
                          <div className="space-y-6">
                            <div className="flex justify-between items-center mb-6">
                              <h4 className="text-sm font-black uppercase tracking-widest text-[#1A1B1E] flex items-center gap-2"><Edit3 size={16}/> Editando Cerebro Corporativo</h4>
                              <div className="flex gap-3">
                                <button onClick={() => setEditingDocId(null)} className="px-5 py-2.5 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#F9F6F2] transition-colors flex items-center gap-2">
                                  <XIcon size={14}/> Cancelar
                                </button>
                                <button onClick={() => handleSaveAdn(doc.id)} className="px-5 py-2.5 bg-[#1A1B1E] text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#FFBD1B] hover:text-[#1A1B1E] transition-colors flex items-center gap-2 shadow-lg">
                                  <Save size={14}/> Guardar Cambios
                                </button>
                              </div>
                            </div>
                            
                            {editForm.raw ? (
                              <textarea 
                                value={editForm.raw} 
                                onChange={(e)=>setEditForm({raw: e.target.value})} 
                                className="w-full h-64 p-6 bg-white border border-[#EBE4DC] rounded-3xl outline-none focus:border-[#FFBD1B] font-mono text-sm leading-relaxed"
                              />
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                  {/* EMPRESA */}
                                  <div className="bg-white p-6 rounded-3xl border border-[#EBE4DC] shadow-sm">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[#FFBD1B] mb-4">Empresa (Propuesta de Valor)</h5>
                                    <textarea 
                                      value={editForm.empresa?.propuesta_valor || ''} 
                                      onChange={(e)=>setEditForm({...editForm, empresa: {...editForm.empresa, propuesta_valor: e.target.value}})}
                                      className="w-full min-h-[100px] p-4 bg-[#F9F6F2] border border-[#EBE4DC] rounded-2xl outline-none focus:border-[#FFBD1B] font-medium text-sm text-[#1A1B1E]"
                                    />
                                  </div>
                                  
                                  {/* DIFERENCIAL COMPETITIVO (NUEVO) */}
                                  <div className="bg-white p-6 rounded-3xl border border-[#EBE4DC] shadow-sm">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2"><Sparkles size={12}/> Diferencial Competitivo</h5>
                                    <textarea 
                                      placeholder="¿Qué nos hace únicos respecto a la competencia?"
                                      value={editForm.diferencial_competitivo || ''} 
                                      onChange={(e)=>setEditForm({...editForm, diferencial_competitivo: e.target.value})}
                                      className="w-full min-h-[100px] p-4 bg-[#F9F6F2] border border-[#EBE4DC] rounded-2xl outline-none focus:border-indigo-500 font-medium text-sm text-[#1A1B1E]"
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-6">
                                  {/* AUDIENCIA */}
                                  <div className="bg-white p-6 rounded-3xl border border-[#EBE4DC] shadow-sm">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4">Audiencia (Perfil)</h5>
                                    <textarea 
                                      value={editForm.audiencia?.perfil_cliente || ''} 
                                      onChange={(e)=>setEditForm({...editForm, audiencia: {...editForm.audiencia, perfil_cliente: e.target.value}})}
                                      className="w-full min-h-[100px] p-4 bg-[#F9F6F2] border border-[#EBE4DC] rounded-2xl outline-none focus:border-emerald-500 font-medium text-sm text-[#1A1B1E]"
                                    />
                                  </div>
                                  
                                  {/* TONO DE MARCA (NUEVO) */}
                                  <div className="bg-white p-6 rounded-3xl border border-[#EBE4DC] shadow-sm">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2"><MessageSquare size={12}/> Tono de Marca</h5>
                                    <textarea 
                                      placeholder="Ej: Autoridad profesional, cercano, directo, provocador..."
                                      value={editForm.tono_marca || ''} 
                                      onChange={(e)=>setEditForm({...editForm, tono_marca: e.target.value})}
                                      className="w-full min-h-[100px] p-4 bg-[#F9F6F2] border border-[#EBE4DC] rounded-2xl outline-none focus:border-rose-500 font-medium text-sm text-[#1A1B1E]"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // ---------------- READ MODE ----------------
                          <div>
                            <div className="flex justify-end mb-6">
                               <button onClick={() => startEditing(doc)} className="px-5 py-2.5 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-[#1A1B1E] transition-colors flex items-center gap-2 shadow-sm">
                                 <Edit3 size={12}/> Editar Matriz
                               </button>
                            </div>
                            {(() => {
                              try {
                                const data = JSON.parse(doc.extractedContext);
                                if (data.error) throw new Error("Fallback to raw");
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-3xl border border-[#EBE4DC] shadow-sm">
                                      <h4 className="text-xs font-black uppercase tracking-widest text-[#FFBD1B] mb-4">Empresa & Marca</h4>
                                      <div className="space-y-4">
                                        {data.empresa?.propuesta_valor && <div><span className="text-[10px] uppercase font-bold text-[#8E8B88]">Propuesta:</span> <p className="text-sm font-medium">{data.empresa.propuesta_valor}</p></div>}
                                        {data.diferencial_competitivo && <div><span className="text-[10px] uppercase font-bold text-indigo-500">Diferencial Único:</span> <p className="text-sm font-bold text-[#1A1B1E] bg-indigo-50 p-3 rounded-xl border border-indigo-100">{data.diferencial_competitivo}</p></div>}
                                        {data.tono_marca && <div><span className="text-[10px] uppercase font-bold text-rose-500">Tono de Voz:</span> <p className="text-sm font-bold text-[#1A1B1E] bg-rose-50 p-3 rounded-xl border border-rose-100">{data.tono_marca}</p></div>}
                                      </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-[#EBE4DC] shadow-sm">
                                      <h4 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4">Audiencia</h4>
                                      <div className="space-y-3">
                                        {data.audiencia?.perfil_cliente && <div><span className="text-[10px] uppercase font-bold text-[#8E8B88]">Perfil:</span> <p className="text-sm font-medium">{data.audiencia.perfil_cliente}</p></div>}
                                        {data.audiencia?.problemas_principales?.length > 0 && <div><span className="text-[10px] uppercase font-bold text-[#8E8B88]">Problemas Reales:</span> <ul className="list-disc list-inside text-sm font-medium text-rose-600">{data.audiencia.problemas_principales.map((p:string,i:number)=><li key={i}>{p}</li>)}</ul></div>}
                                      </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-[#EBE4DC] shadow-sm">
                                      <h4 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-4">Producto</h4>
                                      <div className="space-y-3">
                                        {data.producto?.beneficios?.length > 0 && <div><span className="text-[10px] uppercase font-bold text-[#8E8B88]">Beneficios:</span> <ul className="list-disc list-inside text-sm font-medium text-blue-600">{data.producto.beneficios.map((b:string,i:number)=><li key={i}>{b}</li>)}</ul></div>}
                                        {data.producto?.funcionalidades?.length > 0 && <div><span className="text-[10px] uppercase font-bold text-[#8E8B88]">Funcionalidades:</span> <ul className="list-disc list-inside text-sm font-medium">{data.producto.funcionalidades.map((f:string,i:number)=><li key={i}>{f}</li>)}</ul></div>}
                                      </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-[#EBE4DC] shadow-sm">
                                      <h4 className="text-xs font-black uppercase tracking-widest text-purple-500 mb-4">Casos de Uso</h4>
                                      <div className="space-y-3">
                                        {data.casos_uso?.length > 0 ? (
                                          <ul className="space-y-2">
                                            {data.casos_uso.map((c:any,i:number)=>(
                                              <li key={i} className="text-sm font-medium bg-[#F9F6F2] p-3 rounded-xl border border-[#EBE4DC]">
                                                <span className="font-bold text-[#1A1B1E]">{c.sector || 'General'}:</span> {c.aplicacion}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : <p className="text-sm font-medium text-[#8E8B88]">No detectados</p>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              } catch (e) {
                                return (
                                  <div className="text-sm text-[#1A1B1E] leading-relaxed font-medium bg-white p-10 rounded-[2.5rem] border border-[#EBE4DC]/50 shadow-inner whitespace-pre-wrap">
                                      {doc.extractedContext}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
