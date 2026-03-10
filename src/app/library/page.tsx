"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Image as ImageIcon, 
  MessageSquare, 
  Copy, 
  Download, 
  Edit3,
  Search,
  LayoutGrid,
  Zap,
  Calendar,
  Clock,
  Trash2,
  Target,
  CheckCircle2,
  Users,
  TrendingUp,
  X,
  ShieldCheck
} from "lucide-react";
import { getLibraryItemsAction, deleteLibraryItemAction, duplicateLibraryItemAction, updateLibraryItemAction } from "@/app/actions/library";
import { GeneratedItem } from "@/lib/generated-db";
import "./page.css";

export default function Library() {
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleCopy = (item: GeneratedItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let text = "";
    if (item.type === 'article') text = `# ${item.title}\n\n${item.content.summary}\n\n${item.content.article}`;
    else if (item.type === 'social') text = item.content;
    else text = JSON.stringify(item.content, null, 2);
    navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles");
  };

  const handleDownload = (item: GeneratedItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let text = "";
    let ext = "md";
    if (item.type === 'article') text = `# ${item.title}\n\n${item.content.summary}\n\n${item.content.article}`;
    else if (item.type === 'social') text = item.content;
    else { text = JSON.stringify(item.content, null, 2); ext = "json"; }
    const blob = new Blob([text], { type: `text/${ext}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
    a.click();
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm("¿Estás seguro de que deseas eliminar este activo?")) {
      const res = await deleteLibraryItemAction(id);
      if (res.success) setItems(items.filter(i => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    }
  };

  const handleDuplicate = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const res = await duplicateLibraryItemAction(id);
    if (res.success && res.item) {
      setItems([res.item, ...items]);
    }
  };

  const saveEdit = async () => {
    if (!selectedItem) return;
    const isStringContent = typeof selectedItem.content === 'string';
    const newContentObj = isStringContent ? editContent : { ...selectedItem.content, article: editContent };
    
    const res = await updateLibraryItemAction(selectedItem.id, newContentObj, editTitle);
    if (res.success && res.item) {
      setItems(items.map(i => i.id === selectedItem.id ? res.item! : i));
      setSelectedItem(res.item);
      setIsEditing(false);
    }
  };

  const openItem = (item: GeneratedItem) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditContent(typeof item.content === 'string' ? item.content : (item.content.article || ""));
    setIsEditing(false);
  };


  useEffect(() => {
    async function fetchItems() {
      const res = await getLibraryItemsAction();
      if (res.success) {
        setItems(res.items);
      }
      setLoading(false);
    }
    fetchItems();
  }, []);

  const filteredItems = filter === "all" 
    ? items 
    : items.filter(item => item.type === filter);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="library-container max-w-[1600px] mx-auto py-12 px-6 lg:px-12 space-y-16 animate-in fade-in duration-1000">
      
      <header className="library-header">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1B1E]/5 text-[#8E8B88] text-[9px] font-black uppercase tracking-widest border border-[#EBE4DC]">
            <Zap size={10} fill="currentColor" className="text-[#FFBD1B]" /> Activos Generados
          </div>
          <h1 className="library-title text-4xl lg:text-6xl">Tu <span className="text-[#FFBD1B]">Biblioteca</span></h1>
          <p className="library-subtitle">Gestiona y reutiliza el contenido generado por tu ADN corporativo.</p>
        </div>
        
        <div className="library-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active shadow-lg' : ''}`}
            onClick={() => setFilter('all')}
          >
            <LayoutGrid size={14} /> Todos
          </button>
          <button 
            className={`filter-btn ${filter === 'article' ? 'active shadow-lg' : ''}`}
            onClick={() => setFilter('article')}
          >
            <FileText size={14} /> Artículos
          </button>
          <button 
            className={`filter-btn ${filter === 'marketing' ? 'active shadow-lg' : ''}`}
            onClick={() => setFilter('marketing')}
          >
            <Zap size={14} /> Estrategia
          </button>
          <button 
            className={`filter-btn ${filter === 'social' ? 'active shadow-lg' : ''}`}
            onClick={() => setFilter('social')}
          >
            <MessageSquare size={14} /> Posts
          </button>
          <button 
            className={`filter-btn ${filter === 'image' ? 'active shadow-lg' : ''}`}
            onClick={() => setFilter('image')}
          >
            <ImageIcon size={14} /> Imágenes
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 text-[#8E8B88] animate-pulse">
          <RefreshCw className="animate-spin w-12 h-12 mb-6 text-[#FFBD1B]" />
          <p className="font-black uppercase tracking-widest text-xs">Sincronizando biblioteca...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-40 border-2 border-dashed border-[#EBE4DC] rounded-[4rem] text-center bg-[#F9F6F2]">
          <div className="mx-auto w-24 h-24 bg-white rounded-[2rem] border border-[#EBE4DC] flex items-center justify-center text-[#EBE4DC] mb-8 shadow-sm">
             <Zap size={48} strokeWidth={1} />
          </div>
          <h3 className="text-2xl font-black text-[#1A1B1E] uppercase tracking-tighter mb-4">Biblioteca Vacía</h3>
          <p className="text-[#8E8B88] max-w-sm mx-auto mb-10 text-sm font-medium leading-relaxed">
            Aún no has generado activos. Empieza creando un artículo o un plan de marketing para verlos aquí.
          </p>
          <Link href="/" className="px-10 py-5 bg-[#1A1B1E] text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
            Ir al Dashboard
          </Link>
        </div>
      ) : (
        <div className="library-grid">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="library-card group cursor-pointer"
              onClick={() => openItem(item)}
            >
              
              {(item.type === 'image' || (item.type === 'article' && item.content?.imageUrl) || item.preview) && (
                <div className="card-preview mb-6 relative">
                  <div className="absolute top-4 left-4 z-20">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2 ${
                      item.type === 'article' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      item.type === 'marketing' ? 'bg-[#1A1B1E] text-white border-black' :
                      item.type === 'social' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {item.type === 'article' && <FileText size={10}/>}
                      {item.type === 'marketing' && <Zap size={10}/>}
                      {item.type === 'social' && <MessageSquare size={10}/>}
                      {item.type === 'image' && <ImageIcon size={10}/>}
                      {item.type === 'article' && 'Artículo'}
                      {item.type === 'marketing' && 'Estrategia'}
                      {item.type === 'social' && 'Post Social'}
                      {item.type === 'image' && 'Imagen AI'}
                    </span>
                  </div>
                  
                  <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-white border border-[#EBE4DC] shadow-inner group-hover:border-[#FFBD1B]/50 transition-all duration-500">
                    {item.type === 'image' || (item.type === 'article' && item.content?.imageUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={item.type === 'image' ? item.content : item.content.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : item.preview ? (
                      <div className="p-10 text-[11px] text-[#1A1B1E]/60 italic font-medium leading-relaxed line-clamp-6">
                        {item.preview}
                      </div>
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )}

              <div className="space-y-4 px-4 pb-2">
                {! (item.type === 'image' || (item.type === 'article' && item.content?.imageUrl) || item.preview) && (
                   <div className="flex items-center gap-2 mb-2">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-2 ${
                        item.type === 'article' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        item.type === 'marketing' ? 'bg-[#1A1B1E] text-white border-black' :
                        item.type === 'social' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                   </div>
                )}
                <h3 className="font-black text-xl text-[#1A1B1E] leading-tight truncate group-hover:text-[#FFBD1B] transition-colors">{item.title}</h3>
                
                <div className="flex items-center gap-4 text-[#8E8B88]">
                   <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest">
                     <Clock size={12} /> {formatDate(item.date)}
                   </div>
                </div>
                
                <div className="pt-6 border-t border-[#EBE4DC] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="p-3 bg-[#F9F6F2] hover:bg-white border border-[#EBE4DC] rounded-xl text-[#1A1B1E] transition-all hover:shadow-md hover:border-[#FFBD1B]/30" title="Copiar" onClick={(e) => handleCopy(item, e)}>
                      <Copy size={16} />
                    </button>
                    <button className="p-3 bg-[#F9F6F2] hover:bg-white border border-[#EBE4DC] rounded-xl text-[#1A1B1E] transition-all hover:shadow-md hover:border-[#FFBD1B]/30" title="Descargar" onClick={(e) => handleDownload(item, e)}>
                      <Download size={16} />
                    </button>
                    <button className="p-3 bg-[#F9F6F2] hover:bg-white border border-[#EBE4DC] rounded-xl text-[#1A1B1E] text-blue-500 transition-all hover:shadow-md hover:border-blue-200" title="Duplicar" onClick={(e) => handleDuplicate(item.id, e)}>
                      <Copy size={16} /> {/* Should use better icon for duplicating, keeping as Copy to avoid new imports for now */}
                    </button>
                  </div>
                  <button className="p-3 text-rose-300 hover:text-rose-500 transition-colors" title="Eliminar" onClick={(e) => handleDelete(item.id, e)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-[#F9F6F2] w-full max-w-4xl max-h-[90vh] rounded-[4rem] border border-[#EBE4DC] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-10 border-b border-[#EBE4DC] flex items-center justify-between bg-white">
              <div className="space-y-2 flex-1 mr-4">
                <span className="px-4 py-1.5 rounded-full bg-[#1A1B1E]/5 text-[#8E8B88] text-[9px] font-black uppercase tracking-widest border border-[#EBE4DC]">
                  {selectedItem.type.toUpperCase()}
                </span>
                {isEditing ? (
                  <input type="text" value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="w-full text-3xl font-black text-[#1A1B1E] tracking-tighter bg-transparent border-b-2 border-[#1A1B1E] outline-none" />
                ) : (
                  <h2 className="text-3xl font-black text-[#1A1B1E] tracking-tighter">{selectedItem.title}</h2>
                )}
              </div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-6 py-4 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest">
                    Cancelar
                  </button>
                  <button onClick={saveEdit} className="px-6 py-4 bg-[#1A1B1E] text-white rounded-3xl transition-all border border-[#1A1B1E] hover:bg-black font-black text-[10px] uppercase tracking-widest">
                    Guardar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  {(selectedItem.type === 'article' || selectedItem.type === 'social') && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-4 bg-white hover:bg-[#F9F6F2] text-[#1A1B1E] rounded-3xl transition-all border border-[#EBE4DC] group flex items-center gap-3"
                    >
                      <Edit3 size={20} />
                      <span className="font-black text-[10px] uppercase tracking-widest px-1">Editar</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="p-4 bg-[#F9F6F2] hover:bg-[#1A1B1E] hover:text-white rounded-3xl transition-all border border-[#EBE4DC] group flex items-center gap-3"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
              {selectedItem.type === 'image' && (
                <div className="rounded-[3rem] overflow-hidden border border-[#EBE4DC] shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedItem.content} alt={selectedItem.title} className="w-full" />
                </div>
              )}

              {selectedItem.type === 'article' && (
                <div className="space-y-10">
                  {selectedItem.content.imageUrl && (
                    <div className="rounded-[3rem] overflow-hidden border border-[#EBE4DC] shadow-xl max-h-[400px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedItem.content.imageUrl} alt={selectedItem.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#FFBD1B]">Resumen Ejecutivo</h3>
                    <div className="bg-white p-10 rounded-[2.5rem] border border-[#EBE4DC]/50 shadow-inner italic font-medium text-[#1A1B1E]/70 leading-relaxed">
                      {selectedItem.content.summary}
                    </div>
                  </div>
                  <div className="space-y-6 flex-1 flex flex-col min-h-[400px]">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#FFBD1B]">Artículo Completo</h3>
                    {isEditing ? (
                      <textarea
                        value={editContent}
                        onChange={(e)=>setEditContent(e.target.value)}
                        className="w-full h-full min-h-[500px] p-6 rounded-3xl border-2 border-[#EBE4DC] bg-white text-sm font-mono focus:border-[#FFBD1B] focus:ring-0 outline-none leading-relaxed"
                      />
                    ) : (
                      <div className="prose prose-neutral max-w-none text-[#1A1B1E] leading-relaxed font-medium bg-white p-10 rounded-3xl border border-[#EBE4DC] shadow-sm">
                        <div className="whitespace-pre-wrap">{selectedItem.content.article}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedItem.type === 'marketing' && (
                <div className="space-y-12">
                   {/* Business Profile & Audience */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {selectedItem.content.businessProfile && (
                        <div className="p-10 bg-white rounded-[3rem] border border-[#EBE4DC] space-y-6 shadow-sm">
                          <div className="flex items-center gap-3 text-[#FFBD1B]">
                            <Target size={20} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Perfil de Negocio</h4>
                          </div>
                          <p className="text-2xl font-black text-[#1A1B1E] leading-tight">{selectedItem.content.businessProfile.type}</p>
                          <div className="space-y-2">
                             {selectedItem.content.businessProfile.advantages?.slice(0, 3).map((adv: string, i: number) => (
                               <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-[#8E8B88]">
                                 <CheckCircle2 size={12} className="text-emerald-500" /> {adv}
                               </div>
                             ))}
                          </div>
                        </div>
                      )}
                      {selectedItem.content.targetAudience && (
                        <div className="p-10 bg-white rounded-[3rem] border border-[#EBE4DC] space-y-6 shadow-sm">
                          <div className="flex items-center gap-3 text-[#FFBD1B]">
                            <Users size={20} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Audiencia Ideal</h4>
                          </div>
                          <p className="text-lg font-bold text-[#1A1B1E] leading-relaxed">{selectedItem.content.targetAudience.profile}</p>
                        </div>
                      )}
                   </div>

                   {/* Content Strategy */}
                   {selectedItem.content.contentStrategy && (
                     <div className="p-10 bg-[#1A1B1E] rounded-[3.5rem] border border-black shadow-2xl space-y-8">
                        <div className="flex items-center gap-3 text-[#FFBD1B]">
                          <TrendingUp size={20} />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Ejes Estratégicos</h4>
                        </div>
                        
                        {/* New 4-Pillars Format */}
                        {selectedItem.content.contentStrategy.pillars ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Captación */}
                            <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FFBD1B] flex items-center gap-2"><Target size={14}/> Captación</h4>
                               <div className="space-y-2">
                                 {selectedItem.content.contentStrategy.pillars.captacion?.map((item: string, i: number) => (
                                   <p key={i} className="text-[10px] text-white/70 font-medium leading-relaxed">• {item}</p>
                                 ))}
                               </div>
                            </div>
                            {/* Educativo */}
                            <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2"><FileText size={14}/> Educativo</h4>
                               <div className="space-y-2">
                                 {selectedItem.content.contentStrategy.pillars.educativo?.map((item: string, i: number) => (
                                   <p key={i} className="text-[10px] text-white/70 font-medium leading-relaxed">• {item}</p>
                                 ))}
                               </div>
                            </div>
                            {/* Confianza */}
                            <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2"><ShieldCheck size={14}/> Confianza</h4>
                               <div className="space-y-2">
                                 {selectedItem.content.contentStrategy.pillars.confianza?.map((item: string, i: number) => (
                                   <p key={i} className="text-[10px] text-white/70 font-medium leading-relaxed">• {item}</p>
                                 ))}
                               </div>
                            </div>
                            {/* Conversión */}
                            <div className="space-y-3 p-6 bg-[#FFBD1B]/10 rounded-3xl border border-[#FFBD1B]/30">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FFBD1B] flex items-center gap-2"><Zap size={14}/> Conversión</h4>
                               <div className="space-y-2">
                                 {selectedItem.content.contentStrategy.pillars.conversion?.map((item: string, i: number) => (
                                   <p key={i} className="text-[10px] text-amber-100 font-bold leading-relaxed">• {item}</p>
                                 ))}
                               </div>
                            </div>
                          </div>
                        ) : (
                          // Fallback for older formats
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="space-y-4">
                                <h5 className="text-[9px] font-black text-white/30 uppercase tracking-widest">Temas Principales</h5>
                                <div className="flex flex-wrap gap-2">
                                  {selectedItem.content.contentStrategy.mainThemes?.map((theme: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold">{theme}</span>
                                  ))}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <h5 className="text-[9px] font-black text-white/30 uppercase tracking-widest">Áreas de Sabiduría</h5>
                                <div className="flex flex-wrap gap-2">
                                  {selectedItem.content.contentStrategy.knowledgeAreas?.map((area: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 rounded-xl bg-[#FFBD1B]/10 border border-[#FFBD1B]/20 text-[#FFBD1B] text-[10px] font-bold">{area}</span>
                                  ))}
                                </div>
                             </div>
                             <div className="space-y-4">
                                <h5 className="text-[9px] font-black text-white/30 uppercase tracking-widest">Oportunidades</h5>
                                <div className="flex flex-wrap gap-2">
                                  {selectedItem.content.contentStrategy.opportunities?.map((opp: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">{opp}</span>
                                  ))}
                                </div>
                             </div>
                          </div>
                        )}
                     </div>
                   )}

                   {/* Editorial Plan Weeks if available */}
                   {selectedItem.content.weeks && (
                     <div className="space-y-8">
                       <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#FFBD1B]">Calendario Editorial (MVP)</h3>
                       <div className="space-y-6">
                         {selectedItem.content.weeks.map((week: any) => (
                           <div key={week.week} className="p-10 bg-white rounded-[3.5rem] border border-[#EBE4DC] space-y-8">
                              <div className="flex items-center justify-between">
                                <h4 className="text-2xl font-black text-[#1A1B1E]">Semana {week.week}</h4>
                                <div className="h-px flex-1 mx-8 bg-[#EBE4DC]" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {week.items.map((item: any, idx: number) => (
                                  <div key={idx} className="p-8 bg-[#F9F6F2] rounded-3xl border border-[#EBE4DC] space-y-6 hover:border-[#FFBD1B]/30 transition-all group/item">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-4 rounded-2xl ${item.type === 'article' ? 'bg-amber-100/50 text-amber-600' : 'bg-[#1A1B1E] text-white'}`}>
                                          {item.type === 'article' ? <FileText size={18} /> : <MessageSquare size={18} />}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8B88]">{item.type}</span>
                                      </div>
                                      
                                      {/* Pillar Badge */}
                                      {item.pillar && (
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1
                                          ${item.pillar === 'captacion' ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}
                                          ${item.pillar === 'educativo' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                                          ${item.pillar === 'confianza' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}
                                          ${item.pillar === 'conversion' ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}
                                        `}>
                                          {item.pillar === 'captacion' && <Target size={8} />}
                                          {item.pillar === 'educativo' && <FileText size={8} />}
                                          {item.pillar === 'confianza' && <ShieldCheck size={8} />}
                                          {item.pillar === 'conversion' && <Zap size={8} />}
                                          {item.pillar}
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-xl font-black text-[#1A1B1E] leading-tight group-hover/item:text-[#FFBD1B] transition-colors">{item.title}</p>
                                      <p className="text-xs text-[#8E8B88] font-medium leading-relaxed">{item.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Raw Data if nothing else */}
                   {!selectedItem.content.businessProfile && !selectedItem.content.weeks && (
                     <div className="bg-white p-10 rounded-[3rem] border border-[#EBE4DC] shadow-sm">
                        <pre className="text-xs text-[#1A1B1E]/70 whitespace-pre-wrap font-mono uppercase tracking-tighter">
                          {JSON.stringify(selectedItem.content, null, 2)}
                        </pre>
                     </div>
                   )}
                </div>
              )}

              {selectedItem.type === 'social' && (
                <div className="bg-white p-10 rounded-[3rem] border border-[#EBE4DC] shadow-sm flex items-start gap-8">
                   <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 border border-blue-100">
                     <MessageSquare size={32} />
                   </div>
                   <div className="space-y-4">
                     <p className="text-xl font-bold text-[#1A1B1E] leading-relaxed">
                       {selectedItem.preview}
                     </p>
                     <div className="flex gap-2">
                       <span className="text-[#FFBD1B] font-bold">#IA</span>
                       <span className="text-[#FFBD1B] font-bold">#Marketing</span>
                     </div>
                   </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-[#EBE4DC] bg-[#F9F6F2] flex items-center justify-center gap-4">
              <button onClick={(e) => handleCopy(selectedItem, e)} className="px-10 py-5 bg-[#1A1B1E] text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3">
                <Copy size={16} /> Copiar al Portapapeles
              </button>
              <button onClick={(e) => handleDownload(selectedItem, e)} className="px-10 py-5 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3">
                <Download size={16} /> Descargar Activo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}
