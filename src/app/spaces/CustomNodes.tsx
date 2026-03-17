"use client";

import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Handle, Position, NodeProps, BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps, useReactFlow, useNodes, useEdges } from '@xyflow/react';
import { 
  Video, 
  Type, 
  Play, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Film, 
  Compass, 
  MoreHorizontal, 
  Maximize2, 
  Download, 
  Volume2, 
  ArrowRight, 
  X,
  Zap,
  PlusSquare,
  ImageIcon,
  RefreshCw,
  Scissors,
  Layers,
  Link,
  FilePlus,
  FileText,
  Music,
  Info,
  Globe,
  Eye,
  Paintbrush,
  ChevronLeft,
  ChevronRight,
  Plus,
  Move,
  Maximize,
  MousePointer2,
  Sparkles,
  Eraser,
  Crop,
  Check
} from 'lucide-react';
import './spaces.css';
import { NODE_REGISTRY } from './nodeRegistry';

interface BaseNodeData {
  value?: string;
  value2?: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  label?: string;
  loading?: boolean;
}

const NodeLabel = ({ id, label, defaultLabel }: { id: string, label?: string, defaultLabel: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(label || '');
  const { setNodes } = useReactFlow();
  const allNodes = useNodes();

  // Find index of this node among others of the SAME type
  const nodeType = allNodes.find(n => n.id === id)?.type;
  const sameTypeNodes = allNodes
    .filter(n => n.type === nodeType)
    .sort((a, b) => {
      // Sort by Y then X for logical numbering
      if (a.position.y !== b.position.y) return a.position.y - b.position.y;
      return a.position.x - b.position.x;
    });
  
  const index = sameTypeNodes.findIndex(n => n.id === id) + 1;
  const isSystemLabel = label && (label.startsWith('AI_SPACE_') || label.match(/\.(jpg|jpeg|png|webp|mp4)$/i));
  const displayLabel = (label && !isSystemLabel) ? label : `${defaultLabel} ${index}`;

  const handleBlur = () => {
    setIsEditing(false);
    // Limit to 5 words as requested
    const trimmed = val.split(' ').slice(0, 5).join(' ');
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, label: trimmed } } : n));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setVal(label || '');
      setIsEditing(false);
    }
  };

  return (
    <div className="absolute -top-7 left-0 z-[100] group/label">
      {isEditing ? (
        <input
          autoFocus
          className="bg-cyan-500/20 border border-cyan-500/50 text-[10px] font-black uppercase tracking-widest text-cyan-400 focus:outline-none px-2 py-0.5 rounded-lg cursor-text min-w-[120px] shadow-lg shadow-cyan-500/10"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div 
          onDoubleClick={() => setIsEditing(true)}
          className="px-2 py-0.5 rounded-lg bg-slate-50/50 backdrop-blur-md border border-white/10 text-[9px] font-black text-white/40 truncate hover:text-cyan-400 group-hover/label:border-cyan-500/30 transition-all uppercase tracking-widest cursor-pointer select-none flex items-center gap-2"
          title="Double click to rename (max 5 words)"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-pulse" />
          {displayLabel}
        </div>
      )}
    </div>
  );
};

export const ButtonEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = () => {
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          stroke: '#06b6d4', 
          strokeWidth: 2.5,
          filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.4))'
        }} 
      />
      <EdgeLabelRenderer>
        <div
          key={id}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button className="edgebutton" onClick={onEdgeClick} title="Disconnect">
            <X size={10} strokeWidth={4} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// --- CORE INPUT NODES ---

export const BackgroundNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & { width?: number, height?: number, color?: string };
  const { setNodes } = useReactFlow();

  const updateData = (key: string, val: any) => {
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n));
  };

  const w = nodeData.width ?? 1920;
  const h = nodeData.height ?? 1080;
  const color = nodeData.color ?? '#000000';

  return (
    <div className="custom-node background-node">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Background" />
      <div className="node-header">
        <Paintbrush size={16} /> CANVAS
      </div>
      <div className="node-content">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="node-label">Width (px)</label>
            <input 
              type="number" 
              className="node-input" 
              value={w}
              onChange={(e) => updateData('width', parseInt(e.target.value))}
              onContextMenu={(e) => e.stopPropagation()}
            />
          </div>
          <div>
            <label className="node-label">Height (px)</label>
            <input 
              type="number" 
              className="node-input" 
              value={h}
              onChange={(e) => updateData('height', parseInt(e.target.value))}
              onContextMenu={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div>
          <label className="node-label">Background Color</label>
          <div className="flex gap-3 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
            <input 
              type="color" 
              className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
              value={color}
              onChange={(e) => updateData('color', e.target.value)}
              onContextMenu={(e) => e.stopPropagation()}
            />
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none text-[10px] font-mono text-gray-300 uppercase focus:outline-none"
              value={color}
              onChange={(e) => updateData('color', e.target.value)}
              onContextMenu={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/5 rounded-xl border border-slate-200/60 flex flex-col items-center justify-center min-h-[100px]" style={{ backgroundColor: color + '44' }}>
          <div className="w-20 h-12 border border-white/20 rounded shadow-lg" style={{ backgroundColor: color }}></div>
          <span className="text-[8px] font-black text-gray-500 uppercase mt-2">{w}x{h} ASPECT</span>
        </div>
      </div>
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Image out</span>
        <Handle type="source" position={Position.Right} id="image" className="handle-image" />
      </div>
    </div>
  );
});

