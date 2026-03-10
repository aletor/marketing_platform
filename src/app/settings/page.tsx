"use client";

import { useState, useEffect } from "react";
import { 
  Key, 
  Zap, 
  BarChart3, 
  DollarSign, 
  Activity, 
  ShieldCheck,
  RefreshCw,
  Cpu,
  Users,
  UserPlus,
  Trash2
} from "lucide-react";
import { getOpenAIUsageAction } from "@/app/actions/usage";
import "./page.css";

export default function Settings() {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      const res = await getOpenAIUsageAction();
      if (res.success) {
        setUsage(res.stats);
      }
      setLoading(false);
    }
    fetchUsage();
  }, []);

  return (
    <div className="settings-container animate-in fade-in duration-1000">
      <header className="settings-header border-b border-[#EBE4DC] pb-12 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFBD1B]/10 text-[#FFBD1B] text-[9px] font-black uppercase tracking-widest border border-[#FFBD1B]/20 mb-4">
          <ShieldCheck size={10} /> Panel de Control
        </div>
        <h1 className="settings-title text-5xl lg:text-7xl font-black text-[#1A1B1E] tracking-tighter">Configuración</h1>
        <p className="settings-subtitle text-[#8E8B88] text-lg font-medium mt-4">Gestiona la infraestructura neuronal y el consumo de tu IA.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* API Status Section */}
        <section className="lg:col-span-4 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-[#EBE4DC] shadow-sm space-y-8 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FFBD1B]/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            
            <div className="space-y-2">
              <h2 className="text-[10px] font-black flex items-center gap-3 text-[#FFBD1B] uppercase tracking-[0.2em]">
                <Key className="w-4 h-4" />
                Infraestructura
              </h2>
              <p className="text-[11px] font-bold text-[#8E8B88]">Credenciales y Conectividad</p>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-[#F9F6F2] rounded-2xl border border-[#EBE4DC] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EBE4DC] flex items-center justify-center text-emerald-500 shadow-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#1A1B1E] uppercase">OpenAI API</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Activa y Segura</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-white rounded-2xl border border-[#EBE4DC] border-dashed">
                <p className="text-[10px] text-[#8E8B88] font-medium leading-relaxed italic">
                  La clave de API se gestiona mediante variables de entorno del servidor para máxima seguridad. No es editable desde la UI por política de seguridad.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Stats Module */}
        <section className="lg:col-span-8">
          <div className="bg-[#1A1B1E] p-12 lg:p-16 rounded-[4rem] border border-black shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FFBD1B]/20 to-transparent blur-[100px]" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 relative z-10">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
                  Control de <span className="text-[#FFBD1B]">Consumo</span>
                </h2>
                <p className="text-white/50 text-xs font-black uppercase tracking-[0.3em]">Métricas de Uso OpenAI • {usage?.monthName || 'Mes Actual'}</p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-xl"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Actualizar
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse relative z-10">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 bg-white/5 rounded-3xl border border-white/5" />
                ))}
              </div>
            ) : (
              <div className="space-y-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* API Calls */}
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl group hover:border-[#FFBD1B]/30 transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-3 rounded-xl bg-white/5 text-[#FFBD1B]">
                        <Activity size={20} />
                      </div>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Ejecuciones</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <p className="text-4xl font-black text-white">{usage?.totalCalls || 0}</p>
                       <p className="text-[10px] text-white/30 font-bold">/ {usage?.historicalTotalCalls || 0} total</p>
                    </div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-tighter mt-2">Llamadas este mes</p>
                  </div>

                  {/* Estimated Cost */}
                  <div className="bg-[#FFBD1B] p-8 rounded-[2.5rem] border border-[#FFBD1B] shadow-glow transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-3 rounded-xl bg-black/10 text-black">
                        <DollarSign size={20} />
                      </div>
                      <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">Coste Estimado</span>
                    </div>
                    <p className="text-4xl font-black text-black mb-2">${usage?.totalCost.toFixed(4) || '0.0000'}</p>
                    <p className="text-[10px] font-black text-black/60 uppercase tracking-tighter">USD asociados al uso mensual</p>
                  </div>

                  {/* Token Load */}
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 shadow-xl group hover:border-[#FFBD1B]/30 transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-3 rounded-xl bg-white/5 text-[#FFBD1B]">
                        <Cpu size={20} />
                      </div>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Volumen</span>
                    </div>
                    <p className="text-4xl font-black text-white mb-2">{((usage?.totalInputTokens + usage?.totalOutputTokens) / 1000).toFixed(1)}k</p>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">Tokens procesados (total)</p>
                  </div>
                </div>

                <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <BarChart3 className="text-[#FFBD1B] w-8 h-8" />
                    <div className="space-y-1">
                      <p className="text-white text-sm font-black">Desglose de Eficiencia</p>
                      <p className="text-white/40 text-[10px] font-medium leading-relaxed">
                        Input: {usage?.totalInputTokens.toLocaleString()} tokens • Output: {usage?.totalOutputTokens.toLocaleString()} tokens
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                    Optimización Activa
                  </div>
                </div>

                {/* Recent History Table */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Actividad Reciente</h3>
                  <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02]">
                          <th className="px-6 py-4 font-black uppercase text-white/30 tracking-widest">Modelo</th>
                          <th className="px-6 py-4 font-black uppercase text-white/30 tracking-widest">Tokens</th>
                          <th className="px-6 py-4 font-black uppercase text-white/30 tracking-widest text-right">Coste Est.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {usage?.recentCalls?.map((call: any, i: number) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 text-white/70 font-bold">{call.model}</td>
                            <td className="px-6 py-4 text-white/50">{call.inputTokens + call.outputTokens}</td>
                            <td className="px-6 py-4 text-[#FFBD1B] font-black text-right">${call.cost.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Workspace / Team Management Section */}
        <section className="col-span-1 lg:col-span-12 mt-4">
           <div className="bg-white p-10 lg:p-12 rounded-[4rem] border border-[#EBE4DC] shadow-sm">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
               <div className="space-y-2">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-100 mb-2">
                   WORKSPACE
                 </div>
                 <h2 className="text-3xl font-black text-[#1A1B1E] flex items-center gap-3 tracking-tighter">
                   <Users className="w-8 h-8 text-[#FFBD1B]" />
                   Gestión de Equipo
                 </h2>
                 <p className="text-[#8E8B88] text-sm font-medium">Administra los accesos y roles de tu Workspace: <strong className="text-[#1A1B1E] bg-[#F9F6F2] px-2 py-0.5 rounded">Acme Corp</strong></p>
               </div>
               <button className="px-8 py-5 bg-[#1A1B1E] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#FFBD1B] hover:text-[#1A1B1E] transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2">
                 <UserPlus size={16} /> Invitar Miembro
               </button>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b-2 border-[#EBE4DC]">
                     <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Usuario</th>
                     <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Rol</th>
                     <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88]">Estado</th>
                     <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-[#8E8B88] text-right">Acciones</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#EBE4DC]">
                   {[
                     { name: 'Alejandro Tornero', email: 'alex@acme.com', role: 'Admin', status: 'Activo', initial: 'A', bg: 'bg-[#FFBD1B]/20 text-yellow-700' },
                     { name: 'Sarah Connor', email: 'sarah@acme.com', role: 'Marketing Manager', status: 'Activo', initial: 'S', bg: 'bg-emerald-100 text-emerald-700' },
                     { name: 'John Doe', email: 'john@acme.com', role: 'Editor', status: 'Invitado', initial: 'J', bg: 'bg-blue-100 text-blue-700' },
                   ].map((user, i) => (
                     <tr key={i} className="group hover:bg-[#F9F6F2] transition-colors">
                       <td className="py-6">
                         <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${user.bg}`}>
                             {user.initial}
                           </div>
                           <div>
                             <p className="font-bold text-[#1A1B1E] text-base">{user.name}</p>
                             <p className="text-[11px] font-medium text-[#8E8B88]">{user.email}</p>
                           </div>
                         </div>
                       </td>
                       <td className="py-6">
                         <select className="bg-white border border-[#EBE4DC] rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#1A1B1E] outline-none hover:border-[#1A1B1E] transition-colors cursor-pointer appearance-none shadow-sm" defaultValue={user.role}>
                           <option value="Admin">Admin</option>
                           <option value="Marketing Manager">Marketing Manager</option>
                           <option value="Editor">Editor</option>
                           <option value="Viewer">Viewer</option>
                         </select>
                       </td>
                       <td className="py-6">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${user.status === 'Activo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>
                           {user.status}
                         </span>
                       </td>
                       <td className="py-6 text-right">
                         <button className="p-3 text-[#8E8B88] hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                           <Trash2 size={18} />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </section>

      </div>
    </div>
  );
}
