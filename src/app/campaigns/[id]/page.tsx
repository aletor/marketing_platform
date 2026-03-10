"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Calendar as CalendarIcon, FileText, Image as ImageIcon, 
  MessageSquare, LayoutDashboard, Clock, Plus, Zap
} from "lucide-react";
import { getCampaignDetailsAction } from "@/app/actions/campaign-details";
import { CampaignRecord } from "@/lib/campaigns-db";
import { GeneratedItem } from "@/lib/generated-db";

type TabType = 'overview' | 'assets' | 'calendar';

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
          1️⃣ Estrategia
        </button>
        <button 
          onClick={() => setActiveTab('assets')}
          className={`px-8 py-4 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'assets' ? 'border-[#FFBD1B] text-[#1A1B1E]' : 'border-transparent text-[#8E8B88] hover:text-[#1A1B1E]'}`}
        >
          2️⃣ Contenido
        </button>
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`px-8 py-4 font-black text-[10px] uppercase tracking-widest transition-all border-b-2 whitespace-nowrap ${activeTab === 'calendar' ? 'border-blue-500 text-[#1A1B1E]' : 'border-transparent text-[#8E8B88] hover:text-[#1A1B1E]'}`}
        >
          3️⃣ Calendario
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white p-10 rounded-[3rem] border border-[#EBE4DC] shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#FFBD1B]">Contexto Ocupado</h3>
            <p className="text-lg text-[#1A1B1E] font-medium leading-relaxed">
              Esta campaña fue orquestada automáticamente fusionando el tema <strong>"{campaign.theme}"</strong> con tu ADN Corporativo extraído de la Base de Conocimiento.
            </p>
            <div className="p-6 bg-[#F9F6F2] rounded-2xl border border-[#EBE4DC] mt-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] mb-4">Métricas del Ecosistema</h4>
               <ul className="space-y-4">
                 <li className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#EBE4DC]"><span className="text-sm font-bold text-[#1A1B1E] flex items-center gap-2"><FileText size={16} className="text-amber-500"/> Artículos SEO</span> <span className="font-black text-lg">{assets.filter(a => a.type === 'article').length}</span></li>
                 <li className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#EBE4DC]"><span className="text-sm font-bold text-[#1A1B1E] flex items-center gap-2"><MessageSquare size={16} className="text-blue-500"/> Posts Sociales</span> <span className="font-black text-lg">{assets.filter(a => a.type === 'social').length}</span></li>
               </ul>
            </div>
          </div>
          
          {campaign.briefing && (
            <div className="bg-[#1A1B1E] p-10 rounded-[3rem] shadow-xl text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                 <Zap size={200} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#FFBD1B] mb-8 relative z-10">Prompt de Orquestación Visual</h3>
              {campaign.briefing.imagePrompts && campaign.briefing.imagePrompts.map((prompt: string, i: number) => (
                <div key={i} className="mb-6 relative z-10">
                  <span className="inline-block px-3 py-1 bg-white/10 text-white rounded text-[10px] font-black uppercase tracking-widest mb-2 border border-white/20">Prompt {i+1}</span>
                  <p className="text-sm font-mono text-neutral-300 bg-black/30 p-4 rounded-xl leading-relaxed border border-white/10">{prompt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ASSETS */}
      {activeTab === 'assets' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
          
          {/* Quick Generators for this Campaign */}
          <div className="flex flex-wrap gap-4 p-6 bg-[#F9F6F2] border border-[#EBE4DC] rounded-[2rem]">
            <div className="w-full mb-2">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Añadir Nuevo Contenido a la Campaña</h4>
            </div>
            <Link href={`/article?campaignId=${id}`} className="px-6 py-3 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-[#1A1B1E] transition-all flex items-center gap-2 shadow-sm">
              <FileText size={14} className="text-[#FFBD1B]" /> Crear Artículo
            </Link>
            <Link href={`/social?campaignId=${id}`} className="px-6 py-3 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-[#1A1B1E] transition-all flex items-center gap-2 shadow-sm">
              <MessageSquare size={14} className="text-blue-500" /> Crear Post
            </Link>
            <Link href={`/image?campaignId=${id}`} className="px-6 py-3 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-xl font-black text-[9px] uppercase tracking-widest hover:border-[#1A1B1E] transition-all flex items-center gap-2 shadow-sm">
              <ImageIcon size={14} className="text-emerald-500" /> Crear Imagen
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {assets.length === 0 ? (
             <div className="col-span-full py-20 text-center text-[#8E8B88] font-bold">No hay activos generados para esta campaña.</div>
           ) : (
             assets.map(item => (
              <div key={item.id} className="bg-white rounded-[2.5rem] p-6 border border-[#EBE4DC] hover:border-[#1A1B1E] transition-all group flex flex-col min-h-[300px]">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                    item.type === 'article' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    item.type === 'social' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-neutral-50 text-neutral-600 border-neutral-100'
                  }`}>
                    {item.type === 'article' && <FileText size={12}/>}
                    {item.type === 'social' && <MessageSquare size={12}/>}
                    {item.type.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold text-[#8E8B88]">{new Date(item.date).toLocaleDateString()}</span>
                </div>
                
                <h3 className="text-xl font-black text-[#1A1B1E] leading-tight mb-3 line-clamp-3">{item.title}</h3>
                <p className="text-sm text-[#8E8B88] line-clamp-2 mb-6 font-medium">{item.preview}</p>
                
                <div className="mt-auto pt-6 border-t border-[#F9F6F2]">
                  {/* Link al Library Modal global enviando el ID para abrirlo directo (MVP) */}
                  <Link href={`/library?open=${item.id}`} className="block w-full text-center py-3 bg-[#F9F6F2] hover:bg-[#1A1B1E] hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-[#EBE4DC]">
                    Ver Detalle
                  </Link>
                </div>
              </div>
             ))
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
