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
  Globe,
  Crop
} from 'lucide-react';
import { NODE_REGISTRY } from './nodeRegistry';

// ── Key map: nodeType → shortcut key shown in the badge ──────────────────────
const NODE_KEYS: Record<string, string> = {
  mediaInput:        'm',
  promptInput:       'p',
  background:        'b',
  urlImage:          'u',
  backgroundRemover: 'r',
  mediaDescriber:    'd',
  enhancer:          'h',
  grokProcessor:     'g',
  nanoBanana:        'n',
  geminiVideo:       'v',
  concatenator:      'q',
  space:             's',
  spaceInput:        'i',
  spaceOutput:       'o',
  imageComposer:     'c',
  imageExport:       'e',
  painter:           'w',
  textOverlay:       't',
  crop:              'x',
  bezierMask:        'z',
};


const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
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

  // Small key badge shown top-left of each node button
  const KeyBadge = ({ nodeType }: { nodeType: string }) => {
    const key = NODE_KEYS[nodeType];
    if (!key) return null;
    return (
      <span
        style={{
          position: 'absolute',
          top: '5px',
          left: '6px',
          fontSize: '7px',
          fontWeight: 900,
          color: '#94a3b8',
          lineHeight: 1,
          letterSpacing: '0.05em',
          fontFamily: 'monospace',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {key}
      </span>
    );
  };

  return (
    <aside className="spaces-sidebar group/sidebar">
      {/* Expansion Indicator Arrow (Visible only when collapsed) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-12 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-lg text-slate-300 opacity-100 group-hover/sidebar:opacity-0 transition-opacity z-50 pointer-events-none">
        <ChevronRight size={16} />
      </div>

      <div className="collapsible-content flex flex-col h-full w-full opacity-0 group-hover/sidebar:opacity-100">
        <div className="px-1 mb-4 pt-4 flex-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-5 flex items-center gap-3 px-1 overflow-hidden">
            <Layers size={14} className="shrink-0" /> <span>Node Library</span>
          </div>

          {/* 📥 INGESTA (Inputs) */}
          <div className="sidebar-category mb-6">
            <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5 opacity-70 whitespace-nowrap overflow-hidden">
              <Download size={11} className="shrink-0" /> <span>Ingesta</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 transition-all duration-500">
              <div className="dndnode border-emerald-500/10 hover:border-emerald-500 relative" onDragStart={(event) => onDragStart(event, 'mediaInput')} draggable title="Media Asset · M">
                <KeyBadge nodeType="mediaInput" />
                <FilePlus size={14} className="text-emerald-500 shrink-0" /> <span className="text-emerald-600">Asset</span>
                <TypeIndicators nodeType="mediaInput" />
              </div>
              <div className="dndnode border-emerald-500/10 hover:border-emerald-500 relative" onDragStart={(event) => onDragStart(event, 'promptInput')} draggable title="Prompt Input · P">
                <KeyBadge nodeType="promptInput" />
                <Type size={14} className="text-emerald-500 shrink-0" /> <span className="text-emerald-600">Prompt</span>
                <TypeIndicators nodeType="promptInput" />
              </div>
              <div className="dndnode border-emerald-500/10 hover:border-emerald-500 relative" onDragStart={(event) => onDragStart(event, 'background')} draggable title="Canvas Base · B">
                <KeyBadge nodeType="background" />
                <Paintbrush size={14} className="text-emerald-500 shrink-0" /> <span className="text-emerald-600">Canvas</span>
                <TypeIndicators nodeType="background" />
              </div>
              <div className="dndnode border-emerald-500/10 hover:border-emerald-500 relative" onDragStart={(event) => onDragStart(event, 'urlImage')} draggable title="Web Carousel · U">
                <KeyBadge nodeType="urlImage" />
                <Globe size={14} className="text-emerald-500 shrink-0" /> <span className="text-emerald-600">Web</span>
                <TypeIndicators nodeType="urlImage" />
              </div>
            </div>
          </div>

          {/* 🧠 INTELIGENCIA (AI Processors) */}
          <div className="sidebar-category mb-3">
            <h3 className="text-[9px] font-black text-cyan-600 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5 opacity-70 whitespace-nowrap overflow-hidden">
              <Zap size={11} className="shrink-0" /> <span>Inteligencia</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 transition-all">
              <div className="dndnode border-cyan-500/10 hover:border-cyan-500 relative" onDragStart={(event) => onDragStart(event, 'backgroundRemover')} draggable title="Human Matting · R">
                <KeyBadge nodeType="backgroundRemover" />
                <Scissors size={14} className="text-cyan-500 shrink-0" /> <span className="text-cyan-600">Matting</span>
                <TypeIndicators nodeType="backgroundRemover" />
              </div>
              <div className="dndnode border-cyan-500/10 hover:border-cyan-500 relative" onDragStart={(event) => onDragStart(event, 'mediaDescriber')} draggable title="Vision Eye · D">
                <KeyBadge nodeType="mediaDescriber" />
                <Eye size={14} className="text-cyan-500 shrink-0" /> <span className="text-cyan-600">Eye</span>
                <TypeIndicators nodeType="mediaDescriber" />
              </div>
              <div className="dndnode border-cyan-500/10 hover:border-cyan-500 relative" onDragStart={(event) => onDragStart(event, 'enhancer')} draggable title="Enhancer · H">
                <KeyBadge nodeType="enhancer" />
                <Sparkles size={14} className="text-cyan-500 shrink-0" /> <span className="text-cyan-600">Enhance</span>
                <TypeIndicators nodeType="enhancer" />
              </div>
              <div className="dndnode border-cyan-500/10 hover:border-cyan-500 relative" onDragStart={(event) => onDragStart(event, 'grokProcessor')} draggable title="Grok Studio · G">
                <KeyBadge nodeType="grokProcessor" />
                <Compass size={14} className="text-cyan-500 shrink-0" /> <span className="text-cyan-600">Grok</span>
                <TypeIndicators nodeType="grokProcessor" />
              </div>
              <div className="dndnode border-cyan-500/10 hover:border-cyan-500 relative" onDragStart={(event) => onDragStart(event, 'nanoBanana')} draggable title="Nano Node · N">
                <KeyBadge nodeType="nanoBanana" />
                <Sparkles size={14} className="text-cyan-500 shrink-0" /> <span className="text-cyan-600">Nano</span>
                <TypeIndicators nodeType="nanoBanana" />
              </div>
              <div className="dndnode border-cyan-500/10 hover:border-cyan-500 relative" onDragStart={(event) => onDragStart(event, 'geminiVideo')} draggable title="Gemini Video · V">
                <KeyBadge nodeType="geminiVideo" />
                <Video size={14} className="text-cyan-500 shrink-0" /> <span className="text-cyan-600">Veo 3.1</span>
                <TypeIndicators nodeType="geminiVideo" />
              </div>
            </div>
          </div>

          {/* 🧩 LÓGICA (Utility) */}
          <div className="sidebar-category mb-3">
            <h3 className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5 opacity-70 whitespace-nowrap overflow-hidden">
              <PlusSquare size={11} className="shrink-0" /> <span>Lógica</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 transition-all">
              <div className="dndnode border-blue-500/10 hover:border-blue-500 relative" onDragStart={(event) => onDragStart(event, 'concatenator')} draggable title="Concat · Q">
                <KeyBadge nodeType="concatenator" />
                <PlusSquare size={14} className="text-blue-500 shrink-0" /> <span className="text-blue-600">Concat</span>
                <TypeIndicators nodeType="concatenator" />
              </div>
              <div className="dndnode border-blue-500/10 hover:border-blue-500 relative" onDragStart={(event) => onDragStart(event, 'space')} draggable title="Nested Space · S">
                <KeyBadge nodeType="space" />
                <Layers size={14} className="text-blue-500 shrink-0" /> <span className="text-blue-600">Space</span>
                <TypeIndicators nodeType="space" />
              </div>
              <div className="dndnode border-blue-500/10 hover:border-blue-500 relative" onDragStart={(event) => onDragStart(event, 'spaceInput')} draggable title="Entry · I">
                <KeyBadge nodeType="spaceInput" />
                <ChevronRight size={14} className="text-blue-500 shrink-0" /> <span className="text-blue-600">Entry</span>
                <TypeIndicators nodeType="spaceInput" />
              </div>
              <div className="dndnode border-blue-500/10 hover:border-blue-500 relative" onDragStart={(event) => onDragStart(event, 'spaceOutput')} draggable title="Exit · O">
                <KeyBadge nodeType="spaceOutput" />
                <ChevronLeft size={14} className="text-blue-500 shrink-0" /> <span className="text-blue-600">Exit</span>
                <TypeIndicators nodeType="spaceOutput" />
              </div>
            </div>
          </div>

          {/* 🎨 COMPOSICIÓN (Layout) */}
          <div className="sidebar-category mb-3">
            <h3 className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5 opacity-70 whitespace-nowrap overflow-hidden">
              <Layers size={11} className="shrink-0" /> <span>Composición</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 transition-all">
              <div className="dndnode border-amber-500/10 hover:border-amber-500 relative" onDragStart={(event) => onDragStart(event, 'imageComposer')} draggable title="Composer · C">
                <KeyBadge nodeType="imageComposer" />
                <Layers size={14} className="text-amber-500 shrink-0" /> <span className="text-amber-600">Layout</span>
                <TypeIndicators nodeType="imageComposer" />
              </div>
              <div className="dndnode border-amber-500/10 hover:border-amber-500 relative" onDragStart={(event) => onDragStart(event, 'imageExport')} draggable title="Exporter · E">
                <KeyBadge nodeType="imageExport" />
                <Download size={14} className="text-amber-500 shrink-0" /> <span className="text-amber-600">Export</span>
                <TypeIndicators nodeType="imageExport" />
              </div>
              <div className="dndnode border-amber-500/10 hover:border-amber-500 relative" onDragStart={(event) => onDragStart(event, 'painter')} draggable title="Painter · W">
                <KeyBadge nodeType="painter" />
                <Paintbrush size={14} className="text-amber-500 shrink-0" /> <span className="text-amber-600">Painter</span>
                <TypeIndicators nodeType="painter" />
              </div>
              <div className="dndnode border-amber-500/10 hover:border-amber-500 relative" onDragStart={(event) => onDragStart(event, 'textOverlay')} draggable title="Text Overlay · T">
                <KeyBadge nodeType="textOverlay" />
                <Type size={14} className="text-amber-500 shrink-0" /> <span className="text-amber-600">Text</span>
                <TypeIndicators nodeType="textOverlay" />
              </div>
              <div className="dndnode border-amber-500/10 hover:border-amber-500 relative" onDragStart={(event) => onDragStart(event, 'crop')} draggable title="Crop Asset · X">
                <KeyBadge nodeType="crop" />
                <Crop size={14} className="text-amber-500 shrink-0" /> <span className="text-amber-600">Crop</span>
                <TypeIndicators nodeType="crop" />
              </div>
              <div className="dndnode border-amber-500/10 hover:border-amber-500 relative" onDragStart={(event) => onDragStart(event, 'bezierMask')} draggable title="Bezier Mask · Z">
                <KeyBadge nodeType="bezierMask" />
                <Scissors size={14} className="text-amber-500 shrink-0" /> <span className="text-amber-600">Bezier</span>
                <TypeIndicators nodeType="bezierMask" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto p-5 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-400 font-medium leading-relaxed italic shadow-inner">
          "Focus on the flow, and the AI will follow."
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
