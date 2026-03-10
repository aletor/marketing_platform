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
  ShieldCheck,
  FolderOpen,
  Eye,
  Heart,
  RefreshCw
} from "lucide-react";
import { getLibraryItemsAction, deleteLibraryItemAction, duplicateLibraryItemAction, updateLibraryItemAction, updateLibraryItemCampaignAction } from "@/app/actions/library";
import { getCampaignsAction } from "@/app/actions/campaigns-db";
import { CampaignRecord } from "@/lib/campaigns-db";
import { GeneratedItem } from "@/lib/generated-db";
import "./page.css";

export default function Library() {
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [filter, setFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState<GeneratedItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleCopy = (item: GeneratedItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let text = "";
    if (item.type === 'article') {
      const isObject = typeof item.content === 'object' && item.content !== null;
      const summView = isObject ? (item.content.summary || "") : "";
      const artView = isObject ? (item.content.article || "") : item.content;
      text = `# ${item.title}\n\n${summView}\n\n${artView}`;
    }
    else if (item.type === 'social') text = typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2);
    else text = JSON.stringify(item.content, null, 2);
    navigator.clipboard.writeText(text);
    alert("Copiado al portapapeles");
  };

  const handleDownload = (item: GeneratedItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let text = "";
    let ext = "md";
    if (item.type === 'article') {
      const isObject = typeof item.content === 'object' && item.content !== null;
      const summView = isObject ? (item.content.summary || "") : "";
      const artView = isObject ? (item.content.article || "") : item.content;
      text = `# ${item.title}\n\n${summView}\n\n${artView}`;
    }
    else if (item.type === 'social') text = typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2);
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

  const handleMoveToCampaign = async (campaignId: string) => {
    if (!selectedItem) return;
    const res = await updateLibraryItemCampaignAction(selectedItem.id, campaignId === "none" ? "" : campaignId);
    if (res.success && res.item) {
      setItems(items.map(i => i.id === selectedItem.id ? res.item! : i));
      setSelectedItem(res.item);
    }
  };


  useEffect(() => {
    async function fetchData() {
      const [libRes, campRes] = await Promise.all([
        getLibraryItemsAction(),
        getCampaignsAction()
      ]);
      
      if (libRes.success) setItems(libRes.items);
      if (campRes.success && campRes.campaigns) setCampaigns(campRes.campaigns);
      
      setLoading(false);

      const searchParams = new URLSearchParams(window.location.search);
      const openId = searchParams.get('open');
      if (openId && libRes.success) {
        const itemToOpen = libRes.items.find(i => i.id === openId);
        if (itemToOpen) openItem(itemToOpen);
      }
    }
    fetchData();
  }, []);

  const filteredItems = items.filter(item => {
    const matchType = filter === "all" || item.type === filter;
    const matchCampaign = campaignFilter === "all" || item.campaignId === campaignFilter;
    return matchType && matchCampaign;
  });

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
    <div className="library-container max-w-[1600px] mx-auto py-12 px-6 lg:px-12 space-y-12 animate-in fade-in duration-1000">
      
      {/* HEADER SECTION - FIXED LAYOUT */}
      <header className="library-header border-b border-[#EBE4DC] pb-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          
          {/* Title and Badge Cluster */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1B1E]/5 text-[#8E8B88] text-[9px] font-black uppercase tracking-widest border border-[#EBE4DC]">
              <Zap size={10} fill="currentColor" className="text-[#FFBD1B]" /> Activos Generados
            </div>
            <div className="space-y-0">
               <h1 className="text-6xl lg:text-7xl font-black text-[#1A1B1E] tracking-tighter leading-none m-0">Tu</h1>
               <h2 className="text-6xl lg:text-7xl font-black text-[#FFBD1B] tracking-tighter leading-none m-0">Contenido</h2>
            </div>
            <p className="text-[#8E8B88] text-lg font-medium max-w-sm leading-relaxed">
              Gestiona y reutiliza el contenido generado por tu ADN corporativo.
            </p>
          </div>

          {/* Action Buttons Cluster */}
          <div className="flex items-center gap-4 shrink-0">
             <Link href="/article" className="px-8 py-5 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-3xl font-black text-[10px] uppercase tracking-widest hover:border-[#1A1B1E] transition-all shadow-sm">
               Generar Artículo
             </Link>
             <Link href="/social" style={{ backgroundColor: '#1A1B1E', color: 'white' }} className="px-8 py-5 bg-[#1A1B1E] rounded-3xl font-black text-[10px] uppercase tracking-widest hover:text-[#FFBD1B] transition-all shadow-xl active:scale-95">
               Crear Nuevo Post
             </Link>
          </div>
        </div>

        {/* Filters Section - Simplified Pill Layout */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-10 mt-10 border-t border-[#F9F6F2]">
          
          {/* Main Type Filters */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F9F6F2] rounded-[1.5rem] border border-[#EBE4DC]">
            <button 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'all' ? 'bg-white text-[#1A1B1E] shadow-sm border border-[#EBE4DC]' : 'text-[#8E8B88] hover:text-[#1A1B1E]'}`}
              onClick={() => setFilter('all')}
            >
              <LayoutGrid size={14} /> Todos
            </button>
            <button 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'article' ? 'bg-white text-[#1A1B1E] shadow-sm border border-[#EBE4DC]' : 'text-[#8E8B88] hover:text-[#1A1B1E]'}`}
              onClick={() => setFilter('article')}
            >
              <FileText size={14} /> Artículos
            </button>
            <button 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'marketing' ? 'bg-white text-[#1A1B1E] shadow-sm border border-[#EBE4DC]' : 'text-[#8E8B88] hover:text-[#1A1B1E]'}`}
              onClick={() => setFilter('marketing')}
            >
              <Zap size={14} /> Estrategia
            </button>
            <button 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'social' ? 'bg-white text-[#1A1B1E] shadow-sm border border-[#EBE4DC]' : 'text-[#8E8B88] hover:text-[#1A1B1E]'}`}
              onClick={() => setFilter('social')}
            >
              <MessageSquare size={14} /> Posts
            </button>
            <button 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filter === 'image' ? 'bg-white text-[#1A1B1E] shadow-sm border border-[#EBE4DC]' : 'text-[#8E8B88] hover:text-[#1A1B1E]'}`}
              onClick={() => setFilter('image')}
            >
              <ImageIcon size={14} /> Imágenes
            </button>
          </div>

          {/* Campaign Specific Filter */}
          {campaigns.length > 0 && (
            <div className="flex items-center gap-2 bg-[#F9F6F2] p-1 rounded-[1.5rem] border border-[#EBE4DC]">
              <span className="text-[#8E8B88] text-[9px] font-black uppercase tracking-widest px-4">Campaña:</span>
              <button 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${campaignFilter === 'all' ? 'bg-white text-[#1A1B1E] shadow-sm border border-[#EBE4DC]' : 'text-[#8E8B88] hover:text-[#1A1B1E]'}`}
                onClick={() => setCampaignFilter('all')}
              >
                Todas
              </button>
              {campaigns.map(c => (
                <button 
                  key={c.id}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${campaignFilter === c.id ? 'bg-white text-[#1A1B1E] shadow-sm border border-[#EBE4DC]' : 'text-[#8E8B88] hover:text-[#1A1B1E]'}`}
                  onClick={() => setCampaignFilter(c.id)}
                  title={c.theme}
                >
                  {c.theme.length > 15 ? c.theme.substring(0, 15) + '...' : c.theme}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* BODY SECTION */}
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
          <h3 className="text-2xl font-black text-[#1A1B1E] uppercase tracking-tighter mb-4">Aún no hay Contenido</h3>
          <Link href="/" className="px-10 py-5 bg-[#1A1B1E] text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
            Ir al Dashboard
          </Link>
        </div>
      ) : (
        <div className="library-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredItems.map((item, index) => {
            const views = 1200 + (index * 345);
            const engagement = (4.5 + (index % 5) * 0.3).toFixed(1);
            const leads = 12 + (index * 3);
            const states = ['Borrador', 'Listo', 'Publicado', 'Archivado'];
            const currentState = states[index % 3];

            return (
              <div 
                key={item.id} 
                className="library-card group cursor-pointer flex flex-col h-full bg-white border border-[#EBE4DC] rounded-[2.5rem] shadow-sm hover:border-[#1A1B1E] hover:shadow-xl transition-all duration-300"
                onClick={() => openItem(item)}
              >
                {/* Image / Text Preview Area */}
                <div className="card-preview m-6 mb-2 relative aspect-video rounded-[1.5rem] overflow-hidden bg-[#F9F6F2] border border-[#EBE4DC]">
                  {/* Status Overlay */}
                    <div className="absolute top-4 right-4 z-20">
                       <span 
                         className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md text-white
                            ${currentState === 'Publicado' ? 'bg-emerald-500 border-emerald-600' : 
                              currentState === 'Listo' ? 'bg-blue-500 border-blue-600' : 
                              'bg-amber-500 border-amber-600'}`}
                       >
                         {currentState}
                       </span>
                    </div>

                    {/* Content Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest border border-[#EBE4DC] flex items-center gap-1.5 text-[#1A1B1E]">
                        {item.type === 'article' && <FileText size={10} className="text-[#FFBD1B]" />}
                        {item.type === 'marketing' && <Zap size={10} className="text-[#FFBD1B]" />}
                        {item.type === 'social' && <MessageSquare size={10} className="text-blue-500" />}
                        {item.type === 'image' && <ImageIcon size={10} className="text-emerald-500" />}
                        {item.type === 'article' ? 'Artículo' : item.type === 'marketing' ? 'Estrategia' : item.type === 'social' ? 'Social' : 'Imagen AI'}
                      </span>
                    </div>

                    {/* Background Visual */}
                    {item.type === 'image' || (item.type === 'article' && item.content?.imageUrl) ? (
                      <img 
                        src={item.type === 'image' ? item.content : item.content.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="p-8 text-[11px] text-[#1A1B1E]/40 italic font-medium leading-relaxed line-clamp-5">
                        {item.preview || (typeof item.content === 'string' ? item.content : item.content.article)}
                      </div>
                    )}
                </div>

                {/* Content Info */}
                <div className="card-content flex flex-col flex-1 p-8 pt-4 space-y-4">
                  <h3 className="font-black text-xl text-[#1A1B1E] leading-tight truncate-2-lines group-hover:text-[#FFBD1B] transition-colors h-14">
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-[#8E8B88]">
                     <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest">
                       <Clock size={12} /> {formatDate(item.date)}
                     </div>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-[#F9F6F2]">
                     {/* Mock Metrics Grid */}
                     <div className="flex items-center justify-between text-[#8E8B88] px-2 pb-5 mb-4">
                       <div className="flex flex-col items-center gap-1">
                          <Eye size={14} className="opacity-50" />
                          <span className="text-[10px] font-bold text-[#1A1B1E]">{views.toLocaleString()}</span>
                       </div>
                       <div className="flex flex-col items-center gap-1">
                          <Heart size={14} className="opacity-50" />
                          <span className="text-[10px] font-bold text-[#1A1B1E]">{engagement}%</span>
                       </div>
                       <div className="flex flex-col items-center gap-1">
                          <Target size={14} className="text-[#FFBD1B]" />
                          <span className="text-[10px] font-black text-[#1A1B1E]">{leads}</span>
                       </div>
                     </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-1.5">
                          <button onClick={(e) => handleCopy(item, e)} className="p-2.5 bg-[#F9F6F2] hover:bg-[#1A1B1E] hover:text-white border border-[#EBE4DC] rounded-xl text-[#1A1B1E] transition-all"><Copy size={14}/></button>
                          <button onClick={(e) => handleDownload(item, e)} className="p-2.5 bg-[#F9F6F2] hover:bg-[#1A1B1E] hover:text-white border border-[#EBE4DC] rounded-xl text-[#1A1B1E] transition-all"><Download size={14}/></button>
                        </div>
                        <button onClick={(e) => handleDelete(item.id, e)} className="p-2.5 text-rose-300 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* MODAL DETALLE - Simplified and Optimized Overlay */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1A1B1E]/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedItem(null)}>
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-[#EBE4DC] flex items-center justify-between bg-white">
              <div className="flex-1 mr-6">
                <span className="px-3 py-1 bg-[#FFBD1B]/10 text-[#FFBD1B] rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#FFBD1B]/20 mb-3 inline-block">
                  Detalle del Activo
                </span>
                <h2 className="text-3xl font-black text-[#1A1B1E] tracking-tighter leading-tight">{selectedItem.title}</h2>
              </div>
              <button onClick={() => setSelectedItem(null)} className="w-12 h-12 flex items-center justify-center bg-[#F9F6F2] hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-[#F9F6F2]/30">
               {selectedItem.type === 'article' && (
                 <div className="space-y-8 max-w-2xl mx-auto">
                   {selectedItem.content.imageUrl && <img src={selectedItem.content.imageUrl} className="w-full h-80 object-cover rounded-[2rem] border border-[#EBE4DC]" />}
                   <div className="p-8 bg-white rounded-[2rem] border border-[#EBE4DC]">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FFBD1B] mb-4">Contenido</h4>
                      <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap">{typeof selectedItem.content === 'string' ? selectedItem.content : (selectedItem.content.article || selectedItem.content.summary || "")}</p>
                   </div>
                 </div>
               )}
               {selectedItem.type === 'social' && (
                 <div className="max-w-xl mx-auto p-10 bg-white rounded-[3rem] border border-[#EBE4DC] text-2xl font-bold leading-relaxed whitespace-pre-wrap">
                    {selectedItem.content}
                 </div>
               )}
               {selectedItem.type === 'image' && (
                 <div className="max-w-3xl mx-auto space-y-6">
                   <img src={selectedItem.content} className="w-full rounded-[2rem] border border-[#EBE4DC] shadow-xl" />
                   <p className="text-[10px] font-black text-[#8E8B88] uppercase tracking-widest text-center">Prompt: {selectedItem.title}</p>
                 </div>
               )}
            </div>

            <div className="p-8 bg-white border-t border-[#EBE4DC] flex justify-between items-center">
               <div className="flex gap-3">
                  <button onClick={() => handleCopy(selectedItem)} className="px-8 py-4 bg-[#1A1B1E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-[#FFBD1B] transition-all">Copiar</button>
                  <button onClick={() => handleDownload(selectedItem)} className="px-8 py-4 bg-white border border-[#EBE4DC] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-[#1A1B1E] transition-all">Descargar</button>
               </div>
               <div className="text-right">
                  <p className="text-[10px] text-[#8E8B88] font-black uppercase tracking-widest">Workspace</p>
                  <p className="text-sm font-bold text-[#1A1B1E]">Neuromarketing OS</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
