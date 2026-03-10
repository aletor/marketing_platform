"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Image as ImageIcon, 
  MessageSquare, 
  ArrowRight,
  Sparkles,
  Zap,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Database
} from "lucide-react";
import { getQuickRecommendationsAction } from "@/app/actions/marketing";
import "./page.css";

export default function Dashboard() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0); // 0 or 1 (blocks of 3)
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const fetchRecs = async (query?: string) => {
    setLoading(true);
    try {
      const data = await getQuickRecommendationsAction(query, 6);
      setRecommendations(data);
      setCurrentPage(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    fetchRecs(searchQuery);
  };

  const visibleRecommendations = recommendations.slice(currentPage * 3, (currentPage * 3) + 3);

  return (
    <div className="dashboard-container animate-in fade-in duration-1000">
      
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-[#EBE4DC] pb-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black text-[#1A1B1E] tracking-tight mb-2">
            Dashboard <span className="text-[#FFBD1B]">Estratégico</span>
          </h1>
          <p className="text-[#8E8B88] font-medium text-sm max-w-xl">
            Centro de mando de tu NeuralMarketing OS. Supervisa el ADN corporativo y lanza campañas automáticas basadas en oportunidades reales.
          </p>
        </div>
        <Link href="/campaigns" className="bg-[#1A1B1E] text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-3">
          <Zap size={16} fill="currentColor" /> Crear Nueva Campaña
        </Link>
      </section>

      {/* Top Metrics / Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-[#F9F6F2] p-8 rounded-[3rem] border border-[#EBE4DC] shadow-sm flex items-center gap-6 group hover:border-[#FFBD1B] transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFBD1B]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="w-16 h-16 bg-white rounded-2xl border border-[#EBE4DC] flex items-center justify-center text-[#FFBD1B] shadow-sm shrink-0 z-10">
            <Database size={28} />
          </div>
          <div className="z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] mb-1">Estado del Cerebro</h3>
            <p className="text-2xl font-black text-[#1A1B1E] leading-none mb-2">ADN Activo</p>
            <Link href="/knowledge" className="text-[10px] font-black text-[#1A1B1E] uppercase tracking-widest flex items-center gap-1 hover:text-[#FFBD1B] transition-colors">
              Gestionar Conocimiento <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div className="bg-[#F9F6F2] p-8 rounded-[3rem] border border-[#EBE4DC] shadow-sm flex items-center gap-6 group hover:border-[#FFBD1B] transition-colors relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="w-16 h-16 bg-white rounded-2xl border border-[#EBE4DC] flex items-center justify-center text-emerald-500 shadow-sm shrink-0 z-10">
            <TrendingUp size={28} />
          </div>
          <div className="z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] mb-1">Oportunidades</h3>
            <p className="text-2xl font-black text-[#1A1B1E] leading-none mb-2">{recommendations.length} Detectadas</p>
            <button onClick={() => fetchRecs()} className="text-[10px] font-black text-[#1A1B1E] uppercase tracking-widest flex items-center gap-1 hover:text-emerald-500 transition-colors">
              Escanear de Nuevo <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="bg-[#F9F6F2] p-8 rounded-[3rem] border border-[#EBE4DC] shadow-sm flex items-center gap-6 group hover:border-[#FFBD1B] transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="w-16 h-16 bg-white rounded-2xl border border-[#EBE4DC] flex items-center justify-center text-blue-500 shadow-sm shrink-0 z-10">
            <MessageSquare size={28} />
          </div>
          <div className="z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] mb-1">Impacto Estimado</h3>
            <p className="text-2xl font-black text-[#1A1B1E] leading-none mb-2">Alto Rendimiento</p>
            <Link href="/calendar" className="text-[10px] font-black text-[#1A1B1E] uppercase tracking-widest flex items-center gap-1 hover:text-blue-500 transition-colors">
              Ver Calendario <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        
        {/* Left Col: Guided Search */}
        <section className="lg:col-span-4 bg-white p-10 rounded-[4rem] border border-[#EBE4DC] shadow-sm flex flex-col justify-center gap-6 h-full relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#FFBD1B]/5 rounded-tl-full blur-2xl"></div>
          <div className="space-y-3 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1B1E]/5 text-[9px] font-black text-[#1A1B1E] uppercase tracking-widest border border-[#EBE4DC]">
              <Sparkles size={10} className="text-[#FFBD1B]"/> <span>Asistente Estratégico</span>
            </div>
            <h3 className="text-2xl font-black text-[#1A1B1E] leading-none tracking-tight">
              ¿Qué problema resolvemos hoy?
            </h3>
            <p className="text-xs font-medium text-[#8E8B88] leading-relaxed">Describe un problema recurrente de tus clientes, o un producto específico que quieras potenciar. La IA propondrá campañas.</p>
          </div>
          <form onSubmit={handleSearch} className="relative z-10 mt-2">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: Retrasos en la cadena de suministro..."
              className="w-full pl-12 pr-16 py-5 bg-[#F9F6F2] border border-[#EBE4DC] rounded-3xl text-sm font-bold focus:ring-2 focus:ring-[#FFBD1B] focus:bg-white outline-none transition-all placeholder:text-[#8E8B88]/50"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8E8B88]" size={18} />
            <button 
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-[#1A1B1E] text-white rounded-2xl hover:bg-black transition-all disabled:opacity-50 hover:scale-105 active:scale-95 shadow-md"
            >
              {searching ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            </button>
          </form>
        </section>

        {/* Right Col: Quick Generators */}
        <section className="lg:col-span-8 flex flex-col justify-center h-full">
          <div className="flex items-center justify-between mb-6 px-2">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Herramientas Tácticas Directas</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-full">
            <Link href="/article" className="bg-[#F9F6F2] p-8 rounded-[3rem] border border-[#EBE4DC] hover:border-[#1A1B1E] hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-white rounded-2xl border border-[#EBE4DC] flex items-center justify-center text-[#1A1B1E] shadow-sm mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
                <h3 className="text-lg font-black text-[#1A1B1E] mb-2 leading-tight">Redactor de<br/> Artículos</h3>
                <p className="text-[10px] font-bold text-[#8E8B88] leading-relaxed">Piezas largas en un solo clic.</p>
              </div>
              <div className="mt-8 text-[9px] font-black uppercase tracking-widest text-[#1A1B1E] flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                Abrir <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform"/>
              </div>
            </Link>

            <Link href="/social" className="bg-[#F9F6F2] p-8 rounded-[3rem] border border-[#EBE4DC] hover:border-[#1A1B1E] hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-white rounded-2xl border border-[#EBE4DC] flex items-center justify-center text-[#1A1B1E] shadow-sm mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-lg font-black text-[#1A1B1E] mb-2 leading-tight">Creador de<br/> Posts</h3>
                <p className="text-[10px] font-bold text-[#8E8B88] leading-relaxed">Multiplataforma y adaptado.</p>
              </div>
              <div className="mt-8 text-[9px] font-black uppercase tracking-widest text-[#1A1B1E] flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                Abrir <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform"/>
              </div>
            </Link>

            <Link href="/image" className="bg-[#F9F6F2] p-8 rounded-[3rem] border border-[#EBE4DC] hover:border-[#1A1B1E] hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-white rounded-2xl border border-[#EBE4DC] flex items-center justify-center text-[#1A1B1E] shadow-sm mb-6 group-hover:scale-110 transition-transform">
                  <ImageIcon size={20} />
                </div>
                <h3 className="text-lg font-black text-[#1A1B1E] mb-2 leading-tight">Estudio<br/> Visual</h3>
                <p className="text-[10px] font-bold text-[#8E8B88] leading-relaxed">Midjourney assets a medida.</p>
              </div>
              <div className="mt-8 text-[9px] font-black uppercase tracking-widest text-[#1A1B1E] flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                Abrir <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform"/>
              </div>
            </Link>
          </div>
        </section>
      </div>

      <section className="bg-white p-12 rounded-[4rem] border border-[#EBE4DC] shadow-sm my-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-[#1A1B1E] tracking-tighter mb-2 flex items-center gap-3">
               Oportunidades Estratégicas
               <span className="px-3 py-1 bg-[#1A1B1E] text-white rounded-full text-[9px] uppercase tracking-widest align-middle">Live</span>
            </h2>
            <p className="text-xs font-bold text-[#8E8B88] uppercase tracking-widest">Generadas en tiempo real por el ADN corporativo</p>
          </div>
          <div className="flex items-center gap-4">
            {recommendations.length > 0 && (
              <div className="flex items-center bg-[#F9F6F2] rounded-full p-1.5 border border-[#EBE4DC] shadow-sm">
                <button 
                  onClick={() => setCurrentPage(0)}
                  className={`px-6 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all ${currentPage === 0 ? 'bg-white text-[#1A1B1E] shadow-sm' : 'text-[#8E8B88] hover:text-[#1A1B1E]'}`}
                >
                  Pág 1
                </button>
                <button 
                  onClick={() => setCurrentPage(1)}
                  className={`px-6 py-2 rounded-[1rem] text-[9px] font-black uppercase tracking-widest transition-all ${currentPage === 1 ? 'bg-white text-[#1A1B1E] shadow-sm' : 'text-[#8E8B88] hover:text-[#1A1B1E]'}`}
                >
                  Pág 2
                </button>
              </div>
            )}
            <button 
              onClick={() => fetchRecs()}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#F9F6F2] hover:bg-neutral-100 border border-[#EBE4DC] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1A1B1E] transition-all active:scale-95 group"
            >
              <RefreshCw size={14} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-50">
            {[1,2,3].map(i => (
              <div key={i} className="h-56 animate-pulse bg-[#F9F6F2] border border-[#EBE4DC] rounded-[3rem]"></div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="p-16 border border-dashed border-[#EBE4DC] rounded-[3rem] text-center text-[#8E8B88] bg-[#F9F6F2]">
            <div className="w-20 h-20 bg-white border border-[#EBE4DC] rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#1A1B1E] opacity-50">
               <Database size={32} />
            </div>
            <p className="font-black text-2xl mb-4 text-[#1A1B1E] tracking-tight">Cerebro corporativo inactivo</p>
            <p className="text-sm font-medium">Extrae el ADN de tus documentos corporativos para recibir oportunidades y recomendaciones de marketing hiper-segmentadas.</p>
            <Link href="/knowledge" className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-[#1A1B1E] text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
              <Zap size={16} fill="currentColor"/> Alimentar Cerebro
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {visibleRecommendations.map(rec => (
              <div key={rec.id} className="bg-[#F9F6F2] p-8 rounded-[3rem] border border-[#EBE4DC] hover:border-[#FFBD1B] hover:shadow-2xl transition-all duration-500 group relative flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6 gap-4">
                     <span className="bg-white border border-[#EBE4DC] px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-[#1A1B1E] flex items-center gap-2">
                       {rec.type === 'Article' ? <FileText size={10} className="text-[#FFBD1B]"/> : <MessageSquare size={10} className="text-[#FFBD1B]"/>} {rec.type}
                     </span>
                     <span className="flex items-center gap-1 text-[10px] font-black text-[#FFBD1B] bg-[#FFBD1B]/10 px-3 py-1.5 rounded-full">
                       <Zap size={10} fill="currentColor" /> {rec.match}
                     </span>
                  </div>
                  <h4 className="text-xl font-black leading-tight text-[#1A1B1E] group-hover:text-[#FFBD1B] transition-colors line-clamp-3">{rec.title}</h4>
                </div>
                
                <div className="mt-8 flex gap-3">
                   {/* Create Campaign from Recommendation - New Feature to implement */}
                   <Link href={`/campaigns?idea=${encodeURIComponent(rec.title)}`} className="flex-1 text-center py-3 bg-[#1A1B1E] text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95">
                     Crear Campaña
                   </Link>
                   <Link href={rec.type === 'Article' ? `/article?topic=${encodeURIComponent(rec.title)}` : `/social?topic=${encodeURIComponent(rec.title)}`} className="px-4 py-3 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-[#1A1B1E] transition-all active:scale-95 flex items-center justify-center">
                     <ArrowRight size={14} />
                   </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
