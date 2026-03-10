"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Zap, LayoutDashboard, Database, RefreshCw, CheckCircle2, ArrowRight, Target, LayoutGrid, Check } from "lucide-react";
import Link from "next/link";
import { generateCampaignAction } from "@/app/actions/campaigns";

const GENERATION_STEPS = [
  "Analizando conocimiento empresarial (ADN)",
  "Generando estrategia de contenido",
  "Creando artículo principal",
  "Creando posts sociales",
  "Creando caso de uso",
  "Generando prompts visuales"
];import { Suspense } from 'react';

function CampaignsNewInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idea = searchParams.get('idea') || "";
  
  const [theme, setTheme] = useState(idea);
  const [objective, setObjective] = useState("Generar Leads");
  const [channels, setChannels] = useState<string[]>(["Blog", "LinkedIn"]);
  
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!theme) return;
    setGenerating(true);
    setError("");
    setGenerationStep(0);
    
    // Simulate pipeline steps visually
    const interval = setInterval(() => {
      setGenerationStep(prev => prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev);
    }, 4000);

    try {
      // Pass objective and channels to the action if supported backend, otherwise just theme for now
      // Backend action currently only takes theme. We can append it to theme.
      const fullContextTheme = `Tema: ${theme}. Objetivo: ${objective}. Canales: ${channels.join(', ')}`;
      const data = await generateCampaignAction(fullContextTheme);
      
      clearInterval(interval);
      setGenerationStep(GENERATION_STEPS.length - 1); // Ensure it reaches the end
      
      // Short delay before redirecting
      setTimeout(() => {
         router.push(`/campaigns/${data.campaignId}`);
      }, 1000);

    } catch (e: any) {
      clearInterval(interval);
      setError(e.message || "Error al orquestar la campaña");
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (idea && !generating) {
      setTheme(idea);
    }
  }, [idea]);

  const toggleChannel = (ch: string) => {
    if (channels.includes(ch)) {
       if (channels.length > 1) setChannels(channels.filter(c => c !== ch));
    } else {
       setChannels([...channels, ch]);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto py-12 px-6 lg:px-12 animate-in fade-in duration-1000">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-[#EBE4DC] pb-12 mb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1B1E]/5 border border-[#EBE4DC] text-[#1A1B1E] text-[10px] font-black uppercase tracking-[0.2em]">
            <Zap size={12} className="text-[#FFBD1B]" /> Orquestador Estratégico
          </div>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-[#1A1B1E]">
            Crear <span className="text-neutral-400">Campaña</span>
          </h1>
          <p className="text-[#8E8B88] text-xl font-medium max-w-xl leading-relaxed">
            Define tu estrategia. La IA consultará tu ADN Corporativo para generar el ecosistema completo.
          </p>
        </div>
      </header>

      {generating ? (
        <section className="bg-[#1A1B1E] p-12 lg:p-16 rounded-[4rem] shadow-2xl relative overflow-hidden text-white animate-in zoom-in-95 duration-500">
           <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFBD1B]/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
           
           <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-10">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center border border-white/20 relative">
                 <div className="absolute inset-0 border-2 border-[#FFBD1B] rounded-full border-t-transparent animate-spin"></div>
                 <Database size={40} className="text-[#FFBD1B]" />
              </div>
              
              <div className="space-y-4">
                 <h2 className="text-3xl font-black text-white tracking-tight">Cruces de Información Activos</h2>
                 <p className="text-neutral-400 font-medium text-lg">
                   Contenido generado basado en tu <span className="text-white font-bold border-b border-neutral-600">ADN Corporativo</span>.
                 </p>
              </div>

              {/* Progress Pipeline */}
              <div className="w-full space-y-6 text-left pt-6">
                 {GENERATION_STEPS.map((step, idx) => {
                    const isActive = idx === generationStep;
                    const isDone = idx < generationStep;
                    const isPending = idx > generationStep;

                    return (
                      <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 
                           ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 
                             isActive ? 'border-[#FFBD1B] text-[#FFBD1B]' : 
                             'border-neutral-700 text-neutral-600'}`
                         }>
                           {isDone ? <Check size={16} /> : isActive ? <RefreshCw size={14} className="animate-spin" /> : <div className="w-2 h-2 rounded-full bg-neutral-600"></div>}
                         </div>
                         <span className={`text-sm font-bold uppercase tracking-widest ${isDone ? 'text-neutral-300' : isActive ? 'text-white' : 'text-neutral-500'}`}>
                           {step}
                         </span>
                      </div>
                    )
                 })}
              </div>

              {/* Overall Progress Bar */}
              <div className="w-full pt-8">
                 <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FFBD1B] transition-all duration-500 ease-out" style={{ width: `${((generationStep + 1) / GENERATION_STEPS.length) * 100}%` }}></div>
                 </div>
              </div>
           </div>
        </section>
      ) : (
        <section className="bg-white p-10 lg:p-14 rounded-[4rem] border border-[#EBE4DC] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#EBE4DC]/30 rounded-bl-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-2xl relative z-10 space-y-12">
            
            {/* Tema */}
            <div>
               <label className="flex items-center gap-3 text-sm font-black text-[#1A1B1E] uppercase tracking-widest mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#1A1B1E] text-white flex items-center justify-center text-[10px]">1</span> 
                  ¿De qué va esta campaña?
               </label>
               <input 
                 type="text" 
                 value={theme}
                 onChange={e => setTheme(e.target.value)}
                 placeholder="Ej: IA aplicada al ticketing deportivo..."
                 className="w-full bg-[#F9F6F2] border border-[#EBE4DC] rounded-3xl px-8 py-6 text-xl font-bold focus:ring-2 focus:ring-[#FFBD1B] transition-all outline-none text-[#1A1B1E] placeholder:text-neutral-400 shadow-inner"
               />
            </div>

            {/* Objetivo */}
            <div>
               <label className="flex items-center gap-3 text-sm font-black text-[#1A1B1E] uppercase tracking-widest mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#1A1B1E] text-white flex items-center justify-center text-[10px]">2</span> 
                  Objetivo Principal
               </label>
               <div className="flex flex-wrap gap-4">
                  {['Generar Leads', 'Posicionamiento (Brand)', 'Awareness (Alcance)'].map(obj => (
                     <button
                        key={obj}
                        onClick={() => setObjective(obj)}
                        className={`px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border shadow-sm flex items-center gap-2 ${
                          objective === obj 
                             ? 'bg-[#1A1B1E] text-white border-[#1A1B1E] ring-2 ring-[#1A1B1E] ring-offset-2' 
                             : 'bg-white text-[#8E8B88] border-[#EBE4DC] hover:border-[#1A1B1E] hover:text-[#1A1B1E]'
                        }`}
                     >
                        <Target size={14} className={objective === obj ? 'text-[#FFBD1B]' : ''} /> {obj}
                     </button>
                  ))}
               </div>
            </div>

            {/* Canales */}
            <div>
               <label className="flex items-center gap-3 text-sm font-black text-[#1A1B1E] uppercase tracking-widest mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#1A1B1E] text-white flex items-center justify-center text-[10px]">3</span> 
                  Canales de Distribución
               </label>
               <div className="flex flex-wrap gap-4">
                  {['Blog', 'LinkedIn', 'Newsletter', 'Twitter'].map(ch => (
                     <button
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className={`px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border shadow-sm flex items-center gap-2 ${
                          channels.includes(ch)
                             ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                             : 'bg-white text-[#8E8B88] border-[#EBE4DC] hover:border-emerald-200 hover:text-emerald-700 hover:bg-emerald-50/50'
                        }`}
                     >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${channels.includes(ch) ? 'bg-emerald-500 border-emerald-500' : 'border-[#EBE4DC]'}`}>
                           {channels.includes(ch) && <Check size={10} className="text-white" />}
                        </div>
                        {ch}
                     </button>
                  ))}
               </div>
            </div>

            <div className="pt-6 border-t border-[#F9F6F2]">
              <button
                onClick={handleGenerate}
                disabled={!theme}
                className={`w-full py-6 rounded-3xl font-black text-[13px] uppercase tracking-[0.15em] transition-all shadow-xl flex items-center justify-center gap-3 ${
                  !theme 
                    ? "bg-[#EBE4DC] text-[#8E8B88] cursor-not-allowed shadow-none" 
                    : "bg-[#1A1B1E] hover:bg-black text-white hover:text-[#FFBD1B] hover:-translate-y-1 active:scale-95 shadow-[0_20px_40px_-15px_rgba(26,27,30,0.5)]"
                }`}
              >
                <Zap size={20} fill={theme ? "currentColor" : "none"} /> Generar Ecosistema de Campaña
              </button>
              {error && <p className="text-rose-500 text-sm font-bold mt-6 text-center">{error}</p>}
            </div>

          </div>
        </section>
      )}
    </div>
  );
}

export default function CampaignsNewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center p-6 text-[#8E8B88] font-black uppercase tracking-widest text-xs">
         Preparando Orquestador...
      </div>
    }>
      <CampaignsNewInner />
    </Suspense>
  )
}
