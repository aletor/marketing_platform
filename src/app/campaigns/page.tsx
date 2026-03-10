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
        <Link href="/campaigns/new" className="px-10 py-5 bg-[#1A1B1E] text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3">
          <Plus size={16} /> Nueva Campaña
        </Link>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-[#F9F6F2] animate-pulse rounded-[2.5rem] border border-[#EBE4DC]" />)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="group bg-white rounded-[2.5rem] border border-[#EBE4DC] p-8 hover:border-[#1A1B1E] transition-all duration-300 hover:shadow-xl relative flex flex-col h-full">
              
              <div className="flex justify-between items-start mb-6">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  campaign.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  campaign.status === 'Completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  'bg-neutral-50 text-neutral-600 border-neutral-200'
                }`}>
                  {campaign.status === 'Active' ? 'Activa' : campaign.status === 'Completed' ? 'Completada' : 'Borrador'}
                </span>
                
                <button 
                  onClick={(e) => { e.preventDefault(); handleDelete(campaign.id); }}
                  className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                  title="Eliminar Campaña"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="text-2xl font-black text-[#1A1B1E] tracking-tight mb-4 group-hover:text-[#FFBD1B] transition-colors line-clamp-2">
                {campaign.theme}
              </h3>
              
              <div className="mt-auto pt-8 flex items-center justify-between border-t border-[#F9F6F2]">
                <div className="flex items-center gap-2 text-[#8E8B88] text-[10px] font-bold uppercase tracking-widest">
                  <Calendar size={12} />
                  {new Date(campaign.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </div>
                
                <Link 
                  href={`/campaigns/${campaign.id}`}
                  className="w-10 h-10 rounded-full bg-[#F9F6F2] text-[#1A1B1E] group-hover:bg-[#1A1B1E] group-hover:text-white flex items-center justify-center transition-colors border border-[#EBE4DC]"
                  title="Entrar a la Campaña"
                >
                  <Plus size={16} />
                </Link>
              </div>
              
              {/* Clickable overlay to make entire card a link, minus the delete button */}
              <Link href={`/campaigns/${campaign.id}`} className="absolute inset-0 z-0" aria-label={`Ver campaña ${campaign.theme}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
