"use client";

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnConnect,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { 
  VideoNode, 
  PromptNode, 
  RunwayNode, 
  GrokNode, 
  ConcatenatorNode, 
  EnhancerNode, 
  NanoBananaNode,
  ButtonEdge 
} from './CustomNodes';
import Sidebar from './Sidebar';
import './spaces.css';

const initialNodes: Node[] = [
  {
    id: 'welcome-prompt',
    type: 'promptInput',
    data: { value: 'A high-tech digital laboratory with neon lights and floating holograms' },
    position: { x: 400, y: 150 },
  }
];

const nodeTypes: any = {
  videoInput: VideoNode,
  promptInput: PromptNode,
  runwayProcessor: RunwayNode,
  grokProcessor: GrokNode,
  concatenator: ConcatenatorNode,
  enhancer: EnhancerNode,
  nanoBanana: NanoBananaNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
};

const defaultEdgeOptions = {
  type: 'buttonEdge',
  animated: true,
};

const initialEdges: Edge[] = [];

const SpacesContent = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type,
        position,
        data: { value: '', label: `${type} node` },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="flex w-full h-full" ref={reactFlowWrapper}>
      <Sidebar />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          className="spaces-canvas"
        >
          <Background color="#111" gap={40} size={1} />
          <Controls showInteractive={false} className="bg-black/50 border-white/10 rounded-lg overflow-hidden" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default function SpacesPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <header className="px-8 py-4 bg-[#050505] border-b border-white/5 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <Workflow size={20} className="text-rose-500" />
          <h1 className="text-white font-black tracking-tighter text-xl uppercase">
            AI SPACES <span className="text-rose-600">STUDIO</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden md:flex gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
             <span>v1.0.4-beta</span>
             <span>•</span>
             <span>High Performance Mode</span>
           </div>
           <button className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-rose-600/20">
             SAVE PROJECT
           </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden relative">
        <ReactFlowProvider>
          <SpacesContent />
        </ReactFlowProvider>

        {/* Legend */}
        <div className="absolute bottom-6 left-80 flex gap-6 px-5 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl z-20 pointer-events-none shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prompt Logic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Video Stream</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image Output</span>
          </div>
          <div className="border-l border-white/10 ml-2 pl-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/40 text-[8px] font-black text-red-500">X</div>
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Click wire to disconnect</span>
          </div>
        </div>
      </main>
    </div>
  );
}

import { Workflow } from 'lucide-react';
