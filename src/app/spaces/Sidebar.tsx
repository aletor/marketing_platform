"use client";

import React from 'react';
import { 
  Video, 
  Type, 
  Workflow, 
  Compass, 
  PlusSquare, 
  Zap, 
  ImageIcon,
  Maximize2
} from 'lucide-react';

const Sidebar = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="spaces-sidebar">
      <div className="flex items-center gap-2 mb-6 px-2">
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
