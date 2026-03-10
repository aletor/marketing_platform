"use client";

import { useState } from "react";
import { 
  Zap, 
  Target, 
  Lightbulb, 
  Calendar, 
  FileText, 
  MessageSquare, 
  ArrowRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Users,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { generateMarketingStrategyAction, generateEditorialPlanAction } from "@/app/actions/marketing";
import Link from "next/link";

export default function MarketingPlanPage() {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);
  const [editorialPlan, setEditorialPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const strategyData = await generateMarketingStrategyAction();
      setStrategy(strategyData);
      
      const editorialData = await generateEditorialPlanAction(strategyData);
      setEditorialPlan(editorialData);
    } catch (err: any) {
      setError(err.message || "Error al generar el plan de marketing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 lg:px-0 space-y-20">
      {/* HEADER SECTION */}
      <header className="space-y-6 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em]">
          <Zap size={12} fill="currentColor" /> Marketing Brain
        </div>
        <div className="flex flex-col lg:flex-row justify-between items-end gap-8 border-b border-neutral-200 pb-12">
          <div className="space-y-4 flex-1">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-neutral-900">
              Estrategia de <span className="text-amber-500">Contenidos</span>
            </h1>
            <p className="text-xl text-neutral-500 max-w-2xl leading-relaxed font-medium">
              Transformamos tu base de conocimiento en una máquina de atracción de leads.
              Extraída directamente de tu sabiduría corporativa.
            </p>
          </div>
          {!strategy && !loading && (
            <button 
              onClick={generatePlan}
              className="flex items-center gap-3 bg-[#1A1B1E] text-white hover:scale-105 active:scale-95 px-10 py-5 rounded-3xl font-black transition-all shadow-2xl shadow-[#1A1B1E]/20"
            >
              <Sparkles size={20} /> Generar Hoja de Ruta
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-rose-600 flex items-center gap-6 animate-in fade-in slide-in-from-top-4">
          <ShieldCheck size={32} /> 
          <div className="flex-1">
            <p className="font-bold text-lg">{error}</p>
            <p className="text-sm opacity-80 decoration-neutral-400">Necesitamos analizar documentos para entender tu negocio.</p>
          </div>
          <Link href="/knowledge" className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-sm font-black">Configurar Base</Link>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 space-y-8">
          <div className="relative">
            <div className="w-28 h-28 border-[6px] border-amber-100 border-t-amber-500 rounded-full animate-spin"></div>
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" size={40} fill="currentColor" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-neutral-900">Construyendo tu estrategia...</h2>
            <p className="text-neutral-500 font-medium text-lg">Analizando productos, audiencias y ventajas competitivas.</p>
          </div>
        </div>
      )}

      {strategy && !loading && (
        <div className="space-y-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* SECTION 1: BUSINESS PROFILE CARDS */}
          <section className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white shadow-sm border border-neutral-100 rounded-2xl text-neutral-900">
                <Target size={24} />
              </div>
              <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Análisis del Negocio</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Product */}
              <div className="p-10 rounded-[3rem] bg-white border border-neutral-100 hover:border-amber-200 transition-all shadow-sm hover:shadow-xl space-y-6">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Negocio</span>
                <h3 className="text-2xl font-black text-neutral-900 leading-tight">{strategy.businessProfile.type}</h3>
              </div>

              {/* Target */}
              <div className="p-10 rounded-[3rem] bg-white border border-neutral-100 hover:border-amber-200 transition-all shadow-sm hover:shadow-xl space-y-6">
                <div className="flex items-center gap-2 text-neutral-400">
                  <Users size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Audiencia</span>
                </div>
                <p className="text-neutral-700 leading-relaxed font-bold text-lg">{strategy.targetAudience.profile}</p>
              </div>

              {/* Advantages */}
              <div className="p-10 rounded-[3rem] bg-white border border-neutral-100 hover:border-amber-200 transition-all shadow-sm hover:shadow-xl space-y-6">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Diferencial</span>
                <div className="space-y-3">
                  {strategy.businessProfile.advantages.slice(0, 3).map((adv: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-neutral-600 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pillars / Themes */}
              <div className="p-10 rounded-[3rem] bg-[#1A1B1E] border border-black transition-all shadow-xl lg:col-span-2 space-y-8">
                <div className="flex items-center gap-3 text-amber-400">
                  <TrendingUp size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Ejes Estratégicos</span>
                </div>
                
                {strategy.contentStrategy.pillars ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Captación */}
                    <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FFBD1B] flex items-center gap-2"><Target size={14}/> Captación</h4>
                       <div className="space-y-2">
                         {strategy.contentStrategy.pillars.captacion?.slice(0, 2).map((item: string, i: number) => (
                           <p key={i} className="text-xs text-white/70 font-medium leading-relaxed">• {item}</p>
                         ))}
                       </div>
                    </div>
                    {/* Educativo */}
                    <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2"><FileText size={14}/> Educativo</h4>
                       <div className="space-y-2">
                         {strategy.contentStrategy.pillars.educativo?.slice(0, 2).map((item: string, i: number) => (
                           <p key={i} className="text-xs text-white/70 font-medium leading-relaxed">• {item}</p>
                         ))}
                       </div>
                    </div>
                    {/* Confianza */}
                    <div className="space-y-3 p-6 bg-white/5 rounded-3xl border border-white/10">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2"><ShieldCheck size={14}/> Confianza</h4>
                       <div className="space-y-2">
                         {strategy.contentStrategy.pillars.confianza?.slice(0, 2).map((item: string, i: number) => (
                           <p key={i} className="text-xs text-white/70 font-medium leading-relaxed">• {item}</p>
                         ))}
                       </div>
                    </div>
                    {/* Conversión */}
                    <div className="space-y-3 p-6 bg-[#FFBD1B]/10 rounded-3xl border border-[#FFBD1B]/30 relative overflow-hidden">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FFBD1B] flex items-center gap-2 relative z-10"><Zap size={14}/> Conversión</h4>
                       <div className="space-y-2 relative z-10">
                         {strategy.contentStrategy.pillars.conversion?.slice(0, 2).map((item: string, i: number) => (
                           <p key={i} className="text-xs text-amber-100 font-bold leading-relaxed">• {item}</p>
                         ))}
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {strategy.contentStrategy.mainThemes?.map((theme: string, i: number) => (
                      <span key={i} className="px-4 py-2 bg-white/10 border border-white/20 text-white text-[10px] font-black rounded-full uppercase tracking-tighter">
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 2: EDITORIAL PLAN TIMELINE */}
          <section className="space-y-16 pb-24">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shadow-sm">
                  <Calendar size={24} />
                </div>
                <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Calendario 4 Semanas</h2>
              </div>
              <button 
                onClick={generatePlan}
                className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 transition-all text-sm font-black uppercase tracking-widest"
              >
                <RefreshCw size={16} /> Regenerar
              </button>
            </div>

            <div className="space-y-24 relative">
              {/* Timeline Connector */}
              <div className="absolute left-[39px] top-6 bottom-6 w-1 bg-neutral-100 hidden md:block"></div>

              {editorialPlan?.weeks.map((weekData: any) => (
                <div key={weekData.week} className="md:grid md:grid-cols-12 gap-12 relative items-start">
                  {/* Left: Week Indicator */}
                  <div className="md:col-span-2 hidden md:flex flex-col items-center">
                    <div className="w-20 h-20 rounded-3xl bg-neutral-900 flex flex-col items-center justify-center text-white shadow-2xl z-10">
                      <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Sem</span>
                      <span className="text-3xl font-black">{weekData.week}</span>
                    </div>
                  </div>

                  {/* Mobile Week Indicator */}
                  <div className="md:hidden mb-8 flex items-center gap-4">
                    <div className="px-6 py-3 rounded-2xl bg-neutral-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg">Semana {weekData.week}</div>
                    <div className="h-px flex-1 bg-neutral-100"></div>
                  </div>

                  {/* Right: Content Items */}
                  <div className="md:col-span-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {weekData.items.map((item: any, idx: number) => (
                      <div key={idx} className="group bg-white border border-neutral-100 rounded-[3.5rem] p-10 space-y-8 hover:shadow-2xl hover:border-amber-100 transition-all duration-500 relative overflow-hidden">
                        {/* Pillar Background Decoration */}
                        {item.pillar && (
                          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-all duration-700 group-hover:scale-150 group-hover:opacity-40
                            ${item.pillar === 'captacion' ? 'bg-amber-500' : ''}
                            ${item.pillar === 'educativo' ? 'bg-blue-500' : ''}
                            ${item.pillar === 'confianza' ? 'bg-emerald-500' : ''}
                            ${item.pillar === 'conversion' ? 'bg-rose-500' : ''}
                          `}></div>
                        )}
                        
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-3">
                            <div className={`p-4 rounded-2xl ${item.type === 'article' ? 'bg-amber-50 text-amber-600' : 'bg-neutral-50 text-neutral-900'}`}>
                              {item.type === 'article' ? <FileText size={20} /> : <MessageSquare size={20} />}
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400">
                              {item.type === 'article' ? 'Blog Post' : 'LinkedIn'}
                            </span>
                          </div>
                          
                          {/* Pillar Badge */}
                          {item.pillar && (
                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5
                              ${item.pillar === 'captacion' ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}
                              ${item.pillar === 'educativo' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                              ${item.pillar === 'confianza' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}
                              ${item.pillar === 'conversion' ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}
                            `}>
                              {item.pillar === 'captacion' && <Target size={10} />}
                              {item.pillar === 'educativo' && <FileText size={10} />}
                              {item.pillar === 'confianza' && <ShieldCheck size={10} />}
                              {item.pillar === 'conversion' && <Zap size={10} />}
                              {item.pillar}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4 relative z-10">
                          <h4 className="text-2xl font-black text-neutral-900 group-hover:text-amber-500 transition-colors leading-[1.1] tracking-tight">
                            {item.title}
                          </h4>
                          <p className="text-neutral-500 text-lg leading-relaxed font-medium">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-4 relative z-10">
                          <Link 
                            href={item.type === 'article' 
                              ? `/article?topic=${encodeURIComponent(item.title)}` 
                              : `/social?topic=${encodeURIComponent(item.title)}`}
                            className="inline-flex items-center gap-3 text-sm font-black text-neutral-900 bg-neutral-50 px-8 py-4 rounded-2xl hover:bg-neutral-900 hover:text-white transition-all active:scale-95 shadow-sm"
                          >
                            Generar ahora <ArrowRight size={18} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* EMPTY STATE */}
      {!strategy && !loading && !error && (
        <section className="relative overflow-hidden p-16 lg:p-32 rounded-[5rem] bg-white border border-neutral-100 shadow-2xl transition-all duration-500 hover:border-amber-200">
          {/* Decorative Gradients */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-100/30 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-neutral-200/20 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="relative flex flex-col items-center justify-center text-center space-y-12">
            <div className="w-32 h-32 bg-amber-50 rounded-[3rem] flex items-center justify-center shadow-xl border border-amber-100">
              <Sparkles className="text-amber-500" size={56} fill="currentColor" />
            </div>
            
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-5xl font-black text-neutral-900 tracking-tighter leading-[1.1]">Tu contenido estratégico a un solo click</h2>
              <p className="text-2xl text-neutral-400 leading-relaxed font-medium">
                Analizamos tus activos para entender tu producto, clientes y diferencial. Inteligencia pura.
              </p>
            </div>

            <button 
              onClick={generatePlan}
              className="flex items-center gap-4 bg-[#1A1B1E] text-white px-12 py-6 rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#1A1B1E]/40"
            >
              Comenzar Auditoría <ChevronRight size={24} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
