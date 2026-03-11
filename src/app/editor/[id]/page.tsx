"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Wand2, 
  Save, 
  MoreHorizontal, 
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  History,
  MousePointerClick
} from "lucide-react";
import { getLibraryItemsAction, updateLibraryItemAction } from "@/app/actions/library";
import { GeneratedItem } from "@/lib/generated-db";

export default function EditorialEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [item, setItem] = useState<GeneratedItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Editor State
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Copilot State
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);
  
  // Wizard State (Modal)
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardDraft, setWizardDraft] = useState("");
  const [wizardSuggestion, setWizardSuggestion] = useState("");
  const [isWizardThinking, setIsWizardThinking] = useState(false);

  // When Wizard opens, load the current editor content as the base draft
  useEffect(() => {
    if (showWizard) {
      setWizardDraft(content);
      setWizardStep(0);
      setWizardSuggestion("");
    }
  }, [showWizard, content]);

  const WIZARD_STEPS = [
    '1. Hook Killer', 
    '2. Claridad Brutal', 
    '3. Estructura Profesional', 
    '4. Autoridad (Datos)', 
    '5. Conversión (CTA)', 
    '6. Distribución Social', 
    '7. SEO Base'
  ];

  const applyWizardMagic = async () => {
    if (!wizardDraft.trim()) return;
    setIsWizardThinking(true);
    setWizardSuggestion("");
    
    try {
      const response = await fetch('/api/editor/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepIndex: wizardStep,
          content: wizardDraft
        })
      });

      const data = await response.json();
      if (data.success && data.text) {
         setWizardSuggestion(data.text);
      } else {
         console.error("Wizard error:", data.error);
      }
    } catch (error) {
       console.error("Failed to connect to Wizard API", error);
    } finally {
       setIsWizardThinking(false);
    }
  };

  const keepWizardChanges = () => {
    if (wizardSuggestion) {
      // The suggestion becomes the new baseline draft for the next step
      setWizardDraft(wizardSuggestion);
      setContent(wizardSuggestion); // Update the main editor behind the scenes
      setWizardSuggestion(""); // Clear right side
      
      // Move to next step if not at the end
      if (wizardStep < WIZARD_STEPS.length - 1) {
         setWizardStep(wizardStep + 1);
      } else {
         setShowWizard(false); // Finish
      }
    }
  };

  const closeWizard = () => {
    setShowWizard(false);
    // On close, the editor retains whatever changes were "ept" so far
  };

  useEffect(() => {
    async function loadItem() {
      const res = await getLibraryItemsAction();
      if (res.success) {
        const found = res.items.find(i => i.id === resolvedParams.id);
        if (found) {
          setItem(found);
          setTitle(found.title);
          setContent(typeof found.content === 'string' ? found.content : (found.content.article || ""));
        }
      }
      setLoading(false);
    }
    loadItem();
  }, [resolvedParams.id]);

  const handleSave = async () => {
    if (!item) return;
    setIsSaving(true);
    
    const isStringContent = typeof item.content === 'string';
    const newContentObj = isStringContent ? content : { ...item.content, article: content };
    
    const res = await updateLibraryItemAction(item.id, newContentObj, title);
    if (res.success) {
      setLastSaved(new Date());
    }
    setIsSaving(false);
  };

  const executeCopilotAction = async (action: string, customPrompt?: string) => {
     if (!content.trim()) return;
     
     setIsCopilotThinking(true);
     try {
       const response = await fetch('/api/copilot/action', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           action,
           currentContent: content,
           customPrompt
         })
       });

       const data = await response.json();
       if (data.success && data.text) {
         setContent(data.text);
         // Auto-trigger a save conceptually
       } else {
         console.error("Copilot error:", data.error);
       }
     } catch (e) {
       console.error("Failed to connect to Copilot API", e);
     } finally {
       setIsCopilotThinking(false);
     }
  };

  const handleCustomCopilotPrompt = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value;
      if (val.trim()) {
        executeCopilotAction('custom', val);
        e.currentTarget.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBE4DC] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 text-[#1A1B1E]"><RefreshCwIcon /></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#EBE4DC] flex flex-col items-center justify-center gap-6">
        <AlertTriangle size={48} className="text-[#8E8B88]" />
        <h1 className="text-2xl font-black uppercase tracking-widest text-[#1A1B1E]">Activo no encontrado</h1>
        <Link href="/library" className="px-8 py-4 bg-[#1A1B1E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-colors">Volver a la Biblioteca</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBE4DC] flex flex-col font-sans">
      
      {/* HEADER: Minimalist Topbar */}
      <header className="h-[80px] bg-white border-b border-[#EBE4DC] px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-[#F9F6F2] hover:bg-[#1A1B1E] hover:text-white rounded-xl transition-colors border border-[#EBE4DC]">
            <ArrowLeft size={16} />
          </button>
          <div className="flex flex-col">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-black text-[#1A1B1E] bg-transparent outline-none border-none p-0 focus:ring-0 w-[400px] truncate"
              placeholder="Título del documento..."
            />
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#8E8B88] mt-1">
              <span className="px-2 py-0.5 bg-[#F9F6F2] border border-[#EBE4DC] rounded-md">{item.type}</span>
              {lastSaved && <span className="flex items-center gap-1"><History size={10}/> Guardado {lastSaved.toLocaleTimeString()}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-3 bg-[#F9F6F2] hover:bg-white text-[#1A1B1E] border border-[#EBE4DC] rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
          >
            {isSaving ? <RefreshCwIcon className="animate-spin" size={14}/> : <Save size={14}/>} Guardar
          </button>
          
          <button 
            onClick={() => setShowWizard(true)}
            className="px-8 py-3 bg-[#1A1B1E] hover:bg-[#FFBD1B] hover:text-[#1A1B1E] text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 relative overflow-hidden group"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <Wand2 size={14} className="animate-pulse" /> REFINAR CON IA
          </button>
          
          <button className="w-10 h-10 flex items-center justify-center bg-[#F9F6F2] hover:bg-white rounded-xl transition-colors border border-[#EBE4DC] text-[#8E8B88]">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE: 70/30 Split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Notion-Style Editor (70%) */}
        <main className="flex-1 overflow-y-auto bg-white p-12 lg:p-24 relative">
          <div className="max-w-3xl mx-auto">
             {/* Pista UX si está vacío */}
             {content.length === 0 && (
               <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center text-[#8E8B88] pointer-events-none">
                 <MousePointerClick size={32} className="mx-auto mb-4 opacity-50" />
                 <p className="font-black text-xs uppercase tracking-widest">Empieza a escribir o usa el Copilot</p>
               </div>
             )}
             <textarea 
               value={content}
               onChange={(e) => setContent(e.target.value)}
               placeholder="Escribe aquí tu contenido maestro..."
               className="w-full min-h-[70vh] text-lg lg:text-xl text-[#1A1B1E] leading-relaxed font-medium bg-transparent border-none outline-none resize-none placeholder:text-[#8E8B88]/40"
               style={{ lineHeight: '1.8' }}
             />
          </div>
        </main>

        {/* RIGHT COLUMN: Copilot Assist (30%) */}
        <aside className="w-[360px] bg-[#F9F6F2] border-l border-[#EBE4DC] flex flex-col shrink-0">
          <div className="p-6 border-b border-[#EBE4DC] bg-white flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-[#FFBD1B]/20 border border-[#FFBD1B]/30 flex items-center justify-center text-[#FFBD1B]">
               <Sparkles size={14} />
             </div>
             <div>
               <h3 className="text-xs font-black uppercase tracking-widest text-[#1A1B1E]">Copilot Lateral</h3>
               <p className="text-[10px] font-bold text-[#8E8B88]">Asistente de edición rápida</p>
             </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-8">
             
             {/* Fast Actions Group */}
             <div className="space-y-3">
               <p className="text-[9px] font-black uppercase tracking-widest text-[#8E8B88] ml-2">Comandos de Impacto</p>
               <div className="grid grid-cols-1 gap-2">
                 <button onClick={()=>executeCopilotAction('hook')} className="w-full text-left p-4 bg-white hover:border-[#1A1B1E] border border-[#EBE4DC] rounded-2xl transition-all shadow-sm group relative overflow-hidden">
                   <div className="flex items-center justify-between relative z-10">
                     <span className="text-xs font-black text-[#1A1B1E] group-hover:text-[#FFBD1B] transition-colors">Hook Killer</span>
                     <Zap size={14} className="text-[#8E8B88] group-hover:text-[#FFBD1B]" />
                   </div>
                   <p className="text-[10px] font-medium text-[#8E8B88] mt-1 relative z-10">Haz la intro mucho más provocadora.</p>
                 </button>
                 <button onClick={()=>executeCopilotAction('shorter')} className="w-full text-left p-4 bg-white hover:border-[#1A1B1E] border border-[#EBE4DC] rounded-2xl transition-all shadow-sm group">
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-black text-[#1A1B1E]">Más conciso</span>
                     <Zap size={14} className="text-[#8E8B88]" />
                   </div>
                   <p className="text-[10px] font-medium text-[#8E8B88] mt-1">Elimina la paja y ve directo al grano.</p>
                 </button>
                 <button onClick={()=>executeCopilotAction('storytelling')} className="w-full text-left p-4 bg-white hover:border-[#1A1B1E] border border-[#EBE4DC] rounded-2xl transition-all shadow-sm group">
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-black text-[#1A1B1E]">Aplicar Storytelling</span>
                     <Zap size={14} className="text-[#8E8B88]" />
                   </div>
                   <p className="text-[10px] font-medium text-[#8E8B88] mt-1">Dale narrativa y ritmo al texto.</p>
                 </button>
               </div>
             </div>

             {/* Structural Actions */}
             <div className="space-y-3">
               <p className="text-[9px] font-black uppercase tracking-widest text-[#8E8B88] ml-2">Estructura & Cierre</p>
               <div className="grid grid-cols-1 gap-2">
                 <button onClick={()=>executeCopilotAction('cta')} className="w-full text-left p-4 bg-white hover:border-[#1A1B1E] border border-[#EBE4DC] rounded-2xl transition-all shadow-sm group">
                   <span className="text-xs font-black text-[#1A1B1E]">Generar Call to Action</span>
                 </button>
                 <button onClick={()=>executeCopilotAction('seo')} className="w-full text-left p-4 bg-white hover:border-[#1A1B1E] border border-[#EBE4DC] rounded-2xl transition-all shadow-sm group">
                   <span className="text-xs font-black text-[#1A1B1E]">Optimizar para SEO Base</span>
                 </button>
               </div>
             </div>

          </div>
          
          {/* Chat Mode Input */}
          <div className="p-4 bg-white border-t border-[#EBE4DC]">
            <div className="relative">
              <input 
                placeholder="Pide un cambio específico a la IA..."
                className="w-full pl-4 pr-10 py-3 bg-[#F9F6F2] border border-[#EBE4DC] rounded-xl text-xs font-medium focus:outline-none focus:border-[#1A1B1E] transition-colors"
                disabled={isCopilotThinking}
                onKeyDown={handleCustomCopilotPrompt}
              />
              <button disabled={isCopilotThinking} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-[#EBE4DC] rounded-lg text-[#1A1B1E] transition-colors">
                 {isCopilotThinking ? <RefreshCwIcon className="animate-spin" size={12}/> : <MessageSquare size={12} />}
              </button>
            </div>
            <p className="text-center mt-3 text-[8px] font-black uppercase tracking-widest text-[#8E8B88]">Ctrl + J para foco</p>
          </div>
        </aside>

      </div>

      {/* --- WIZARD 7 PASOS MODAL (Scaffold) --- */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-[#1A1B1E]/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
           <div className="w-full max-w-6xl h-[85vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 relative">
             
             {/* Wizard Header */}
             <div className="h-20 bg-[#F9F6F2] border-b border-[#EBE4DC] flex items-center justify-between px-8">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-[1rem] bg-[#1A1B1E] text-white flex items-center justify-center">
                   <Wand2 size={16} />
                 </div>
                 <div>
                   <h2 className="text-lg font-black text-[#1A1B1E]">Módulo de Refinamiento Profesional</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Metodología en 7 Pasos</p>
                 </div>
               </div>
               <button onClick={closeWizard} className="px-6 py-2 bg-white border border-[#EBE4DC] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1A1B1E] hover:bg-rose-50 hover:text-rose-600 transition-colors">
                 Cerrar Wizard
               </button>
             </div>

             {/* Wizard Grid Split (Steps vs Diff) */}
             <div className="flex-1 flex overflow-hidden">
                {/* Steps Menu */}
                <div className="w-64 bg-white border-r border-[#EBE4DC] p-6 space-y-2 overflow-y-auto shrink-0">
                   {WIZARD_STEPS.map((step, idx) => (
                     <button 
                       key={idx} 
                       onClick={() => setWizardStep(idx)}
                       className={`w-full text-left p-4 rounded-2xl text-[10px] font-black uppercase tracking-wide transition-all flex items-center gap-2 ${wizardStep === idx ? 'bg-[#1A1B1E] text-white shadow-lg' : 'bg-transparent text-[#8E8B88] hover:bg-[#F9F6F2]'}`}
                     >
                       {wizardStep > idx && <CheckCircle2 size={12} className="text-emerald-400"/>}
                       {step}
                     </button>
                   ))}
                </div>
                
                {/* Working Area (Antes/Despues) */}
                <div className="flex-1 bg-[#F9F6F2] p-8 flex flex-col relative overflow-hidden">
                   <div className="flex justify-between items-center mb-6 shrink-0">
                     <h3 className="text-2xl font-black text-[#1A1B1E]">{WIZARD_STEPS[wizardStep]}</h3>
                     <button 
                       onClick={applyWizardMagic}
                       disabled={isWizardThinking}
                       className="px-8 py-4 bg-[#FFBD1B] hover:bg-black hover:text-white text-[#1A1B1E] disabled:bg-[#EBE4DC] disabled:text-[#8E8B88] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
                     >
                       {isWizardThinking ? <RefreshCwIcon className="animate-spin" size={14}/> : <Sparkles size={14}/>} 
                       {isWizardThinking ? 'Generando Magia...' : 'Aplicar Magia'}
                     </button>
                   </div>
                   
                   {/* Diff Viewer */}
                   <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">
                      {/* Before (Draft) */}
                      <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-400"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4 bg-red-50 w-fit px-3 py-1 rounded-md">Borrador Actual</span>
                        <div className="flex-1 overflow-y-auto text-[#1A1B1E] font-medium text-sm leading-relaxed whitespace-pre-wrap">{wizardDraft}</div>
                      </div>
                      
                      {/* After (Suggestion) */}
                      <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-xl flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-400"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2 bg-emerald-50 w-fit px-3 py-1 rounded-md">
                          <CheckCircle2 size={12}/> Sugerencia Copywriter
                        </span>
                        <div className="flex-1 overflow-y-auto text-[#1A1B1E] font-medium text-sm leading-relaxed whitespace-pre-wrap relative">
                          {isWizardThinking ? (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8E8B88]">
                                <RefreshCwIcon className="animate-spin w-8 h-8 mb-4 text-[#FFBD1B]" />
                                <span className="font-black uppercase tracking-widest text-[10px]">La IA está reescribiendo...</span>
                             </div>
                          ) : wizardSuggestion ? (
                             wizardSuggestion
                          ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8E8B88]/50 italic text-center p-8">
                                Haz clic en "Aplicar Magia" para que gpt-5.2 mejore este paso basándose en tu contexto corporativo.
                             </div>
                          )}
                        </div>
                      </div>
                   </div>

                   {/* Footer Actions */}
                   <div className="mt-8 flex justify-end gap-4 border-t border-[#EBE4DC] pt-6 shrink-0">
                      <button 
                        disabled={!wizardSuggestion}
                        onClick={() => setWizardSuggestion('')}
                        className="px-8 py-3 bg-white border border-[#EBE4DC] text-[#1A1B1E] disabled:opacity-50 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#F9F6F2] transition-colors"
                      >
                        Rechazar
                      </button>
                      <button 
                        disabled={!wizardSuggestion}
                        onClick={keepWizardChanges}
                        className="px-8 py-3 bg-[#1A1B1E] text-white disabled:opacity-50 disabled:bg-[#8E8B88] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#FFBD1B] hover:text-[#1A1B1E] transition-colors shadow-lg"
                      >
                        {wizardStep === WIZARD_STEPS.length - 1 ? 'Finalizar Wizard' : 'Mantener & Siguiente Paso'}
                      </button>
                   </div>
                </div>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}

// Pequeño helper para el icono animado de carga
function RefreshCwIcon(props: any) {
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
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