export const UrlImageNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & { 
    urls?: string[], 
    selectedIndex?: number,
    pendingSearch?: boolean
  };
  const { setNodes } = useReactFlow();
  const [loading, setLoading] = useState(false);
  
  const urls = nodeData.urls || [];
  const selectedIndex = nodeData.selectedIndex ?? 0;
  const currentUrl = urls[selectedIndex] || nodeData.value || '';

  // Reactive Search Trigger
  useEffect(() => {
    if (nodeData.pendingSearch && nodeData.label && !loading) {
      const triggerSearch = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/spaces/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: nodeData.label, limit: 10 })
          });
          const json = await res.json();
          if (json.urls && json.urls.length > 0) {
            setNodes((nds: any) => nds.map((n: any) => n.id === id ? { 
              ...n, 
              data: { 
                ...n.data, 
                urls: json.urls, 
                value: json.urls[0], 
                selectedIndex: 0, 
                pendingSearch: false,
                type: 'image',
                source: 'url'
              } 
            } : n));
          } else {
            // No results, clear flag
            setNodes((nds: any) => nds.map((n: any) => n.id === id ? { 
              ...n, 
              data: { ...n.data, pendingSearch: false } 
            } : n));
          }
        } catch (err) {
          console.error("Search failed:", err);
          setNodes((nds: any) => nds.map((n: any) => n.id === id ? { 
            ...n, 
            data: { ...n.data, pendingSearch: false } 
          } : n));
        } finally {
          setLoading(false);
        }
      };

      triggerSearch();
    }
  }, [nodeData.pendingSearch, nodeData.label, id, setNodes, loading]);

  const updateData = (updates: any) => {
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, ...updates } } : n));
  };

  const next = () => {
    if (urls.length === 0) return;
    const nextIdx = (selectedIndex + 1) % urls.length;
    updateData({ selectedIndex: nextIdx, value: urls[nextIdx], type: 'image' });
  };

  const prev = () => {
    if (urls.length === 0) return;
    const prevIdx = (selectedIndex - 1 + urls.length) % urls.length;
    updateData({ selectedIndex: prevIdx, value: urls[prevIdx], type: 'image' });
  };

  return (
    <div className={`custom-node url-image-node border-cyan-500/30 ${loading ? 'node-glow-running' : ''}`}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Image Search" />
      <div className="node-header text-cyan-400">
        <Globe size={16} /> CAROUSEL {loading && <Loader2 size={12} className="animate-spin ml-auto" />}
      </div>
      <div className="node-content">
        <div className="relative w-full aspect-video bg-slate-50 rounded-xl overflow-hidden border border-white/10 group mb-3 shadow-inner">
          {currentUrl ? (
            <img src={currentUrl} className="w-full h-full object-contain" alt="Carousel" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 gap-2">
              <Globe size={32} />
              <span className="text-[9px] font-black uppercase tracking-tighter">No URL provided</span>
            </div>
          )}
          
          {urls.length > 1 && (
            <>
              <button 
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100/50 backdrop-blur-md rounded-full text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-500/20"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100/50 backdrop-blur-md rounded-full text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-500/20"
              >
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-2 right-2 bg-slate-100/50 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-mono text-cyan-400 border border-cyan-500/20">
                {selectedIndex + 1} / {urls.length}
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
           <div>
              <label className="node-label text-gray-500">Active URL</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
                <input 
                  type="text"
                  className="node-input pl-9 text-[10px]"
                  placeholder="Paste URL..."
                  value={currentUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newUrls = [...urls];
                    if (newUrls.length === 0) newUrls.push(val);
                    else newUrls[selectedIndex] = val;
                    updateData({ urls: newUrls, value: val, type: 'image' });
                  }}
                />
              </div>
           </div>

           {urls.length > 0 && (
             <div className="pt-2 border-t border-slate-200/60">
                <div className="text-[8px] font-black text-gray-600 uppercase mb-2 tracking-widest flex justify-between items-center">
                  <span>Gallery Stack</span>
                  <button 
                    onClick={() => updateData({ urls: [...urls, ''] })}
                    className="text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                  >
                    <Plus size={10} /> ADD URL
                  </button>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                  {urls.map((url, i) => (
                    <div 
                      key={i}
                      onClick={() => updateData({ selectedIndex: i, value: url, type: 'image' })}
                      className={`flex-shrink-0 w-12 h-12 rounded-lg border transition-all cursor-pointer overflow-hidden ${i === selectedIndex ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                    >
                      {url ? <img src={url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><Link size={10} /></div>}
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      </div>
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Image Out</span>
        <Handle type="source" position={Position.Right} id="image" className="handle-image" />
      </div>
    </div>
  );
});

// --- IMAGE COMPOSER NODE ---

// --- IMAGE COMPOSER NODE ---

export const ImageComposerNode = ({ id, data }: NodeProps<any>) => {
  const nodes = useNodes();
  const edges = useEdges();
  const { setNodes } = useReactFlow();
  const previewRef = useRef<HTMLDivElement>(null);
  
  const nodeData = data as BaseNodeData & { 
    layersConfig?: Record<string, { x: number, y: number, scale: number }>,
    selectedLayerId?: string
  };

  const layersConfig: Record<string, { x: number, y: number, scale: number }> = nodeData.layersConfig || {};
  const selectedLayerId = nodeData.selectedLayerId || null;
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  // Dragging State (local for performance)
  const [dragInfo, setDragInfo] = useState<{ 
    handleId: string, 
    startX: number, 
    startY: number, 
    initialX: number, 
    initialY: number, 
    initialScale: number, 
    mode: 'move' | 'scale-br' | 'scale-bl' | 'scale-tr' | 'scale-tl' 
  } | null>(null);

  // Find all edges connected TO this node, sorted by handle ID (layer-0, layer-1...)
  const connectedInputs = useMemo(() => 
    edges.filter((e: any) => e.target === id).sort((a: any, b: any) => (a.targetHandle || '').localeCompare(b.targetHandle || '')),
    [edges, id]
  );

  // Map handles to actual layer data
  const layers = useMemo(() => {
    return connectedInputs.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const hId = edge.targetHandle || 'layer-0';
      const config = layersConfig[hId] || { x: 0, y: 0, scale: 1 };
      
      const sourceHandle = (edge as any).sourceHandle;
      // Robust value extraction: prioritize current handle, then common keys, then generic value
      const value = sourceHandle 
        ? (sourceNode?.data[sourceHandle] || sourceNode?.data[`result_${sourceHandle}`] || sourceNode?.data.value) 
        : sourceNode?.data.value;
      
      return {
        id: sourceNode?.id,
        edgeId: edge.id,
        handleId: hId,
        type: sourceNode?.data.type,
        value: value as string | undefined,
        color: sourceNode?.data.color as string | undefined,
        width: sourceNode?.data.width as number || 1920,
        height: sourceNode?.data.height as number || 1080,
        ...config
      };
    }).filter(l => l.value || l.color);
  }, [connectedInputs, nodes, layersConfig]);

  const updateData = (updates: any) => {
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, ...updates } } : n));
  };

  // --- Real-time Composition Engine ---
  useEffect(() => {
    const renderFlattened = async () => {
      if (layers.length === 0) return;

      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      for (const layer of layers) {
        if (layer.color) {
          ctx.fillStyle = layer.color;
          ctx.fillRect(0, 0, 1920, 1080);
        } else if (layer.value) {
          try {
            const img = await loadCanvasImage(layer.value);
            const scale = layer.scale || 1;
            
            // Smarter dimension handling
            let targetW, targetH;
            if (layer.color || (layers.indexOf(layer) === 0 && layer.scale === 1 && layer.x === 0 && layer.y === 0)) {
               targetW = 1920;
               targetH = 1080;
            } else {
               targetW = 1920 * 0.4 * scale;
               targetH = (targetW / img.naturalWidth) * img.naturalHeight;
            }
            
            ctx.drawImage(img, layer.x, layer.y, targetW, targetH);
          } catch (e) {
            console.warn("[Composer] Failed to load layer:", layer.value, e);
          }
        }
      }

      const flattenedUrl = canvas.toDataURL('image/png', 0.9);
      // Only update if value changed significantly and canvas is not empty (black)
      if (nodeData.value !== flattenedUrl && canvas.width > 0) {
         updateData({ value: flattenedUrl });
      }
    };

    const timer = setTimeout(renderFlattened, 300); // Debounce for performance
    return () => clearTimeout(timer);
  }, [layers, nodeData.value]);

  // Dynamic Handle IDs
  const handleIds = useMemo(() => {
    const ids = connectedInputs.map((e: any) => e.targetHandle || 'layer-0');
    const lastNum = ids.length > 0 ? parseInt(ids[ids.length - 1].replace('layer-', '')) : -1;
    return [...new Set([...ids, `layer-${lastNum + 1}`])];
  }, [connectedInputs]);


  return (
    <div className="custom-node composer-node min-w-[340px]">
      {handleIds.map((hId: any, index: number) => (
        <div key={hId} className="handle-wrapper handle-left" style={{ top: `${(index + 1) * (100 / (handleIds.length + 1))}%` }}>
          <Handle type="target" position={Position.Left} id={hId} className="handle-image" />
          <span className="handle-label">Layer {index + 1}</span>
        </div>
      ))}

      <div className="node-header flex-col items-start gap-0">
        <NodeLabel id={id} label={nodeData.label} defaultLabel="Composer" />
        <div className="flex items-center w-full gap-2">
          <Layers size={14} /> IMAGE COMPOSER
          <button 
            onClick={() => setIsStudioOpen(true)}
            className="ml-auto bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
          >
            <Maximize2 size={10} /> Studio Mode
          </button>
        </div>
      </div>
      
      <div className="node-content">
        <div className="mb-3 flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">
          <div className="flex items-center gap-1.5"><Move size={12} className="text-cyan-500" /> Interactive Canvas</div>
          <span className="bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full text-cyan-400">{layers.length} Layers</span>
        </div>
        
        {/* COMPOSITION CANVAS */}
        <div 
          ref={previewRef}
          className="relative w-full aspect-video bg-[#0a0a0a] rounded-xl overflow-hidden border border-white/10 group shadow-2xl select-none" 
          style={{ backgroundImage: 'radial-gradient(#1a1a1a 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        >
          {layers.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-800 gap-2">
              <Layers size={40} strokeWidth={1} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Connect layers to compose</span>
            </div>
          ) : (
            layers.map((layer, idx) => {
              const isSelected = selectedLayerId === layer.handleId;
              return (
                <div 
                  key={`${layer.handleId}-${layer.edgeId}-${idx}`} 
                  data-layer-id={layer.handleId}
                  className={`absolute transition-shadow transition-[border-color] ${isSelected ? 'ring-2 ring-cyan-500/50 z-50' : 'hover:ring-1 hover:ring-white/30'}`}
                  style={{ 
                    zIndex: idx,
                    left: `${(layer.x / 1920) * 100}%`,
                    top: `${(layer.y / 1080) * 100}%`,
                    width: (layer.color || (idx === 0 && layer.scale === 1 && layer.x === 0 && layer.y === 0)) ? '100%' : `${40 * (layer.scale || 1)}%`,
                    height: (layer.color || (idx === 0 && layer.scale === 1 && layer.x === 0 && layer.y === 0)) ? '100%' : 'auto',
                    pointerEvents: 'none' // Static preview
                  }}
                >
                  <div className="relative group/layer w-full h-full">
                    {layer.color ? (
                      <div className="w-full h-full rounded" style={{ backgroundColor: layer.color }}></div>
                    ) : (
                      <img 
                        src={layer.value} 
                        className="w-full h-auto block pointer-events-none" 
                        onLoad={(e) => {
                          // Ensure image is loaded before claiming success
                          (e.target as any).classList.add('opacity-100');
                        }}
                        onError={(e) => {
                          console.error("Layer Image Failed:", layer.id);
                        }}
                        alt={`Layer ${idx}`} 
                      />
                    )}
                    
                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-cyan-600/90 text-[7px] text-white px-1.5 py-0.5 rounded font-black uppercase shadow-sm">
                         L{idx+1}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* LAYER MANAGER LIST */}
        <div className="mt-4 border-t border-slate-200/60 pt-3">
          <div className="text-[8px] font-black text-gray-500 uppercase mb-2 tracking-widest flex items-center gap-2 px-1">
             <MousePointer2 size={10} /> Selection Manager
          </div>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
            {layers.slice().reverse().map((l, i) => {
              const actualIdx = layers.length - 1 - i;
              const isSelected = selectedLayerId === l.handleId;
              return (
                <div 
                  key={actualIdx} 
                  onClick={() => updateData({ selectedLayerId: l.handleId })}
                  className={`group flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.03] border-slate-200/60 hover:bg-white/10 hover:border-white/10'}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                    {actualIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[9px] font-bold truncate ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`}>
                      {l.color ? `Canvas Layer` : `Source Asset`}
                    </div>
                    <div className="text-[7px] text-gray-600 font-mono truncate">
                       X: {Math.round(l.x)} | S: {l.scale.toFixed(2)} {l.value ? `| ${Math.round(l.value.length / 1024)}KB` : ''}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${l.color ? 'bg-amber-500' : 'bg-cyan-500'} ${isSelected ? 'animate-pulse' : 'opacity-40'}`}></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RENDER COMPOSITION BUTTON */}
        <button 
          onClick={async () => {
            if (layers.length === 0) return alert("Add layers before rendering!");
            setIsRendering(true);
            try {
              const formData = new FormData();
              formData.append('layers', JSON.stringify(layers));
              formData.append('format', 'jpeg');
              formData.append('width', '1920');
              formData.append('height', '1080');
              formData.append('previewWidth', '1920');
              formData.append('previewHeight', '1080');

              const res = await fetch('/api/spaces/compose', { method: 'POST', body: formData });
              if (!res.ok) throw new Error("Server composition failed");

              const blob = await res.blob();
              const base64Url = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });

              updateData({ value: base64Url, type: 'image' });
            } catch (e: any) {
              console.error(e);
              alert("Render failed: " + e.message);
            } finally {
              setIsRendering(false);
            }
          }}
          disabled={isRendering || layers.length === 0}
          className="execute-btn w-full justify-center mt-4 gap-2"
        >
          {isRendering ? 'RENDERING...' : 'RENDER COMPOSITION'}
        </button>
      </div>
      
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Result</span>
        <Handle type="source" position={Position.Right} id="image" className="handle-image" />
      </div>

      {isStudioOpen && createPortal(
        <ComposerStudio 
          layers={layers}
          layersConfig={layersConfig}
          onSave={(newConfig) => {
            updateData({ layersConfig: newConfig });
            setIsStudioOpen(false);
          }}
          onClose={() => setIsStudioOpen(false)}
        />,
        document.body
      )}
    </div>
  );
};

// --- COMPOSER STUDIO MODAL ---

interface ComposerStudioProps {
  layers: any[];
  layersConfig: Record<string, any>;
  onSave: (config: Record<string, any>) => void;
  onClose: () => void;
}

const ComposerStudio = ({ layers, layersConfig: initialConfig, onSave, onClose }: ComposerStudioProps) => {
  const [config, setConfig] = useState(initialConfig);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string, startX: number, startY: number, initX: number, initY: number, initS: number, mode: string } | null>(null);
  const studioRef = useRef<HTMLDivElement>(null);

  // Handle keyboard movement
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const c = config[selectedId] || { x: 0, y: 0, scale: 1 };
      let { x, y } = c;
      if (e.key === 'ArrowUp') y -= 5;
      else if (e.key === 'ArrowDown') y += 5;
      else if (e.key === 'ArrowLeft') x -= 5;
      else if (e.key === 'ArrowRight') x += 5;
      else return;
      
      e.preventDefault();
      e.stopPropagation();
      setConfig({ ...config, [selectedId]: { ...c, x, y } });
    };
    window.addEventListener('keydown', onKey, true); // Use capture to block parent
    return () => window.removeEventListener('keydown', onKey, true);
  }, [selectedId, config]);

  const onDown = (e: React.PointerEvent, id: string, mode = 'move') => {
    e.stopPropagation();
    const c = config[id] || { x: 0, y: 0, scale: 1 };
    setDrag({ id, startX: e.clientX, startY: e.clientY, initX: c.x, initY: c.y, initS: c.scale, mode });
    setSelectedId(id);
  };

  const onMove = (e: PointerEvent) => {
    if (!drag || !studioRef.current) return; // Added studioRef check
    
    const rect = studioRef.current.getBoundingClientRect();
    const scaleX = 1920 / rect.width;
    const scaleY = 1080 / rect.height;
    
    const dx = (e.clientX - drag.startX) * scaleX; // Scaled dx
    const dy = (e.clientY - drag.startY) * scaleY; // Scaled dy
    const c = config[drag.id] || { x: 0, y: 0, scale: 1 };

    if (drag.mode === 'move') {
      setConfig({ ...config, [drag.id]: { ...c, x: drag.initX + dx, y: drag.initY + dy } });
    } else {
      // Pivot-based scaling logic (Uniform)
      const sf = 0.005;
      // Use scaled dx/dy for moveDeltaScreen as well
      const moveDeltaScreen = (drag.mode.includes('tl') || drag.mode.includes('bl')) ? (-dx + dy) : (dx + dy);
      const newS = Math.max(0.1, drag.initS + moveDeltaScreen * sf);
      
      // Reference dimensions (fixed internal 1920x1080)
      const baseW = 1920 * 0.4;
      const baseH = 1080 * 0.4; // 16:9 approx
      
      let newX = drag.initX;
      let newY = drag.initY;

      // Calculate translation to keep opposite corner fixed
      if (drag.mode === 'scale-tl') { // Pivot is BR
        newX = drag.initX - (baseW * (newS - drag.initS));
        newY = drag.initY - (baseH * (newS - drag.initS));
      } else if (drag.mode === 'scale-tr') { // Pivot is BL
        newY = drag.initY - (baseH * (newS - drag.initS));
      } else if (drag.mode === 'scale-bl') { // Pivot is TR
        newX = drag.initX - (baseW * (newS - drag.initS));
      }
      // scale-br keeps TL (origin) fixed, so no X/Y change

      setConfig({ ...config, [drag.id]: { ...c, scale: newS, x: newX, y: newY } });
    }
  };

  useEffect(() => {
    if (!drag) return;
    const up = () => setDrag(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', up); };
  }, [drag, config]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 studio-overlay" onPointerDown={() => setSelectedId(null)}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 border-b border-slate-200/60 bg-slate-50 flex items-center px-8 gap-6 backdrop-blur-md">
        <button onClick={() => onSave(config)} className="text-gray-500 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex items-center gap-3">
          <Layers className="text-cyan-500" size={18} />
          <span className="text-[11px] font-black uppercase tracking-[3px] text-white">Advanced Composer <span className="text-cyan-500/50">Studio</span></span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button onClick={() => setConfig({})} className="text-[10px] font-black text-rose-500/60 hover:text-rose-500 transition-colors uppercase tracking-[2px]">Clear Layout</button>
          <button 
            onClick={() => onSave(config)}
            className="group relative bg-cyan-500 hover:bg-cyan-400 text-black px-10 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[2px] transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            Guardar y Cerrar
            <div className="absolute inset-0 rounded-full group-hover:animate-ping bg-cyan-500/20 pointer-events-none"></div>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-full flex items-center justify-center pt-16 pb-20">
        <div 
          ref={studioRef} // Added studioRef
          className="relative aspect-video bg-[#050505] border border-white/10 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,1)] overflow-hidden select-none group/canvas"
          style={{ 
            width: 'min(92vw, 1600px)',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', 
            backgroundSize: '32px 32px' 
          }}
        >
          {layers.map((l, idx) => {
            const isSel = selectedId === l.handleId;
            const c = config[l.handleId] || { x: 0, y: 0, scale: 1 };
            return (
              <div
                key={`${l.handleId}-${l.edgeId}-${idx}`}
                onPointerDown={(e) => onDown(e, l.handleId!)}
                className={`absolute cursor-move ${isSel ? 'z-50' : 'hover:z-10'}`} // Removed transition-[box-shadow,transform] duration-200
                style={{
                  left: `${(c.x / 1920) * 100}%`,
                  top: `${(c.y / 1080) * 100}%`,
                  width: (l.color || (idx === 0 && c.scale === 1 && c.x === 0 && c.y === 0)) ? '100%' : `${40 * c.scale}%`,
                  height: (l.color || (idx === 0 && c.scale === 1 && c.x === 0 && c.y === 0)) ? '100%' : 'auto',
                  zIndex: idx,
                }}
              >
                <div className={`relative w-full h-full p-0.5 rounded-lg ${isSel ? 'ring-2 ring-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.4)]' : 'group-hover/canvas:ring-1 group-hover/canvas:ring-white/10'}`}>
                  {l.color ? (
                    <div className="w-full h-full min-h-[40px] rounded shadow-lg" style={{ backgroundColor: l.color }}></div>
                  ) : (
                    <img src={l.value} className="w-full h-auto block pointer-events-none drop-shadow-2xl" alt="" />
                  )}

                  {isSel && (
                    <>
                      {/* Scale Handles */}
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-nwse-resize shadow-lg hover:scale-150 transition-transform" onPointerDown={(e) => onDown(e, l.handleId!, 'scale-tl')} />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-nesw-resize shadow-lg hover:scale-150 transition-transform" onPointerDown={(e) => onDown(e, l.handleId!, 'scale-tr')} />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-nesw-resize shadow-lg hover:scale-150 transition-transform" onPointerDown={(e) => onDown(e, l.handleId!, 'scale-bl')} />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-nwse-resize shadow-lg hover:scale-150 transition-transform" onPointerDown={(e) => onDown(e, l.handleId!, 'scale-br')} />
                      
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap bg-slate-100/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 text-[9px] font-black uppercase text-cyan-400 shadow-xl pointer-events-none">
                         <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                         L{idx + 1} • {Math.round(c.scale * 100)}%
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Status */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-12 text-gray-400 text-[8px] font-black uppercase tracking-[3px] bg-white/5 backdrop-blur-xl px-10 py-3 rounded-full border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3">DRAG <span className="text-gray-600">to move</span></div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-3 text-cyan-500">HANDLES <span className="text-cyan-500/40">to pivot-scale</span></div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-3">ARROWS <span className="text-gray-600">fine-tune</span></div>
        <div className="w-px h-3 bg-white/10" />
        <div className="flex items-center gap-3 text-rose-500/60">X <span className="text-rose-500/30">to close</span></div>
      </div>
    </div>
  );
};

  // --- IMAGE EXPORT NODE ---

const loadCanvasImage = async (url: string): Promise<HTMLImageElement> => {
  if (!url) throw new Error("Empty image URL");
  
  // If it's already a data URL, load it directly
  if (url.startsWith('data:')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load DataURL image"));
      img.src = url;
    });
  }

  try {
    // Force requests through our local proxy to bypass CORS/S3 Signatures issues in the browser
    const proxyUrl = `/api/spaces/proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => reject(new Error("Failed to decode image data"));
      img.src = objectUrl;
    });
  } catch (err: any) {
    throw new Error(`Connection failed: ${err.message}. Check CORS settings on source.`);
  }
};

export const ImageExportNode = memo(({ id, data }: NodeProps<any>) => {
  const nodes = useNodes();
  const edges = useEdges();
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Refs for synchronous form-based download (bypasses Chrome async security blocks)
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const layersInputRef = useRef<HTMLInputElement>(null);
  const filenameInputRef = useRef<HTMLInputElement>(null);
  const formatInputRef = useRef<HTMLInputElement>(null);

  // Find the single source connected to this node
  const sourceEdge = edges.find(e => e.target === id);
  const sourceNode = sourceEdge ? nodes.find(n => n.id === sourceEdge.source) : null;

  // Map handles to actual layer data
  const layers = useMemo(() => {
    if (!sourceNode) return [];

    // Case 1: Source is a Composer
    if (sourceNode.type === 'imageComposer') {
      if (sourceNode.data.value) {
        return [{
          type: 'flattened',
          value: sourceNode.data.value as string,
          x: 0, y: 0, scale: 1, width: 1920, height: 1080
        }];
      }
      // Fallback: reconstruct from edges
      const composerEdges = edges.filter(e => e.target === sourceNode.id)
        .sort((a: any, b: any) => (a.targetHandle || '').localeCompare(b.targetHandle || ''));
      const layersConfig: Record<string, any> = sourceNode.data.layersConfig || {};
      return composerEdges.map(edge => {
        const node = nodes.find(n => n.id === edge.source);
        const hId = edge.targetHandle || 'layer-0';
        const config = (layersConfig as any)[hId] || { x: 0, y: 0, scale: 1 };
        return {
          type: node?.type,
          value: (node?.data?.value || ((node?.data as any)?.urls && (node?.data as any)?.urls[(node?.data as any)?.selectedIndex || 0])) as string | undefined,
          color: node?.data?.color as string | undefined,
          width: node?.data?.width as number || 0,
          height: node?.data?.height as number || 0,
          x: config.x, y: config.y, scale: config.scale
        };
      }).filter(l => (l.value as string) || (l.color as string));
    }

    // Case 2: Direct image node (NanoBanana, urlImage, backgroundRemover, etc.)
    return [{
      type: sourceNode.type,
      value: sourceNode.data.value as string | undefined,
      color: (sourceNode.data as any).color as string | undefined,
      width: (sourceNode.data as any).width as number || 0,
      height: (sourceNode.data as any).height as number || 0
    }].filter(l => l.value || l.color);
  }, [sourceNode, edges, nodes]);

  const handleExport = () => {
    if (!sourceNode) return alert("Connect an image first!");
    if (!formRef.current || !layersInputRef.current || !filenameInputRef.current || !formatInputRef.current) return;

    const extension = format === 'jpeg' ? 'jpg' : 'png';
    const filename = `AI_Space_Output_${Date.now()}.${extension}`;

    console.log(`[Export] Submitting form for ${filename}, layers: ${layers.length}`);

    // Populate form inputs SYNCHRONOUSLY (before any awaits)
    layersInputRef.current.value = JSON.stringify(layers);
    filenameInputRef.current.value = filename;
    formatInputRef.current.value = format;

    // SYNCHRONOUS form submit → browser handles Content-Disposition: attachment natively
    formRef.current.submit();

    setIsExporting(true);

    // Also fetch async for PREVIEW only (not download)
    const formData = new FormData();
    formData.append('layers', JSON.stringify(layers));
    formData.append('filename', filename);
    formData.append('format', format);
    formData.append('width', '1920');
    formData.append('height', '1080');
    formData.append('previewWidth', '1920');
    formData.append('previewHeight', '1080');

    fetch('/api/spaces/compose', { method: 'POST', body: formData })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch(err => console.error('[Export] Preview fetch error:', err))
      .finally(() => setTimeout(() => setIsExporting(false), 500));
  };



  return (
    <div className="custom-node export-node border-rose-500/30">
      <NodeLabel id={id} label={data.label} defaultLabel="Export" />

      {/* Hidden iframe — receives the form POST response (Content-Disposition: attachment) */}
      <iframe
        ref={iframeRef}
        name="export-download-frame"
        title="download"
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
      />

      {/* Hidden form — submitted synchronously when user clicks Export */}
      <form
        ref={formRef}
        action="/api/spaces/compose"
        method="POST"
        target="export-download-frame"
        style={{ display: 'none' }}
      >
        <input ref={layersInputRef} type="hidden" name="layers" />
        <input ref={filenameInputRef} type="hidden" name="filename" />
        <input ref={formatInputRef} type="hidden" name="format" />
        <input type="hidden" name="width" value="1920" />
        <input type="hidden" name="height" value="1080" />
        <input type="hidden" name="previewWidth" value="1920" />
        <input type="hidden" name="previewHeight" value="1080" />
      </form>

      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="image" className="handle-image" />
        <span className="handle-label">Image Input</span>
      </div>
      <div className="node-header text-rose-400">
        <Download size={16} /> IMAGE EXPORT
      </div>
      <div className="node-content">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setFormat('png')}
            className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${format === 'png' ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}
          >PNG</button>
          <button
            onClick={() => setFormat('jpeg')}
            className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${format === 'jpeg' ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}
          >JPG</button>
        </div>

        <button
          className={`execute-btn w-full justify-center mb-4 ${isExporting ? 'opacity-50' : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'}`}
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <><Loader2 size={14} className="animate-spin" /> BUILDING...</>
          ) : (
            <><Download size={14} /> EXPORT {format.toUpperCase()}</>
          )}
        </button>

        <div className="mb-2 flex justify-between items-center text-[8px] font-mono text-gray-500 uppercase">
          <span>1920x1080 PX</span>
          <span>COMPOSITION MODE</span>
        </div>

        <div className="relative w-full aspect-video bg-slate-50 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} className="w-full h-full object-contain" alt="Export Preview" />
          ) : (sourceNode?.data.value && sourceNode.type !== 'imageComposer') ? (
            <img src={sourceNode?.data.value as string} className="w-full h-full object-contain" alt="Export Preview" />
          ) : sourceNode?.type === 'imageComposer' ? (
             <div className="flex flex-col items-center gap-2 text-rose-500/50">
               <Layers size={32} />
               <span className="text-[9px] font-black uppercase">Click Export to build {layers.length} layers</span>
             </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-700">
              <ImageIcon size={32} />
              <span className="text-[9px] font-black uppercase">No source connected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});


// --- UNIVERSAL MEDIA INPUT NODE ---

export const MediaInputNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & { 
    type?: 'video' | 'image' | 'audio' | 'pdf' | 'txt' | 'url',
    source?: 'upload' | 'url' | 'asset',
    metadata?: { duration?: string, resolution?: string, fps?: number, size?: string, codec?: string }
  };
  const { setNodes } = useReactFlow();
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [showFullSize, setShowFullSize] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isUploading = isUploadingLocal || nodeData.loading;


  const updateNodeData = (updates: any) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...updates } } : n)));
  };

  const getFileType = (fileName: string, mime: string): 'video' | 'image' | 'audio' | 'pdf' | 'txt' | 'url' => {
    if (mime.startsWith('video/') || fileName.match(/\.(mp4|mov|avi|webm|mkv)$/i)) return 'video';
    if (mime.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) return 'image';
    if (mime.startsWith('audio/') || fileName.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) return 'audio';
    if (mime === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf';
    if (mime.startsWith('text/') || fileName.endsWith('.txt')) return 'txt';
    return 'url';
  };

  const handleFileUpload = async (file: File) => {
    setIsUploadingLocal(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/runway/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.url) {
        const type = getFileType(file.name, file.type);
        const mockMetadata = {
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          resolution: (type === 'video' || type === 'image') ? '1920×1080' : '-',
          duration: (type === 'video' || type === 'audio') ? '–' : '-',
          codec: file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN'
        };
        updateNodeData({ value: json.url, type, source: 'upload', metadata: mockMetadata });
      }
    } catch (err) { console.error("Upload error:", err); } 
    finally { setIsUploadingLocal(false); }
  };

  const getIcon = () => {
    if (nodeData.type === 'image') return <ImageIcon size={16} />;
    if (nodeData.type === 'audio') return <Music size={16} />;
    if (nodeData.type === 'pdf') return <FilePlus size={16} />;
    if (nodeData.type === 'txt') return <FileText size={16} />;
    if (nodeData.type === 'url') return <Globe size={16} />;
    return <Film size={16} />;
  };

  const getTitleColor = () => {
    switch (nodeData.type) {
      case 'video': return '#f43f5e';
      case 'image': return '#ec4899';
      case 'audio': return '#a855f7';
      default: return '#9ca3af';
    }
  };

  const handleClass = nodeData.type ? `handle-${nodeData.type}` : 'handle-video';

  const hasMedia = !!nodeData.value;
  const isVisual = nodeData.type === 'image' || nodeData.type === 'video';

  return (
    <div
      className="custom-node"
      style={{ padding: 0, minWidth: 260, borderRadius: 18, overflow: 'visible' }}
    >
      <NodeLabel id={id} label={nodeData.label} defaultLabel={nodeData.type ? `${nodeData.type.charAt(0).toUpperCase() + nodeData.type.slice(1)} Input` : 'Media Input'} />

      {/* Persistent header */}
      <div className="node-header" style={{ color: getTitleColor() }}>
        {getIcon()}
        <span className="font-black tracking-tighter uppercase">{nodeData.type || 'Media'} Input</span>
        {nodeData.type && (
          <span className="ml-auto text-[8px] bg-white/10 px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-gray-400">
            {nodeData.source || 'upload'}
          </span>
        )}
      </div>

      {/* Full-bleed drop zone / preview */}
      <div
        className={`relative w-full ${hasMedia && isVisual ? 'aspect-video' : 'min-h-[160px] flex items-center justify-center'} bg-zinc-900 cursor-pointer transition-all overflow-hidden`}
        style={{ outline: isDragOver ? '2px dashed #ec4899' : 'none', outlineOffset: '-2px' }}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); }}
        onClick={() => !hasMedia && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*,audio/*,.pdf,.txt"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
        />

        {/* Preview */}
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-rose-400">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Uploading…</span>
          </div>
        ) : hasMedia && nodeData.type === 'video' ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={nodeData.value}
              className="w-full h-full object-cover"
              muted
              loop
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
            {/* Play/pause overlay button */}
            <button
              className="absolute inset-0 flex items-center justify-center nodrag group"
              onClick={(e) => {
                e.stopPropagation();
                const v = videoRef.current;
                if (!v) return;
                if (v.paused) { v.play(); } else { v.pause(); }
              }}
            >
              {!isPlaying && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
                >
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="white">
                    <path d="M0 0L14 8L0 16V0Z" />
                  </svg>
                </div>
              )}
              {isPlaying && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
                >
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="white">
                    <rect x="0" y="0" width="4" height="14" />
                    <rect x="8" y="0" width="4" height="14" />
                  </svg>
                </div>
              )}
            </button>
          </div>

        ) : hasMedia && nodeData.type === 'image' ? (
          <img src={nodeData.value} className="w-full h-full object-cover" alt="Preview" />
        ) : hasMedia && nodeData.type === 'audio' ? (
          <div className="flex flex-col items-center gap-3 text-purple-400">
            <Music size={36} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Audio Loaded</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 select-none">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <FilePlus size={22} className="text-gray-600" />
            </div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight text-center px-6">
              Drop file or click to upload
            </span>
            <span className="text-[8px] text-gray-700 uppercase tracking-widest">
              video · image · audio · pdf
            </span>
          </div>
        )}

        {/* Drag-over replace hint */}
        {isDragOver && hasMedia && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-black text-[11px] uppercase tracking-widest">Replace media</span>
          </div>
        )}

        {/* Metadata overlay strip */}
        {hasMedia && nodeData.metadata && isVisual && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)' }}>
            <span className="text-[8px] font-mono text-white/60 uppercase">
              {nodeData.metadata.resolution}
            </span>
            <span className="text-[8px] font-mono text-white/60 uppercase">
              {nodeData.metadata.codec}
            </span>
            <span className="text-[8px] font-mono text-white/60 uppercase">
              {nodeData.metadata.size}
            </span>
          </div>
        )}

        {/* Header pill top-left */}
        {hasMedia && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(0,0,0,0.55)', color: getTitleColor(), backdropFilter: 'blur(6px)' }}>
            {getIcon()}
            <span>{nodeData.type}</span>
          </div>
        )}

        {/* Fullscreen button top-right */}
        {hasMedia && isVisual && (
          <button
            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 nodrag"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { e.stopPropagation(); setShowFullSize(true); }}
            title="Ver tamaño completo"
          >
            <Maximize2 size={12} className="text-white/70" />
          </button>
        )}

        {/* Replace hint when has media */}
        {hasMedia && !isDragOver && (
          <button
            className="absolute bottom-8 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity nodrag"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            title="Reemplazar archivo"
          >
            <FilePlus size={10} className="text-white/70" />
          </button>
        )}
      </div>

      {/* Fullscreen portal overlay */}
      {showFullSize && nodeData.value && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center nodrag nopan"
          onClick={() => setShowFullSize(false)}
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <div className="absolute top-6 right-6 flex items-center gap-4">
            <span className="text-white/40 text-[10px] uppercase tracking-widest">Click anywhere to close</span>
            <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all" onClick={() => setShowFullSize(false)}>
              <X size={20} className="text-white" />
            </button>
          </div>
          {/* Metadata bar */}
          {nodeData.metadata && (
            <div className="absolute top-6 left-6 flex items-center gap-4">
              {Object.entries(nodeData.metadata).map(([k,v]) => (
                <div key={k} className="text-center">
                  <div className="text-[8px] text-white/30 uppercase tracking-widest">{k}</div>
                  <div className="text-[11px] text-white/70 font-mono">{v as string}</div>
                </div>
              ))}
            </div>
          )}
          <div onClick={(e) => e.stopPropagation()} className="max-w-[90vw] max-h-[85vh]">
            {nodeData.type === 'video' ? (
              <video
                src={nodeData.value}
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl"
                controls
                autoPlay
              />
            ) : (
              <img
                src={nodeData.value}
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
                alt="Full size"
              />
            )}
          </div>
        </div>,
        document.body
      )}

      <div className="handle-wrapper handle-right" style={{ top: '50%' }}>
        <span className="handle-label">Media Asset</span>
        <Handle type="source" position={Position.Right} id="media" className={handleClass} />
      </div>
    </div>
  );
});


