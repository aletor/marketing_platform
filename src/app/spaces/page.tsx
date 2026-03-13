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
  MediaInputNode, 
  PromptNode, 
  RunwayNode, 
  GrokNode, 
  ConcatenatorNode, 
  EnhancerNode, 
  NanoBananaNode,
  MaskExtractionNode,
  MediaDescriberNode,
  BackgroundNode,
  ImageComposerNode,
  ImageExportNode,
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
  Clock,
  Copy,
  Workflow,
  Loader2,
  X,
  Edit2
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
  mediaInput: MediaInputNode,
  promptInput: PromptNode,
  runwayProcessor: RunwayNode,
  grokProcessor: GrokNode,
  concatenator: ConcatenatorNode,
  enhancer: EnhancerNode,
  nanoBanana: NanoBananaNode,
  maskExtraction: MaskExtractionNode,
  mediaDescriber: MediaDescriberNode,
  background: BackgroundNode,
  imageComposer: ImageComposerNode,
  imageExport: ImageExportNode,
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isGeneratingAssistant, setIsGeneratingAssistant] = useState(false);

  // Fetch saved spaces on mount
  useEffect(() => {
    fetch('/api/spaces').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setSavedSpaces(data);
    }).catch(err => console.error('Fetch error:', err));
  }, []);

  const saveSpace = async (nameToSave?: string) => {
    setIsSaving(true);
    try {
      const spaceToSave = {
        id: currentId,
        name: nameToSave || currentName || 'Untitled Space',
        nodes,
        edges
      };

      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spaceToSave)
      });
      
      const updatedList = await res.json();
      
      if (Array.isArray(updatedList)) {
        setSavedSpaces(updatedList);
        
        // If we were saving a new space, we need the ID from the server
        if (!currentId) {
          const matched = updatedList.find((s: any) => s.name === spaceToSave.name);
          if (matched) {
            setCurrentId(matched.id);
            setCurrentName(matched.name);
          }
        }
      }
      setShowSaveModal(false);
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving space. Check console for details.');
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

  const duplicateSpace = async (space: any) => {
    setIsSaving(true);
    try {
      const copyToSave = {
        name: `${space.name} (Copy)`,
        nodes: space.nodes,
        edges: space.edges
      };

      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyToSave)
      });
      
      const updatedList = await res.json();
      if (Array.isArray(updatedList)) setSavedSpaces(updatedList);
    } catch (err) {
      console.error('Duplicate error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const renameSpace = async (id: string, newName: string) => {
    const spaceToUpdate = savedSpaces.find(s => s.id === id);
    if (!spaceToUpdate) return;

    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...spaceToUpdate,
          name: newName
        })
      });
      const updatedList = await res.json();
      if (Array.isArray(updatedList)) {
        setSavedSpaces(updatedList);
        if (currentId === id) setCurrentName(newName);
      }
      setEditingId(null);
    } catch (err) {
      console.error('Rename error:', err);
    }
  };

  const onGenerateAssistant = async (prompt: string) => {
    setIsGeneratingAssistant(true);
    try {
      const res = await fetch('/api/spaces/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      
      if (data.nodes && data.edges) {
        setNodes(data.nodes);
        setEdges(data.edges);
        setCurrentId(null);
        setCurrentName('');
        
        // Smooth transition to center generated workflow
        setTimeout(() => {
          fitView({ padding: 0.2, duration: 800 });
        }, 100);
      }
    } catch (err) {
      console.error('Assistant Generation error:', err);
      alert('AI Assistant failed to generate the space. Try again.');
    } finally {
      setIsGeneratingAssistant(false);
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

      const reactFlowType = event.dataTransfer.getData('application/reactflow');
      const files = Array.from(event.dataTransfer.files);

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Handle Native File Drops
      if (files.length > 0) {
        files.forEach(async (file, index) => {
          const type = (name: string, mime: string): any => {
            if (mime.startsWith('video/') || name.match(/\.(mp4|mov|avi|webm|mkv)$/i)) return 'video';
            if (mime.startsWith('image/') || name.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) return 'image';
            if (mime.startsWith('audio/') || name.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) return 'audio';
            if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
            if (mime.startsWith('text/') || name.endsWith('.txt')) return 'txt';
            return 'url';
          };

          const fileType = type(file.name, file.type);
          const nodeId = `node_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`;
          
          const newNode = {
            id: nodeId,
            type: 'mediaInput',
            position: { x: position.x + (index * 20), y: position.y + (index * 20) },
            data: { 
              value: '', 
              type: fileType, 
              label: file.name,
              loading: true,
              source: 'upload'
            },
          };

          setNodes((nds) => [...nds, newNode]);

          // Trigger Upload
          const formData = new FormData();
          formData.append('file', file);
          try {
            const res = await fetch('/api/runway/upload', { method: 'POST', body: formData });
            const json = await res.json();
            if (json.url) {
              setNodes((nds) => nds.map((n) => n.id === nodeId ? {
                ...n,
                data: {
                  ...n.data,
                  value: json.url,
                  loading: false,
                  metadata: {
                    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                    resolution: (fileType === 'video' || fileType === 'image') ? 'Auto-detected' : '-',
                    codec: file.type.split('/')[1]?.toUpperCase() || 'RAW'
                  }
                }
              } : n));
            }
          } catch (err) {
            console.error("Auto-drop upload error:", err);
            setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: { ...n.data, loading: false, error: true } } : n));
          }
        });
        return;
      }

      // Handle Sidebar Drops
      if (!reactFlowType) return;

      const newNode = {
        id: `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: reactFlowType,
        position,
        data: { value: '', label: `${reactFlowType} node` },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div className="flex w-full h-full" ref={reactFlowWrapper}>
      <Sidebar onGenerate={onGenerateAssistant} isGenerating={isGeneratingAssistant} />
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
          <div className="absolute bottom-6 left-6 flex flex-wrap gap-x-6 gap-y-3 px-6 py-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl z-50 pointer-events-none shadow-2xl max-w-[600px]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prompt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Video</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sound</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mask</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TXT</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">URL</span>
            </div>
            <div className="border-l border-white/10 ml-2 pl-4 flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/40 text-[8px] font-black text-red-500">X</div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Disconnect wire</span>
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
                          {editingId === space.id ? (
                            <input 
                              autoFocus
                              type="text"
                              className="bg-white/10 border border-rose-500/50 rounded-lg px-2 py-1 text-sm font-bold text-white w-full focus:outline-none"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={() => renameSpace(space.id, editingName)}
                              onKeyDown={(e) => e.key === 'Enter' && renameSpace(space.id, editingName)}
                            />
                          ) : (
                            <h4 
                              onClick={() => {
                                setEditingId(space.id);
                                setEditingName(space.name);
                              }}
                              className="text-sm font-bold text-white truncate uppercase tracking-tight cursor-pointer hover:text-rose-500 flex items-center gap-2 group/title"
                            >
                              {space.name}
                              <Edit2 size={12} className="opacity-0 group-hover/title:opacity-50 transition-opacity" />
                            </h4>
                          )}
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
                            onClick={() => duplicateSpace(space)}
                            title="Duplicate Space"
                            className="p-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            onClick={() => deleteSpace(space.id)}
                            title="Delete Space"
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
