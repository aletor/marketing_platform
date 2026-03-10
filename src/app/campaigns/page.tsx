"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, LayoutDashboard, Plus, Trash2, Calendar, FolderOpen } from "lucide-react";
import { getCampaignsAction, deleteCampaignAction } from "@/app/actions/campaigns-db";
import { CampaignRecord } from "@/lib/campaigns-db";

export default function CampaignsDashboard() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      const res = await getCampaignsAction();
      if (res.success && res.campaigns) {
        setCampaigns(res.campaigns);
      }
      setLoading(false);
    }
    fetchCampaigns();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta campaña y todos sus activos generados? Esta acción no se puede deshacer.")) {
      const res = await deleteCampaignAction(id);
      if (res.success) {
        setCampaigns(campaigns.filter(c => c.id !== id));
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto py-12 px-6 lg:px-12 space-y-12 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-[#EBE4DC] pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1B1E]/5 border border-[#EBE4DC] text-[#1A1B1E] text-[10px] font-black uppercase tracking-[0.2em]">
            <LayoutDashboard size={12} className="text-[#FFBD1B]" /> Panel de Control
          </div>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-[#1A1B1E]">
            Mis <span className="text-neutral-400">Campañas</span>
          </h1>
          <p className="text-[#8E8B88] text-xl font-medium max-w-xl leading-relaxed">
            Gestiona tus entornos de trabajo estratégicos. Cada campaña tiene sus propios activos y calendario.
          </p>
        </div>
        <Link href="/campaigns/new" className="px-10 py-5 bg-[#1A1B1E] text-white hover:text-[#FFBD1B] rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3">
          <Plus size={16} /> Nueva Campaña
        </Link>
      </header>

      {loading ? (
        <div className="space-y-4 opacity-50">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-[#F9F6F2] animate-pulse rounded-3xl border border-[#EBE4DC]" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center bg-[#F9F6F2] border-2 border-dashed border-[#EBE4DC] rounded-[3rem]">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#EBE4DC]">
            <FolderOpen size={40} className="text-[#8E8B88]" />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-[#1A1B1E] mb-2">No hay campañas activas</h3>
          <p className="text-[#8E8B88] max-w-md mb-8">
            Comienza extrayendo el ADN corporativo y orquesta tu primera campaña multicanal para verla aquí.
          </p>
          <Link href="/campaigns/new" className="px-8 py-4 bg-white border border-[#EBE4DC] text-[#1A1B1E] rounded-full font-black text-[10px] uppercase tracking-widest hover:border-[#1A1B1E] transition-colors flex items-center gap-2 shadow-sm">
            <Zap size={14} className="text-[#FFBD1B]" /> Orquestar Primera Campaña
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Link 
              href={`/campaigns/${campaign.id}`} 
              key={campaign.id} 
              className="group bg-white rounded-3xl border border-[#EBE4DC] p-6 hover:border-[#1A1B1E] hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative"
            >
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-[#F9F6F2] border border-[#EBE4DC] flex items-center justify-center group-hover:bg-[#1A1B1E] group-hover:text-[#FFBD1B] transition-colors shrink-0">
                    <FolderOpen size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-[#1A1B1E] tracking-tight group-hover:text-[#FFBD1B] transition-colors mb-2">
                       {campaign.theme}
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#8E8B88]">
                       <span className={`px-3 py-1 rounded-full border ${
                         campaign.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         campaign.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                         'bg-neutral-50 text-neutral-600 border-neutral-200'
                       }`}>
                         {campaign.status === 'Active' ? 'Activa' : campaign.status === 'Completed' ? 'Completada' : 'Borrador'}
                       </span>
                       <span className="flex items-center gap-1.5 opacity-60"><Calendar size={12}/> {new Date(campaign.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 hidden md:flex z-10">
                <button 
                  onClick={(e) => { e.preventDefault(); handleDelete(campaign.id); }}
                  className="w-12 h-12 flex items-center justify-center text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors border border-transparent hover:border-rose-100"
                  title="Eliminar Campaña"
                >
                  <Trash2 size={18} />
                </button>
              </div>

               {/* Mobile delete button */}
               <div className="absolute top-6 right-6 md:hidden z-10">
                 <button 
                    onClick={(e) => { e.preventDefault(); handleDelete(campaign.id); }}
                    className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