export const PromptNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const { setNodes } = useReactFlow();
  return (
    <div className="custom-node prompt-node">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Prompt" />
      <div className="node-header">
        <Type size={16} /> PROMPT
      </div>
      <div className="node-content">
        <textarea 
          className="node-textarea nowheel nodrag nokey"
          placeholder="Describe your vision..."
          value={nodeData.value || ''}
          onChange={(e) => setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, value: e.target.value } } : n))}
          onContextMenu={(e) => e.stopPropagation()}
        />
      </div>
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Prompt out</span>
        <Handle type="source" position={Position.Right} id="prompt" className="handle-prompt" />
      </div>
    </div>
  );
});

// --- LOGIC NODES ---

export const ConcatenatorNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const nodes = useNodes();
  const edges = useEdges();
  const { setNodes } = useReactFlow();

  // Find all edges connected TO this node
  const connectedInputs = useMemo(() => 
    edges.filter((e: any) => e.target === id).sort((a: any, b: any) => (a.targetHandle || '').localeCompare(b.targetHandle || '')),
    [edges, id]
  );

  // Dynamic logic: result is concatenation of all connected prompt values
  useEffect(() => {
    const values = connectedInputs.map((edge: any) => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      return sourceNode?.data.value || '';
    });
    
    const result = values.filter((v: any) => v).join(' ').trim();
    if (result !== (nodeData.value || '')) {
      setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, value: result } } : n));
    }
  }, [connectedInputs, nodes, id, nodeData.value, setNodes]);

  // Fixed handles for stability: 8 slots available
  const handleIds = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];

  return (
    <div className="custom-node tool-node min-w-[220px]">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Concatenator" />
      {handleIds.map((hId: any, index: number) => (
        <div key={hId} className="handle-wrapper handle-left" style={{ top: `${(index + 1) * (100 / (handleIds.length + 1))}%` }}>
          <Handle 
            type="target" 
            position={Position.Left} 
            id={hId} 
            className={`handle-prompt ${connectedInputs.some(e => e.targetHandle === hId) ? 'active' : ''}`} 
          />
          <span className="handle-label">In {index + 1}</span>
        </div>
      ))}
      
      <div className="node-header bg-gradient-to-r from-blue-600/20 to-cyan-600/20">
        <PlusSquare size={16} className="text-blue-400" /> 
        <span>Concatenator</span>
        <div className="node-badge">UTILITY</div>
      </div>
      <div className="node-content">
        <div className="p-3 bg-slate-50/50 rounded-lg text-[10px] text-gray-400 font-mono italic min-h-[50px] max-h-[150px] overflow-y-auto">
          {nodeData.value || 'Connect prompts to combine them...'}
        </div>
        <div className="mt-2 text-[8px] text-gray-600 uppercase font-bold tracking-tighter">
          {connectedInputs.length} Inputs active
        </div>
      </div>
      
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Result</span>
        <Handle type="source" position={Position.Right} id="prompt" className="handle-prompt" />
      </div>
    </div>
  );
});

export const EnhancerNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const nodes = useNodes();
  const edges = useEdges();
  const { setNodes } = useReactFlow();
  const [loading, setLoading] = useState(false);

  // Fixed 8 slots — always in DOM so ReactFlow can always draw edges to them
  const ALL_HANDLES = ['p0','p1','p2','p3','p4','p5','p6','p7'];

  // All edges targeting this node, sorted by handle id
  const connectedEdges = useMemo(() =>
    edges.filter((e: any) => e.target === id)
         .sort((a: any, b: any) => (a.targetHandle || '').localeCompare(b.targetHandle || '')),
    [edges, id]
  );

  const connectedHandleIds = new Set(connectedEdges.map((e: any) => e.targetHandle));
  // How many handles to visually show (connected + 1 empty, min 1, max 8)
  const visibleCount = Math.min(connectedEdges.length + 1, ALL_HANDLES.length);

  // Live concatenation
  const concatenated = useMemo(() =>
    connectedEdges
      .map((edge: any) => nodes.find((n: any) => n.id === edge.source)?.data.value || '')
      .filter(Boolean)
      .join('\n\n'),
    [connectedEdges, nodes]
  );

  const handleEnhance = async () => {
    const input = concatenated || nodeData.value;
    if (!input) return alert('Connect at least one prompt!');
    setLoading(true);
    try {
      const res = await fetch('/api/openai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const json = await res.json();
      setNodes((nds: any) =>
        nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, value: json.enhanced } } : n)
      );
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="custom-node tool-node min-w-[260px]">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Enhancer" />

      {/* Always render all 8 handles; hide extras beyond connected+1 */}
      {ALL_HANDLES.map((hId, index) => {
        const connected = connectedHandleIds.has(hId);
        const visible = index < visibleCount;
        return (
          <div
            key={hId}
            className="handle-wrapper handle-left"
            style={{
              top: `${(index + 1) * (100 / (visibleCount + 1))}%`,
              visibility: visible ? 'visible' : 'hidden',
              pointerEvents: visible ? 'auto' : 'none',
            }}
          >
            <Handle
              type="target"
              position={Position.Left}
              id={hId}
              className={`handle-prompt ${connected ? '' : 'opacity-40'}`}
            />
            <span className="handle-label" style={{ fontSize: 7 }}>
              {connected ? `P${index + 1} ✓` : `P${index + 1}`}
            </span>
          </div>
        );
      })}

      <div className="node-header bg-gradient-to-r from-purple-600/20 to-indigo-600/20">
        <Zap size={16} className="text-purple-400" />
        <span>Prompt Enhancer</span>
        <div className="node-badge">AI TOOL</div>
      </div>

      <div className="node-content space-y-3">
        {concatenated ? (
          <div className="p-2 rounded-lg border border-purple-500/20 bg-purple-500/5 text-[9px] text-purple-300 font-mono leading-relaxed max-h-[100px] overflow-y-auto whitespace-pre-wrap">
            {concatenated}
          </div>
        ) : (
          <div className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-[9px] text-zinc-600 italic">
            Connect prompts to see concatenation…
          </div>
        )}

        {connectedEdges.length > 0 && (
          <div className="text-[8px] font-black text-purple-400/70 uppercase tracking-widest">
            {connectedEdges.length} prompt{connectedEdges.length > 1 ? 's' : ''} connected
          </div>
        )}

        <button className="execute-btn w-full" onClick={handleEnhance} disabled={loading}>
          {loading ? <><Loader2 size={12} className="animate-spin" /> ENHANCING…</> : 'ENHANCE WITH OPENAI'}
        </button>

        {nodeData.value && (
          <div className="p-3 bg-slate-50/50 rounded-lg text-[10px] text-gray-300 italic min-h-[60px] max-h-[140px] overflow-y-auto">
            {nodeData.value}
          </div>
        )}
      </div>

      <div className="handle-wrapper handle-right">
        <span className="handle-label">Enhanced</span>
        <Handle type="source" position={Position.Right} id="prompt" className="handle-prompt" />
      </div>
    </div>
  );
});


// --- GENERATOR NODES ---




export const GrokNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const { setNodes } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState<string | null>(null);

  const onRun = async () => {
    const video = nodes.find(n => n.id === edges.find(e => e.target === id && e.targetHandle === 'video')?.source)?.data.value;
    const prompt = nodes.find(n => n.id === edges.find(e => e.target === id && e.targetHandle === 'prompt')?.source)?.data.value;
    if (!prompt) return alert("Need prompt!");
    
    setStatus('running');
    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promptText: prompt, 
          videoUrl: video, 
          duration: nodeData.duration || 5,
          resolution: nodeData.resolution || '720p',
          aspect_ratio: nodeData.aspect_ratio || '16:9'
        })
      });
      const json = await res.json();
      if (json.taskId) {
        const check = setInterval(async () => {
          const sRes = await fetch(`/api/grok/status/${json.taskId}`);
          const sJson = await sRes.json();
          if (['SUCCEEDED', 'DONE'].includes(sJson.status?.toUpperCase())) {
            setResult(sJson.output?.[0]);
            setStatus('success');
            clearInterval(check);
          }
        }, 3000);
      }
    } catch (e) { setStatus('error'); }
  };

  return (
    <div className={`custom-node processor-node ${status === 'running' ? 'node-glow-running' : ''}`}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Grok Imagine" />
      <div className="handle-wrapper handle-left" style={{ top: '30%' }}>
        <Handle type="target" position={Position.Left} id="video" className="handle-video" />
        <span className="handle-label">Video in</span>
      </div>
      <div className="handle-wrapper handle-left" style={{ top: '70%' }}>
        <Handle type="target" position={Position.Left} id="prompt" className="handle-prompt" />
        <span className="handle-label">Prompt in</span>
      </div>
      <div className="node-header"><Compass size={16} /> GROK IMAGINE</div>
      <div className="node-content">
        <div className="flex gap-2 mb-3">
          <select className="node-input text-[10px]" value={nodeData.resolution || '720p'} onChange={(e) => setNodes((nds: any) => nds.map((n: any) => n.id === id ? {...n, data: {...n.data, resolution: e.target.value}} : n))}>
            <option value="720p">720p</option>
            <option value="480p">480p</option>
          </select>
          <select className="node-input text-[10px]" value={nodeData.aspect_ratio || '16:9'} onChange={(e) => setNodes((nds: any) => nds.map((n: any) => n.id === id ? {...n, data: {...n.data, aspect_ratio: e.target.value}} : n))}>
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
          </select>
        </div>
        <button className="execute-btn w-full justify-center" onClick={onRun}>{status === 'running' ? 'PROCESSING...' : 'GENERATE VIDEO'}</button>
        {result && <video src={result} className="mt-4 rounded-lg w-full" controls />}
      </div>
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Video out</span>
        <Handle type="source" position={Position.Right} id="video" className="handle-video" />
      </div>
    </div>
  );
});


// ── NANO BANANA NODE ─────────────────────────────────────────────────────────
const NB_MODELS = [
  { id: 'flash31', label: 'Flash 3.1', badge: 'SPEED+', color: 'text-cyan-400', borderColor: 'border-cyan-500/40', bg: 'bg-cyan-500/10' },
  { id: 'pro3',    label: 'Pro 3',     badge: 'PRO',     color: 'text-violet-400', borderColor: 'border-violet-500/40', bg: 'bg-violet-500/10' },
  { id: 'flash25', label: 'Flash 2.5', badge: 'FAST',    color: 'text-emerald-400', borderColor: 'border-emerald-500/40', bg: 'bg-emerald-500/10' },
] as const;

const ASPECT_RATIOS = [
  { value: '1:1',  label: '1:1',  icon: '⬛', category: 'standard' },
  { value: '16:9', label: '16:9', icon: '▬', category: 'standard' },
  { value: '9:16', label: '9:16', icon: '▮', category: 'standard' },
  { value: '3:2',  label: '3:2',  icon: '▬', category: 'standard' },
  { value: '4:3',  label: '4:3',  icon: '▬', category: 'standard' },
  { value: '2:3',  label: '2:3',  icon: '▮', category: 'standard' },
  { value: '3:4',  label: '3:4',  icon: '▮', category: 'standard' },
  { value: '4:1',  label: '4:1',  icon: '━', category: 'extreme' },
  { value: '1:4',  label: '1:4',  icon: '┃', category: 'extreme' },
  { value: '8:1',  label: '8:1',  icon: '━', category: 'extreme' },
  { value: '1:8',  label: '1:8',  icon: '┃', category: 'extreme' },
] as const;

const REF_SLOTS = [
  { id: 'image',  label: 'Ref 1', top: '15%' },
  { id: 'image2', label: 'Ref 2', top: '32%' },
  { id: 'image3', label: 'Ref 3', top: '49%' },
  { id: 'image4', label: 'Ref 4', top: '66%' },
] as const;

