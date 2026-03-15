"use client";

import React, { useState } from 'react';
import { 
  Video, 
  Type, 
  Workflow, 
  Compass, 
  PlusSquare, 
  Zap, 
  ImageIcon,
  Sparkles,
  Loader2,
  Scissors,
  FilePlus,
  Eye,
  Paintbrush,
  Layers,
  Download,
  ChevronRight,
  ChevronLeft,
  Globe
} from 'lucide-react';
import { NODE_REGISTRY } from './nodeRegistry';

interface SidebarProps {
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating?: boolean;
}

const Sidebar = ({ onGenerate, isGenerating = false }: SidebarProps) => {
  const [prompt, setPrompt] = useState('');

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await onGenerate(prompt);
    setPrompt('');
  };

  const TypeIndicators = ({ nodeType }: { nodeType: string }) => {
    const meta = NODE_REGISTRY[nodeType];
    if (!meta) return <div className="type-indicator-container"><div className="type-dot" /><div className="type-dot" /></div>;

    return (
      <div className="type-indicator-container">
        <div className="type-group items-start">
          {meta.inputs.length > 0 ? (
            meta.inputs.map((input, idx) => (
              <div key={idx} className={`type-dot ${input.type} active`} title={`Input: ${input.label} (${input.type})`} />
            ))
          ) : (
            <div className="type-dot" />
          )}
        </div>
        <div className="type-group items-end">
          {meta.outputs.length > 0 ? (
            meta.outputs.map((output, idx) => (
              <div key={idx} className={`type-dot ${output.type} active`} title={`Output: ${output.label} (${output.type})`} />
            ))
          ) : (
            <div className="type-dot" />
          )}
        </div>
      </div>
    );
  };

  return (
    <aside className="spaces-sidebar border-r border-white/5 bg-[#050505]">
      {/* AI Assistant Section & Brand Logo */}
      <div className="sidebar-category mb-6">
        <div className="px-2 mb-4">
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2.5 rounded-2xl group hover:border-cyan-500/50 transition-all cursor-pointer shadow-xl">
            <div className="relative w-9 h-9 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] overflow-hidden shrink-0">
               <Layers size={20} className="text-white relative z-10" />
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-black uppercase tracking-[3px] text-white leading-none">Media</span>
              <span className="text-[10px] font-black uppercase tracking-[1px] text-cyan-500 leading-tight">Composer</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 px-2 opacity-50">
          <Sparkles size={12} className="text-cyan-400 animate-pulse" />
          <h3 className="text-[9px] font-black text-white/60 uppercase tracking-[2px]">Agent Assistant</h3>
        </div>
        <div className="px-2">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Describe workflow modifications..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all min-h-[70px] resize-none mb-2"
          />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
          >
            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />} 
            {isGenerating ? 'Processing...' : 'Modify Space'}
          </button>
        </div>
      </div>

      <div className="px-2 mb-4 border-t border-white/5 pt-5">
        <div className="text-[9px] font-black text-gray-600 uppercase tracking-[3px] mb-4 flex items-center gap-2">
          <Layers size={12} /> Node Library
        </div>

        {/* 📥 INGESTA (Inputs) */}
        <div className="sidebar-category mb-6">
          <h3 className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
            <Download size={10} /> Ingesta
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="dndnode border-emerald-500/30 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]" onDragStart={(event) => onDragStart(event, 'mediaInput')} draggable title="Media Asset">
              <FilePlus size={12} className="text-emerald-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-emerald-500">Asset</span>
              <TypeIndicators nodeType="mediaInput" />
            </div>
            <div className="dndnode border-emerald-500/30 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]" onDragStart={(event) => onDragStart(event, 'promptInput')} draggable title="Prompt Input">
              <Type size={12} className="text-emerald-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-emerald-500">Prompt</span>
              <TypeIndicators nodeType="promptInput" />
            </div>
            <div className="dndnode border-emerald-500/30 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]" onDragStart={(event) => onDragStart(event, 'background')} draggable title="Canvas Base">
              <Paintbrush size={12} className="text-emerald-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-emerald-500">Canvas</span>
              <TypeIndicators nodeType="background" />
            </div>
            <div className="dndnode border-emerald-500/30 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]" onDragStart={(event) => onDragStart(event, 'urlImage')} draggable title="Web Carousel">
              <Globe size={12} className="text-emerald-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-emerald-500">Web</span>
              <TypeIndicators nodeType="urlImage" />
            </div>
          </div>
        </div>

        {/* 🧠 INTELIGENCIA (AI Processors) */}
        <div className="sidebar-category mb-6">
          <h3 className="text-[8px] font-black text-cyan-500/60 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
            <Zap size={10} /> Inteligencia
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="dndnode border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" onDragStart={(event) => onDragStart(event, 'backgroundRemover')} draggable title="Human Matting">
              <Scissors size={12} className="text-cyan-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-cyan-500">Matting</span>
              <TypeIndicators nodeType="backgroundRemover" />
            </div>
            <div className="dndnode border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" onDragStart={(event) => onDragStart(event, 'mediaDescriber')} draggable title="Vision Eye">
              <Eye size={12} className="text-cyan-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-cyan-500">Eye</span>
              <TypeIndicators nodeType="mediaDescriber" />
            </div>
            <div className="dndnode border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" onDragStart={(event) => onDragStart(event, 'enhancer')} draggable title="Enhancer">
              <Sparkles size={12} className="text-cyan-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-cyan-500">Enhance</span>
              <TypeIndicators nodeType="enhancer" />
            </div>
            <div className="dndnode border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" onDragStart={(event) => onDragStart(event, 'grokProcessor')} draggable title="Grok Studio">
              <Compass size={12} className="text-cyan-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-cyan-500">Grok</span>
              <TypeIndicators nodeType="grokProcessor" />
            </div>
            <div className="dndnode border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" onDragStart={(event) => onDragStart(event, 'nanoBanana')} draggable title="Nano Node">
              <Sparkles size={12} className="text-cyan-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-cyan-500">Nano</span>
              <TypeIndicators nodeType="nanoBanana" />
            </div>
            <div className="dndnode border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" onDragStart={(event) => onDragStart(event, 'geminiVideo')} draggable title="Gemini Video">
              <Video size={12} className="text-cyan-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-cyan-500">Veo 3.1</span>
              <TypeIndicators nodeType="geminiVideo" />
            </div>
            <div className="dndnode border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" onDragStart={(event) => onDragStart(event, 'runwayProcessor')} draggable title="Runway G3">
              <Video size={12} className="text-cyan-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-cyan-500">Runway</span>
              <TypeIndicators nodeType="runwayProcessor" />
            </div>
            <div className="dndnode border-cyan-500/30 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]" onDragStart={(event) => onDragStart(event, 'videoBackgroundRemoval')} draggable title="Video BG Removal">
              <Scissors size={12} className="text-cyan-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-cyan-500">VideoBG</span>
              <TypeIndicators nodeType="videoBackgroundRemoval" />
            </div>
          </div>
        </div>

        {/* 🧩 LÓGICA (Utility) */}
        <div className="sidebar-category mb-6">
          <h3 className="text-[8px] font-black text-blue-500/60 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
            <PlusSquare size={10} /> Lógica
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="dndnode border-blue-500/30 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]" onDragStart={(event) => onDragStart(event, 'concatenator')} draggable title="Concat">
              <PlusSquare size={12} className="text-blue-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-blue-500">Concat</span>
              <TypeIndicators nodeType="concatenator" />
            </div>
            <div className="dndnode border-blue-500/30 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]" onDragStart={(event) => onDragStart(event, 'space')} draggable title="Nested Space">
              <Layers size={12} className="text-blue-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-blue-500">Space</span>
              <TypeIndicators nodeType="space" />
            </div>
            <div className="dndnode border-blue-500/30 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]" onDragStart={(event) => onDragStart(event, 'spaceInput')} draggable title="Entry">
              <ChevronRight size={12} className="text-blue-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-blue-500">Entry</span>
              <TypeIndicators nodeType="spaceInput" />
            </div>
            <div className="dndnode border-blue-500/30 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]" onDragStart={(event) => onDragStart(event, 'spaceOutput')} draggable title="Exit">
              <ChevronLeft size={12} className="text-blue-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-blue-500">Exit</span>
              <TypeIndicators nodeType="spaceOutput" />
            </div>
          </div>
        </div>

        {/* 🎨 COMPOSICIÓN (Layout) */}
        <div className="sidebar-category mb-6">
          <h3 className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
            <Layers size={10} /> Composición
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="dndnode border-amber-500/30 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]" onDragStart={(event) => onDragStart(event, 'imageComposer')} draggable title="Composer">
              <Layers size={12} className="text-amber-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-amber-500">Layout</span>
              <TypeIndicators nodeType="imageComposer" />
            </div>
            <div className="dndnode border-amber-500/30 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]" onDragStart={(event) => onDragStart(event, 'imageExport')} draggable title="Exporter">
              <Download size={12} className="text-amber-500" /> <span className="uppercase tracking-tighter scale-90 font-black text-amber-500">Export</span>
              <TypeIndicators nodeType="imageExport" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 bg-white/5 rounded-xl border border-white/5 text-[10px] text-gray-400 font-medium leading-relaxed italic">
        "Focus on the flow, and the AI will follow."
      </div>
    </aside>
  );
};

export default Sidebar;
