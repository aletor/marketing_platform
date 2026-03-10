"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  MessageSquare, 
  ArrowRight,
  Sparkles,
  Zap,
  RefreshCw,
  Database,
  Layers,
  FolderOpen,
  Plus
} from "lucide-react";
import { getQuickRecommendationsAction } from "@/app/actions/marketing";
import { getCampaignsAction } from "@/app/actions/campaigns-db";
import { getLibraryItemsAction } from "@/app/actions/library";

export default function Dashboard() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);
  
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    generatedItems: 0,
    dnaExtracted: true // Mock for now, would check knowledge-db
  });

  useEffect(() => {
    async function fetchDashboardData() {
      // Fetch System State
      const [campRes, libRes] = await Promise.all([
        getCampaignsAction(),
        getLibraryItemsAction()
      ]);
      
      setStats({
        activeCampaigns: campRes.success ? campRes.campaigns?.length || 0 : 0,
        generatedItems: libRes.success ? libRes.items?.length || 0 : 0,
        dnaExtracted: true
      });
      setLoadingTop(false);

      // Fetch Opportunities
      fetchRecs();
    }
    fetchDashboardData();
  }, []);

  const fetchRecs = async () => {
    setLoadingRecs(true);
    try {
      const data = await getQuickRecommendationsAction(undefined, 4); // Fetch 4 recs
      setRecommendations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-6 lg:px-12 space-y-12 animate-in fade-in duration-1000">
      
      {/* HEADER & TOP ACTIONS */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-[#EBE4DC] pb-8">
        <div>
          <h1 className="text-4xl font-black text-[#1A1B1E] tracking-tight mb-2">
            Dashboard <span className="text-[#FFBD1B]">Central</span>
          </h1>
          <p className="text-[#8E8B88] font-medium text-sm">
            Supervisa el estado del sistema y lanza nuevas campañas de marketing automáticas.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/knowledge" className="px-6 py-4 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-[#1A1B1E] transition-all flex items-center gap-2 shadow-sm">
            <Database size={14} /> Añadir Conocimiento
          </Link>
          <Link href="/library" className="px-6 py-4 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-[#1A1B1E] transition-all flex items-center gap-2 shadow-sm">
            <Layers size={14} /> Generar Contenido Rápido
          </Link>
          <Link href="/campaigns/new" className="px-8 py-4 bg-[#1A1B1E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-2">
            <Plus size={16} /> Crear Campaña
          </Link>
        </div>
      </section>

      {/* SYSTEM STATE ROW */}
      <section className="mb-12">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] mb-6">Estado del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-[#F9F6F2] p-8 rounded-[2.5rem] border border-[#EBE4DC] flex items-center gap-6">
            <div className="w-14 h-14 bg-white rounded-2xl border border-[#EBE4DC] flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
              <Database size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-[#1A1B1E] leading-none mb-1">ADN Extraído</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8B88]">Empresa, Audiencia, Producto</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-[#EBE4DC] flex items-center gap-6">
            <div className="w-14 h-14 bg-[#F9F6F2] rounded-2xl border border-[#EBE4DC] flex items-center justify-center text-[#1A1B1E] shrink-0">
              <FolderOpen size={24} />
            </div>
            <div>
              {loadingTop ? <div className="h-8 w-16 bg-[#EBE4DC] rounded animate-pulse mb-1"></div> : (
                <p className="text-4xl font-black text-[#1A1B1E] leading-none mb-1">{stats.activeCampaigns}</p>
              )}
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8B88]">Campañas Activas</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-[#EBE4DC] flex items-center gap-6">
            <div className="w-14 h-14 bg-[#F9F6F2] rounded-2xl border border-[#EBE4DC] flex items-center justify-center text-[#1A1B1E] shrink-0">
              <Layers size={24} />
            </div>
            <div>
              {loadingTop ? <div className="h-8 w-16 bg-[#EBE4DC] rounded animate-pulse mb-1"></div> : (
                <p className="text-4xl font-black text-[#1A1B1E] leading-none mb-1">{stats.generatedItems}</p>
              )}
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E8B88]">Contenidos Generados</p>
            </div>
          </div>

        </div>
      </section>

      {/* OPPORTUNITIES LIST */}
      <section className="bg-white p-10 rounded-[3rem] border border-[#EBE4DC] shadow-sm">
        <div className="flex justify-between items-center mb-10 border-b border-[#F9F6F2] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFBD1B]/10 rounded-xl flex items-center justify-center">
              <Sparkles size={18} className="text-[#FFBD1B]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1A1B1E] tracking-tight">Oportunidades de Marketing</h2>
              <p className="text-[10px] font-bold text-[#8E8B88] uppercase tracking-widest">Basadas en tu ADN Corporativo</p>
            </div>
          </div>
          <button 
            onClick={() => fetchRecs()}
            disabled={loadingRecs}
            className="p-3 bg-[#F9F6F2] hover:bg-neutral-100 rounded-xl text-[#8E8B88] hover:text-[#1A1B1E] transition-colors"
            title="Sincronizar nuevas oportunidades"
          >
            <RefreshCw size={16} className={loadingRecs ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingRecs ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-20 bg-[#F9F6F2] rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
           <div className="py-20 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-[#F9F6F2] rounded-full flex items-center justify-center mb-6">
               <Database size={30} className="text-[#8E8B88]" />
             </div>
             <p className="text-xl font-black text-[#1A1B1E] mb-2">Esperando Información</p>
             <p className="text-[#8E8B88] mb-6 max-w-sm">Añade conocimiento a tu Cerebro Corporativo para recibir estrategias automáticas.</p>
             <Link href="/knowledge" className="px-6 py-3 bg-[#1A1B1E] text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
               Alimentar Cerebro
             </Link>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F9F6F2]">
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Tema</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Tipo</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Impacto Estimado</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88] text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec, i) => (
                  <tr key={i} className="border-b border-[#F9F6F2] last:border-0 hover:bg-[#F9F6F2]/50 transition-colors group">
                    <td className="py-6 pr-4">
                      <p className="text-lg font-black text-[#1A1B1E] group-hover:text-[#FFBD1B] transition-colors">{rec.title}</p>
                    </td>
                    <td className="py-6 align-middle">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A1B1E]/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#1A1B1E]">
                        {rec.type === 'Article' ? <FileText size={10} className="text-[#FFBD1B]"/> : <MessageSquare size={10} className="text-blue-500"/>} {rec.type === 'Article' ? 'Educación' : 'Captación'}
                      </span>
                    </td>
                    <td className="py-6 align-middle">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#FFBD1B]">
                        <Zap size={10} fill="currentColor" /> {rec.match || 'Alto'}
                      </span>
                    </td>
                    <td className="py-6 text-right align-middle">
                      <Link 
                        href={`/campaigns/new?theme=${encodeURIComponent(rec.title)}`} 
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-[#EBE4DC] text-[#1A1B1E] hover:border-[#1A1B1E] hover:bg-[#1A1B1E] hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Crear Campaña <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
