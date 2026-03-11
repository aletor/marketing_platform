"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Calendar as CalendarIcon, FileText, Image as ImageIcon, 
  MessageSquare, LayoutDashboard, Clock, Plus, Zap, Sparkles, Database
} from "lucide-react";
import { getCampaignDetailsAction } from "@/app/actions/campaign-details";
import { CampaignRecord } from "@/lib/campaigns-db";
import { GeneratedItem } from "@/lib/generated-db";

type TabType = 'overview' | 'contents' | 'visuals' | 'calendar';

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<CampaignRecord | null>(null);
  const [assets, setAssets] = useState<GeneratedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    async function fetchData() {
      const res = await getCampaignDetailsAction(id);
      if (res.success && res.campaign) {
        setCampaign(res.campaign);
        setAssets(res.assets || []);
      } else {
        // Handle error (e.g., redirect to dashboard)
        router.push('/campaigns');
      }
      setLoading(false);
    }
    if (id) fetchData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto py-12 px-6 lg:px-12 animate-pulse">
        <div className="h-40 bg-[#F9F6F2] rounded-[3rem] border border-[#EBE4DC] mb-12" />
        <div className="h-96 bg-[#F9F6F2] rounded-[3rem] border border-[#EBE4DC]" />
      </div>
    );
  }

  if (!campaign) return null;

  // Generate 7 days for the calendar view
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const getItemsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return assets.filter(item => {
      if (item.metadata?.scheduledFor === dateStr) return true;
      // MVP auto-distribution
      if (!item.metadata?.scheduledFor) {
        const charCode = item.id.charCodeAt(0);
        const dayOffset = charCode % 7;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        return targetDate.toISOString().split('T')[0] === dateStr;
      }
      return false;
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-6 lg:px-12 space-y-12 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="space-y-8">
        <Link href="/campaigns" className="inline-flex items-center gap-2 text-[#8E8B88] hover:text-[#1A1B1E] transition-colors font-black text-[10px] uppercase tracking-widest">
          <ArrowLeft size={14} /> Volver a Campañas
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-[#EBE4DC] pb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1B1E] text-white text-[10px] font-black uppercase tracking-[0.2em]">
              <Zap size={12} className="text-[#FFBD1B]" /> {campaign.status}
            </div>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-[#1A1B1E] max-w-4xl leading-tight">
              {campaign.theme}
            </h1>
            <div className="flex items-center gap-4 text-[#8E8B88] text-sm font-medium">
              <span className="flex items-center gap-2"><CalendarIcon size={14} /> Creada el {new Date(campaign.createdAt).toLocaleDateString('es-ES')}</span>
              <span>•</span>
              <span className="flex items-center gap-2"><LayoutDashboard size={14} /> {assets.length} Activos Generados</span>
            </div>
          </div>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div className="flex gap-4 border-b border-[#EBE4DC] overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-8 py-4 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-[#1A1B1E] text-[#1A1B1E]' : 'border-transparent text-[#8E8B88] hover:text-[#1A1B1E]'}`}
        >
          1️⃣ Resumen
        </button>
        <button 
          onClick={() => setActiveTab('contents')}
          className={`px-8 py-4 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'contents' ? 'border-[#FFBD1B] text-[#1A1B1E]' : 'border-transparent text-[#8E8B88] hover:text-[#1A1B1E]'}`}
        >
          2️⃣ Contenidos
        </button>
        <button 
          onClick={() => setActiveTab('visuals')}
          className={`px-8 py-4 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'visuals' ? 'border-emerald-500 text-[#1A1B1E]' : 'border-transparent text-[#8E8B88] hover:text-[#1A1B1E]'}`}
        >
          3️⃣ Visuales
        </button>
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`px-8 py-4 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'calendar' ? 'border-blue-500 text-[#1A1B1E]' : 'border-transparent text-[#8E8B88] hover:text-[#1A1B1E]'}`}
        >
          4️⃣ Calendario
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Left Column: Context & Metrics */}
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-[#EBE4DC] shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#FFBD1B]">Contexto Estratégico</h3>
              <p className="text-lg text-[#1A1B1E] font-medium leading-relaxed">
                Esta campaña fue orquestada automáticamente fusionando el tema <strong>"{campaign.theme}"</strong> con tu ADN Corporativo extraído de la Base de Conocimiento.
              </p>
              <div className="p-6 bg-[#F9F6F2] rounded-2xl border border-[#EBE4DC] mt-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] mb-4">Ecosistema Actual</h4>
                 <ul className="space-y-4">
                   <li className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#EBE4DC]"><span className="text-sm font-bold text-[#1A1B1E] flex items-center gap-2"><FileText size={16} className="text-amber-500"/> Artículos SEO</span> <span className="font-black text-lg">{assets.filter(a => a.type === 'article').length}</span></li>
                   <li className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#EBE4DC]"><span className="text-sm font-bold text-[#1A1B1E] flex items-center gap-2"><MessageSquare size={16} className="text-blue-500"/> Posts Sociales</span> <span className="font-black text-lg">{assets.filter(a => a.type === 'social').length}</span></li>
                 </ul>
              </div>
            </div>
            
            {/* Hidden Raw Prompts area previously here - moved to visuals completely */}
          </div>
          
          {/* Right Column: Structured Brief */}
          <div className="bg-white p-10 rounded-[3rem] border border-[#EBE4DC] shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                <LayoutDashboard size={18} className="text-emerald-500" />
              </div>
              <h3 className="text-2xl font-black text-[#1A1B1E] tracking-tight">Brief de Campaña</h3>
            </div>
            
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-[#F9F6F2] rounded-2xl border border-[#EBE4DC]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] block mb-2">Objetivo</span>
                  <p className="text-sm font-bold text-[#1A1B1E]">{campaign.briefing?.objective || 'Captación de Leads / Posicionamiento'}</p>
                </div>
                <div className="p-6 bg-[#F9F6F2] rounded-2xl border border-[#EBE4DC]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] block mb-2">Audiencia</span>
                  <p className="text-sm font-bold text-[#1A1B1E]">{campaign.briefing?.audience || 'Decision Makers & Directores de Marketing B2B'}</p>
                </div>
              </div>
              
              <div className="p-6 bg-[#F9F6F2] rounded-2xl border border-[#EBE4DC]">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 block mb-2">Problema Principal del Cliente</span>
                <p className="text-sm font-bold text-[#1A1B1E] leading-relaxed">{campaign.briefing?.problem || 'Fricción operativa entre equipos, procesos desconectados que derivan en pérdida de leads en la capa media del embudo y falta de claridad analítica.'}</p>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block mb-2">Mensaje Principal</span>
                <p className="text-sm font-bold text-[#1A1B1E] leading-relaxed">{campaign.briefing?.message || `Orquestar una solución nativa donde: "${campaign.theme}" se posiciona como el estándar para integrar y resolver esta fricción.`}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-[#F9F6F2] rounded-2xl border border-[#EBE4DC]">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] block mb-2">Ángulo</span>
                  <p className="text-sm font-bold text-[#1A1B1E] leading-relaxed">{campaign.briefing?.angle || 'Autoridad / Novedad / Solucionador'}</p>
                </div>
                <div className="p-6 bg-[#1A1B1E] rounded-2xl border border-black text-white shadow-md">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FFBD1B] block mb-2">CTA Final</span>
                  <p className="text-sm font-bold leading-relaxed">{campaign.briefing?.cta || 'Agendar Demo de Arquitectura / Iniciar Prueba Gratuita'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CONTENTS */}
      {activeTab === 'contents' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-12">
          
          {/* Action Header */}
          <div className="flex justify-between items-center pb-4 border-b border-[#EBE4DC]">
             <h3 className="text-xl font-black text-[#1A1B1E] tracking-tight">Piezas de Campaña</h3>
             <div className="flex gap-4">
                <Link href={`/article?campaignId=${id}`} className="px-4 py-2 border border-[#EBE4DC] text-[#1A1B1E] rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-[#1A1B1E] transition-all flex items-center gap-2">
                  <Plus size={12} /> Post Principal
                </Link>
                <Link href={`/social?campaignId=${id}`} className="px-4 py-2 border border-[#EBE4DC] text-[#1A1B1E] rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-[#1A1B1E] transition-all flex items-center gap-2">
                  <Plus size={12} /> Post Educativo
                </Link>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             {/* Left Area: Main Article (Nucleo) */}
             <div className="lg:col-span-8 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#1A1B1E]"></div> Núcleo de la Campaña</h4>
                
                {assets.filter(a => a.type === 'article' && !a.title.includes('Caso de Uso')).map(article => (
                  <div key={article.id} className="bg-white p-10 rounded-[4rem] border border-[#EBE4DC] relative overflow-hidden group hover:border-[#FFBD1B] hover:shadow-xl transition-all h-full min-h-[400px] flex flex-col">
                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity"><FileText size={100} className="text-[#FFBD1B]"/></div>
                     <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full font-black uppercase tracking-widest self-start mb-6">Post Principal</span>
                     <h2 className="text-3xl lg:text-4xl font-black text-[#1A1B1E] leading-tight mb-6 max-w-2xl">{article.title}</h2>
                     <p className="text-base text-[#8E8B88] font-medium leading-relaxed max-w-2xl line-clamp-4">{article.preview}</p>
                     <div className="mt-auto pt-8">
                       <Link href={`/editor/${article.id}`} className="inline-flex items-center justify-center px-8 py-4 bg-[#1A1B1E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors">
                         Abrir en el Editor de IA
                       </Link>
                     </div>
                  </div>
                ))}

                {assets.filter(a => a.type === 'article' && !a.title.includes('Caso de Uso')).length === 0 && (
                  <div className="bg-[#F9F6F2] p-10 rounded-[4rem] border border-[#EBE4DC] border-dashed flex items-center justify-center text-[#8E8B88] text-sm font-bold uppercase tracking-widest h-[400px]">
                    No se ha generado Post Principal
                  </div>
                )}
             </div>

             {/* Right Area: Derived Content (Social, Use Cases) */}
             <div className="lg:col-span-4 space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Contenido Derivado</h4>
                
                <div className="space-y-4">
                   {/* Social Posts */}
                   {assets.filter(a => a.type === 'social').map((post, i) => (
                      <div key={post.id} className="bg-white p-6 rounded-[2rem] border border-[#EBE4DC] group hover:border-[#1A1B1E] transition-all cursor-pointer relative overflow-hidden flex flex-col min-h-[150px]">
                         <div className="absolute top-4 right-4 text-blue-100 group-hover:text-blue-200 transition-colors"><MessageSquare size={24}/></div>
                         <h3 className="text-sm font-black text-[#1A1B1E] mb-2 pr-8">{post.title || `Post Educativo ${i+1}`}</h3>
                         <p className="text-xs text-[#8E8B88] font-medium line-clamp-2 leading-relaxed flex-1">{post.preview}</p>
                         <Link href={`/editor/${post.id}`} className="mt-4 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800">Refinar con IA →</Link>
                         <Link href={`/editor/${post.id}`} className="absolute inset-0" aria-label="Ver post" />
                      </div>
                   ))}

                   {/* Use Cases */}
                   {assets.filter(a => a.title.includes('Caso de Uso')).map(uc => (
                      <div key={uc.id} className="bg-[#1A1B1E] p-6 rounded-[2rem] text-white group cursor-pointer relative overflow-hidden shadow-lg min-h-[150px] flex flex-col">
                         <div className="absolute top-4 right-4 text-white/10 group-hover:text-white/20 transition-colors"><Database size={24}/></div>
                         <span className="text-[9px] bg-white/10 text-[#FFBD1B] border border-white/20 px-2 py-1 rounded inline-block font-black uppercase tracking-widest self-start mb-3">Caso de Éxito</span>
                         <h3 className="text-sm font-black leading-tight mb-2 pr-8">{uc.title.replace('Caso de Uso: ', '')}</h3>
                         <p className="text-xs text-neutral-400 font-medium line-clamp-2 leading-relaxed flex-1">{uc.preview}</p>
                         <Link href={`/editor/${uc.id}`} className="mt-4 text-[9px] font-black uppercase tracking-widest text-[#FFBD1B] hover:text-white">Refinar con IA →</Link>
                         <Link href={`/editor/${uc.id}`} className="absolute inset-0" aria-label="Ver caso de uso" />
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* TAB: VISUALS */}
      {activeTab === 'visuals' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
           <div className="p-10 bg-[#F9F6F2] rounded-[3rem] border border-[#EBE4DC]">
              <div className="mb-10 max-w-2xl">
                 <h2 className="text-3xl font-black text-[#1A1B1E] flex items-center gap-3 tracking-tight mb-4">
                   <ImageIcon className="text-emerald-500" size={32} /> Visual Assets Sugeridos
                 </h2>
                 <p className="text-[#8E8B88] text-lg font-medium leading-relaxed">
                   Estos prompts visuales (opcionales) han sido diseñados específicamente para acompañar al núcleo de esta campaña y a sus contenidos derivados, manteniendo el ADN corporativo. Usa Midjourney o DALL-E para generarlos.
                 </p>
              </div>

              {(!campaign.briefing?.imagePrompts || campaign.briefing.imagePrompts.length === 0) ? (
                 <div className="py-20 text-center text-[#8E8B88] font-bold">No hay sugerencias visuales generadas para esta campaña.</div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {campaign.briefing.imagePrompts.map((prompt:string, i:number) => (
                       <div key={i} className="bg-white p-8 rounded-[2rem] border border-[#EBE4DC] hover:border-emerald-300 transition-colors shadow-sm relative group overflow-hidden">
                          <span className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-sm font-black">
                             {i+1}
                          </span>
                          <p className="text-sm font-mono text-[#1A1B1E] leading-relaxed pt-2">
                             {prompt}
                          </p>
                          <div className="mt-6">
                             <button className="px-4 py-2 bg-[#F9F6F2] text-[#8E8B88] hover:text-[#1A1B1E] hover:bg-[#EBE4DC] rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2">
                                <FileText size={12} /> Copiar Prompt
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        </div>
      )}

      {/* TAB: CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="flex gap-6 flex-wrap pb-8 items-start animate-in slide-in-from-bottom-4 duration-500">
        {days.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = i === 0;
          const dayItems = getItemsForDate(date);
          
          return (
            <div key={dateStr} className={`flex-1 min-w-[300px] min-h-[500px] rounded-[3rem] border transition-all duration-300 ${isToday ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-[#F9F6F2] border-[#EBE4DC]'}`}>
              <div className={`p-6 border-b flex items-center justify-between rounded-t-[3rem] ${isToday ? 'bg-blue-100/50 border-blue-200' : 'bg-white border-[#EBE4DC]'}`}>
                <div className="space-y-1">
                   <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-blue-800' : 'text-[#8E8B88]'}`}>
                     {date.toLocaleDateString('es-ES', { weekday: 'long' })}
                   </p>
                   <p className={`text-2xl font-black tracking-tighter ${isToday ? 'text-blue-900' : 'text-[#1A1B1E]'}`}>
                     {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                   </p>
                </div>
              </div>

              <div className="p-4 flex flex-col gap-4">
                {dayItems.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-[#EBE4DC] border-2 border-dashed border-[#EBE4DC] rounded-3xl m-2 bg-white">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#8E8B88]">Sin posts de campaña</p>
                  </div>
                ) : (
                  dayItems.map(item => (
                    <div key={item.id} className="bg-white p-5 rounded-3xl border border-[#EBE4DC] hover:border-[#1A1B1E] transition-colors shadow-sm group">
                      <div className="flex justify-between items-start mb-3">
                         <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                           item.type === 'article' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                           item.type === 'social' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                           'bg-neutral-50 text-neutral-600 border-neutral-100'
                         }`}>
                           {item.type === 'article' && <FileText size={8}/>}
                           {item.type === 'social' && <MessageSquare size={8}/>}
                           {item.type.substring(0,3)}
                         </span>
                         <span className="text-[8px] font-black text-[#8E8B88] uppercase tracking-widest bg-[#F9F6F2] px-2 py-1 rounded border border-[#EBE4DC]">
                           10:00 AM
                         </span>
                      </div>
                      <h4 className="text-sm font-black text-[#1A1B1E] leading-tight line-clamp-2 mb-2 group-hover:text-amber-500 transition-colors">{item.title}</h4>
                    </div>
                  ))
                )}
                
                <button className="mt-2 mx-2 p-4 border-2 border-dashed border-[#EBE4DC] rounded-3xl text-[#8E8B88] hover:text-[#1A1B1E] hover:border-[#1A1B1E] hover:bg-white transition-all flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest">
                  <Plus size={14} /> Asignar Contenido
                </button>
              </div>
            </div>
          )
        })}
      </div>
      )}

    </div>
  );
}
