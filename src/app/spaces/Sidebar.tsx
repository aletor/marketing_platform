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
  Loader2
} from 'lucide-react';

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

  return (
    <aside className="spaces-sidebar">
      {/* AI Assistant Section */}
      <div className="sidebar-category mb-8">
        <div className="flex items-center gap-2 mb-4 px-2">
          <Sparkles size={16} className="text-amber-400 animate-pulse" />
          <h3 className="sidebar-category-title !mb-0">Space Assistant</h3>
        </div>
        <div className="px-2">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your workflow (e.g., 'Generate video from my prompt')..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-rose-500/50 transition-colors min-h-[80px] resize-none mb-3"
          />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/20"
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Architects at work...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Generate Space
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 px-2 border-t border-white/5 pt-6">
        <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center border border-rose-500/30">
          <Workflow size={16} className="text-rose-500" />
        </div>
        <span className="font-bold tracking-tight text-white uppercase text-sm">Node Library</span>
      </div>

      <div className="sidebar-category">
        <h3 className="sidebar-category-title">Core Inputs</h3>
        <div className="dndnode video" onDragStart={(event) => onDragStart(event, 'videoInput')} draggable>
          <Video size={16} /> Video Source
        </div>
        <div className="dndnode prompt" onDragStart={(event) => onDragStart(event, 'promptInput')} draggable>
          <Type size={16} /> Prompt Input
        </div>
      </div>

      <div className="sidebar-category">
        <h3 className="sidebar-category-title">Logic & Text</h3>
        <div className="dndnode tool" onDragStart={(event) => onDragStart(event, 'concatenator')} draggable>
          <PlusSquare size={16} /> Concat Prompts
        </div>
        <div className="dndnode tool" onDragStart={(event) => onDragStart(event, 'enhancer')} draggable>
          <Zap size={16} /> Prompt Enhancer
        </div>
      </div>

      <div className="sidebar-category">
        <h3 className="sidebar-category-title">AI Processors</h3>
        <div className="dndnode processor" onDragStart={(event) => onDragStart(event, 'runwayProcessor')} draggable>
          <Workflow size={16} /> RunwayML Gen-3
        </div>
        <div className="dndnode processor" onDragStart={(event) => onDragStart(event, 'grokProcessor')} draggable>
          <Compass size={16} /> Grok Imagine
        </div>
        <div className="dndnode processor" onDragStart={(event) => onDragStart(event, 'nanoBanana')} draggable>
          <ImageIcon size={16} /> Nano Banana 2
        </div>
      </div>

      <div className="mt-auto p-4 bg-white/5 rounded-xl border border-white/5 text-[10px] text-gray-500 leading-relaxed">
        Drag and drop components to the canvas to start building your AI pipeline.
      </div>
    </aside>
  );
};

export default Sidebar;