export const NanoBananaNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & {
    aspect_ratio?: string;
    resolution?: string;
    modelKey?: string;
    thinking?: boolean;
  };
  const nodes = useNodes();
  const edges = useEdges();
  const { setNodes } = useReactFlow();
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [showFullSize, setShowFullSize] = useState(false);

  const selectedModel = nodeData.modelKey || 'flash31';
  const modelInfo = NB_MODELS.find(m => m.id === selectedModel) || NB_MODELS[0];
  const isPro = selectedModel === 'pro3';
  const isFlash25 = selectedModel === 'flash25';

  const updateData = (key: string, val: any) =>
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n));

  // Collect all connected reference images
  const getRefImages = () => {
    const imgs: (string | null)[] = [];
    for (const slot of REF_SLOTS) {
      const edge = edges.find(e => e.target === id && e.targetHandle === slot.id);
      const srcNode = edge ? nodes.find(n => n.id === edge.source) : null;
      const rawVal = srcNode?.data?.value;
      imgs.push(typeof rawVal === 'string' ? rawVal : null);
    }
    return imgs;
  };

  // Check which handles have connections
  const connectedSlots = REF_SLOTS.map(slot =>
    edges.some(e => e.target === id && e.targetHandle === slot.id)
  );

  const onRun = async () => {
    const promptEdge = edges.find(e => e.target === id && e.targetHandle === 'prompt');
    const prompt = nodes.find(n => n.id === promptEdge?.source)?.data?.value;
    if (!prompt) return alert("Connect a prompt node!");

    const refImages = getRefImages().filter(Boolean) as string[];

    setStatus('running');
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(p => {
        const next = p + (isPro ? 0.6 : 1.2); // thinking takes longer
        return next > 92 ? 92 : next;
      });
    }, 400);

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          images: refImages,
          aspect_ratio: nodeData.aspect_ratio || '1:1',
          resolution: isFlash25 ? '1k' : (nodeData.resolution || '1k'),
          model: selectedModel,
          thinking: nodeData.thinking && isPro,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.output) {
        setResult(json.output);
        setNodes(nds => nds.map(n =>
          n.id === id ? { ...n, data: { ...n.data, value: json.output, type: 'image' } } : n
        ));
        setStatus('success');
      } else throw new Error("No output received");
    } catch (e: any) {
      clearInterval(progressInterval);
      console.error("[NanoBanana] Error:", e.message);
      alert("Nano Banana Error:\n" + e.message);
      setStatus('error');
    } finally {
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className={`custom-node processor-node w-[340px] ${status === 'running' ? 'node-glow-running' : ''}`}
         style={{ minHeight: 0 }}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Nano Banana 2" />

      {/* ── Reference image handles (4 slots) ─── */}
      {REF_SLOTS.map((slot, i) => (
        <div key={slot.id} className="handle-wrapper handle-left"
             style={{ top: slot.top, opacity: i === 0 || connectedSlots[i - 1] ? 1 : 0.35 }}>
          <Handle type="target" position={Position.Left} id={slot.id} className="handle-image" />
          <span className="handle-label" style={{
            color: connectedSlots[i] ? '#f59e0b' : undefined,
            fontWeight: connectedSlots[i] ? '900' : undefined,
          }}>
            {connectedSlots[i] ? `✓ ${slot.label}` : slot.label}
          </span>
        </div>
      ))}

      {/* ── Prompt handle ─── */}
      <div className="handle-wrapper handle-left" style={{ top: '83%' }}>
        <Handle type="target" position={Position.Left} id="prompt" className="handle-prompt" />
        <span className="handle-label">Prompt</span>
      </div>

      {/* ── Node header ─── */}
      <div className="node-header bg-gradient-to-r from-yellow-600/20 to-orange-600/20">
        <Sparkles size={15} className="text-yellow-400" />
        <span>Nano Banana</span>
        <div className={`node-badge ${modelInfo.bg} ${modelInfo.color} border ${modelInfo.borderColor}`}>
          {modelInfo.badge}
        </div>
      </div>

      <div className="node-content space-y-4">

        {/* ── Model selector ─── */}
        <div className="space-y-1.5">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Model</span>
          <div className="grid grid-cols-3 gap-1.5">
            {NB_MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => updateData('modelKey', m.id)}
                className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all
                  ${selectedModel === m.id
                    ? `${m.bg} ${m.color} ${m.borderColor} shadow-sm`
                    : 'bg-white/[0.02] text-zinc-600 border-white/5 hover:border-white/15 hover:text-zinc-400'
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {isPro && (
            <p className="text-[8px] text-violet-400/70 font-medium leading-tight">
              Pro 3: professional quality, slower. Supports thinking mode.
            </p>
          )}
        </div>

        {/* ── Aspect ratio grid ─── */}
        <div className="space-y-1.5">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Aspect Ratio</span>
          {/* Standard */}
          <div className="grid grid-cols-7 gap-1">
            {ASPECT_RATIOS.filter(r => r.category === 'standard').map(r => (
              <button
                key={r.value}
                onClick={() => updateData('aspect_ratio', r.value)}
                title={r.value}
                className={`py-1 rounded text-[7px] font-black text-center border transition-all
                  ${nodeData.aspect_ratio === r.value
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                    : 'bg-white/[0.02] text-zinc-600 border-white/5 hover:border-white/15 hover:text-zinc-400'
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* Extreme — only for flash31 and pro3 */}
          <div className="grid grid-cols-4 gap-1">
            {ASPECT_RATIOS.filter(r => r.category === 'extreme').map(r => (
              <button
                key={r.value}
                onClick={() => !isFlash25 && updateData('aspect_ratio', r.value)}
                disabled={isFlash25}
                title={isFlash25 ? `${r.value} — not available on Flash 2.5` : r.value}
                className={`py-1 rounded text-[7px] font-black text-center border transition-all
                  ${isFlash25 ? 'opacity-25 cursor-not-allowed bg-white/[0.01] text-zinc-700 border-white/5' :
                    nodeData.aspect_ratio === r.value
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                      : 'bg-white/[0.02] text-zinc-600 border-white/5 hover:border-white/15 hover:text-zinc-400'
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {isFlash25 && (
            <p className="text-[7px] text-zinc-700 font-bold">Extreme ratios only on Flash 3.1 / Pro 3</p>
          )}
        </div>

        {/* ── Resolution ─── */}
        {!isFlash25 && (
          <div className="space-y-1.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Resolution</span>
            <div className="grid grid-cols-4 gap-1">
              {[
                { v: '0.5k', l: '0.5K', hint: 'Draft' },
                { v: '1k',   l: '1K',   hint: 'Normal' },
                { v: '2k',   l: '2K',   hint: 'High' },
                { v: '4k',   l: '4K',   hint: 'Ultra' },
              ].map(({ v, l, hint }) => (
                <button
                  key={v}
                  onClick={() => updateData('resolution', v)}
                  title={hint}
                  className={`py-1 rounded text-[8px] font-black border transition-all
                    ${nodeData.resolution === v || (!nodeData.resolution && v === '1k')
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : 'bg-white/[0.02] text-zinc-600 border-white/5 hover:border-white/15 hover:text-zinc-400'
                    }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Thinking mode ─── */}
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all
          ${isPro
            ? 'bg-violet-500/5 border-violet-500/20 cursor-pointer hover:bg-violet-500/10'
            : 'bg-white/[0.02] border-white/5 opacity-35 cursor-not-allowed'
          }`}
          onClick={() => isPro && updateData('thinking', !nodeData.thinking)}
        >
          <div className="space-y-0.5">
            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <span>🧠</span> Thinking Mode
            </p>
            <p className="text-[7px] text-zinc-600 font-medium">
              {isPro ? 'Deep reasoning before generation (+30s)' : 'Pro 3 model required'}
            </p>
          </div>
          <div className={`w-8 h-4 rounded-full border transition-all flex items-center px-0.5
            ${isPro && nodeData.thinking
              ? 'bg-violet-500 border-violet-500 justify-end'
              : 'bg-white/5 border-white/10 justify-start'
            }`}>
            <div className={`w-3 h-3 rounded-full transition-all
              ${isPro && nodeData.thinking ? 'bg-white' : 'bg-zinc-600'}`} />
          </div>
        </div>

        {/* ── Reference images connected indicator ─── */}
        {connectedSlots.some(Boolean) && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Ref Images</span>
            <div className="flex gap-1.5 ml-auto">
              {REF_SLOTS.map((slot, i) => (
                <div key={slot.id}
                  className={`w-4 h-4 rounded border text-[6px] font-black flex items-center justify-center transition-all
                    ${connectedSlots[i]
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-white/[0.02] border-white/5 text-zinc-700'
                    }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Generate button ─── */}
        <button
          className="execute-btn w-full !py-3 !text-xs"
          onClick={onRun}
          disabled={status === 'running'}
        >
          {status === 'running'
            ? <><Loader2 size={12} className="animate-spin" /><span className="ml-2">{isPro && nodeData.thinking ? 'THINKING...' : 'GENERATING...'}</span></>
            : <><Sparkles size={12} /><span className="ml-2">GENERATE IMAGE</span></>
          }
        </button>

        {/* ── Progress bar ─── */}
        {status === 'running' && (
          <div className="space-y-1">
            <div className="w-full bg-white/5 h-0.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[7px] text-yellow-500/50 font-medium text-center uppercase tracking-widest animate-pulse">
              {isPro && nodeData.thinking
                ? `Nano Banana Pro · Thinking → Generating (40-90s)... ${Math.round(progress)}%`
                : `Flash ${selectedModel === 'flash31' ? '3.1' : '2.5'} · Generating (15-35s)... ${Math.round(progress)}%`
              }
            </p>
          </div>
        )}

        {/* ── Result preview ─── */}
        <div className="drop-zone overflow-hidden bg-slate-50 min-h-[160px] border-slate-200/60 group/media relative">
          {result ? (
            <>
              <img src={result} className="w-full h-full object-cover group-hover/media:scale-105 transition-transform duration-700" alt="Result" />
              <button
                onClick={() => setShowFullSize(true)}
                className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white text-[8px] font-black px-2 py-1 rounded-lg flex items-center gap-1 opacity-0 group-hover/media:opacity-100 transition-opacity"
              >
                <Maximize2 size={10} /> FULLSCREEN
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-20">
              <ImageIcon className="text-zinc-400" size={32} />
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">No image generated</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Output handle ─── */}
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Image out</span>
        <Handle type="source" position={Position.Right} id="image" className="handle-image" />
      </div>

      {/* ── Fullscreen overlay ─── */}
      {showFullSize && result && (
        <div
          className="fixed inset-0 z-[9999] bg-black/92 flex items-center justify-center p-10 cursor-zoom-out nodrag nopan"
          onClick={() => setShowFullSize(false)}
        >
          <div className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
            <X size={36} strokeWidth={2} />
          </div>
          <img src={result} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" alt="Full size" />
        </div>
      )}
    </div>
  );
});

// ── TEXT OVERLAY NODE ────────────────────────────────────────────────────────
const FONT_FAMILIES = [
  { label: 'Inter',        value: 'Inter, sans-serif' },
  { label: 'Serif',        value: 'Georgia, serif' },
  { label: 'Mono',         value: 'monospace' },
  { label: 'Display',      value: '"Bebas Neue", sans-serif' },
  { label: 'Playfair',     value: '"Playfair Display", serif' },
  { label: 'Roboto',       value: 'Roboto, sans-serif' },
  { label: 'Oswald',       value: 'Oswald, sans-serif' },
  { label: 'Lato',         value: 'Lato, sans-serif' },
  { label: 'Montserrat',   value: 'Montserrat, sans-serif' },
  { label: 'Comic',        value: '"Comic Sans MS", cursive' },
];

const FONT_WEIGHTS = [
  { label: 'Thin',    value: '300' },
  { label: 'Regular', value: '400' },
  { label: 'Bold',    value: '700' },
  { label: 'Black',   value: '900' },
];

export const TextOverlayNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & {
    text?: string;
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    fontWeight?: string;
    textAlign?: CanvasTextAlign;
    canvasW?: number;
    canvasH?: number;
  };
  const { setNodes } = useReactFlow();
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  const text       = nodeData.text      ?? 'Your text here';
  const fontFamily = nodeData.fontFamily ?? 'Inter, sans-serif';
  const fontSize   = nodeData.fontSize  ?? 72;
  const color      = nodeData.color     ?? '#ffffff';
  const fontWeight = nodeData.fontWeight ?? '700';
  const textAlign  = (nodeData.textAlign ?? 'center') as CanvasTextAlign;
  const canvasW    = nodeData.canvasW   ?? 1920;
  const canvasH    = nodeData.canvasH   ?? 400;

  const updateData = (key: string, val: any) =>
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n));

  // Render text on canvas and push to output
  const renderText = useCallback(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width  = canvasW;
    offscreen.height = canvasH;
    const ctx = offscreen.getContext('2d')!;

    // Transparent background
    ctx.clearRect(0, 0, canvasW, canvasH);

    ctx.font         = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle    = color;
    ctx.textAlign    = textAlign;
    ctx.textBaseline = 'middle';

    const x = textAlign === 'left' ? 40 : textAlign === 'right' ? canvasW - 40 : canvasW / 2;

    // Multi-line support (split by \n)
    const lines = text.split('\n');
    const lineH  = fontSize * 1.3;
    const startY = canvasH / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => ctx.fillText(line, x, startY + i * lineH));

    const dataUrl = offscreen.toDataURL('image/png');

    // Show in preview
    if (previewRef.current) {
      const pCtx = previewRef.current.getContext('2d')!;
      previewRef.current.width  = previewRef.current.offsetWidth  || 280;
      previewRef.current.height = previewRef.current.offsetHeight || 80;
      const scale = Math.min(previewRef.current.width / canvasW, previewRef.current.height / canvasH);
      pCtx.clearRect(0, 0, previewRef.current.width, previewRef.current.height);
      const img = new Image();
      img.onload = () => {
        pCtx.drawImage(img, 0, 0, canvasW * scale, canvasH * scale);
        setRendered(true);
      };
      img.src = dataUrl;
    }

    // Push to output
    setNodes((nds: any) => nds.map((n: any) =>
      n.id === id ? { ...n, data: { ...n.data, value: dataUrl, type: 'image' } } : n
    ));
  }, [text, fontFamily, fontSize, color, fontWeight, textAlign, canvasW, canvasH, id, setNodes]);

  return (
    <div className="custom-node tool-node w-[320px]">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Text Overlay" />

      <div className="node-header bg-gradient-to-r from-purple-600/20 to-pink-600/20">
        <Type size={14} className="text-purple-500" />
        <span>Text Overlay</span>
        <div className="node-badge bg-purple-500/10 text-purple-400 border border-purple-500/30">TEXT</div>
      </div>

      <div className="node-content space-y-3">

        {/* Text input */}
        <div className="space-y-1">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Text</span>
          <textarea
            className="node-textarea w-full text-sm"
            rows={3}
            value={text}
            placeholder="Your text here…"
            onChange={e => updateData('text', e.target.value)}
            style={{ fontFamily, fontSize: Math.min(fontSize, 16), color, fontWeight, resize: 'none' }}
          />
        </div>

        {/* Font family */}
        <div className="space-y-1">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Font Family</span>
          <div className="grid grid-cols-5 gap-1">
            {FONT_FAMILIES.map(f => (
              <button
                key={f.value}
                onClick={() => updateData('fontFamily', f.value)}
                className={`py-1 rounded text-[7px] font-bold border transition-all truncate
                  ${fontFamily === f.value
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                    : 'bg-white/[0.02] text-zinc-600 border-white/5 hover:border-white/15 hover:text-zinc-400'
                  }`}
                style={{ fontFamily: f.value }}
                title={f.label}
              >{f.label}</button>
            ))}
          </div>
        </div>

        {/* Font size + weight row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Size: {fontSize}px</span>
            <input
              type="range" min={12} max={300} step={2} value={fontSize}
              onChange={e => updateData('fontSize', Number(e.target.value))}
              className="node-slider w-full"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Weight</span>
            <div className="grid grid-cols-4 gap-0.5">
              {FONT_WEIGHTS.map(w => (
                <button
                  key={w.value}
                  onClick={() => updateData('fontWeight', w.value)}
                  className={`py-1 rounded text-[7px] border transition-all
                    ${fontWeight === w.value
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                      : 'bg-white/[0.02] text-zinc-600 border-white/5 hover:text-zinc-400'
                    }`}
                  style={{ fontWeight: w.value }}
                >{w.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Color + align row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color" value={color}
                onChange={e => updateData('color', e.target.value)}
                className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer"
              />
              <input
                type="text" value={color} maxLength={7}
                onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) updateData('color', e.target.value); }}
                className="node-input text-[9px] !py-1 !px-2 font-mono uppercase"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Align</span>
            <div className="grid grid-cols-3 gap-1">
              {(['left','center','right'] as CanvasTextAlign[]).map(a => (
                <button
                  key={a}
                  onClick={() => updateData('textAlign', a)}
                  className={`py-1 rounded text-[8px] font-black border transition-all
                    ${textAlign === a
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                      : 'bg-white/[0.02] text-zinc-600 border-white/5 hover:text-zinc-400'
                    }`}
                >{a === 'left' ? '⟵' : a === 'center' ? '≡' : '⟶'}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas size (compact) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Canvas W</span>
            <input type="number" value={canvasW} min={100} max={4000} step={10}
              onChange={e => updateData('canvasW', Number(e.target.value))}
              className="node-input text-[9px] !py-1 !px-2" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Canvas H</span>
            <input type="number" value={canvasH} min={100} max={4000} step={10}
              onChange={e => updateData('canvasH', Number(e.target.value))}
              className="node-input text-[9px] !py-1 !px-2" />
          </div>
        </div>

        {/* Render button */}
        <button className="execute-btn w-full !py-2.5 !text-xs" onClick={renderText}>
          <Type size={11} /> <span className="ml-2">RENDER TEXT → IMAGE</span>
        </button>

        {/* Preview canvas */}
        <div className="w-full rounded-xl overflow-hidden border border-white/10 bg-gray-900"
             style={{ height: 80 }}>
          <canvas
            ref={previewRef}
            style={{ width: '100%', height: '100%' }}
          />
          {!rendered && (
            <div className="flex items-center justify-center h-full opacity-25">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Preview after render</span>
            </div>
          )}
        </div>
      </div>

      {/* Output handle */}
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Image out</span>
        <Handle type="source" position={Position.Right} id="image" className="handle-image" />
      </div>
    </div>
  );
});


export const BackgroundRemoverNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & { 
    expansion?: number,
    feather?: number,

    threshold?: number,
    result_rgba?: string,
    result_mask?: string,
    bbox?: number[]
  };
  const nodes = useNodes();
  const edges = useEdges();
  const { setNodes } = useReactFlow();
  const [status, setStatus] = useState('idle');
  const [previewMode, setPreviewMode] = useState<'original' | 'mask' | 'cutout'>('cutout');
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  useEffect(() => {
    if (nodeData.threshold === undefined) {
      updateNestedData('threshold', 0.9);
    }
  }, []);

  const updateNestedData = (key: string, val: any) => {
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n));
  };

  const onRun = async () => {
    console.log("[BackgroundRemover] onRun triggered");
    
    // Find ANY incoming edge if the specific one fails
    const incomingEdges = edges.filter(e => e.target === id);
    console.log("[BackgroundRemover] Connected edges:", incomingEdges.length);

    if (incomingEdges.length === 0) {
      return alert("No input connected! Connect an image node to the left side.");
    }

    // Try to find a node with a value among all connected sources
    let media = "";
    let sourceNodeLabel = "";

    for (const edge of incomingEdges) {
      const srcNode = nodes.find(n => n.id === edge.source);
      const val = srcNode?.data?.value;
      if (typeof val === 'string' && val) {
        media = val;
        sourceNodeLabel = (srcNode.data.label || srcNode.id) as string;
        break;
      }
    }

    console.log("[BackgroundRemover] Found media from:", sourceNodeLabel);

    if (!media) {
      return alert("Connected node (" + sourceNodeLabel + ") has no image data. Try selecting an image in the source node first.");
    }

    setStatus('running');
    try {
      console.log("[BackgroundRemover] Fetching matte...");
      const res = await fetch('/api/spaces/matte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: media,
          expansion: nodeData.expansion ?? 0,
          feather: nodeData.feather ?? 0.6,
          threshold: nodeData.threshold ?? 0.9
        })
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setNodes((nds: any) => nds.map((n: any) => n.id === id ? { 
        ...n, 
        data: { 
          ...n.data, 
          rgba: json.rgba_image,
          mask: json.mask,
          bbox: json.bbox,
          result_rgba: json.rgba_image,
          result_mask: json.mask,
          value: json.rgba_image,
          metadata: json.metadata,
          type: 'image'
        } 
      } : n));
      
      setStatus('success');
    } catch (err: any) {
      console.error("[BackgroundRemover] Error:", err.message);
      alert("Background Remover Error:\n" + err.message);
      setStatus('idle');
    }
  };

  const getPreviewImage = () => {
    const sourceEdge = edges.find(e => e.target === id && e.targetHandle === 'media');
    const sourceNode = nodes.find(n => n.id === sourceEdge?.source);
    const original = sourceNode?.data.value as string | undefined;

    switch (previewMode) {
      case 'original': return original;
      case 'mask': return nodeData.result_mask;
      case 'cutout': return nodeData.result_rgba;
      default: return original;
    }
  };

  return (
    <div className={`custom-node mask-node w-[360px] ${status === 'running' ? 'node-glow-running' : ''}`}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Background Remover" />
      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="media" className="handle-image" />
        <span className="handle-label">Media Input</span>
      </div>
      
      <div className="node-header bg-gradient-to-r from-cyan-600/20 to-blue-600/20">
        <Scissors size={16} className="text-cyan-400" /> 
        <span>Remove Background</span>
        <button 
          onClick={() => setIsStudioOpen(true)}
          className="node-badge !bg-cyan-500/20 !text-cyan-400 hover:!bg-cyan-500/40 transition-colors pointer-events-auto cursor-pointer flex items-center gap-1.5 border-none outline-none"
        >
          <Maximize2 size={10} /> STUDIO
        </button>
      </div>
      
      <div className="flex flex-col">
          {/* PREVIEW AREA */}
          <div className="relative group/preview overflow-hidden bg-slate-100/50 h-[220px] flex items-center justify-center border-b border-slate-200/60">
             <div className="absolute top-2 left-2 z-10 flex gap-1 bg-slate-50/50 p-1 rounded-lg backdrop-blur-md border border-slate-200/60">
                {(['original', 'mask', 'cutout'] as const).map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setPreviewMode(mode)}
                    className={`px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-widest transition-all ${previewMode === mode ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  >
                    {mode}
                  </button>
                ))}
             </div>

            {getPreviewImage() ? (
              <img 
                src={getPreviewImage()} 
                className={`w-full h-full object-contain ${previewMode === 'mask' ? 'invert brightness-150' : ''}`} 
                alt="Remover Preview" 
              />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-20">
                 <Scissors size={40} className="text-cyan-400" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting Output</span>
              </div>
            )}

            {status === 'running' && (
              <div className="absolute inset-0 bg-slate-50 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                 <Loader2 size={24} className="animate-spin text-cyan-400 mb-2" />
                 <span className="text-[9px] font-black text-white uppercase tracking-widest">Processing Alpha...</span>
              </div>
            )}
          </div>

          {/* CONTROLS */}
          <div className="p-4 space-y-5">
            <button 
              onClick={onRun}
              disabled={status === 'running'}
              className="execute-btn w-full"
            >
              {status === 'running' ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              <span>{status === 'running' ? 'REMOVING...' : 'REMOVE BACKGROUND'}</span>
            </button>

            <div className="space-y-4 pt-2 border-t border-slate-200/60">
               <div className="space-y-2">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Threshold (Precision)</span>
                     <span className="text-[10px] font-mono text-pink-500 font-black bg-pink-500/10 px-2 py-0.5 rounded">{(nodeData.threshold ?? 0.9).toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" min="0" max="1" step="0.01"
                    value={nodeData.threshold ?? 0.9}
                    onChange={(e) => updateNestedData('threshold', parseFloat(e.target.value))}
                    className="node-slider nodrag accent-pink-500"
                  />
               </div>

               <div className="space-y-2">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Expansion</span>
                     <span className="text-[10px] font-mono text-cyan-400 font-black bg-cyan-400/10 px-2 py-0.5 rounded">{nodeData.expansion ?? 0}px</span>
                  </div>
                  <input 
                    type="range" min="-10" max="10" step="1"
                    value={nodeData.expansion ?? 0}
                    onChange={(e) => updateNestedData('expansion', parseInt(e.target.value))}
                    className="node-slider nodrag accent-cyan-500"
                  />
               </div>

               <div className="space-y-2">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Borders (Feather)</span>
                     <span className="text-[10px] font-mono text-blue-400 font-black bg-blue-400/10 px-2 py-0.5 rounded">{(nodeData.feather ?? 0.6).toFixed(1)}px</span>
                  </div>
                  <input 
                    type="range" min="0" max="2" step="0.1"
                    value={nodeData.feather ?? 0.6}
                    onChange={(e) => updateNestedData('feather', parseFloat(e.target.value))}
                    className="node-slider nodrag accent-blue-400"
                  />
               </div>
            </div>
          </div>
      </div>

      <div className="flex flex-col gap-2 absolute right-[-14px] top-[40px] nodrag">
          <div className="relative group/h mb-4">
             <Handle type="source" position={Position.Right} id="mask" className="handle-mask !right-0 shadow-[0_0_10px_rgba(34,211,238,0.5)] cursor-crosshair" />
             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase text-cyan-400 bg-black/90 px-1 border border-cyan-400/20 rounded opacity-0 group-hover/h:opacity-100 transition-opacity whitespace-nowrap">MASK</span>
          </div>
          <div className="relative group/h mb-4">
             <Handle type="source" position={Position.Right} id="rgba" className="handle-image !right-0 shadow-[0_0_10px_rgba(236,72,153,0.5)] cursor-crosshair" />
             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase text-pink-500 bg-black/90 px-1 border border-pink-500/20 rounded opacity-0 group-hover/h:opacity-100 transition-opacity whitespace-nowrap">CUTOUT</span>
          </div>
          <div className="relative group/h">
             <Handle type="source" position={Position.Right} id="bbox" className="handle-txt !right-0 shadow-[0_0_10px_rgba(245,158,11,0.5)] cursor-crosshair" />
             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase text-amber-500 bg-slate-100/50 px-1 border border-amber-500/20 rounded opacity-0 group-hover/h:opacity-100 transition-opacity whitespace-nowrap">BBOX</span>
          </div>
      </div>

      {isStudioOpen && createPortal(
        <MatteStudioOverlay 
          nodeData={nodeData}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          onRun={onRun}
          status={status}
          updateNestedData={updateNestedData}
          onClose={() => setIsStudioOpen(false)}
          getPreviewImage={getPreviewImage}
        />,
        document.body
      )}
    </div>
  );
});

interface MatteStudioOverlayProps {
  nodeData: any;
  previewMode: string;
  setPreviewMode: (mode: any) => void;
  onRun: () => void;
  status: string;
  updateNestedData: (key: string, val: any) => void;
  onClose: () => void;
  getPreviewImage: () => string | undefined;
}

const MatteStudioOverlay = ({ 
  nodeData, 
  previewMode, 
  setPreviewMode, 
  onRun, 
  status, 
  updateNestedData, 
  onClose,
  getPreviewImage 
}: MatteStudioOverlayProps) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col studio-overlay nodrag nopan">
      <div className="h-16 border-b border-slate-200/60 bg-slate-50/50 flex items-center px-8 gap-6 backdrop-blur-md">
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors cursor-pointer"><X size={20} /></button>
        <div className="h-6 w-px bg-white/10" />
        <div className="flex items-center gap-3">
          <Scissors className="text-cyan-500" size={18} />
          <span className="text-[11px] font-black uppercase tracking-[3px] text-white">Background Remover <span className="text-cyan-500/50">Studio</span></span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button 
            onClick={onRun}
            disabled={status === 'running'}
            className="group relative bg-cyan-500 hover:bg-cyan-400 text-black px-10 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[2px] transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2"
          >
            {status === 'running' ? <Loader2 size={12} className="animate-spin" /> : <Play size={10} />}
            {status === 'running' ? 'Computing...' : 'Run Extraction'}
            <div className="absolute inset-0 rounded-full group-hover:animate-ping bg-cyan-500/20 pointer-events-none"></div>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-slate-50/50 relative flex items-center justify-center p-12">
           <div className="absolute top-8 left-8 z-10 flex gap-2">
              {(['original', 'mask', 'cutout'] as const).map(mode => (
                <button 
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${previewMode === mode ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {mode}
                </button>
              ))}
           </div>

           <div className="w-full h-full relative group/canvas flex items-center justify-center">
              {getPreviewImage() ? (
                <img 
                  src={getPreviewImage()} 
                  className={`max-w-full max-h-full object-contain rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-slate-200/60 ${previewMode === 'mask' ? 'invert brightness-125' : ''}`} 
                  alt="Studio Preview" 
                />
              ) : (
                <div className="text-gray-800 flex flex-col items-center gap-4">
                  <ImageIcon size={64} opacity={0.2} />
                  <span className="text-sm font-black uppercase tracking-widest opacity-20">Waiting for media</span>
                </div>
              )}

              {status === 'running' && (
                <div className="absolute inset-0 bg-slate-50 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-2xl">
                   <div className="w-48 h-1 bg-cyan-500/10 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-cyan-500 animate-pulse w-full" />
                   </div>
                   <span className="text-xs font-black text-cyan-400 uppercase tracking-[4px] animate-pulse">Neural Processing...</span>
                </div>
              )}
           </div>
        </div>

        <div className="w-[380px] border-l border-slate-200/60 bg-slate-50/50 backdrop-blur-xl p-8 overflow-y-auto flex flex-col gap-8">
           <section className="space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                 <Zap size={14} />
                 <h3 className="text-[10px] font-black uppercase tracking-widest">Configuration</h3>
              </div>
              <div className="space-y-4 bg-white/[0.02] p-4 rounded-2xl border border-slate-200/60">
                <div>
                  <label className="node-label flex justify-between mb-2">Threshold <span className="text-cyan-500">{(nodeData.threshold ?? 0.9).toFixed(2)}</span></label>
                  <input 
                    type="range" min="0" max="1" step="0.01"
                    value={nodeData.threshold ?? 0.9}
                    onChange={(e) => updateNestedData('threshold', parseFloat(e.target.value))}
                    className="w-full h-1.5 accent-cyan-500 bg-white/5 rounded-full appearance-none"
                  />
                </div>
              </div>
           </section>

           <section className="space-y-4">
              <div className="flex items-center gap-2 text-pink-500">
                 <Paintbrush size={14} />
                 <h3 className="text-[10px] font-black uppercase tracking-widest">Refinement</h3>
              </div>
              <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-slate-200/60">
                <div>
                  <label className="node-label flex justify-between mb-3 uppercase tracking-tighter">Expansion <span className="text-cyan-400 font-mono">{nodeData.expansion ?? 0}px</span></label>
                  <input 
                    type="range" min="-10" max="10" step="1"
                    value={nodeData.expansion ?? 0}
                    onChange={(e) => updateNestedData('expansion', parseInt(e.target.value))}
                    className="w-full h-1.5 accent-cyan-500 bg-white/5 rounded-full appearance-none"
                  />
                </div>

                <div>
                  <label className="node-label flex justify-between mb-3 uppercase tracking-tighter">Feather <span className="text-pink-500 font-mono">{(nodeData.feather ?? 0.6).toFixed(1)}px</span></label>
                  <input 
                    type="range" min="0" max="2" step="0.1"
                    value={nodeData.feather ?? 0.6}
                    onChange={(e) => updateNestedData('feather', parseFloat(e.target.value))}
                    className="w-full h-1.5 accent-pink-500 bg-white/5 rounded-full appearance-none"
                  />
                </div>
              </div>
           </section>

           <div className="mt-auto space-y-4 px-2">
              <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                 <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500"><Info size={16} /></div>
                 <div className="flex-1">
                    <p className="text-[9px] font-bold text-amber-500 uppercase">GPU Acceleration Active</p>
                    <p className="text-[8px] text-gray-500">851-labs Professional Engine</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};



export const SpaceNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & { 
    outputType?: string, 
    inputType?: string,
    spaceId?: string,
    hasInput?: boolean,
    hasOutput?: boolean,
    internalCategories?: string[]
  };
  const { setNodes } = useReactFlow();
  const spaceId = nodeData.spaceId;

  // Refresh node when returning from an inner space (so preview updates)
  useEffect(() => {
    const onSpaceDataUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.spaceId === spaceId) {
        // Trigger a force-update by touching the node
        setNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, _ts: Date.now() } } : n));
      }
    };
    window.addEventListener('space-data-updated', onSpaceDataUpdated);
    return () => window.removeEventListener('space-data-updated', onSpaceDataUpdated);
  }, [id, spaceId, setNodes]);

  const onEnterSpace = () => {
    // This will be handled by the parent component via a custom event or callback
    const targetId = nodeData.spaceId || nodeData.value;
    const event = new CustomEvent('enter-space', { detail: { nodeId: id, spaceId: targetId } });
    window.dispatchEvent(event);
  };

  // Dynamic Icon Mapping
  const getIcon = () => {
    switch (nodeData.outputType) {
      case 'image': return <ImageIcon size={16} className="text-pink-400" />;
      case 'video': return <Film size={16} className="text-rose-400" />;
      case 'prompt': return <Type size={16} className="text-blue-400" />;
      case 'mask': return <Scissors size={16} className="text-cyan-400" />;
      case 'url': return <Globe size={16} className="text-emerald-400" />;
      case 'json': return <Zap size={16} className="text-purple-400" />;
      default: return <Layers size={16} className="text-cyan-400" />;
    }
  };

  const getHandleClass = () => {
    switch (nodeData.outputType) {
      case 'image': return 'handle-image';
      case 'video': return 'handle-video';
      case 'prompt': return 'handle-prompt';
      case 'mask': return 'handle-mask';
      case 'url': return 'handle-emerald';
      case 'json': return 'handle-sound';
      default: return '';
    }
  };

  const getInputHandleClass = () => {
    switch (nodeData.inputType) {
      case 'image': return 'handle-image';
      case 'video': return 'handle-video';
      case 'prompt': return 'handle-prompt';
      case 'mask': return 'handle-mask';
      case 'url': return 'handle-emerald';
      case 'json': return 'handle-sound';
      default: return '';
    }
  };

  const renderInternalIcon = (cat: string) => {
    switch (cat) {
      case 'ai': return <Zap size={14} key={cat} className="text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" />;
      case 'image': return <ImageIcon size={14} key={cat} className="text-pink-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />;
      case 'canvas': return <Layers size={14} key={cat} className="text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />;
      case 'prompt': return <Type size={14} key={cat} className="text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />;
      case 'logic': return <RefreshCw size={14} key={cat} className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" />;
      case 'video': return <Film size={14} key={cat} className="text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.5)]" />;
      case 'tool': return <Scissors size={14} key={cat} className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />;
      default: return null;
    }
  };

  return (
    <div className="relative" style={{ isolation: 'isolate' }}>
      {/* Ghost card layer 2 (furthest back) */}
      <div className="absolute inset-0 rounded-[18px] border border-white/30"
        style={{
          transform: 'translate(6px, 6px) rotate(1.5deg)',
          background: 'rgba(255,255,255,0.18)',
          zIndex: -2,
        }}
      />
      {/* Ghost card layer 1 */}
      <div className="absolute inset-0 rounded-[18px] border border-white/40"
        style={{
          transform: 'translate(3px, 3px) rotate(0.7deg)',
          background: 'rgba(255,255,255,0.25)',
          zIndex: -1,
        }}
      />

      {/* Main node card */}
      <div className="custom-node space-node border-cyan-500/30" style={{ position: 'relative', zIndex: 0 }}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Space" />
      
      {/* Input handle only if space has an internal InputNode */}
      {nodeData.hasInput !== false && (
        <div className="handle-wrapper handle-left">
          <Handle type="target" position={Position.Left} id="in" className={getInputHandleClass()} />
          <span className="handle-label">Data In</span>
        </div>
      )}
      
      <div className="node-header">
        {getIcon()} <span className="uppercase">{nodeData.outputType ? `${nodeData.outputType} Space` : 'NESTED SPACE'}</span>
      </div>
      
      <div className="node-content">
        {/* Internal Blueprint Summary */}
        <div className="flex flex-col gap-1.5 mb-3 p-2 bg-slate-50/50 border border-slate-200/60 rounded-xl shadow-inner">
          <div className="flex justify-between items-center px-1">
             <span className="text-[7.5px] font-black text-gray-500 uppercase tracking-widest">Internal Blueprint</span>
             <Layers size={10} className="text-gray-700" />
          </div>
          <div className="flex items-center justify-center gap-3 py-1 min-h-[24px]">
            {nodeData.internalCategories && nodeData.internalCategories.length > 0 ? (
              nodeData.internalCategories.map(cat => renderInternalIcon(cat))
            ) : (
              <span className="text-[8px] text-gray-700 font-bold uppercase tracking-tighter">Initializing...</span>
            )}
          </div>
        </div>

        {/* Output media preview */}
        {nodeData.value && (nodeData.outputType === 'image' || nodeData.outputType === 'video') && (
          <div className="relative w-full aspect-video overflow-hidden rounded-xl mb-3" style={{ background: '#0a0a0a' }}>
            {nodeData.outputType === 'video' ? (
              <video src={nodeData.value as string} className="w-full h-full object-cover" muted />
            ) : (
              <img src={nodeData.value as string} className="w-full h-full object-cover" alt="Space output" />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest"
              style={{ background: 'rgba(0,0,0,0.6)', color: nodeData.outputType === 'video' ? '#f43f5e' : '#ec4899', backdropFilter: 'blur(6px)' }}>
              {nodeData.outputType} output
            </div>
          </div>
        )}
        
        <button 
          onClick={onEnterSpace}
          className="execute-btn w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-900/40 py-3 rounded-2xl text-[11px] font-black transition-all active:scale-95 group/btn"
        >
          <Maximize2 size={16} className="group-hover/btn:scale-110 transition-transform" /> ENTER SPACE
        </button>
      </div>


      {/* Output handle only if space has an internal OutputNode */}
      {nodeData.hasOutput !== false && (
        <div className="handle-wrapper handle-right">
          <span className="handle-label">Result Out</span>
          <Handle type="source" position={Position.Right} id="out" className={getHandleClass()} />
        </div>
      )}
    </div>
    </div>
  );
});


export const SpaceInputNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & { inputType?: string };
  
  const getHandleClass = () => {
    switch (nodeData.inputType) {
      case 'image': return 'handle-image';
      case 'video': return 'handle-video';
      case 'prompt': return 'handle-prompt';
      case 'mask': return 'handle-mask';
      case 'url': return 'handle-emerald';
      case 'json': return 'handle-sound';
      default: return 'handle-emerald';
    }
  };

  const getThemeColors = () => {
    switch (nodeData.inputType) {
      case 'prompt': return { border: 'border-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: 'text-blue-500' };
      case 'image': return { border: 'border-pink-500/30', text: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', icon: 'text-pink-500' };
      case 'video': return { border: 'border-rose-500/30', text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: 'text-rose-500' };
      default: return { border: 'border-emerald-500/30', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: 'text-emerald-500' };
    }
  };

  const theme = getThemeColors();

  return (
    <div className={`custom-node space-io-node ${theme.border}`}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Input" />
      <div className="node-header">
        <ChevronRight size={16} className={theme.text} /> SPACE INPUT
      </div>
      <div className="node-content text-center py-4">
        <div className={`w-12 h-12 ${theme.bg} rounded-full flex items-center justify-center border mx-auto mb-2`}>
          <ArrowRight size={24} className={theme.icon} />
        </div>
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Entry Point</span>
      </div>
      <div className="handle-wrapper handle-right">
        <Handle type="source" position={Position.Right} id="out" className={getHandleClass()} />
      </div>
    </div>
  );
});

export const SpaceOutputNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & { outputType?: string };
  const nodes = useNodes();
  const edges = useEdges();

  // Find what's connected to the 'in' handle
  const inputEdge = edges.find((e: any) => e.target === id && e.targetHandle === 'in');
  const sourceNode = inputEdge ? nodes.find((n: any) => n.id === inputEdge.source) : null;
  const sourceValue: string | undefined = typeof sourceNode?.data?.value === 'string' ? sourceNode.data.value : undefined;
  // Resolve output type: NODE_REGISTRY is most reliable, fallback to data fields
  const nodeType = sourceNode?.type as string | undefined;
  const registryOutputType = nodeType ? (NODE_REGISTRY[nodeType]?.outputs?.[0]?.type ?? '') : '';
  const sourceType: string = registryOutputType || (sourceNode?.data?.outputType as string) || (sourceNode?.data?.type as string) || '';
  const isVisual = sourceType === 'image' || sourceType === 'video';

  const getHandleClass = () => {
    if (sourceType === 'image') return 'handle-image';
    if (sourceType === 'video') return 'handle-video';
    if (sourceType === 'prompt') return 'handle-prompt';
    return 'handle-rose';
  };

  const getThemeColors = () => {
    if (sourceType === 'image') return { border: 'border-pink-500/30', text: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', icon: 'text-pink-500' };
    if (sourceType === 'video') return { border: 'border-rose-500/30', text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: 'text-rose-500' };
    if (sourceType === 'prompt') return { border: 'border-blue-500/30', text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: 'text-blue-500' };
    return { border: 'border-rose-500/30', text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: 'text-rose-500' };
  };

  const theme = getThemeColors();

  return (
    <div className={`custom-node space-io-node ${theme.border}`} style={{ padding: 0, overflow: 'visible', minWidth: 200 }}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Output" />

      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="in" className={getHandleClass()} />
      </div>

      {/* Header */}
      <div className="node-header" style={{ padding: '10px 14px' }}>
        <ChevronLeft size={16} className={theme.text} />
        <span className="font-black tracking-tighter uppercase">Space Output</span>
      </div>

      {/* Media preview if connected visual node */}
      {isVisual && sourceValue ? (
        <div className="relative w-full aspect-video overflow-hidden" style={{ background: '#0a0a0a' }}>
          {sourceType === 'video' ? (
            <video src={sourceValue} className="w-full h-full object-cover" muted />
          ) : (
            <img src={sourceValue} className="w-full h-full object-cover" alt="Output preview" />
          )}
          {/* Type badge */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(0,0,0,0.6)', color: sourceType === 'video' ? '#f43f5e' : '#ec4899', backdropFilter: 'blur(6px)' }}>
            {sourceType}
          </div>
        </div>
      ) : (
        <div className="node-content text-center py-4">
          <div className={`w-12 h-12 ${theme.bg} rounded-full flex items-center justify-center border mx-auto mb-2`}>
            <CheckCircle size={24} className={theme.icon} />
          </div>
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
            {inputEdge ? 'Connected' : 'Exit Point'}
          </span>
        </div>
      )}
    </div>
  );
});



export const MediaDescriberNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const nodes = useNodes();
  const edges = useEdges();
  const { setNodes } = useReactFlow();
  const [status, setStatus] = useState('idle');
  const [description, setDescription] = useState<string | null>(null);

  const onRun = async () => {
    const inputEdge = edges.find(e => e.target === id && e.targetHandle === 'media');
    const inputNode = nodes.find(n => n.id === inputEdge?.source);
    
    if (!inputNode) return alert("Need media input to describe!");

    setStatus('running');
    
    try {
      let finalMediaUrl = inputNode.data.value;
      let finalMediaType = inputNode.type === 'imageComposer' ? 'image' : (inputNode.data.type || 'image');

      // If it's a composer and it doesn't have a flattened value yet, compose it on the fly
      if (inputNode.type === 'imageComposer' && !finalMediaUrl) {
        // Extract layers
        const composerEdges = edges.filter(e => e.target === inputNode.id)
          .sort((a: any, b: any) => (a.targetHandle || '').localeCompare(b.targetHandle || ''));
        
        const layersConfig: Record<string, any> = inputNode.data.layersConfig || {};
        
        const layers = composerEdges.map(edge => {
          const node = nodes.find(n => n.id === edge.source);
          const hId = edge.targetHandle || 'layer-0';
          const config = layersConfig[hId] || { x: 0, y: 0, scale: 1 };
          
          return {
            type: node?.type,
            value: (node?.data?.value || ((node?.data as any)?.urls && (node?.data as any)?.urls[(node?.data as any)?.selectedIndex || 0])) as string | undefined,
            color: node?.data?.color as string | undefined,
            width: node?.data?.width as number || 0,
            height: node?.data?.height as number || 0,
            x: config.x,
            y: config.y,
            scale: config.scale
          };
        }).filter(l => l.value || l.color);

        if (layers.length === 0) throw new Error("Composer has no layers attached.");

        const formData = new FormData();
        formData.append('layers', JSON.stringify(layers));
        formData.append('format', 'jpeg'); // JPEG is smaller for passing to OpenAI
        formData.append('width', '1920');
        formData.append('height', '1080');
        formData.append('previewWidth', '1920');
        formData.append('previewHeight', '1080');

        const composeRes = await fetch('/api/spaces/compose', { method: 'POST', body: formData });
        if (!composeRes.ok) throw new Error("Failed to flatten composer image.");
        
        const blob = await composeRes.blob();
        
        // Convert blob to base64 for the OpenAI Vision API (it accepts data URIs)
        finalMediaUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      if (!finalMediaUrl) throw new Error("No media URL available to describe.");

      const res = await fetch('/api/spaces/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: finalMediaUrl, 
          type: finalMediaType,
          metadata: inputNode.data.metadata
        })
      });
      const json = await res.json();
      
      if (json.description) {
        setDescription(json.description);
        setNodes((nds: any) => nds.map((n: any) => (n.id === id ? { ...n, data: { ...n.data, value: json.description } } : n)));
        setStatus('success');
      } else {
        throw new Error(json.error || "Failed to analyze");
      }
    } catch (err) {
      console.error("Describe error:", err);
      setStatus('error');
      alert("Error analyzing media: " + (err as Error).message);
    }
  };

  return (
    <div className={`custom-node describer-node ${status === 'running' ? 'node-glow-running' : ''}`}>
      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="media" />
        <span className="handle-label">Media in</span>
      </div>
      
      <div className="node-header bg-gradient-to-r from-indigo-600/20 to-blue-600/20">
        <Eye size={16} className="text-indigo-400" />
        <span>Gemini Describer</span>
        <div className="node-badge">VISION</div>
      </div>
      
      <div className="node-content">
        <p className="text-[10px] text-gray-500 mb-3 italic">Analyze any media and generate a detailed prompt description.</p>
        
        <button className="execute-btn w-full justify-center mb-4" onClick={onRun} disabled={status === 'running'}>
          {status === 'running' ? 'ANALYZING...' : 'GENERATE DESCRIPTION'}
        </button>

        <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/60 min-h-[80px]">
          {description ? (
            <div className="text-[10px] text-gray-300 leading-relaxed font-mono">{description}</div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-4">
              <Zap size={24} className="mb-2" />
              <span className="text-[8px] font-bold uppercase">Awaiting analysis</span>
            </div>
          )}
        </div>
      </div>

      <div className="handle-wrapper handle-right">
        <span className="handle-label">Description (Prompt)</span>
        <Handle type="source" position={Position.Right} id="prompt" className="handle-prompt" />
      </div>
    </div>
  );
});

const CameraMotionSelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const motions = [
    { id: '', label: 'Auto', icon: <div className="w-full h-full border border-dashed border-white/20 rounded-md" /> },
    { id: 'Dolly-in', label: 'Dolly-in', icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <rect x="10" y="10" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" className="animate-dolly-in" />
        <path d="M5 5 L15 15 M35 5 L25 15 M5 35 L15 25 M35 35 L25 25" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      </svg>
    )},
    { id: 'Dolly-out', label: 'Dolly-out', icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <rect x="10" y="10" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1" className="animate-dolly-out" />
        <path d="M5 5 L15 15 M35 5 L25 15 M5 35 L15 25 M35 35 L25 25" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
      </svg>
    )},
    { id: 'Orbit-Left', label: 'Orbit L', icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
        <circle cx="20" cy="8" r="3" fill="currentColor" className="animate-orbit" />
      </svg>
    )},
    { id: 'Slow-Pan', label: 'Pan', icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <rect x="5" y="12" width="30" height="16" fill="none" stroke="currentColor" strokeWidth="1" rx="2" />
        <path d="M8 15 L12 15 M15 15 L19 15 M22 15 L26 15" stroke="currentColor" strokeWidth="0.5" className="animate-pan" />
      </svg>
    )},
    { id: 'Crane-Up', label: 'Crane', icon: (
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <rect x="12" y="5" width="16" height="30" fill="none" stroke="currentColor" strokeWidth="1" rx="2" />
        <path d="M15 8 L15 12 M15 15 L15 19 M15 22 L15 26" stroke="currentColor" strokeWidth="0.5" className="animate-crane" />
      </svg>
    )},
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {motions.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border ${value === m.id ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-slate-200/60 text-zinc-500 hover:border-white/20'}`}
        >
          <div className="w-10 h-10 flex items-center justify-center">
            {m.icon}
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest">{m.label}</span>
        </button>
      ))}
    </div>
  );
};

