"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, LayoutDashboard, Database, RefreshCw, FileText, MessageSquare, ImageIcon, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { generateCampaignAction } from "@/app/actions/campaigns";

export default function CampaignsPage() {
  const searchParams = useSearchParams();
  const idea = searchParams.get('idea') || "";
  
  const [theme, setTheme] = useState(idea);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!theme) return;
    setGenerating(true);
    setError("");
    setResult(null);
    try {
      const data = await generateCampaignAction(theme);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Error al orquestar la campaña");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (idea && !result && !generating) {
      setTheme(idea);
    }
  }, [idea]);

  return (
    <div className="max-w-[1200px] mx-auto py-12 px-6 lg:px-12 space-y-12 animate-in fade-in duration-1000">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-neutral-200 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1B1E]/5 border border-[#EBE4DC] text-[#1A1B1E] text-[10px] font-black uppercase tracking-[0.2em]">
            <Zap size={12} className="text-[#FFBD1B]" /> Orquestador
          </div>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-[#1A1B1E]">
            Campañas <span className="text-neutral-400">Marketing</span>
          </h1>
          <p className="text-[#8E8B88] text-xl font-medium max-w-xl leading-relaxed">
            Convierte un tema en un ecosistema completo de contenidos: Artículo, Redes Sociales y Casos de Uso integrados.
          </p>
        </div>
      </header>

      <section className="bg-white p-10 rounded-[4rem] border border-[#EBE4DC] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFBD1B]/5 rounded-bl-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-3xl relative z-10">
          <label className="block text-sm font-black text-[#1A1B1E] uppercase tracking-widest mb-4">¿De qué va esta campaña?</label>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              value={theme}
              onChange={e => setTheme(e.target.value)}
              placeholder="Ej: Smart ticketing en eventos deportivos masivos..."
              className="flex-1 bg-[#F9F6F2] border border-[#EBE4DC] rounded-3xl px-8 py-5 text-lg font-bold focus:ring-2 focus:ring-[#FFBD1B] focus:bg-white transition-all outline-none"
              disabled={generating}
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !theme}
              className={`px-10 py-5 rounded-3xl font-black text-[12px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
                generating 
                  ? "bg-neutral-100 text-neutral-400 shadow-none cursor-not-allowed" 
                  : "bg-[#1A1B1E] hover:bg-black text-white hover:scale-105 active:scale-95"
              }`}
            >
              {generating ? (
                <><RefreshCw className="animate-spin" size={18} /> Orquestando Universo...</>
              ) : (
                <><Zap size={18} fill="currentColor" /> Lanzar Campaña</>
              )}
            </button>
          </div>
          {error && <p className="text-rose-500 text-sm font-bold mt-4">{error}</p>}
        </div>
      </section>

      {generating && (
        <section className="bg-[#F9F6F2] p-12 rounded-[4rem] border border-[#EBE4DC] text-center space-y-6 animate-pulse">
           <Zap size={48} className="mx-auto text-[#FFBD1B] animate-bounce" />
           <h3 className="text-2xl font-black text-[#1A1B1E]">Cruzando datos con tu ADN Corporativo...</h3>
           <p className="text-[#8E8B88] font-medium max-w-lg mx-auto">Nuestros agentes IA están sincronizando la propuesta de valor de tu negocio para generar artículos y posts perfectamente alienados. Esto puede tomar hasta un minuto.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto opacity-50">
             {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-3xl border border-[#EBE4DC]"></div>)}
           </div>
        </section>
      )}

      {result && !generating && (
        <section className="animate-in slide-in-from-bottom-8 duration-700 space-y-12">
          
          <div className="flex items-center gap-4 bg-emerald-50 text-emerald-600 p-6 rounded-3xl border border-emerald-100">
             <CheckCircle className="shrink-0" />
             <div>
               <h4 className="font-black uppercase tracking-widest text-[10px]">Campaña Orquestada con Éxito</h4>
               <p className="font-medium text-sm">Todos los activos han sido guardados automáticamente en tu biblioteca.</p>
             </div>
             <Link href="/library" className="ml-auto px-6 py-2 bg-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1A1B1E] border border-emerald-200 hover:border-[#1A1B1E] transition-all">
               Ir a Biblioteca
             </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Activos Generados */}
            <div className="lg:col-span-8 space-y-8">
               <div className="bg-white p-10 rounded-[4rem] border border-[#EBE4DC] shadow-sm relative overflow-hidden group hover:border-[#FFBD1B] transition-colors">
                  <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 transition-opacity"><FileText size={64} className="text-[#FFBD1B]"/></div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88] mb-4">Post Principal (Blog/Newsletter)</h3>
                  <h4 className="text-2xl font-black text-[#1A1B1E] leading-tight max-w-md">{result.article.title}</h4>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {result.article.seoKeywords?.map((k:string, i:number) => (
                      <span key={i} className="text-[9px] font-black uppercase tracking-widest bg-[#F9F6F2] border border-[#EBE4DC] px-3 py-1 rounded-lg text-[#8E8B88]">{k}</span>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {result.socialPosts?.map((post:any, i:number) => (
                    <div key={i} className="bg-white p-8 rounded-[3rem] border border-[#EBE4DC] shadow-sm hover:border-[#1A1B1E] transition-all flex flex-col justify-between">
                      <div>
                        <MessageSquare size={24} className="text-blue-500 mb-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-lg mb-4 inline-block">{post.objective}</span>
                        <p className="text-xs font-medium text-[#1A1B1E] line-clamp-4 leading-relaxed">{post.content}</p>
                      </div>
                    </div>
                 ))}
               </div>

               <div className="bg-[#1A1B1E] p-10 rounded-[4rem] shadow-xl text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10"><Database size={64} /></div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">Caso de Uso (Nutrición)</h3>
                  <h4 className="text-xl font-black leading-tight max-w-md mb-4">{result.useCase?.title}</h4>
                  <p className="text-xs font-medium text-neutral-300 line-clamp-2 leading-relaxed max-w-lg">{result.useCase?.content}</p>
               </div>
            </div>

            {/* Asset Recomendado */}
            <div className="lg:col-span-4 max-w-full">
              <div className="bg-[#F9F6F2] p-8 rounded-[3rem] border border-[#EBE4DC] shadow-sm h-full">
                 <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1B1E] mb-6 flex items-center gap-2">
                   <ImageIcon size={16} /> Asset Visual Suggestions
                 </h3>
                 <div className="space-y-4">
                   {result.imagePrompts?.map((prompt:string, i:number) => (
                     <div key={i} className="bg-white p-4 rounded-3xl border border-[#EBE4DC] text-xs font-medium text-[#8E8B88] leading-relaxed relative group cursor-pointer hover:border-[#FFBD1B]">
                       <span className="absolute -top-2 -left-2 w-6 h-6 bg-[#1A1B1E] text-white rounded-full flex items-center justify-center text-[10px] font-black">{i+1}</span>
                       <p className="pt-2">{prompt}</p>
                     </div>
                   ))}
                 </div>

                 <Link href="/image" className="mt-8 flex w-full items-center justify-center gap-2 px-6 py-4 bg-white border border-[#EBE4DC] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1A1B1E] hover:border-[#FFBD1B] hover:bg-[#FFBD1B]/5 transition-all shadow-sm active:scale-95">
                   Ir a Estudio Visual <ArrowRight size={14} />
                 </Link>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
