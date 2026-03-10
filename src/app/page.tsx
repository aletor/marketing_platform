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
  Plus,
  GitCommit,
  Calendar,
  Activity,
  BarChart,
  Clock,
  Heart,
  CheckCircle2
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
    dnaExtracted: true
  });

  useEffect(() => {
    async function fetchDashboardData() {
      // Fetch System State
      const [campRes, libRes] = await Promise.all([
        getCampaignsAction(),
        getLibraryItemsAction()
      ]);
      
      setStats({
        activeCampaigns: campRes.success ? campRes.campaigns?.filter(c => c.status === 'Active')?.length || 0 : 0,
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
      
      {/* MARKETING PIPELINE (VISUAL FLOW) */}
      <section className="mb-4 w-full overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max bg-white border border-[#EBE4DC] rounded-full p-2 shadow-sm">
          
          <Link href="/knowledge" className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-[#F9F6F2] transition-colors group">
            <div className="w-8 h-8 rounded-full bg-[#1A1B1E] text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Database size={14}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1B1E]">1. Conocimiento</span>
          </Link>

          <GitCommit size={16} className="text-[#EBE4DC] mx-2 shrink-0" />

          <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFBD1B]/10 border border-[#FFBD1B]/20 group">
            <div className="w-8 h-8 rounded-full bg-white text-[#FFBD1B] flex items-center justify-center shrink-0 shadow-sm"><Sparkles size={14}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1B1E]">2. Oportunidades</span>
          </div>

          <GitCommit size={16} className="text-[#EBE4DC] mx-2 shrink-0" />

          <Link href="/campaigns" className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-[#F9F6F2] transition-colors group">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 fill-blue-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-blue-100"><FolderOpen size={14} fill="currentColor"/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1B1E]">3. Campañas ({loadingTop ? '...' : stats.activeCampaigns})</span>
          </Link>

          <GitCommit size={16} className="text-[#EBE4DC] mx-2 shrink-0" />

          <Link href="/library" className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-[#F9F6F2] transition-colors group">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 fill-emerald-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-emerald-100"><Layers size={14} fill="currentColor"/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1B1E]">4. Contenido ({loadingTop ? '...' : stats.generatedItems})</span>
          </Link>

          <GitCommit size={16} className="text-[#EBE4DC] mx-2 shrink-0" />

          <Link href="/calendar" className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-[#F9F6F2] transition-colors group">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-purple-100"><Calendar size={14}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1B1E]">5. Calendario</span>
          </Link>

        </div>
      </section>

      {/* HEADER & TOP ACTIONS */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-[#EBE4DC] pb-8">
        <div>
          <h1 className="text-4xl font-black text-[#1A1B1E] tracking-tight mb-2">
            Dashboard <span className="text-[#FFBD1B]">Central</span>
          </h1>
          <p className="text-[#8E8B88] font-medium text-sm">
            Control estratégico del ecosistema de marketing y generación de oportunidades.
          </p>
        </div>
        
        <div className="flex items-center">
          <Link href="/campaigns/new" className="px-10 py-5 bg-[#1A1B1E] text-white hover:text-[#FFBD1B] rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 flex items-center gap-2">
            <Plus size={16} className="text-[#FFBD1B]" /> Crear Campaña
          </Link>
        </div>
      </section>

      {/* STRATEGIC DASHBOARD WIDGETS */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Widget 1: Progreso de Marketing */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#EBE4DC] shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><BarChart size={120} /></div>
            <div className="relative z-10 flex-1 flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] mb-8 flex items-center gap-2">
                <Activity size={14} className="text-[#1A1B1E]" /> Progreso del Marketing
              </h3>
              <div className="space-y-6 mt-auto">
                <div className="flex items-center justify-between group-hover:-translate-y-1 transition-transform cursor-default">
                  <span className="text-sm font-bold text-[#1A1B1E]">Campañas Activas</span>
                  <span className="text-2xl font-black text-[#1A1B1E]">{loadingTop ? '-' : stats.activeCampaigns}</span>
                </div>
                <div className="flex items-center justify-between group-hover:-translate-y-1 transition-transform delay-75 cursor-default">
                  <span className="text-sm font-bold text-[#1A1B1E]">Campañas Completadas</span>
                  <span className="text-2xl font-black text-[#1A1B1E]">5</span>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-[#F9F6F2] group-hover:-translate-y-1 transition-transform delay-150 cursor-default">
                  <span className="text-sm font-bold text-[#1A1B1E]">Publicaciones Programadas</span>
                  <span className="text-2xl font-black text-emerald-500">12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Salud de Contenido */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-[#EBE4DC] shadow-sm flex flex-col justify-between">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] mb-8 flex items-center gap-2">
                <Heart size={14} className="text-rose-500" /> Salud del Contenido
              </h3>
              <div className="space-y-6 mt-auto">
                 <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                       <span className="text-[#1A1B1E]">Educación (Brand)</span>
                       <span className="text-[#8E8B88]">45%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F9F6F2] rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{width: '45%'}}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                       <span className="text-[#1A1B1E]">Captación (Leads)</span>
                       <span className="text-[#8E8B88]">40%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F9F6F2] rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 delay-100" style={{width: '40%'}}></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                       <span className="text-[#1A1B1E]">Conversión (Ventas)</span>
                       <span className="text-rose-500">15%</span>
                    </div>
                    <div className="w-full h-2 bg-[#F9F6F2] rounded-full overflow-hidden">
                       <div className="h-full bg-[#FFBD1B] rounded-full transition-all duration-1000 delay-200" style={{width: '15%'}}></div>
                    </div>
                 </div>
              </div>
          </div>

          {/* Widget 3: Siguientes Acciones Recomendadas */}
          <div className="bg-[#1A1B1E] p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 p-6 opacity-10"><Zap size={100} /></div>
            <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#FFBD1B] mb-6 flex items-center gap-2">
                <Sparkles size={14} /> Recomendación IA
              </h3>
              <p className="text-sm font-medium leading-relaxed mb-6 text-neutral-300">
                La campaña <span className="text-white font-bold border-b border-neutral-600">"Smart Ticketing Education"</span> no tiene contenido de métricas de conversión.
              </p>
              <div className="p-4 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#FFBD1B] mb-3">Sugerencia de Producción:</p>
                <ul className="text-xs font-bold space-y-2.5">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> 1 Post en Social Media (ROI)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> 1 Caso de Uso Práctico</li>
                </ul>
              </div>
            </div>
            <Link href="/campaigns/new" className="w-full py-4 bg-white text-[#1A1B1E] rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-[#FFBD1B] transition-colors relative z-10 shadow-lg active:scale-95">
               Generar Contenido
            </Link>
          </div>

        </div>
      </section>

      {/* RECENT ACTIVITY FEED */}
      <section className="mb-12">
        <div className="bg-[#F9F6F2] py-4 px-6 md:px-8 rounded-[2rem] border border-[#EBE4DC] flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-inner">
           <div className="flex items-center gap-3 min-w-max">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <h3 className="text-[10px] font-black text-[#8E8B88] uppercase tracking-widest">Actividad Reciente</h3>
           </div>
           
           <div className="flex-1 flex w-full gap-8 overflow-x-auto no-scrollbar md:justify-end pr-4">
              <div className="shrink-0 flex items-center gap-2">
                 <Database size={12} className="text-[#8E8B88]" />
                 <span className="text-[10px] font-bold text-[#1A1B1E]">Documento analizado</span>
                 <span className="text-[9px] text-[#8E8B88] font-medium ml-1">Hace 2h</span>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                 <FileText size={12} className="text-[#8E8B88]" />
                 <span className="text-[10px] font-bold text-[#1A1B1E]">Artículo generado</span>
                 <span className="text-[9px] text-[#8E8B88] font-medium ml-1">Hace 5h</span>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                 <FolderOpen size={12} className="text-[#8E8B88]" />
                 <span className="text-[10px] font-bold text-[#1A1B1E]">Campaña creada (Smart Ticketing)</span>
                 <span className="text-[9px] text-[#8E8B88] font-medium ml-1">Ayer</span>
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
            className="p-3 bg-[#F9F6F2] hover:bg-[#1A1B1E] hover:text-[#FFBD1B] hover:border-[#1A1B1E] border border-[#EBE4DC] rounded-xl text-[#1A1B1E] transition-all"
            title="Sincronizar nuevas oportunidades"
          >
            <RefreshCw size={16} className={loadingRecs ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingRecs ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-28 bg-[#F9F6F2] rounded-3xl animate-pulse"></div>
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
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Oportunidad Estratégica</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Score de Impacto</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Esfuerzo Sugerido</th>
                  <th className="py-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88] text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec, i) => {
                  const score = 95 - (i * 3); // Mock score 95, 92, 89, 86
                  const effortType = i % 2 === 0 ? "Medio" : "Bajo";
                  const effortTime = effortType === "Medio" ? "⏱ 45 min est." : "⏱ 20 min est.";
                  const pieces = effortType === "Medio" ? "3 piezas de contenido" : "2 piezas de contenido";
                  const formats = rec.type === 'Article' ? ['Artículo SEO', 'Post Social', 'C. Uso'] : ['LinkedIn', 'Visual', 'Infografía'];
                  
                  return (
                  <tr key={i} className="border-b border-[#F9F6F2] last:border-0 hover:bg-[#F9F6F2]/50 transition-colors group">
                    <td className="py-8 pr-6 max-w-sm">
                      <p className="text-lg font-black text-[#1A1B1E] leading-tight group-hover:text-[#FFBD1B] transition-colors mb-4 line-clamp-2">{rec.title}</p>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A1B1E]/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#1A1B1E]">
                        {rec.type === 'Article' ? <FileText size={10} className="text-[#FFBD1B]"/> : <MessageSquare size={10} className="text-blue-500"/>} {rec.type === 'Article' ? 'Educación' : 'Captación'}
                      </span>
                    </td>
                    <td className="py-8 align-top pr-6">
                      <div className="flex flex-col gap-2 w-56">
                         <div className="flex items-center gap-2">
                            <span className="text-3xl font-black text-[#1A1B1E] leading-none">{score}</span>
                            <span className="text-[10px] font-black text-[#8E8B88] uppercase tracking-widest">Impacto</span>
                         </div>
                         <div className="w-full h-1.5 bg-[#EBE4DC] rounded-full overflow-hidden mb-1">
                            <div className={`h-full ${score >= 90 ? 'bg-[#FFBD1B]' : 'bg-emerald-500'}`} style={{ width: `${score}%` }}></div>
                         </div>
                         <div className="space-y-1.5 mt-2">
                            <p className="text-[8px] font-black text-[#8E8B88] uppercase tracking-widest mb-2">Por qué es alto:</p>
                            <p className="text-[10px] font-bold text-[#1A1B1E] flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0"/> {rec.type === 'Article' ? 'Problema detectado en audiencia' : 'Tendencia alta en tu sector'}</p>
                            <p className="text-[10px] font-bold text-[#1A1B1E] flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0"/> Alta relevancia con producto</p>
                            {score >= 90 && <p className="text-[10px] font-bold text-[#1A1B1E] flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0"/> Tema educativo clave</p>}
                         </div>
                      </div>
                    </td>
                    <td className="py-8 align-top pr-6">
                      <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-[#EBE4DC] shadow-sm">
                           <Clock size={14} className="text-[#FFBD1B]" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1B1E]">{effortTime}</span>
                        </div>
                        <div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-[#8E8B88] mb-2">{pieces}</p>
                           <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                              {formats.map((f, idx) => (
                                <span key={idx} className="px-2 py-1 bg-[#F9F6F2] border border-[#EBE4DC] rounded text-[9px] font-black uppercase tracking-widest text-[#8E8B88] whitespace-nowrap">{f}</span>
                              ))}
                           </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-8 text-right align-middle">
                      <Link 
                        href={`/campaigns/new?theme=${encodeURIComponent(rec.title)}`} 
                        className="inline-flex flex-col items-center gap-1.5 px-6 py-4 bg-[#1A1B1E] text-white hover:bg-[#FFBD1B] hover:text-[#1A1B1E] hover:shadow-[0_10px_20px_rgba(255,189,27,0.3)] rounded-3xl transition-all shadow-md group-hover:-translate-y-1"
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Crear Campaña <ArrowRight size={12} /></span>
                      </Link>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
