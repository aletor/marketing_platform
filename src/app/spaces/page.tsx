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
  BackgroundRemoverNode,
  MediaDescriberNode,
  BackgroundNode,
  ImageComposerNode,
  ImageExportNode,
  UrlImageNode,
  SpaceNode,
  SpaceInputNode,
  SpaceOutputNode,
  VideoBackgroundRemovalNode,
  GeminiVideoNode,
  ButtonEdge 
} from './CustomNodes';
import Sidebar from './Sidebar';
import { AgentHUD } from './AgentHUD';
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
  Maximize2,
  LayoutGrid,
  ChevronLeft,
  Layers,
  PlusSquare,
  Scissors,
  Cloud,
  Sparkles,
  Zap
} from 'lucide-react';

const initialNodes: Node[] = [];

const nodeTypes: any = {
  mediaInput: MediaInputNode,
  promptInput: PromptNode,
  runwayProcessor: RunwayNode,
  grokProcessor: GrokNode,
  concatenator: ConcatenatorNode,
  enhancer: EnhancerNode,
  nanoBanana: NanoBananaNode,
  backgroundRemover: BackgroundRemoverNode,
  mediaDescriber: MediaDescriberNode,
  background: BackgroundNode,
  imageComposer: ImageComposerNode,
  imageExport: ImageExportNode,
  urlImage: UrlImageNode,
  space: SpaceNode,
  spaceInput: SpaceInputNode,
  spaceOutput: SpaceOutputNode,
  videoBackgroundRemoval: VideoBackgroundRemovalNode,
  geminiVideo: GeminiVideoNode,
};