export const GeminiVideoNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as any;
  const { setNodes, getEdges, getNodes } = useReactFlow();
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(nodeData.value || null);

  const onRun = async () => {
    const edges = getEdges();
    const nodes = getNodes();
    
    // Find inputs
    const promptEdge = edges.find((e: any) => e.target === id && e.targetHandle === 'prompt');
    const firstFrameEdge = edges.find((e: any) => e.target === id && e.targetHandle === 'firstFrame');
    const lastFrameEdge = edges.find((e: any) => e.target === id && e.targetHandle === 'lastFrame');
    const negativePromptEdge = edges.find((e: any) => e.target === id && e.targetHandle === 'negativePrompt');

    const findSourceValue = (edge: any) => {
      if (!edge) return null;
      const sourceNode = nodes.find((n: any) => n.id === edge.source);
      return sourceNode?.data?.value;
    };

    const prompt = findSourceValue(promptEdge) || nodeData.prompt || "";
    const firstFrame = findSourceValue(firstFrameEdge);
    const lastFrame = findSourceValue(lastFrameEdge);
    const negativePrompt = findSourceValue(negativePromptEdge) || nodeData.negativePrompt;

    if (!prompt) return alert("Se necesita un Creative Prompt para generar video. Puedes escribirlo en el nodo o conectar un nodo de Prompt.");

    setStatus('running');
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 - prev) * 0.05;
        return next > 99 ? 99 : next;
      });
    }, 2000);

    try {
      const res = await fetch('/api/gemini/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          firstFrame,
          lastFrame,
          resolution: nodeData.resolution || "1080p",
          durationSeconds: nodeData.duration || "5",
          audio: nodeData.audio || false,
          seed: nodeData.seed,
          negativePrompt: negativePrompt,
          animationPrompt: nodeData.animationPrompt,
          cameraPreset: nodeData.cameraPreset
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const json = await res.json();
      if (json.output) {
        setResult(json.output);
        setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, value: json.output, type: 'video' } } : n)));
        setStatus('success');
      }
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      alert("Error generating video: " + e.message);
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
    }
  };

  const updateData = (key: string, val: any) => {
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n));
  };

  return (
    <div className={`custom-node processor-node w-[350px] ${status === 'running' ? 'node-glow-running' : ''}`}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Gemini Video (Veo 3.1)" />
      
      <div className="handle-wrapper handle-left !top-[20%]">
        <Handle type="target" position={Position.Left} id="firstFrame" className="handle-image" />
        <span className="handle-label text-emerald-600">First Frame</span>
      </div>
      <div className="handle-wrapper handle-left !top-[35%]">
        <Handle type="target" position={Position.Left} id="lastFrame" className="handle-image" />
        <span className="handle-label text-emerald-600">Last Frame</span>
      </div>
      <div className="handle-wrapper handle-left !top-[50%]">
        <Handle type="target" position={Position.Left} id="prompt" className="handle-prompt" />
        <span className="handle-label text-emerald-600">Creative Prompt</span>
      </div>
      <div className="handle-wrapper handle-left !top-[65%]">
        <Handle type="target" position={Position.Left} id="negativePrompt" className="handle-prompt border-rose-500/50" />
        <span className="handle-label text-rose-600">Negative Prompt</span>
      </div>

      <div className="node-header bg-gradient-to-r from-emerald-600/20 to-cyan-600/20">
        <Video size={16} className="text-emerald-600" />
        <span>Gemini Video</span>
        <div className="node-badge">VEO 3.1</div>
      </div>

      <div className="node-content space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Resolution</span>
             <select 
               className="node-input text-[10px]" 
               value={nodeData.resolution || '1080p'} 
               onChange={(e) => updateData('resolution', e.target.value)}
             >
               <option value="720p">720p HD</option>
               <option value="1080p">1080p Full HD</option>
               <option value="4K">4K Ultra HD</option>
             </select>
          </div>
          <div className="space-y-1">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
             <select 
               className="node-input text-[10px]" 
               value={nodeData.duration || '5'} 
               onChange={(e) => updateData('duration', e.target.value)}
             >
               <option value="4">4 Seconds</option>
               <option value="5">5 Seconds</option>
               <option value="6">6 Seconds</option>
               <option value="8">8 Seconds</option>
             </select>
          </div>
        </div>

        <div className="border-t border-slate-200/60 pt-3 space-y-4">
          <div className="space-y-2">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Camera Motion</span>
            <CameraMotionSelector 
              value={nodeData.cameraPreset || ''} 
              onChange={(val) => updateData('cameraPreset', val)} 
            />
          </div>
        </div>

        <button 
          onClick={onRun}
          disabled={status === 'running'}
          className="execute-btn w-full justify-center gap-2 group relative overflow-hidden"
        >
          {status === 'running' && (
            <div className="absolute inset-0 bg-emerald-500/20" style={{ width: `${progress}%`, transition: 'width 0.5s ease-out' }} />
          )}
          <Zap size={14} className={status === 'running' ? 'animate-pulse' : 'group-hover:scale-125 transition-transform'} />
          <span className="relative z-10">{status === 'running' ? `GENERATING ${Math.round(progress)}%` : 'GENERATE VIDEO'}</span>
        </button>

        <div className="preview-container w-full min-h-[200px] bg-slate-50 rounded-xl border border-slate-200/60 overflow-hidden flex items-center justify-center relative group">
          {result ? (
            <video 
              src={result} 
              className="w-full h-full object-cover" 
              controls 
              loop 
              muted 
              playsInline
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
              <Video size={32} />
              <span className="text-[8px] font-black uppercase tracking-[2px]">No video generated</span>
            </div>
          )}
        </div>
      </div>

      <div className="handle-wrapper handle-right">
        <span className="handle-label text-cyan-400">Video Out</span>
        <Handle type="source" position={Position.Right} id="video" className="handle-video" />
      </div>
    </div>
  );
});

