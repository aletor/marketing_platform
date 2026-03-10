"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Calendar as CalendarIcon, Clock, MoveRight, FileText, MessageSquare, ImageIcon, LayoutDashboard, Plus, PieChart } from "lucide-react";
import { getLibraryItemsAction, updateLibraryItemAction } from "@/app/actions/library";
import { GeneratedItem } from "@/lib/generated-db";

export default function CalendarPage() {
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      const res = await getLibraryItemsAction();
      if (res.success) setItems(res.items);
      setLoading(false);
    }
    fetchItems();
  }, []);

  // Generate the next 7 days
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const getItemsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return items.filter(item => {
      // If it's explicitly scheduled
      if (item.metadata?.scheduledFor === dateStr) return true;
      // For MVP demo, just map recently generated items to the next few days if not scheduled
      // Using a deterministic way based on item.id to spread them out across the week
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

  const handleScheduleItem = async (item: GeneratedItem, date: Date) => {
     const dateStr = date.toISOString().split('T')[0];
     // Update in db (simulate if real update is needed, requires DB change to support metadata updates)
     // For this MVP, we will assume it works if we update local state
     const updatedItem = { ...item, metadata: { ...item.metadata, scheduledFor: dateStr } };
     setItems(items.map(i => i.id === item.id ? updatedItem : i));
     await updateLibraryItemAction(item.id, item.content, item.title); // Note: updateLibraryItemAction might need modification to accept metadata.
  };

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-6 lg:px-12 space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-neutral-200 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1B1E]/5 border border-[#EBE4DC] text-[#1A1B1E] text-[10px] font-black uppercase tracking-[0.2em]">
            <CalendarIcon size={12} className="text-[#FFBD1B]" /> Planificación
          </div>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-[#1A1B1E]">
            Calendario <span className="text-neutral-400">Editorial</span>
          </h1>
          <p className="text-[#8E8B88] text-xl font-medium max-w-xl leading-relaxed">
            Visualiza y organiza los contenidos de tus campañas orquestadas para la próxima semana.
          </p>
        </div>
        <Link href="/campaigns" className="px-10 py-5 bg-[#1A1B1E] text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3">
          <Zap size={16} fill="currentColor" /> Crear Campaña
        </Link>
      </header>

      {/* FUNNEL BALANCE PANEL */}
      <section className="mb-4">
        <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-[#EBE4DC] shadow-sm flex flex-col lg:flex-row items-center gap-8 justify-between">
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-[#1A1B1E] text-white flex items-center justify-center shrink-0">
               <PieChart size={20} />
             </div>
             <div>
               <h3 className="text-sm font-black text-[#1A1B1E]">Equilibrio del Embudo</h3>
               <p className="text-[9px] font-bold text-[#8E8B88] uppercase tracking-widest">Distribución semanal de contenidos</p>
             </div>
           </div>
           
           <div className="flex-1 w-full flex h-3 rounded-full overflow-hidden bg-[#F9F6F2]">
              <div className="h-full bg-blue-500" style={{ width: '60%' }} title="Captación (60%)"></div>
              <div className="h-full bg-[#FFBD1B]" style={{ width: '25%' }} title="Educación (25%)"></div>
              <div className="h-full bg-emerald-500" style={{ width: '15%' }} title="Conversión (15%)"></div>
           </div>
           
           <div className="flex flex-wrap gap-6 min-w-max justify-center">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1B1E]">Captación (60%)</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FFBD1B]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1B1E]">Educación (25%)</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1B1E]">Conversión (15%)</span>
             </div>
           </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 opacity-50">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-96 bg-[#F9F6F2] animate-pulse rounded-[2.5rem] border border-[#EBE4DC]" />)}
        </div>
      ) : (
        <div className="flex gap-6 flex-wrap pb-8 items-start">
          {days.map((date, i) => {
            const dateStr = date.toISOString().split('T')[0];
            const isToday = i === 0;
            const dayItems = getItemsForDate(date);
            
            return (
              <div key={dateStr} className={`flex-1 min-w-[300px] min-h-[500px] rounded-[3rem] border transition-all duration-300 ${isToday ? 'bg-[#FFBD1B]/5 border-[#FFBD1B] shadow-lg' : 'bg-[#F9F6F2] border-[#EBE4DC]'}`}>
                <div className={`p-6 border-b flex items-center justify-between rounded-t-[3rem] ${isToday ? 'bg-[#FFBD1B]/10 border-[#FFBD1B]/20' : 'bg-white border-[#EBE4DC]'}`}>
                  <div className="space-y-1">
                     <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-[#1A1B1E]' : 'text-[#8E8B88]'}`}>
                       {date.toLocaleDateString('es-ES', { weekday: 'long' })}
                     </p>
                     <p className={`text-2xl font-black tracking-tighter ${isToday ? 'text-[#1A1B1E]' : 'text-[#1A1B1E]'}`}>
                       {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                     </p>
                  </div>
                  {isToday && <span className="px-3 py-1 bg-[#1A1B1E] text-white text-[8px] font-black uppercase tracking-widest rounded-full">Hoy</span>}
                </div>

                <div className="p-4 flex flex-col gap-4">
                  {dayItems.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-[#EBE4DC] border-2 border-dashed border-[#EBE4DC] rounded-3xl m-2 bg-white">
                      <LayoutDashboard size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest mt-4 text-[#8E8B88]">Día Libre</p>
                    </div>
                  ) : (
                    dayItems.map(item => (
                      <div key={item.id} className="bg-white p-5 rounded-3xl border border-[#EBE4DC] hover:border-[#1A1B1E] transition-colors shadow-sm group">
                        <div className="flex justify-between items-start mb-3">
                           <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                             item.type === 'article' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                             item.type === 'marketing' ? 'bg-[#1A1B1E] text-white border-black' :
                             item.type === 'social' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                             'bg-emerald-50 text-emerald-600 border-emerald-100'
                           }`}>
                             {item.type === 'article' && <FileText size={8}/>}
                             {item.type === 'marketing' && <Zap size={8}/>}
                             {item.type === 'social' && <MessageSquare size={8}/>}
                             {item.type === 'image' && <ImageIcon size={8}/>}
                             {item.type.substring(0,3)}
                           </span>
                           <span className="text-[8px] font-black text-[#8E8B88] uppercase tracking-widest bg-[#F9F6F2] px-2 py-1 rounded border border-[#EBE4DC]">
                             10:00 AM
                           </span>
                        </div>
                        <h4 className="text-sm font-black text-[#1A1B1E] leading-tight line-clamp-2 mb-2 group-hover:text-[#FFBD1B] transition-colors">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-4 text-[9px] font-black uppercase tracking-widest text-[#8E8B88]">
                          <Clock size={10} /> Programado
                        </div>
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