const edgeTypes = {
  buttonEdge: ButtonEdge,
  default: ButtonEdge, // Fallback for stability
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
  const [activeSpaceId, setActiveSpaceId] = useState<string>('root');
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
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId?: string } | null>(null);
  
  // Access Security
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState(false);

  const handleAuth = (val: string) => {
    setPasscode(val);
    if (val === '6666') {
      setIsAuthenticated(true);
    } else if (val.length === 4) {
      setPassError(true);
      setTimeout(() => {
        setPasscode('');
        setPassError(false);
      }, 500);
    }
  };

  // Helper to detect structure and data output from a space
  const analyzeSpaceStructure = (nodes: any[], edges: any[]): { 
    type: string, 
    label: string,
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
      
      // AI / Intelligence Category
      if (type.includes('grok') || type.includes('runway') || type.includes('assistant') || type.includes('processor') || type.includes('banana') || type.includes('remover') || type.includes('describer')) {
        categoriesSet.add('ai');
      } 
      
      // Logic / Utility Category
      if (type.includes('composer') || type.includes('concatenator') || type.includes('batch') || (type === 'space' && n.id !== 'in' && n.id !== 'out')) {
        categoriesSet.add('logic');
      }

      // Prompt Category
      if (type.includes('prompt') || type.includes('describer') || type.includes('enhancer')) {
        categoriesSet.add('prompt');
      }

      // Media / Image Category
      if (type.includes('image') || type.includes('media') || type.includes('matted')) {
        categoriesSet.add('image');
      }
      
      // Video Category
      if (type.includes('video')) {
        categoriesSet.add('video');
      }

      // Canvas / Composition Category
      if (type.includes('background') || type.includes('layer') || type.includes('export')) {
        categoriesSet.add('canvas');
      }

      // Tool Category
      if (type.includes('mask') || type.includes('tool') || type.includes('scissors') || type.includes('vision') || type.includes('describer')) {
        categoriesSet.add('tool');
      }
    });

    const result = {
      type: 'url',
      label: 'Space',
      value: null as string | null,
      hasInput: !!inputNode,
      hasOutput: !!outputNode,
      internalCategories: Array.from(categoriesSet).slice(0, 5) 
    };

    if (!outputNode) return result;

    // FIND THE EDGE: Be lenient with handle IDs
    const incomingEdge = edges.find(e => e.target === outputNode.id);
    if (!incomingEdge) return result;

    const sourceNode = nodes.find(n => n.id === incomingEdge.source);
    if (!sourceNode) return result;

    // Registry-Based Type Detection (Fail-safe)
    const sourceMetadata = NODE_REGISTRY[sourceNode.type];
    // Find matching output type by checking all handles of the source node if specific handle not found
    let sourceHandleType = sourceMetadata?.outputs.find(o => o.id === incomingEdge.sourceHandle)?.type;
    if (!sourceHandleType && sourceMetadata?.outputs.length === 1) {
        sourceHandleType = sourceMetadata.outputs[0].type;
    }
    
    // Check propagated type if it's reaching from a sub-space
    const propagatedType = (sourceNode.data?.outputType || sourceNode.data?.type || '').toLowerCase();

    // Final mapping to visual result types
    if (sourceHandleType === 'image' || propagatedType === 'image') {
        result.type = 'image';
        result.label = 'Image Space';
    }
    else if (sourceHandleType === 'video' || propagatedType === 'video') {
        result.type = 'video';
        result.label = 'Video Space';
    }
    else if (sourceHandleType === 'prompt' || propagatedType === 'prompt') {
        result.type = 'prompt';
        result.label = 'Prompt Space';
    }
    else if (sourceHandleType === 'mask' || propagatedType === 'mask') {
        result.type = 'mask';
        result.label = 'Mask Space';
    }
    else if (sourceHandleType === 'url' || propagatedType === 'url') {
        result.type = 'url';
        result.label = 'URL Space';
    }
    else if (sourceHandleType === 'json' || propagatedType === 'json') {
        result.type = 'json';
        result.label = 'Data Space';
    }
    
    result.value = sourceNode.data?.value || null;
    return result;
  };

  // Helper to commit current state AND propagate up
  const syncCurrentSpaceState = useCallback((currentNodes: any[], currentEdges: any[], currentSpacesMap: Record<string, any>, currentId: string) => {
    const structure = analyzeSpaceStructure(currentNodes, currentEdges);
    
    // 1. Detect INCOMING type from parent to this space
    let incomingType = 'url';
    Object.values(currentSpacesMap).forEach((space: any) => {
      const spaceNode = space.nodes?.find((n: any) => n.type === 'space' && n.data.spaceId === currentId);
      if (spaceNode) {
        const edge = space.edges?.find((e: any) => e.target === spaceNode.id && e.targetHandle === 'in');
        if (edge) {
          const srcNode = space.nodes?.find((n: any) => n.id === edge.source);
          if (srcNode) {
            const hType = NODE_REGISTRY[srcNode.type]?.outputs.find(o => o.id === edge.sourceHandle)?.type || srcNode.data.outputType;
            if (hType) incomingType = hType;
          }
        }
      }
    });

    // 2. Update THIS space entry
    const newMap = {
      ...currentSpacesMap,
      [currentId]: {
        ...(currentSpacesMap[currentId] || {}),
        id: currentId,
        nodes: currentNodes.map(n => n.type === 'spaceInput' ? { ...n, data: { ...n.data, inputType: incomingType } } : n),
        edges: [...currentEdges],
        outputType: structure.type,
        outputValue: structure.value,
        hasInput: structure.hasInput,
        hasOutput: structure.hasOutput,
        internalCategories: structure.internalCategories,
        updatedAt: new Date().toISOString()
      }
    };

    // 3. Propagate to ALL potential parents in the stack (Deep Propagation)
    // Update every parent space node in the map that points to this space (Upward)
    Object.keys(newMap).forEach(key => {
        if (newMap[key].nodes) {
            newMap[key].nodes = newMap[key].nodes.map((n: any) => {
                if (n.type === 'space' && n.data.spaceId === currentId) {
                    return { 
                        ...n, 
                        data: { 
                            ...n.data, 
                            label: structure.label,
                            outputType: structure.type, 
                            inputType: incomingType,
                            value: structure.value,
                            hasInput: structure.hasInput,
                            hasOutput: structure.hasOutput,
                            internalCategories: [...structure.internalCategories]
                        } 
                    };
                }
                return n;
            });
        }
    });

    // 4. DOWNWARD PROPAGATION: Find all spaces mentioned in CURRENT nodes and update their inputs
    currentNodes.filter(n => n.type === 'space' && n.data.spaceId).forEach(spaceNode => {
        const sId = spaceNode.data.spaceId;
        if (newMap[sId]) {
            // Find connection to this space node in currentEdges
            const edge = currentEdges.find(e => e.target === spaceNode.id && e.targetHandle === 'in');
            let sIncomingType = 'url';
            if (edge) {
                const srcNode = currentNodes.find(n => n.id === edge.source);
                if (srcNode) {
                    sIncomingType = NODE_REGISTRY[srcNode.type]?.outputs.find(o => o.id === edge.sourceHandle)?.type || srcNode.data.outputType || 'url';
                }
            }
            // Update the internal spaceInput of that child space
            newMap[sId].nodes = newMap[sId].nodes?.map((n: any) => 
                n.type === 'spaceInput' ? { ...n, data: { ...n.data, inputType: sIncomingType } } : n
            );
        }
    });

    // 4.5 INTERNAL OUTPUT SYNC: Ensure the internal spaceOutput node reflects the structure type
    newMap[currentId].nodes = newMap[currentId].nodes.map((n: any) => 
        n.type === 'spaceOutput' ? { ...n, data: { ...n.data, outputType: structure.type } } : n
    );

    // 5. COMMIT CHANGES TO STATE
    setSpacesMap(newMap);

    // 6. IF WE UPDATED THE CURRENT VIEW (activeSpaceId), update local states
    if (newMap[currentId]) {
        // Only update if nodes/edges were changed by propagation (like spaceInput type)
        // We check if the stringified nodes changed to avoid unnecessary renders
        if (JSON.stringify(newMap[currentId].nodes) !== JSON.stringify(currentNodes)) {
            setNodes(newMap[currentId].nodes);
        }
    }

    return { newMap, structure };
  }, [analyzeSpaceStructure, setNodes, setSpacesMap]);

  // Navigation Logic
  const handleEnterSpace = useCallback((e: any) => {
    const { nodeId, spaceId } = e.detail;
    const currentId = activeSpaceId;
    
    // Sync current state first
    const { newMap: updatedSpacesMap } = syncCurrentSpaceState(nodes, edges, spacesMap, currentId);

    let targetSpaceId = spaceId;
    if (!targetSpaceId) {
      targetSpaceId = `space_${Date.now()}`;
      // Initialize if new
      updatedSpacesMap[targetSpaceId] = {
        id: targetSpaceId,
        name: `Nested Space`,
        nodes: [
          { id: 'in', type: 'spaceInput', position: { x: 100, y: 200 }, data: { label: 'Input' } },
          { id: 'out', type: 'spaceOutput', position: { x: 800, y: 200 }, data: { label: 'Output' } }
        ],
        edges: [],
        createdAt: new Date().toISOString()
      };
      
      // Update parent trigger node in EVERYTHING (in case of deep linking)
      Object.keys(updatedSpacesMap).forEach(key => {
        if (updatedSpacesMap[key].nodes) {
          updatedSpacesMap[key].nodes = updatedSpacesMap[key].nodes.map((n: any) => 
            n.id === nodeId ? { ...n, data: { ...n.data, spaceId: targetSpaceId, hasInput: true, hasOutput: true } } : n
          );
        }
      });
    }

    const targetSpace = updatedSpacesMap[targetSpaceId];
    if (targetSpace && targetSpace.nodes) {
      setSpacesMap(updatedSpacesMap);
      setNodes([...targetSpace.nodes]);
      setEdges([...(targetSpace.edges || [])]);
      setNavigationStack(prev => [...prev, currentId]);
      setActiveSpaceId(targetSpaceId);
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [activeSpaceId, nodes, edges, spacesMap, setNodes, setEdges, fitView, syncCurrentSpaceState]);

  const handleGoBack = useCallback(() => {
    if (navigationStack.length === 0) return;
    
    const newStack = [...navigationStack];
    const parentSpaceId = newStack.pop() as string;
    const currentId = activeSpaceId;
    
    // 1. Sync current state AND propagate up
    const { newMap: updatedSpacesMap } = syncCurrentSpaceState(nodes, edges, spacesMap, currentId);

    // 2. Switch to parent
    const parentSpace = updatedSpacesMap[parentSpaceId];
    if (parentSpace) {
      setSpacesMap(updatedSpacesMap);
      setNodes([...parentSpace.nodes]);
      setEdges([...(parentSpace.edges || [])]);
      setActiveSpaceId(parentSpaceId);
      setNavigationStack(newStack);
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
    }
  }, [activeSpaceId, nodes, edges, spacesMap, navigationStack, setNodes, setEdges, fitView, syncCurrentSpaceState]);

  useEffect(() => {
    window.addEventListener('enter-space', handleEnterSpace);
    return () => window.removeEventListener('enter-space', handleEnterSpace);
  }, [handleEnterSpace]);

  // Reactive Propagation Bridge: Sync current space structure to map and parents on change
  useEffect(() => {
    if (!activeSpaceId) return;
    
    const timer = setTimeout(() => {
      // Pass the current states to ensure we sync the actual reflected view
      syncCurrentSpaceState(nodes, edges, spacesMap, activeSpaceId);
    }, 800); 
    return () => clearTimeout(timer);
  }, [nodes, edges, activeSpaceId, spacesMap, syncCurrentSpaceState]); 

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
      const structure = analyzeSpaceStructure(nodes, edges);
      const updatedSpacesMap = {
        ...spacesMap,
        [activeSpaceId]: {
          ...(spacesMap[activeSpaceId] || {}),
          id: activeSpaceId,
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

      const projectToSave = {
        id: activeProjectId,
        name: nameToSave || currentName || 'Untitled Project',
        rootSpaceId: 'root', // Always 'root' now
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
           setActiveSpaceId('root');
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
    // Migration/Normalization: Use project.rootSpaceId or default to 'root'
    const rootSpaceId = project.rootSpaceId || 'root';
    const rootSpace = project.spaces?.[rootSpaceId] || project.spaces?.['root'];
    
    if (!rootSpace) {
      console.error("Root space not found for project:", project.id);
      alert("Error: could not find the main space for this project.");
      return;
    }

    setNodes([...(rootSpace.nodes || [])]);
    setEdges([...(rootSpace.edges || [])]);
    setActiveProjectId(project.id);
    setActiveSpaceId(rootSpaceId);
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
        setActiveSpaceId('root');
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
        
        // Remove the forced reset of IDs to maintain context inside spaces or projects
        // setActiveProjectId(null);
        // setActiveSpaceId(null);
        // setCurrentName('');
        
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

  const onPaneContextMenu = useCallback((event: any) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const onNodeContextMenu = useCallback((event: any, node: any) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setContextMenu(null);
  }, [setNodes, setEdges]);

  const duplicateNode = useCallback((id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;

    const newNode = {
      ...node,
      id: `${node.type}_${Date.now()}`,
      position: { x: node.position.x + 20, y: node.position.y + 20 },
      selected: false,
    };

    setNodes((nds) => [...nds, newNode]);
    setContextMenu(null);
  }, [nodes, setNodes]);

  const groupSelectedToSpace = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected);
    if (selectedNodes.length === 0) {
      setContextMenu(null);
      return;
    }

    const selectedIds = new Set(selectedNodes.map(n => n.id));
    const internalEdges = edges.filter(e => selectedIds.has(e.source) && selectedIds.has(e.target));
    
    const spaceId = `space_group_${Date.now()}`;
    const minX = Math.min(...selectedNodes.map(n => n.position.x));
    const minY = Math.min(...selectedNodes.map(n => n.position.y));
    const maxX = Math.max(...selectedNodes.map(n => n.position.x));
    const maxY = Math.max(...selectedNodes.map(n => n.position.y));
    const avgX = (minX + maxX) / 2;
    const avgY = (minY + maxY) / 2;

    // Create the new space
    const newSpacesMap = { ...spacesMap };
    
    // Offset nodes to be centered in the new space
    const nestedNodes = selectedNodes.map(n => ({
      ...n,
      position: { x: n.position.x - minX + 200, y: n.position.y - minY + 200 },
      selected: false
    }));

    // For initial structure analysis, we include a virtual 'out' node to help identify the output type
    const virtualOutNode = { id: 'out', type: 'spaceOutput' };
    const structure = analyzeSpaceStructure([...nestedNodes, virtualOutNode], internalEdges);

    newSpacesMap[spaceId] = {
      id: spaceId,
      name: `Grouped Space`,
      nodes: [
        { id: 'in', type: 'spaceInput', position: { x: 50, y: 250 }, data: { label: 'Input' } },
        { id: 'out', type: 'spaceOutput', position: { x: 800, y: 250 }, data: { label: 'Output' } },
        ...nestedNodes
      ],
      edges: internalEdges.map(e => ({
        ...e,
        id: `nested_${e.id}`
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      outputType: structure.type,
      outputValue: structure.value,
      hasInput: structure.hasInput,
      hasOutput: structure.hasOutput,
      internalCategories: structure.internalCategories
    };

    // Replace grouped nodes with a single space node
    const newNode = {
      id: `node_space_${Date.now()}`,
      type: 'space',
      position: { x: avgX, y: avgY },
      data: { 
        spaceId, 
        label: 'Nested Group',
        hasInput: true,
        hasOutput: true,
        outputType: structure.type,
        internalCategories: structure.internalCategories
      },
    };

    const remainingNodes = nodes.filter(n => !selectedIds.has(n.id));
    const remainingEdges = edges.filter(e => !selectedIds.has(e.source) && !selectedIds.has(e.target));

    setNodes([...remainingNodes, newNode]);
    setEdges(remainingEdges);
    setSpacesMap(newSpacesMap);
    setContextMenu(null);
  }, [nodes, edges, spacesMap, setNodes, setEdges]);

  const isValidConnection = useCallback((connection: any) => {
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return false;

    // Get source handle type
    const sourceMetadata = NODE_REGISTRY[sourceNode.type];
    let sourceHandleType = sourceMetadata?.outputs.find(o => o.id === connection.sourceHandle)?.type;

    // IF SPACE NODE: Override sourceHandleType with the dynamic outputType from internal structure
    if (sourceNode.type === 'space' && sourceNode.data?.outputType) {
      sourceHandleType = sourceNode.data.outputType;
    }

    // Get target handle type
    const targetMetadata = NODE_REGISTRY[targetNode.type];
    let targetHandleType = targetMetadata?.inputs.find(i => i.id === connection.targetHandle)?.type;

    // IF TARGET IS SPACE: Override targetHandleType with internal inputType
    if (targetNode.type === 'space' && targetNode.data?.inputType) {
        targetHandleType = targetNode.data.inputType;
    }

    // Fallback for missing/mismatched handle IDs: Use first handle type from registry
    if (!sourceHandleType && sourceMetadata?.outputs?.[0]) sourceHandleType = sourceMetadata.outputs[0].type;
    if (!targetHandleType && targetMetadata?.inputs?.[0]) targetHandleType = targetMetadata.inputs[0].type;

    // Handle "layer-n" inputs for composer (they are always images)
    if (connection.targetHandle?.startsWith('layer-')) {
      targetHandleType = 'image';
    }

    // Handle "p-n" inputs for concatenator (they are always prompts)
    if (targetNode.type === 'concatenator' && connection.targetHandle?.startsWith('p')) {
      targetHandleType = 'prompt';
    }

    // Special cases for generic mediaInput
    if (sourceNode.type === 'mediaInput') {
       const actualType = (sourceNode.data as any)?.type; 
       if (actualType === targetHandleType) return true;
    }

    // Match exact types or allow flexible 'url'
    if (sourceHandleType === 'url' || targetHandleType === 'url') return true;
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
      <Sidebar />
      <div className="flex-1 relative" onContextMenu={(e) => e.preventDefault()}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
           onDrop={onDrop}
          onDragOver={onDragOver}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.8 }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
          minZoom={0.05}
          maxZoom={4}
          proOptions={{ hideAttribution: true }}
          className="spaces-canvas"
        >
          <Background color="#111" gap={40} size={1} />
          
          {/* Initial State Message */}
          {isAuthenticated && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <span className="text-white/90 text-[14px] font-black uppercase tracking-[20px] animate-pulse drop-shadow-2xl">
                Hola
              </span>
            </div>
          )}
        </ReactFlow>

        {/* Password Overlay */}
        {!isAuthenticated && (
          <div className="fixed inset-0 z-[1000] bg-[#0a0a0a] flex flex-col items-center justify-center backdrop-blur-3xl overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
            
            <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm px-6">
               <div className="flex flex-col items-center gap-2">
                 <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-2xl shadow-cyan-500/20 mb-4">
                   <Layers size={32} className="text-white" />
                 </div>
                 <h1 className="text-2xl font-black text-white uppercase tracking-[8px] mr-[-8px]">Media</h1>
                 <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-[4px] opacity-80">Composer Access</p>
               </div>

               <div className="w-full flex flex-col gap-4">
                 <div className="relative">
                   <input 
                     type="password"
                     autoFocus
                     maxLength={4}
                     value={passcode}
                     onChange={(e) => handleAuth(e.target.value)}
                     placeholder="••••"
                     className={`w-full bg-white/5 border ${passError ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'border-white/10'} rounded-2xl py-5 text-center text-4xl font-black tracking-[1.5em] pl-[1.5em] text-white focus:outline-none focus:border-cyan-500/40 transition-all placeholder:text-white/10`}
                   />
                   {passError && (
                     <p className="absolute -bottom-6 left-0 w-full text-center text-[8px] font-black text-rose-500 uppercase tracking-widest animate-bounce">
                       Invalid passcode
                     </p>
                   )}
                 </div>
                 <p className="text-center text-[9px] font-medium text-white/30 uppercase tracking-[2px]">Enter security key to initialize studio</p>
               </div>
            </div>

            <div className="absolute bottom-12 flex flex-col items-center gap-2 opacity-20 hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-cyan-500" />
                 <span className="text-[8px] font-bold text-white uppercase tracking-[4px]">Verified Infrastructure</span>
               </div>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div 
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseLeave={() => setContextMenu(null)}
          >
            <div className="px-3 py-2 text-[8px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">
              Actions
            </div>
            
            {contextMenu.nodeId ? (
              <>
                <div 
                  className="context-menu-item"
                  onClick={() => duplicateNode(contextMenu.nodeId!)}
                >
                  <Copy size={14} className="text-blue-400" /> Duplicate Node
                </div>
                <div 
                  className="context-menu-item danger"
                  onClick={() => deleteNode(contextMenu.nodeId!)}
                >
                  <Trash2 size={14} className="text-rose-500" /> Delete Node
                </div>
              </>
            ) : (
              <>
                <div 
                  className="context-menu-item primary"
                  onClick={groupSelectedToSpace}
                >
                  <PlusSquare size={14} /> Group into Nested Space
                </div>
                <div className="context-menu-separator" />
                <div 
                  className="context-menu-item"
                  onClick={() => {
                    setNodes([]);
                    setEdges([]);
                    setContextMenu(null);
                  }}
                >
                  <Trash2 size={14} /> Clear Canvas
                </div>
              </>
            )}
          </div>
        )}
        
        <AgentHUD onGenerate={onGenerateAssistant} isGenerating={isGeneratingAssistant} />

        {/* Action HUD - Consolidating Breadcrumbs & Actions on the Right */}
        <div key="action-hud" className="absolute top-6 right-6 z-50 flex items-center gap-4">
            {/* Navigation & Project Context (Clean Ghost Style) */}
            <div className="flex items-center gap-3 pr-2 border-r border-white/10">
              <button 
                onClick={handleGoBack}
                disabled={navigationStack.length === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-0"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[2px]">
                <span 
                  onClick={() => {
                    if (activeSpaceId !== 'root') {
                      const { newMap: updatedSpacesMap } = syncCurrentSpaceState(nodes, edges, spacesMap, activeSpaceId);
                      const rootSpace = updatedSpacesMap['root'];
                      if (rootSpace) {
                        setSpacesMap(updatedSpacesMap);
                        setNodes([...rootSpace.nodes]);
                        setEdges([...(rootSpace.edges || [])]);
                        setActiveSpaceId('root');
                        setNavigationStack([]);
                      }
                    }
                  }}
                  className={`hover:text-cyan-400 cursor-pointer transition-colors ${activeSpaceId === 'root' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
                >
                  Canvas
                </span>
                
                {navigationStack.map((id, idx) => (
                  <React.Fragment key={id}>
                    <span className="text-white/20">/</span>
                    <span 
                      onClick={() => {
                        const { newMap: updatedSpacesMap } = syncCurrentSpaceState(nodes, edges, spacesMap, activeSpaceId);
                        const newStack = navigationStack.slice(0, idx);
                        const targetSpace = updatedSpacesMap[id];
                        if (targetSpace) {
                          setSpacesMap(updatedSpacesMap);
                          setNodes([...targetSpace.nodes]);
                          setEdges([...(targetSpace.edges || [])]);
                          setActiveSpaceId(id);
                          setNavigationStack(newStack);
                        }
                      }}
                      className="text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors"
                    >
                      {spacesMap[id]?.name || 'Space'}
                    </span>
                  </React.Fragment>
                ))}
                
                {activeSpaceId !== 'root' && (
                  <>
                    <span className="text-white/20">/</span>
                    <span className="text-cyan-400 font-bold tracking-wider">
                      {spacesMap[activeSpaceId]?.name || 'Nested Space'}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl">
                 <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest drop-shadow-sm">
                   {currentName || 'Untitled Composition'}
                 </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1.5">
              <button 
                onClick={autoLayoutNodes}
                title="Order Nodes"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 rounded-xl text-white flex items-center justify-center transition-all hover:scale-105 group"
              >
                <LayoutGrid size={16} className="text-emerald-400 group-hover:text-emerald-300" />
              </button>
              <button 
                onClick={() => fitView({ padding: 0.2, duration: 800 })}
                title="Fit View"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 rounded-xl text-white flex items-center justify-center transition-all hover:scale-105 group"
              >
                <Maximize size={16} className="text-cyan-400 group-hover:text-cyan-300" />
              </button>
              <button 
                onClick={() => setShowLoadModal(true)}
                title="My Spaces"
                className="w-10 h-10 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 rounded-xl text-white flex items-center justify-center transition-all hover:scale-105 group"
              >
                <FolderOpen size={16} className="text-rose-400 group-hover:text-rose-300" />
              </button>
              <button 
                onClick={() => activeProjectId ? saveProject() : setShowSaveModal(true)}
                disabled={isSaving}
                className={`h-10 px-4 ${activeProjectId ? 'bg-rose-600/20 text-rose-400 border-rose-500/30' : 'bg-rose-600 text-white'} hover:brightness-110 backdrop-blur-xl border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 shadow-xl shadow-rose-900/10`}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                <span className="hidden sm:inline">{activeProjectId ? 'Commit' : 'Save'}</span>
              </button>
            </div>
        </div>

        {/* Legend HUD - Ultra Minimal Single Row */}
        <div key="legend-hud" className="absolute bottom-6 left-6 flex items-center gap-6 px-6 py-2.5 bg-white/5 backdrop-blur-2xl border border-white/5 rounded-full z-50 pointer-events-none shadow-2xl shadow-black/5">
            {[
              { color: 'bg-blue-500', label: 'Prompt' },
              { color: 'bg-rose-500', label: 'Video' },
              { color: 'bg-pink-500', label: 'Image' },
              { color: 'bg-purple-500', label: 'Sound' },
              { color: 'bg-cyan-500', label: 'Mask' },
              { color: 'bg-orange-500', label: 'PDF' },
              { color: 'bg-amber-500', label: 'Txt' },
              { color: 'bg-emerald-500', label: 'Url' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
            <div className="h-3 w-[1px] bg-white/10 mx-1" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-rose-500/50 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-rose-500" />
              </div>
              <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Disconnect</span>
            </div>
        </div>

        {/* Modals */}
        {showSaveModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50" />
              <button 
                onClick={() => setShowSaveModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Save Workspace</h2>
              <p className="text-gray-400 text-xs mb-8">Give your AI pipeline a name to find it later in your hub.</p>
              
              <div className="relative mb-8">
                <Settings2 className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" size={18} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g., Cinematic Video Flow..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500/50 transition-colors"
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
            <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 relative max-h-[80vh] flex flex-col">
              <button 
                onClick={() => setShowLoadModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Your Projects</h2>
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
                      <div key={project.id} className="group/item flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl transition-all">
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
                              className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight cursor-pointer hover:text-rose-600 flex items-center gap-2 group/title"
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

              <h2 className="text-2xl font-black text-slate-900 text-center">Delete Project?</h2>
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
    <div className="w-screen h-screen bg-slate-50 overflow-hidden">
      <ReactFlowProvider>
        <SpacesContent />
      </ReactFlowProvider>
    </div>
  );
}
