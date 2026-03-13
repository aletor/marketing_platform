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
  UrlImageNode,
  SpaceNode,
  SpaceInputNode,
  SpaceOutputNode,
  ButtonEdge 
} from './CustomNodes';
import Sidebar from './Sidebar';
import './spaces.css';
import { NODE_REGISTRY } from './nodeRegistry';
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
  Edit2,
  Maximize,
  LayoutGrid,
  ChevronLeft,
  Layers
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
  urlImage: UrlImageNode,
  space: SpaceNode,
  spaceInput: SpaceInputNode,
  spaceOutput: SpaceOutputNode,
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
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string>('');
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [spacesMap, setSpacesMap] = useState<Record<string, any>>({});
  const [metadata, setMetadata] = useState<any>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isGeneratingAssistant, setIsGeneratingAssistant] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>([]);

  // Helper to detect structure and data output from a space
  const analyzeSpaceStructure = (nodes: any[], edges: any[]): { 
    type: string, 
    value: string | null, 
    hasInput: boolean, 
    hasOutput: boolean,
    internalCategories: string[] 
  } => {
    const inputNode = nodes.find(n => n.type === 'spaceInput');
    const outputNode = nodes.find(n => n.type === 'spaceOutput');
    
    // Extract internal categories for visualization
    const categoriesSet = new Set<string>();
    nodes.forEach(n => {
      const type = (n.type || '').toLowerCase();
      
      // AI Category (Grok, Runway, Assistants)
      if (type.includes('grok') || type.includes('runway') || type.includes('assistant') || type.includes('processor')) {
        categoriesSet.add('ai');
      } 
      
      // Logic/Composition Category (Composers, Concatenators, Batch)
      if (type.includes('composer') || type.includes('concatenator') || type.includes('batch')) {
        categoriesSet.add('logic');
      }

      // Prompt Category
      if (type.includes('prompt')) {
        categoriesSet.add('prompt');
      }

      // Media Categories (Video, Image)
      if (type.includes('video')) {
        categoriesSet.add('video');
      } else if ((type.includes('image') || type.includes('media')) && !type.includes('composer') && type !== 'spaceinput' && type !== 'spaceoutput') {
        categoriesSet.add('image');
      }

      // Canvas Category (Backgrounds)
      if (type.includes('background')) {
        categoriesSet.add('canvas');
      }

      // Tool Category (Masking, Extraction, Describing)
      if (type.includes('mask') || type.includes('extraction') || type.includes('describer')) {
        categoriesSet.add('tool');
      }
    });

    const result = {
      type: 'url',
      value: null as string | null,
      hasInput: !!inputNode,
      hasOutput: !!outputNode,
      internalCategories: Array.from(categoriesSet).slice(0, 5) // Show up to 5 icons now
    };

    if (!outputNode) return result;

    const incomingEdge = edges.find(e => e.target === outputNode.id && e.targetHandle === 'in');
    if (!incomingEdge) return result;

    const sourceNode = nodes.find(n => n.id === incomingEdge.source);
    if (!sourceNode) return result;

    result.value = sourceNode.data?.value || null;

    // Try to guess type from source handle or node type or data.type
    const sourceHandleId = (incomingEdge.sourceHandle || '').toLowerCase();
    const nodeType = (sourceNode.type || '').toLowerCase();
    const dataType = (sourceNode.data?.type || '').toLowerCase();

    if (sourceHandleId.includes('image') || nodeType.includes('image') || dataType === 'image') result.type = 'image';
    else if (sourceHandleId.includes('video') || nodeType.includes('video') || dataType === 'video') result.type = 'video';
    else if (sourceHandleId.includes('prompt') || nodeType.includes('prompt')) result.type = 'prompt';
    else if (sourceHandleId.includes('mask')) result.type = 'mask';
    
    return result;
  };

  // Navigation Logic
  const handleEnterSpace = useCallback((e: any) => {
    const { nodeId, spaceId } = e.detail;
    const currentId = activeSpaceId || 'root';
    
    // 1. Prepare modern clones of current state
    let targetSpaceId = spaceId;
    let newFullSpacesMap = { ...spacesMap };
    let finalNodesInCurrentSpace = [...nodes];
    let finalEdgesInCurrentSpace = [...edges];

    // 2. If creating NEW sub-space, register it in the current parent snapshot
    if (!targetSpaceId) {
      targetSpaceId = `space_${Date.now()}`;
      
      // Update the trigger node in the snapshot we are about to save
      finalNodesInCurrentSpace = finalNodesInCurrentSpace.map(n => 
        n.id === nodeId ? { ...n, data: { ...n.data, spaceId: targetSpaceId, hasInput: true, hasOutput: true } } : n
      );

      // Initialize the target space entry
      newFullSpacesMap[targetSpaceId] = {
        id: targetSpaceId,
        name: `Nested Space ${Object.keys(spacesMap).length + 1}`,
        nodes: [
          { id: 'in', type: 'spaceInput', position: { x: 100, y: 200 }, data: { label: 'Input' } },
          { id: 'out', type: 'spaceOutput', position: { x: 800, y: 200 }, data: { label: 'Output' } }
        ],
        edges: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // 3. Commit the CURRENT space state to the map (Atomic Save)
    const structure = analyzeSpaceStructure(finalNodesInCurrentSpace, finalEdgesInCurrentSpace);
    newFullSpacesMap[currentId] = {
      ...(newFullSpacesMap[currentId] || {}),
      id: currentId,
      nodes: finalNodesInCurrentSpace,
      edges: finalEdgesInCurrentSpace,
      outputType: structure.type,
      outputValue: structure.value,
      hasInput: structure.hasInput,
      hasOutput: structure.hasOutput,
      internalCategories: structure.internalCategories,
      updatedAt: new Date().toISOString()
    };

    // 4. Perform the transition
    const targetSpace = newFullSpacesMap[targetSpaceId];
    if (targetSpace) {
      // Sync local UI state to parent first (for the trigger node update to be visible)
      setNodes(finalNodesInCurrentSpace);
      
      // Then switch context
      setNodes(targetSpace.nodes || []);
      setEdges(targetSpace.edges || []);
      
      if (targetSpaceId !== activeSpaceId) {
        setNavigationStack(prev => [...prev, currentId]);
      }
      
      setActiveSpaceId(targetSpaceId);
      setSpacesMap(newFullSpacesMap);
      
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [activeSpaceId, nodes, edges, spacesMap, setNodes, setEdges, fitView]);

  const handleGoBack = useCallback(() => {
    if (navigationStack.length === 0) return;
    
    const newStack = [...navigationStack];
    const parentSpaceId = newStack.pop();
    const currentId = activeSpaceId || 'root';
    const structure = analyzeSpaceStructure(nodes, edges);
    
    // Atomic Save of current sub-space before leaving
    const updatedSpacesMap = {
      ...spacesMap,
      [currentId]: {
        ...(spacesMap[currentId] || {}),
        id: currentId,
        nodes: [...nodes],
        edges: [...edges],
        outputType: structure.type,
        outputValue: structure.value,
        hasInput: structure.hasInput,
        hasOutput: structure.hasOutput,
        internalCategories: structure.internalCategories,
        updatedAt: new Date().toISOString()
      }
    };

    const parentSpace = updatedSpacesMap[parentSpaceId as string];
    if (parentSpace) {
      // Propagation: Update the SpaceNode in the parent graph with the detected type AND value
      const updatedParentNodes = (parentSpace.nodes || []).map((n: any) => {
        if (n.type === 'space' && n.data.spaceId === currentId) {
          return { 
            ...n, 
            data: { 
              ...n.data, 
              outputType: structure.type, 
              value: structure.value,
              hasInput: structure.hasInput,
              hasOutput: structure.hasOutput,
              internalCategories: structure.internalCategories
            } 
          };
        }
        return n;
      });

      setNodes(updatedParentNodes);
      setEdges(parentSpace.edges || []);
      setActiveSpaceId(parentSpaceId === 'root' ? null : (parentSpaceId || null));
      setNavigationStack(newStack);
      setSpacesMap(updatedSpacesMap);
      
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [activeSpaceId, nodes, edges, spacesMap, navigationStack, setNodes, setEdges, fitView]);

  useEffect(() => {
    window.addEventListener('enter-space', handleEnterSpace);
    return () => window.removeEventListener('enter-space', handleEnterSpace);
  }, [handleEnterSpace]);

  // Fetch saved projects on mount
  useEffect(() => {
    fetch('/api/spaces').then(res => res.json()).then(data => {
      if (Array.isArray(data)) setSavedProjects(data);
    }).catch(err => console.error('Fetch error:', err));
  }, []);

  const saveProject = async (nameToSave?: string) => {
    setIsSaving(true);
    try {
      // Synchronize current nodes/edges to the active space in the map
      const updatedSpacesMap = {
        ...spacesMap,
        [activeSpaceId as string]: {
          ...spacesMap[activeSpaceId as string],
          nodes,
          edges,
          updatedAt: new Date().toISOString()
        }
      };

      const projectToSave = {
        id: activeProjectId,
        name: nameToSave || currentName || 'Untitled Project',
        rootSpaceId: activeProjectId || undefined, // Simple for now
        spaces: updatedSpacesMap,
        metadata: metadata
      };

      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectToSave)
      });
      
      const updatedList = await res.json();
      
      if (Array.isArray(updatedList)) {
        setSavedProjects(updatedList);
        
        // If we were saving a new project, we need the active IDs from the server's last added project
        if (!activeProjectId) {
           const newest = updatedList[updatedList.length - 1];
           setActiveProjectId(newest.id);
           setActiveSpaceId(newest.rootSpaceId);
           setCurrentName(newest.name);
           setSpacesMap(newest.spaces);
        } else {
           setSpacesMap(updatedSpacesMap);
        }
      }
      setShowSaveModal(false);
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving project. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const loadProject = (project: any) => {
    const rootSpace = project.spaces[project.rootSpaceId];
    setNodes(rootSpace.nodes || []);
    setEdges(rootSpace.edges || []);
    setActiveProjectId(project.id);
    setActiveSpaceId(project.rootSpaceId);
    setCurrentName(project.name);
    setSpacesMap(project.spaces);
    setMetadata(project.metadata || {});
    setNavigationStack([]); // Clear stack on new project load
    setShowLoadModal(false);
    
    // Smooth transition
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 });
    }, 100);
  };

  const deleteProject = async (idToDelete: string) => {
    try {
      const res = await fetch(`/api/spaces?id=${idToDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (Array.isArray(data)) setSavedProjects(data);
      if (activeProjectId === idToDelete) {
        setActiveProjectId(null);
        setActiveSpaceId(null);
        setCurrentName('');
        setSpacesMap({});
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const duplicateProject = async (project: any) => {
    setIsSaving(true);
    try {
      const copyToSave = {
        name: `${project.name} (Copy)`,
        spaces: project.spaces,
        rootSpaceId: project.rootSpaceId,
        metadata: project.metadata
      };

      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copyToSave)
      });
      
      const updatedList = await res.json();
      if (Array.isArray(updatedList)) setSavedProjects(updatedList);
    } catch (err) {
      console.error('Duplicate error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const renameProject = async (id: string, newName: string) => {
    const projectToUpdate = savedProjects.find(p => p.id === id);
    if (!projectToUpdate) return;

    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectToUpdate,
          name: newName
        })
      });
      const updatedList = await res.json();
      if (Array.isArray(updatedList)) {
        setSavedProjects(updatedList);
        if (activeProjectId === id) setCurrentName(newName);
      }
      setEditingId(null);
    } catch (err) {
      console.error('Rename error:', err);
    }
  };

  const autoLayoutNodes = useCallback(() => {
    const nodeWidth = 350;
    const nodeHeight = 450;
    const paddingX = 250; // Increased from 100
    const paddingY = 150; // Increased from 50

    // 1. Build dependency map
    const incomingEdges: Record<string, string[]> = {};
    nodes.forEach(n => incomingEdges[n.id] = []);
    edges.forEach(e => {
      if (incomingEdges[e.target]) incomingEdges[e.target].push(e.source);
    });

    // 2. Identify layers (Sugiyama-style)
    const layers: Record<string, number> = {};
    const getLayer = (nodeId: string, visited = new Set()): number => {
      if (layers[nodeId] !== undefined) return layers[nodeId];
      if (visited.has(nodeId)) return 0; // Prevent circularity crashes
      
      visited.add(nodeId);
      const deps = incomingEdges[nodeId] || [];
      if (deps.length === 0) {
        layers[nodeId] = 0;
        return 0;
      }
      
      const maxDepLayer = Math.max(...deps.map(d => getLayer(d, visited)));
      layers[nodeId] = maxDepLayer + 1;
      return layers[nodeId];
    };

    nodes.forEach(n => getLayer(n.id));

    // 3. Group nodes by layer
    const grouped: Record<number, string[]> = {};
    Object.entries(layers).forEach(([id, layer]) => {
      if (!grouped[layer]) grouped[layer] = [];
      grouped[layer].push(id);
    });

    // 4. Calculate new positions
    const newNodes = nodes.map(node => {
      const layer = layers[node.id] || 0;
      const indexInLayer = grouped[layer].indexOf(node.id);
      
      // Vertical centering: find total height of this layer
      const layerNodes = grouped[layer].length;
      const totalLayerHeight = layerNodes * nodeHeight + (layerNodes - 1) * paddingY;
      const startY = -totalLayerHeight / 2;

      return {
        ...node,
        position: {
          x: layer * (nodeWidth + paddingX),
          y: startY + indexInLayer * (nodeHeight + paddingY)
        }
      };
    });

    setNodes(newNodes);
    setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
  }, [nodes, edges, setNodes, fitView]);

  const onGenerateAssistant = async (prompt: string) => {
    setIsGeneratingAssistant(true);
    try {
      const res = await fetch('/api/spaces/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          currentNodes: nodes,
          currentEdges: edges
        })
      });
      const data = await res.json();
      
      if (data.nodes && data.edges) {
        // Validation: Ensure all nodes have a valid position {x, y}
        const validatedNodes = data.nodes.map((n: any) => ({
          ...n,
          position: n.position || { x: 0, y: 0 } // Fail-safe default
        }));

        setNodes(validatedNodes);
        setEdges(data.edges);
        setActiveProjectId(null);
        setActiveSpaceId(null);
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
    (params) => setEdges((eds) => addEdge({ ...params, type: 'buttonEdge' }, eds)),
    [setEdges]
  );

  const isValidConnection = useCallback((connection: any) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // Get source handle type
    const sourceMetadata = NODE_REGISTRY[sourceNode.type];
    const sourceHandleType = sourceMetadata?.outputs.find(o => o.id === connection.sourceHandle)?.type;

    // Get target handle type
    const targetMetadata = NODE_REGISTRY[targetNode.type];
    let targetHandleType = targetMetadata?.inputs.find(i => i.id === connection.targetHandle)?.type;

    // Handle "layer-n" inputs for composer (they are always images)
    if (connection.targetHandle?.startsWith('layer-')) {
      targetHandleType = 'image';
    }

    // Special cases for generic mediaInput
    if (sourceNode.type === 'mediaInput') {
       // mediaInput identifies as 'url' in registry, but we can be more specific if its data.type matches target
       const actualType = (sourceNode.data as any)?.type; // image, video, audio
       if (actualType === targetHandleType) return true;
    }

    // If source or target is explicitly 'url', allow it (most flexible)
    if (sourceHandleType === 'url' || targetHandleType === 'url') return true;

    // Match exact types
    return sourceHandleType === targetHandleType;
  }, [nodes]);

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
                  s3Key: json.s3Key, // Store physical key for cleanup
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
          isValidConnection={isValidConnection}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          minZoom={0.1}
          maxZoom={4}
          className="spaces-canvas"
        >
          <Background color="#111" gap={40} size={1} />
          
          {/* Header Internal HUD / Breadcrumbs */}
          <div key="header-hud" className="absolute top-6 left-6 z-50 flex items-center gap-2">
            <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${activeProjectId ? 'bg-green-500' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                {activeProjectId ? 'Synced' : 'Draft'}
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-tight">
                {currentName || 'Untitled Workflow'}
              </span>
            </div>
            
            {navigationStack.length > 0 && (
              <>
                <div className="w-6 h-[1px] bg-white/10" />
                <button 
                  onClick={handleGoBack}
                  className="px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest transition-all group pointer-events-auto"
                >
                  <ChevronLeft size={14} className="text-cyan-400 group-hover:-translate-x-1 transition-transform" />
                  Return
                </button>
                <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center gap-2">
                   <Layers size={12} className="text-cyan-400" />
                   <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                     {spacesMap[activeSpaceId as string]?.name || 'Sub-Space'}
                   </span>
                </div>
              </>
            )}
          </div>

          {/* Action HUD */}
          <div key="action-hud" className="absolute top-6 right-6 z-50 flex gap-2">
            <button 
              onClick={autoLayoutNodes}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105"
            >
              <LayoutGrid size={14} className="text-emerald-400" /> Order Nodes
            </button>
            <button 
              onClick={() => fitView({ padding: 0.2, duration: 800 })}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105"
            >
              <Maximize size={14} className="text-cyan-400" /> Fit View
            </button>
            <button 
              onClick={() => setShowLoadModal(true)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105"
            >
              <FolderOpen size={14} className="text-rose-400" /> My Spaces
            </button>
            <button 
              onClick={() => activeProjectId ? saveProject() : setShowSaveModal(true)}
              disabled={isSaving}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/20 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 shadow-xl shadow-rose-900/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
              {activeProjectId ? 'Save Changes' : 'Save Project'}
            </button>
          </div>

          {/* Legend HUD */}
          <div key="legend-hud" className="absolute bottom-6 left-6 flex flex-wrap gap-x-6 gap-y-3 px-6 py-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl z-50 pointer-events-none shadow-2xl max-w-[600px]">
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
                  onKeyDown={(e) => e.key === 'Enter' && saveProject()}
                />
              </div>

              <button 
                onClick={() => saveProject()}
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
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Your Projects</h2>
              <p className="text-gray-400 text-xs mb-8">Select a configuration to restore it to the canvas.</p>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {savedProjects.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
                    <FolderOpen className="mx-auto mb-4 text-gray-600" size={40} />
                    <p className="text-gray-500 text-sm italic">No saved projects found yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedProjects.map((project) => (
                      <div key={project.id} className="group/item flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all">
                        <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center border border-rose-500/30">
                          <Workflow size={20} className="text-rose-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingId === project.id ? (
                            <input 
                              autoFocus
                              type="text"
                              className="bg-white/10 border border-rose-500/50 rounded-lg px-2 py-1 text-sm font-bold text-white w-full focus:outline-none"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={() => renameProject(project.id, editingName)}
                              onKeyDown={(e) => e.key === 'Enter' && renameProject(project.id, editingName)}
                            />
                          ) : (
                            <h4 
                              onClick={() => {
                                setEditingId(project.id);
                                setEditingName(project.name);
                              }}
                              className="text-sm font-bold text-white truncate uppercase tracking-tight cursor-pointer hover:text-rose-500 flex items-center gap-2 group/title"
                            >
                              {project.name}
                              <Edit2 size={12} className="opacity-0 group-hover/title:opacity-50 transition-opacity" />
                            </h4>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                             <div className="flex items-center gap-1 text-[9px] text-gray-500 uppercase font-black tracking-widest">
                               <Calendar size={10} /> {new Date(project.updatedAt).toLocaleDateString()}
                             </div>
                             <div className="flex items-center gap-1 text-[9px] text-gray-500 uppercase font-black tracking-widest">
                               <Settings2 size={10} /> {Object.keys(project.spaces || {}).length} Spaces
                             </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => duplicateProject(project)}
                            title="Duplicate Project"
                            className="p-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            onClick={() => setProjectToDelete(project)}
                            title="Delete Project"
                            className="p-2.5 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button 
                            onClick={() => loadProject(project)}
                            className="px-4 py-2 bg-white/10 hover:bg-white text-gray-400 hover:text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            LOAD PROJECT
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

        {/* Delete Confirmation Modal */}
        {projectToDelete && (
          <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-rose-500/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(244,63,94,0.2)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
              
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 mb-6 mx-auto">
                <Trash2 size={32} className="text-rose-500 mr-0" />
              </div>

              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter text-center">Delete Project?</h2>
              <p className="text-gray-400 text-xs mb-8 text-center px-4 leading-relaxed">
                This will permanently remove <span className="text-white font-bold">"{projectToDelete.name}"</span> and all its associated media assets from the server.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={() => {
                    deleteProject(projectToDelete.id);
                    setProjectToDelete(null);
                  }}
                  className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-rose-600/20"
                >
                  DELETE ALL
                </button>
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