// --- PAINTER NODE ---
export const PainterNode = memo(({ id, data }: NodeProps<any>) => {
  const { setNodes } = useReactFlow();
  const nodeData = data as BaseNodeData & { 
    bgColor?: string, 
    strokeColor?: string, 
    brushSize?: number 
  };
  
  const width = 1024;
  const height = 1024;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(nodeData.strokeColor || '#ffffff');
  const [bgColor, setBgColor] = useState(nodeData.bgColor || '#000000');
  const [brushSize, setBrushSize] = useState(nodeData.brushSize || 10);
  const [mode, setMode] = useState<'brush'|'eraser'>('brush');
  
  const saveToNode = useCallback(() => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, value: dataUrl, type: 'image' } } : n));
  }, [id, setNodes]);

  // Handle changes to background color without clearing drawing
  useEffect(() => {
    if (data.value) return; 
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const currentData = canvas.toDataURL();
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      const img = new Image();
      img.onload = () => {
         ctx.drawImage(img, 0, 0);
         saveToNode();
      };
      img.src = currentData;
    }
  }, [bgColor, saveToNode, data.value, width, height]);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (!data.value) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      saveToNode();
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = data.value;
    }
  }, []);

  const updateData = (key: string, val: any) => {
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n));
  };

  const getCoordinates = (e: React.PointerEvent) => {
    if (!canvasRef.current || !containerRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.PointerEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    e.stopPropagation();
    
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = mode === 'eraser' ? bgColor : color;
    
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    e.stopPropagation();

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.closePath();
    setIsDrawing(false);
    e.preventDefault();
    e.stopPropagation();
    saveToNode();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    saveToNode();
  };

  return (
    <div className="custom-node bg-[#1e1e1e] border-slate-700 w-[300px]">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Painter" />
      
      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="image" className="handle-image" />
        <span className="handle-label text-emerald-500">Base Image</span>
      </div>

      <div className="node-content p-3 space-y-3 flex flex-col items-center">
        <div ref={containerRef} className="nodrag nopan bg-[#000000] rounded-2xl overflow-hidden flex items-center justify-center relative touch-none border border-slate-700 w-full shadow-inner">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-auto aspect-square cursor-crosshair touch-none"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            style={{ touchAction: 'none' }}
          />
        </div>

        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mt-2">
          <button 
            onClick={() => setMode('brush')}
            className={`p-1.5 rounded-md transition-colors ${mode === 'brush' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
          >
            <Paintbrush size={14} />
          </button>
          <button 
            onClick={() => setMode('eraser')}
            className={`p-1.5 rounded-md transition-colors ${mode === 'eraser' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
          >
            <Eraser size={14} />
          </button>
          <button onClick={clearCanvas} className="ml-auto text-[10px] text-gray-400 hover:text-white underline underline-offset-2">
            Clear
          </button>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <input 
              type="color" 
              value={color} 
              onChange={(e) => { setColor(e.target.value); updateData('strokeColor', e.target.value); }}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0 nodrag"
            />
            <input 
              type="text" 
              value={color.toUpperCase()} 
              onChange={(e) => { setColor(e.target.value); updateData('strokeColor', e.target.value); }}
              className="bg-black/30 border border-white/10 rounded px-2 py-1 text-[9px] text-white font-mono w-[60px] nodrag"
            />
            
            <div className="flex-1 flex items-center gap-2 ml-2">
              <span className="text-[9px] text-gray-500">Size</span>
              <input 
                type="range" 
                min="1" max="100" 
                value={brushSize} 
                onChange={(e) => { setBrushSize(parseInt(e.target.value)); updateData('brushSize', parseInt(e.target.value)); }}
                className="flex-1 accent-white nodrag"
              />
              <span className="text-[9px] text-gray-400 w-4 text-right">{brushSize}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
             <div className="bg-black/30 border border-white/5 p-1 px-2 rounded flex items-center gap-1">
               <span className="text-[9px] text-gray-600 font-mono">W</span>
               <input type="number" readOnly value={width} className="bg-transparent text-[10px] text-white font-mono outline-none w-8 p-0 border-0" />
             </div>
             <div className="bg-black/30 border border-white/5 p-1 px-2 rounded flex items-center gap-1">
               <span className="text-[9px] text-gray-600 font-mono">H</span>
               <input type="number" readOnly value={height} className="bg-transparent text-[10px] text-white font-mono outline-none w-8 p-0 border-0" />
             </div>
             
             <div className="ml-auto flex items-center gap-2 bg-black/30 border border-white/5 p-1 px-2 rounded">
               <span className="text-[9px] font-medium text-gray-400">Background Color</span>
               <input 
                 type="color" 
                 value={bgColor} 
                 onChange={(e) => { setBgColor(e.target.value); updateData('bgColor', e.target.value); }}
                 className="w-4 h-4 rounded cursor-pointer border-0 p-0 nodrag"
               />
             </div>
          </div>
        </div>
      </div>

      <div className="handle-wrapper handle-right">
        <span className="handle-label text-cyan-500">Output Image</span>
        <Handle type="source" position={Position.Right} id="image" className="handle-image" />
      </div>
    </div>
  );
});

// --- CROP NODE ---
export const CropNode = memo(({ id, data }: NodeProps<any>) => {
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();
  
  const nodeData = data as BaseNodeData & { 
    aspectRatio?: string,
    cropConfig?: { x: number, y: number, w: number, h: number }
  };
  
  const [aspectRatio, setAspectRatio] = useState(nodeData.aspectRatio || 'free'); 
  const [crop, setCrop] = useState(nodeData.cropConfig || { x: 10, y: 10, w: 80, h: 80 }); 
  
  const previewRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [draggingAction, setDraggingAction] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [dragStartInfo, setDragStartInfo] = useState<{ startX: number, startY: number, initialCrop: any } | null>(null);

  const inputEdge = edges.find(e => e.target === id && e.targetHandle === 'image');
  const inputNode = nodes.find(n => n.id === inputEdge?.source);
  const sourceHandle = (inputEdge as any)?.sourceHandle;
  const rawValue = sourceHandle 
    ? (inputNode?.data[sourceHandle] || inputNode?.data[`result_${sourceHandle}`] || inputNode?.data.value)
    : inputNode?.data?.value;
    
  const sourceImage = typeof rawValue === 'string' ? rawValue : undefined;

  const updateData = (key: string, val: any) => {
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n));
  };
  
  const applyCrop = useCallback(() => {
    if (!sourceImage || !previewRef.current) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const naturalAR = img.naturalWidth / img.naturalHeight;
      const previewRect = previewRef.current!.getBoundingClientRect();
      const containerAR = previewRect.width / previewRect.height;
      
      let renderX = crop.x;
      let renderY = crop.y;
      let renderW = crop.w;
      let renderH = crop.h;

      const sx = (renderX / 100) * img.naturalWidth;
      const sy = (renderY / 100) * img.naturalHeight;
      const sw = (renderW / 100) * img.naturalWidth;
      const sh = (renderH / 100) * img.naturalHeight;
      
      canvas.width = sw;
      canvas.height = sh;
      
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      setNodes((nds: any) => nds.map((n: any) => n.id === id ? { 
        ...n, 
        data: { 
          ...n.data, 
          value: croppedDataUrl, 
          type: 'image',
          cropConfig: crop,
          aspectRatio
        } 
      } : n));
    };
    img.src = sourceImage;
  }, [sourceImage, crop, id, setNodes, aspectRatio]);

  const handlePointerDown = (e: React.PointerEvent, action: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingAction(action);
    setDragStartInfo({ startX: e.clientX, startY: e.clientY, initialCrop: { ...crop } });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingAction || !dragStartInfo || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartInfo.startX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartInfo.startY) / rect.height) * 100;

    let newX = dragStartInfo.initialCrop.x;
    let newY = dragStartInfo.initialCrop.y;
    let newW = dragStartInfo.initialCrop.w;
    let newH = dragStartInfo.initialCrop.h;

    if (draggingAction === 'move') {
      newX = Math.max(0, Math.min(100 - newW, dragStartInfo.initialCrop.x + deltaX));
      newY = Math.max(0, Math.min(100 - newH, dragStartInfo.initialCrop.y + deltaY));
    } else if (draggingAction === 'nw') {
      newX = Math.max(0, Math.min(newX + newW - 5, dragStartInfo.initialCrop.x + deltaX));
      newY = Math.max(0, Math.min(newY + newH - 5, dragStartInfo.initialCrop.y + deltaY));
      newW = dragStartInfo.initialCrop.w - (newX - dragStartInfo.initialCrop.x);
      newH = dragStartInfo.initialCrop.h - (newY - dragStartInfo.initialCrop.y);
    } else if (draggingAction === 'ne') {
      newY = Math.max(0, Math.min(newY + newH - 5, dragStartInfo.initialCrop.y + deltaY));
      newW = Math.max(5, Math.min(100 - newX, dragStartInfo.initialCrop.w + deltaX));
      newH = dragStartInfo.initialCrop.h - (newY - dragStartInfo.initialCrop.y);
    } else if (draggingAction === 'sw') {
      newX = Math.max(0, Math.min(newX + newW - 5, dragStartInfo.initialCrop.x + deltaX));
      newW = dragStartInfo.initialCrop.w - (newX - dragStartInfo.initialCrop.x);
      newH = Math.max(5, Math.min(100 - newY, dragStartInfo.initialCrop.h + deltaY));
    } else if (draggingAction === 'se') {
      newW = Math.max(5, Math.min(100 - newX, dragStartInfo.initialCrop.w + deltaX));
      newH = Math.max(5, Math.min(100 - newY, dragStartInfo.initialCrop.h + deltaY));
    }

    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + newW > 100) newW = 100 - newX;
    if (newY + newH > 100) newH = 100 - newY;

    setCrop({ x: newX, y: newY, w: newW, h: newH });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingAction) {
      setDraggingAction(null);
      setDragStartInfo(null);
      e.stopPropagation();
    }
  };

  return (
    <div className="custom-node bg-[#1e1e1e] border-slate-700 w-[340px]">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Crop Asset" />
      
      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="image" className="handle-image" />
        <span className="handle-label text-emerald-500">Source Image</span>
      </div>

      <div className="node-content p-3 space-y-3 flex flex-col items-center">
        <div 
          ref={containerRef}
          className="relative bg-black rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center min-h-[150px] w-full touch-none select-none nodrag nopan flex-1 shadow-inner"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {!sourceImage ? (
            <div className="flex flex-col items-center gap-2 opacity-30 p-8">
              <Crop size={24} />
              <span className="text-[9px] uppercase tracking-widest font-black text-center">Connect an image<br/>to crop</span>
            </div>
          ) : (
            <>
              <img 
                ref={previewRef}
                src={sourceImage} 
                alt="Source" 
                className="w-full h-full object-fill pointer-events-none block" 
              />
              
              <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
              
              <div 
                className="absolute border border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] group/crop cursor-move"
                style={{
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.w}%`,
                  height: `${crop.h}%`,
                  pointerEvents: draggingAction !== null ? 'none' : 'auto' 
                }}
                onPointerDown={(e) => handlePointerDown(e, 'move')}
              >
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-0 group-hover/crop:opacity-50 transition-opacity">
                   <div className="border-b border-r border-amber-400/40"></div>
                   <div className="border-b border-r border-amber-400/40"></div>
                   <div className="border-b border-amber-400/40"></div>
                   <div className="border-b border-r border-amber-400/40"></div>
                   <div className="border-b border-r border-amber-400/40"></div>
                   <div className="border-b border-amber-400/40"></div>
                   <div className="border-r border-amber-400/40"></div>
                   <div className="border-r border-amber-400/40"></div>
                   <div></div>
                </div>

                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-amber-500 cursor-nwse-resize pointer-events-auto shadow-sm" onPointerDown={(e) => handlePointerDown(e, 'nw')}></div>
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-amber-500 cursor-nesw-resize pointer-events-auto shadow-sm" onPointerDown={(e) => handlePointerDown(e, 'ne')}></div>
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-amber-500 cursor-nesw-resize pointer-events-auto shadow-sm" onPointerDown={(e) => handlePointerDown(e, 'sw')}></div>
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-amber-500 cursor-nwse-resize pointer-events-auto shadow-sm" onPointerDown={(e) => handlePointerDown(e, 'se')}></div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 w-full pt-2">
           <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Aspect</span>
           <select 
             value={aspectRatio} 
             onChange={(e) => {
               setAspectRatio(e.target.value);
               updateData('aspectRatio', e.target.value);
               if (e.target.value === '1:1') setCrop({ x: 25, y: 10, w: 50, h: 80 }); 
               if (e.target.value === '16:9') setCrop({ x: 10, y: 25, w: 80, h: 50 }); 
               if (e.target.value === '9:16') setCrop({ x: 30, y: 10, w: 40, h: 80 });
             }}
             className="node-input text-[10px] w-full max-w-[100px] nodrag"
           >
             <option value="free">Freeform</option>
             <option value="1:1">1:1 Square</option>
             <option value="16:9">16:9 Wide</option>
             <option value="9:16">9:16 Story</option>
           </select>

           <button 
             onClick={applyCrop}
             disabled={!sourceImage}
             className="ml-auto bg-amber-500 hover:bg-amber-400 text-white font-black text-[9px] px-3 py-1.5 rounded uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.3)] disabled:opacity-50 nodrag transition-colors"
           >
             Apply Crop
           </button>
        </div>
      </div>

      <div className="handle-wrapper handle-right">
        <span className="handle-label text-cyan-500">Cropped Out</span>
        <Handle type="source" position={Position.Right} id="image" className="handle-image" />
      </div>
    </div>
  );
});

// --- BEZIER MASK NODE ---
export const BezierMaskNode = memo(({ id, data }: NodeProps<any>) => {
  const { setNodes } = useReactFlow();
  const edges = useEdges();
  const nodes = useNodes();
  
  const nodeData = data as BaseNodeData & { 
    points?: any[]; 
    closed?: boolean;
    invert?: boolean;
    result_mask?: string;
    result_rgba?: string;
  };

  const [points, setPoints] = useState<any[]>(nodeData.points || []);
  const [closed, setClosed] = useState<boolean>(nodeData.closed || false);
  const [invert, setInvert] = useState<boolean>(nodeData.invert || false);
  const [mode, setMode] = useState<'draw' | 'edit'>('draw');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'original' | 'mask' | 'cutout'>('cutout');
  
  // Interaction State
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const [activeHandle, setActiveHandle] = useState<'anchor' | 'in' | 'out' | null>(null);
  
  // Zoom/Pan State for Fullscreen Editor
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, px: 0, py: 0 });
  
  const svgRef = useRef<SVGSVGElement>(null);

  // Retrieve Source Image
  const inputEdge = edges.find(e => e.target === id);
  const inputNode = nodes.find(n => n.id === inputEdge?.source);
  const rawValue = inputNode?.data?.value;
  const sourceImage = typeof rawValue === 'string' ? rawValue : undefined;

  const updateData = (key: string, val: any) => {
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n));
  };

  // Convert client coords to 0-100% relative to SVG, accounting for zoom/pan
  const getCoords = (e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    // Coords in SVG space (in pixels)
    const svgX = (e.clientX - rect.left);
    const svgY = (e.clientY - rect.top);
    // Convert to 0-100 (unzoomed)
    const x = ((svgX / zoom - pan.x / zoom) / (rect.width / zoom)) * 100;
    const y = ((svgY / zoom - pan.y / zoom) / (rect.height / zoom)) * 100;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    
    // Middle mouse or Alt+click = pan
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
      return;
    }

    if (closed && mode === 'draw') return;
    const { x, y } = getCoords(e);

    if (mode === 'draw') {
      if (points.length > 2) {
        const first = points[0];
        const dist = Math.hypot(first.anchor.x - x, first.anchor.y - y);
        if (dist < 3 / zoom) {
          const newPoints = [...points];
          setClosed(true);
          setPoints(newPoints);
          updateData('points', newPoints);
          updateData('closed', true);
          generateMaskFromPoints(newPoints, true);
          return;
        }
      }
      const newPoint = { anchor: { x, y }, hIn: { x, y }, hOut: { x, y } };
      const newPoints = [...points, newPoint];
      setPoints(newPoints);
      setActivePointIndex(newPoints.length - 1);
      setActiveHandle('out');
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({ x: panStart.px + dx, y: panStart.py + dy });
      return;
    }

    if (activePointIndex === null || activeHandle === null) return;
    const { x, y } = getCoords(e);
    const pts = [...points];
    const pt = pts[activePointIndex];

    if (activeHandle === 'anchor') {
      const dx = x - pt.anchor.x;
      const dy = y - pt.anchor.y;
      pt.anchor = { x, y };
      pt.hIn = { x: pt.hIn.x + dx, y: pt.hIn.y + dy };
      pt.hOut = { x: pt.hOut.x + dx, y: pt.hOut.y + dy };
    } else if (activeHandle === 'out') {
      pt.hOut = { x, y };
      const dx = x - pt.anchor.x;
      const dy = y - pt.anchor.y;
      pt.hIn = { x: pt.anchor.x - dx, y: pt.anchor.y - dy };
    } else if (activeHandle === 'in') {
      pt.hIn = { x, y };
      const dx = x - pt.anchor.x;
      const dy = y - pt.anchor.y;
      pt.hOut = { x: pt.anchor.x - dx, y: pt.anchor.y - dy };
    }
    setPoints(pts);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (isPanning) { setIsPanning(false); return; }
    if (activePointIndex !== null) {
      updateData('points', points);
      setActivePointIndex(null);
      setActiveHandle(null);
    }
  };

  const deletePoint = (i: number) => {
    const newPoints = points.filter((_, idx) => idx !== i);
    if (closed && newPoints.length < 3) setClosed(false);
    setPoints(newPoints);
    updateData('points', newPoints);
    if (newPoints.length < 3) { setClosed(false); updateData('closed', false); }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(z => Math.max(0.3, Math.min(10, z * delta)));
  };

  // Build SVG path data from points
  const buildPath = (pts: any[], isClosed: boolean) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].anchor.x} ${pts[0].anchor.y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1], curr = pts[i];
      d += ` C ${prev.hOut.x} ${prev.hOut.y}, ${curr.hIn.x} ${curr.hIn.y}, ${curr.anchor.x} ${curr.anchor.y}`;
    }
    if (isClosed && pts.length > 2) {
      const prev = pts[pts.length - 1], curr = pts[0];
      d += ` C ${prev.hOut.x} ${prev.hOut.y}, ${curr.hIn.x} ${curr.hIn.y}, ${curr.anchor.x} ${curr.anchor.y} Z`;
    }
    return d;
  };
  const pathD = buildPath(points, closed);

  // Helper: draws the bezier path on a 2d context (W x H canvas, pts in 0-100% space)
  const drawBezierPath = (ctx: CanvasRenderingContext2D, pts: any[], isClosed: boolean, W: number, H: number) => {
    ctx.beginPath();
    ctx.moveTo((pts[0].anchor.x / 100) * W, (pts[0].anchor.y / 100) * H);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], c = pts[i];
      ctx.bezierCurveTo(
        (p.hOut.x / 100) * W, (p.hOut.y / 100) * H,
        (c.hIn.x / 100) * W, (c.hIn.y / 100) * H,
        (c.anchor.x / 100) * W, (c.anchor.y / 100) * H
      );
    }
    if (isClosed && pts.length > 2) {
      const p = pts[pts.length - 1], c = pts[0];
      ctx.bezierCurveTo(
        (p.hOut.x / 100) * W, (p.hOut.y / 100) * H,
        (c.hIn.x / 100) * W, (c.hIn.y / 100) * H,
        (c.anchor.x / 100) * W, (c.anchor.y / 100) * H
      );
    }
    ctx.closePath();
  };

  const generateMaskFromPoints = (pts: any[], isClosed: boolean) => {
    if (!sourceImage || pts.length < 3) {
      console.warn('[BezierMask] Cannot generate: sourceImage=', !!sourceImage, 'pts=', pts.length);
      return;
    }

    const img = new Image();
    // Do NOT set crossOrigin - it causes silent failures with blob/data URLs
    
    img.onerror = (e) => {
      console.error('[BezierMask] Failed to load source image:', e);
      alert('Bezier Mask: Error al cargar la imagen fuente. Intenta de nuevo.');
    };

    img.onload = () => {
      try {
        const W = img.naturalWidth || 1920;
        const H = img.naturalHeight || 1080;
        console.log('[BezierMask] Generating mask. Image size:', W, 'x', H, 'Points:', pts.length, 'Closed:', isClosed);

        // --- MASK CANVAS (B/W) ---
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = W; maskCanvas.height = H;
        const mCtx = maskCanvas.getContext('2d')!;
        mCtx.fillStyle = invert ? '#ffffff' : '#000000';
        mCtx.fillRect(0, 0, W, H);
        drawBezierPath(mCtx, pts, isClosed, W, H);
        mCtx.fillStyle = invert ? '#000000' : '#ffffff';
        mCtx.fill();
        const maskDataUrl = maskCanvas.toDataURL('image/png');

        // --- RGBA CUTOUT using destination-in compositing (most reliable approach) ---
        const rgbaCanvas = document.createElement('canvas');
        rgbaCanvas.width = W; rgbaCanvas.height = H;
        const rCtx = rgbaCanvas.getContext('2d')!;

        if (invert) {
          // Inverted: draw full image, then erase the bezier area
          rCtx.drawImage(img, 0, 0);
          rCtx.globalCompositeOperation = 'destination-out';
          drawBezierPath(rCtx, pts, isClosed, W, H);
          rCtx.fillStyle = 'black';
          rCtx.fill();
        } else {
          // Normal: draw image, then use destination-in to keep only inside bezier area
          rCtx.drawImage(img, 0, 0);
          rCtx.globalCompositeOperation = 'destination-in';
          drawBezierPath(rCtx, pts, isClosed, W, H);
          rCtx.fillStyle = 'black'; // fill color doesn't matter, alpha does
          rCtx.fill();
        }

        let rgbaDataUrl: string;
        try {
          rgbaDataUrl = rgbaCanvas.toDataURL('image/png');
        } catch (corsErr) {
          console.error('[BezierMask] Canvas tainted (CORS). Trying without transparency...', corsErr);
          // Fallback: draw on white background if canvas is tainted
          const fallback = document.createElement('canvas');
          fallback.width = W; fallback.height = H;
          const fCtx = fallback.getContext('2d')!;
          fCtx.drawImage(img, 0, 0);
          rgbaDataUrl = fallback.toDataURL('image/jpeg', 0.9);
        }

        console.log('[BezierMask] Generated RGBA. Length:', rgbaDataUrl.length);

        setNodes((nds: any) => nds.map((n: any) => n.id === id ? {
          ...n,
          data: {
            ...n.data,
            mask: maskDataUrl,
            result_mask: maskDataUrl,
            rgba: rgbaDataUrl,
            result_rgba: rgbaDataUrl,
            value: rgbaDataUrl,
            type: 'image'
          }
        } : n));
      } catch (err) {
        console.error('[BezierMask] Error generating mask:', err);
        alert('Error al generar la máscara: ' + String(err));
      }
    };

    img.src = sourceImage;
  };

  const generateMask = () => generateMaskFromPoints(points, closed);



  const clearPath = () => {
    setPoints([]);
    setClosed(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    updateData('points', []);
    updateData('closed', false);
    updateData('value', null);
    updateData('result_mask', null);
    updateData('result_rgba', null);
  };

  const getPreviewImage = () => {
    switch (previewMode) {
      case 'original': return sourceImage;
      case 'mask': return nodeData.result_mask;
      case 'cutout': return nodeData.result_rgba;
      default: return sourceImage;
    }
  };

  const svgTransform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  const hasMask = !!(nodeData.result_rgba);

  return (
    <div className={`custom-node mask-node w-[360px]`}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Bezier Mask" />
      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="image" className="handle-image" />
        <span className="handle-label">Media Input</span>
      </div>
      
      <div className="node-header bg-gradient-to-r from-cyan-600/20 to-indigo-600/20">
        <Scissors size={16} className="text-cyan-400" />
        <span>Bezier Mask</span>
        <button 
          onClick={() => setIsStudioOpen(true)}
          className="ml-auto bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter hover:bg-cyan-500/30 transition-all flex items-center gap-1.5"
        >
          <Maximize2 size={10} /> Studio Mode
        </button>
      </div>
      
      <div className="flex flex-col">
        {/* PREVIEW AREA */}
        <div className="relative group/preview overflow-hidden bg-slate-100/50 h-[220px] flex items-center justify-center border-b border-slate-200/60">
          <div className="absolute top-2 left-2 z-10 flex gap-1 bg-slate-50/50 p-1 rounded-lg backdrop-blur-md border border-slate-200/60">
            {(['original', 'mask', 'cutout'] as const).map(m => (
              <button
                key={m}
                onClick={() => setPreviewMode(m)}
                className={`px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-widest transition-all ${previewMode === m ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                {m}
              </button>
            ))}
          </div>

          {getPreviewImage() ? (
            <img
              src={getPreviewImage()}
              className={`w-full h-full object-contain ${previewMode === 'mask' ? 'invert brightness-150' : ''}`}
              alt="Bezier Preview"
              style={{ backgroundImage: previewMode === 'cutout' ? 'conic-gradient(#444 25%, #666 25%, #666 50%, #444 50%, #444 75%, #666 75%)' : undefined, backgroundSize: previewMode === 'cutout' ? '16px 16px' : undefined }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-20">
              <Scissors size={40} className="text-cyan-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {sourceImage ? 'Open Studio to Draw Mask' : 'Awaiting Input'}
              </span>
            </div>
          )}
        </div>

        {/* Point count & clear status */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasMask ? 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.7)]' : 'bg-white/10'}`} />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
              {hasMask ? `${points.length} pts · Mask Ready` : points.length > 0 ? `${points.length} pts · Open Studio` : 'No Path'}
            </span>
          </div>
          {points.length > 0 && (
            <button onClick={clearPath} className="text-[8px] text-rose-500 hover:text-rose-400 font-black uppercase tracking-widest transition-colors">
              Clear Path
            </button>
          )}
        </div>
      </div>

      {/* OUTPUT HANDLES - Same absolute style as BackgroundRemoverNode */}
      <div className="flex flex-col gap-2 absolute right-[-14px] top-[40px] nodrag">
        <div className="relative group/h mb-4">
          <Handle type="source" position={Position.Right} id="mask" className="handle-mask !right-0 shadow-[0_0_10px_rgba(148,163,184,0.5)] cursor-crosshair" />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase text-slate-400 bg-black/90 px-1 border border-slate-400/20 rounded opacity-0 group-hover/h:opacity-100 transition-opacity whitespace-nowrap">MASK</span>
        </div>
        <div className="relative group/h">
          <Handle type="source" position={Position.Right} id="rgba" className="handle-image !right-0 shadow-[0_0_10px_rgba(6,182,212,0.5)] cursor-crosshair" />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase text-cyan-400 bg-black/90 px-1 border border-cyan-400/20 rounded opacity-0 group-hover/h:opacity-100 transition-opacity whitespace-nowrap">RGBA</span>
        </div>
      </div>

      {/* FULLSCREEN STUDIO MODAL */}
      {isStudioOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-[#0a0a0a]/95 backdrop-blur-xl flex flex-col" onWheel={handleWheel}>
          
          {/* TOP BAR */}
          <div className="h-14 bg-black/50 border-b border-white/10 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <Scissors size={18} className="text-cyan-500" />
              <span className="text-[14px] font-black uppercase tracking-[3px] text-white">Bezier Editor</span>
              <div className="ml-4 flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                <button 
                  onClick={() => setMode('draw')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${mode === 'draw' ? 'bg-cyan-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  <Scissors size={12} /> Draw
                </button>
                <button 
                  onClick={() => setMode('edit')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${mode === 'edit' ? 'bg-cyan-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  <Compass size={12} /> Edit
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* ZOOM CONTROLS */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                <button onClick={() => setZoom(z => Math.max(0.3, z / 1.3))} className="w-8 h-8 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all text-lg font-black">−</button>
                <span className="text-[11px] font-mono text-cyan-400 px-2 min-w-[56px] text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(10, z * 1.3))} className="w-8 h-8 flex items-center justify-center rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all text-lg font-black">+</button>
                <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="px-2 h-8 rounded-md text-[9px] text-white/40 hover:text-white hover:bg-white/10 transition-all font-black uppercase">RESET</button>
              </div>

              <div className="w-px h-6 bg-white/10" />

              <label className="flex items-center gap-2 text-[11px] text-gray-400 font-bold cursor-pointer hover:text-white">
                <input type="checkbox" checked={invert} onChange={(e) => { setInvert(e.target.checked); updateData('invert', e.target.checked); }} className="accent-cyan-500 w-4 h-4 cursor-pointer" />
                Invert Mask
              </label>

              <button onClick={clearPath} className="text-[11px] text-rose-500 hover:text-rose-400 font-bold uppercase transition-colors px-2">Clear</button>

              <button 
                onClick={() => { generateMask(); setIsStudioOpen(false); }}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[11px] px-6 py-2 rounded-lg uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 hover:scale-105 disabled:opacity-40"
                disabled={!closed || points.length < 3}
              >
                <Check size={14} /> Apply Mask
              </button>

              <button onClick={() => setIsStudioOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors" title="Close">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* CANVAS AREA */}
          <div
            className="flex-1 overflow-hidden relative flex items-center justify-center cursor-crosshair"
            style={{ cursor: isPanning ? 'grab' : mode === 'draw' ? 'crosshair' : 'default' }}
          >
            {/* Checkerboard background */}
            <div className="absolute inset-0" style={{ backgroundImage: 'conic-gradient(#1a1a1a 25%, #111 25%, #111 50%, #1a1a1a 50%, #1a1a1a 75%, #111 75%)', backgroundSize: '32px 32px' }} />
            
            {/* HELP TEXT */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white/40 text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 z-10 pointer-events-none">
              {mode === 'draw' ? 'Click to add points · Click first point (red) to close path' : 'Drag anchors or handles · Right-click anchor to delete'}
            </div>

            {sourceImage ? (
              <div
                className="relative inline-block origin-top-left"
                style={{ transform: svgTransform, willChange: 'transform' }}
              >
                <img
                  src={sourceImage}
                  alt="Reference"
                  className="block pointer-events-none select-none"
                  style={{ maxHeight: 'calc(100vh - 140px)', maxWidth: 'calc(100vw - 80px)', opacity: 0.65 }}
                  draggable={false}
                />
                <svg
                  ref={svgRef}
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                >
                  {/* PATH FILL */}
                  <path d={pathD} fill={closed ? 'rgba(6,182,212,0.15)' : 'none'} stroke="#06b6d4" strokeWidth={0.3 / zoom} strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* POINTS & HANDLES */}
                  {points.map((pt, i) => (
                    <g key={i}>
                      {/* Handle Lines */}
                      <line x1={pt.anchor.x} y1={pt.anchor.y} x2={pt.hIn.x} y2={pt.hIn.y} stroke="rgba(255,255,255,0.3)" strokeWidth={0.15 / zoom} strokeDasharray={`${0.4/zoom} ${0.2/zoom}`} />
                      <line x1={pt.anchor.x} y1={pt.anchor.y} x2={pt.hOut.x} y2={pt.hOut.y} stroke="rgba(255,255,255,0.3)" strokeWidth={0.15 / zoom} strokeDasharray={`${0.4/zoom} ${0.2/zoom}`} />
                      
                      {/* Bezier Handles */}
                      {mode === 'edit' && (
                        <>
                          <circle cx={pt.hIn.x} cy={pt.hIn.y} r={0.8/zoom} fill="rgba(255,255,255,0.8)" stroke="#06b6d4" strokeWidth={0.2/zoom} className="cursor-pointer"
                            onPointerDown={(e) => { e.stopPropagation(); setActivePointIndex(i); setActiveHandle('in'); }} />
                          <circle cx={pt.hOut.x} cy={pt.hOut.y} r={0.8/zoom} fill="rgba(255,255,255,0.8)" stroke="#06b6d4" strokeWidth={0.2/zoom} className="cursor-pointer"
                            onPointerDown={(e) => { e.stopPropagation(); setActivePointIndex(i); setActiveHandle('out'); }} />
                        </>
                      )}
                      
                      {/* ANCHOR POINT */}
                      <rect
                        x={pt.anchor.x - 1/zoom} y={pt.anchor.y - 1/zoom} width={2/zoom} height={2/zoom}
                        fill={i === 0 && !closed ? '#f43f5e' : (activePointIndex === i ? '#ffffff' : '#06b6d4')}
                        stroke={i === 0 && !closed ? '#f87171' : 'rgba(255,255,255,0.5)'}
                        strokeWidth={0.2/zoom}
                        className="cursor-pointer"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          if (mode === 'draw' && i === 0 && points.length > 2) {
                            const newPts = [...points];
                            setClosed(true);
                            updateData('closed', true);
                            generateMaskFromPoints(newPts, true);
                          } else {
                            setActivePointIndex(i);
                            setActiveHandle('anchor');
                            setMode('edit');
                          }
                        }}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); deletePoint(i); }}
                      />
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="relative flex flex-col items-center gap-4 opacity-40">
                <Scissors size={64} className="text-cyan-500" strokeWidth={1} />
                <p className="text-white font-bold uppercase tracking-widest text-sm">Connect an image to the node first</p>
              </div>
            )}

            {/* Pan hint */}
            <div className="absolute bottom-4 right-4 text-[9px] text-white/20 font-bold uppercase tracking-widest pointer-events-none">
              Alt+Drag or Middle Click to Pan · Scroll to Zoom · Right-click anchor to delete
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});



// ─────────────────────────────────────────────────────────────────────────────
// FINAL OUTPUT NODE — permanent output destination, no delete, no outputs
// ─────────────────────────────────────────────────────────────────────────────
export const FinalOutputNode = memo(({ id, data }: NodeProps<any>) => {
  const nodes = useNodes();
  const edges = useEdges();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Resolve connected media from either image or video input handle
  const imageEdge = edges.find((e: any) => e.target === id && e.targetHandle === 'image');
  const videoEdge = edges.find((e: any) => e.target === id && e.targetHandle === 'video');
  const imageSourceNode = imageEdge ? nodes.find((n: any) => n.id === imageEdge.source) : null;
  const videoSourceNode = videoEdge ? nodes.find((n: any) => n.id === videoEdge.source) : null;

  const mediaValue: string | undefined =
    (typeof videoSourceNode?.data?.value === 'string' ? videoSourceNode.data.value : undefined) ||
    (typeof imageSourceNode?.data?.value === 'string' ? imageSourceNode.data.value : undefined);

  const mediaType: 'image' | 'video' =
    videoSourceNode?.data?.value ? 'video' : 'image';

  const toggleWindow = () => {
    window.dispatchEvent(new CustomEvent('toggle-final-window'));
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // ── VIEWER MODE: compact connection circle ─────────────────────────────────
  if (data?.viewerMode) {
    const isConnected = !!(imageEdge || videoEdge);
    const dotColor = mediaType === 'video' ? '#f43f5e' : '#ec4899';
    return (
      <div className="relative overflow-visible" style={{ width: 32, height: 32 }}>
        {/* Image handle — top-left */}
        <Handle
          type="target"
          position={Position.Top}
          id="image"
          style={{ left: 6, top: -6, background: '#ec4899', border: '2px solid #fff', width: 10, height: 10 }}
        />
        {/* Video handle — top-right */}
        <Handle
          type="target"
          position={Position.Top}
          id="video"
          style={{ left: 22, top: -6, background: '#f43f5e', border: '2px solid #fff', width: 10, height: 10 }}
        />
        {/* Connection circle */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: isConnected ? dotColor : 'rgba(255,255,255,0.08)',
          border: `2px solid ${isConnected ? dotColor : 'rgba(255,255,255,0.2)'}`,
          boxShadow: isConnected ? `0 0 14px ${dotColor}99` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s',
        }}>
          {isConnected && (
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#fff', opacity: 0.9,
            }} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-visible"
      style={{ width: 260, minHeight: 200 }}
    >
      {/* Input handles */}
      <div className="handle-wrapper handle-left" style={{ top: '35%' }}>
        <Handle type="target" position={Position.Left} id="image" className="handle-image" />
        <span className="handle-label">Image</span>
      </div>
      <div className="handle-wrapper handle-left" style={{ top: '65%' }}>
        <Handle type="target" position={Position.Left} id="video" className="handle-video" />
        <span className="handle-label">Video</span>
      </div>

      {/* Main card */}
      <div
        className="rounded-[18px] overflow-hidden border-2 border-amber-400/60 shadow-2xl shadow-amber-500/20"
        style={{
          background: mediaValue ? 'transparent' : 'rgba(20,16,8,0.95)',
          minHeight: 200,
          position: 'relative',
        }}
      >
        {/* Persistent header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            zIndex: 10,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">FINAL OUT</span>
          </div>
          {/* Window toggle button */}
          <button
            onClick={toggleWindow}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(251,191,36,0.2)',
              border: '1px solid rgba(251,191,36,0.4)',
              color: '#fbbf24',
            }}
            title="Toggle Window Viewer"
          >
            <Maximize2 size={10} />
            <span>Window</span>
          </button>
        </div>

        {/* Media preview */}
        {mediaValue ? (
          <div className="relative w-full" style={{ aspectRatio: '16/9', minHeight: 160 }}>
            {mediaType === 'video' ? (
              <>
                <video
                  ref={videoRef}
                  src={mediaValue}
                  className="w-full h-full object-cover"
                  loop
                  muted={false}
                  onEnded={() => setIsPlaying(false)}
                />
                {/* Play overlay */}
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center group/play"
                  style={{ background: 'transparent' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all opacity-60 group-hover/play:opacity-100 group-hover/play:scale-110"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                  >
                    {isPlaying
                      ? <div className="flex gap-0.5"><div className="w-1 h-4 bg-white rounded-sm" /><div className="w-1 h-4 bg-white rounded-sm" /></div>
                      : <Play size={18} className="text-white ml-0.5" fill="white" />
                    }
                  </div>
                </button>
              </>
            ) : (
              <img src={mediaValue} className="w-full h-full object-cover" alt="Final output" />
            )}
            {/* Gradient overlay bottom */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }} />
            {/* Type badge */}
            <div
              className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest"
              style={{ background: 'rgba(0,0,0,0.6)', color: mediaType === 'video' ? '#f43f5e' : '#fbbf24', backdropFilter: 'blur(6px)' }}
            >
              {mediaType} · output
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-2 py-16 px-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}
            >
              <Maximize size={22} className="text-amber-400" strokeWidth={1.5} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/70 text-center">
              Connect an image or video node
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

FinalOutputNode.displayName = 'FinalOutputNode';
