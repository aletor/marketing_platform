"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Check, 
  Settings2,
  Calendar,
  Clock
} from 'lucide-react';

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
  const { screenToFlowPosition, setViewport, fitView } = useReactFlow();
  
  // Persistence state
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string>('');
  const [savedSpaces, setSavedSpaces] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // Fetch saved spaces on mount
  useEffect(() => {
    fetch('/api/spaces').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setSavedSpaces(data);
    }).catch(err => console.error('Fetch error:', err));
  }, []);

  const saveSpace = async (nameToSave?: string) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentId,
          name: nameToSave || currentName || 'Untitled Space',
          nodes,
          edges
        })
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedSpaces(data);
        if (!currentId) {
          // If it was a new save, find it in the list to set currentId
          const last = data[data.length - 1];
          setCurrentId(last.id);
          setCurrentName(last.name);
        }
      }
      setShowSaveModal(false);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const loadSpace = (space: any) => {
    setNodes(space.nodes || []);
    setEdges(space.edges || []);
    setCurrentId(space.id);
    setCurrentName(space.name);
    setShowLoadModal(false);
    
    // Smooth transition
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  };

  const deleteSpace = async (idToDelete: string) => {
    try {
      const res = await fetch(`/api/spaces?id=${idToDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (Array.isArray(data)) setSavedSpaces(data);
      if (currentId === idToDelete) {
        setCurrentId(null);
        setCurrentName('');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

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
          
          {/* Header Internal HUD */}
          <div className="absolute top-6 left-6 z-50 pointer-events-none">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${currentId ? 'bg-green-500' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                {currentId ? 'Synced' : 'Draft'}
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-tight">
                {currentName || 'Untitled Workflow'}
              </span>
            </div>
          </div>

          {/* Action HUD */}
          <div className="absolute top-6 right-6 z-50 flex gap-2">
            <button 
              onClick={() => setShowLoadModal(true)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105"
            >
              <FolderOpen size={14} className="text-rose-400" /> My Spaces
            </button>
            <button 
              onClick={() => currentId ? saveSpace() : setShowSaveModal(true)}
              disabled={isSaving}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/20 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 shadow-xl shadow-rose-900/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
              {currentId ? 'Save Changes' : 'Save Space'}
            </button>
          </div>

          {/* Legend HUD */}
          <div className="absolute bottom-6 left-6 flex gap-6 px-5 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl z-50 pointer-events-none shadow-2xl">
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
        </ReactFlow>

        {/* Modals */}
        {showSaveModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />
              <button 
                onClick={() => setShowSaveModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Save Workspace</h2>
              <p className="text-gray-400 text-xs mb-8">Give your AI pipeline a name to find it later in your hub.</p>
              
              <div className="relative mb-8">
                <Settings2 className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" size={18} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g., Cinematic Video Flow..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-rose-500/50 transition-colors"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveSpace()}
                />
              </div>

              <button 
                onClick={() => saveSpace()}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-rose-600/20"
              >
                CONFIRM AND SAVE
              </button>
            </div>
          </div>
        )}

        {showLoadModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl relative max-h-[80vh] flex flex-col">
              <button 
                onClick={() => setShowLoadModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Your Saved Spaces</h2>
              <p className="text-gray-400 text-xs mb-8">Select a configuration to restore it to the canvas.</p>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {savedSpaces.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                    <FolderOpen className="mx-auto mb-4 text-gray-600" size={40} />
                    <p className="text-gray-500 text-sm italic">No saved spaces found yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedSpaces.map((space) => (
                      <div key={space.id} className="group/item flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center border border-rose-500/30">
                          <Workflow size={20} className="text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate uppercase tracking-tight">{space.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                             <div className="flex items-center gap-1 text-[9px] text-gray-500 uppercase font-black tracking-widest">
                               <Calendar size={10} /> {new Date(space.updatedAt).toLocaleDateString()}
                             </div>
                             <div className="flex items-center gap-1 text-[9px] text-gray-500 uppercase font-black tracking-widest">
                               <Settings2 size={10} /> {space.nodes.length} Nodes
                             </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => deleteSpace(space.id)}
                            className="p-2.5 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            onClick={() => loadSpace(space)}
                            className="px-4 py-2 bg-white/10 hover:bg-white text-gray-400 hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            LOAD SPACE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SpacesPage() {
  return (
    <div className="w-screen h-screen bg-[#000] overflow-hidden">
      <ReactFlowProvider>
        <SpacesContent />
      </ReactFlowProvider>
    </div>
  );
}

import { Workflow, Loader2, X } from 'lucide-react';
