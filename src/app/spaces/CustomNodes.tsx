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
  MousePointer2
} from 'lucide-react';
import './spaces.css';

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
          className="px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-black text-white/40 truncate hover:text-cyan-400 group-hover/label:border-cyan-500/30 transition-all uppercase tracking-widest cursor-pointer select-none flex items-center gap-2"
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
            />
          </div>
          <div>
            <label className="node-label">Height (px)</label>
            <input 
              type="number" 
              className="node-input" 
              value={h}
              onChange={(e) => updateData('height', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="node-label">Background Color</label>
          <div className="flex gap-3 items-center bg-black/40 p-3 rounded-xl border border-white/5">
            <input 
              type="color" 
              className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
              value={color}
              onChange={(e) => updateData('color', e.target.value)}
            />
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none text-[10px] font-mono text-gray-300 uppercase focus:outline-none"
              value={color}
              onChange={(e) => updateData('color', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center justify-center min-h-[100px]" style={{ backgroundColor: color + '44' }}>
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
                pendingSearch: false 
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
    updateData({ selectedIndex: nextIdx, value: urls[nextIdx] });
  };

  const prev = () => {
    if (urls.length === 0) return;
    const prevIdx = (selectedIndex - 1 + urls.length) % urls.length;
    updateData({ selectedIndex: prevIdx, value: urls[prevIdx] });
  };

  return (
    <div className={`custom-node url-image-node border-cyan-500/30 ${loading ? 'node-glow-running' : ''}`}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Image Search" />
      <div className="node-header text-cyan-400">
        <Globe size={16} /> CAROUSEL {loading && <Loader2 size={12} className="animate-spin ml-auto" />}
      </div>
      <div className="node-content">
        <div className="relative w-full aspect-video bg-black/60 rounded-xl overflow-hidden border border-white/10 group mb-3 shadow-inner">
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
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/80 backdrop-blur-md rounded-full text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-500/20"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/80 backdrop-blur-md rounded-full text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-cyan-500/20"
              >
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-mono text-cyan-400 border border-cyan-500/20">
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
                    updateData({ urls: newUrls, value: val });
                  }}
                />
              </div>
           </div>

           {urls.length > 0 && (
             <div className="pt-2 border-t border-white/5">
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
                      onClick={() => updateData({ selectedIndex: i, value: url })}
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

export const ImageComposerNode = memo(({ id, data }: NodeProps<any>) => {
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
      
      return {
        id: sourceNode?.id,
        edgeId: edge.id,
        handleId: hId,
        type: sourceNode?.data.type,
        value: sourceNode?.data.value as string | undefined,
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
                      <div className="w-full h-full min-h-[40px] rounded" style={{ backgroundColor: layer.color }}></div>
                    ) : (
                      <img src={layer.value} className="w-full h-full object-contain pointer-events-none" alt={`Layer ${idx}`} />
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
        <div className="mt-4 border-t border-white/5 pt-3">
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
                  className={`group flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.03] border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                    {actualIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[9px] font-bold truncate ${isSelected ? 'text-cyan-400' : 'text-gray-400'}`}>
                      {l.color ? `Canvas Layer` : `Source Asset`}
                    </div>
                    <div className="text-[7px] text-gray-600 font-mono truncate">
                       X: {Math.round(l.x)} | S: {l.scale.toFixed(2)}
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${l.color ? 'bg-amber-500' : 'bg-cyan-500'} ${isSelected ? 'animate-pulse' : 'opacity-40'}`}></div>
                </div>
              );
            })}
          </div>
        </div>
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
});

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
      <div className="absolute top-0 left-0 right-0 h-16 border-b border-white/5 bg-black/60 flex items-center px-8 gap-6 backdrop-blur-md">
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
                    <img src={l.value} className="w-full h-full object-contain pointer-events-none drop-shadow-2xl" alt="" />
                  )}

                  {isSel && (
                    <>
                      {/* Scale Handles */}
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-nwse-resize shadow-lg hover:scale-150 transition-transform" onPointerDown={(e) => onDown(e, l.handleId!, 'scale-tl')} />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-nesw-resize shadow-lg hover:scale-150 transition-transform" onPointerDown={(e) => onDown(e, l.handleId!, 'scale-tr')} />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-nesw-resize shadow-lg hover:scale-150 transition-transform" onPointerDown={(e) => onDown(e, l.handleId!, 'scale-bl')} />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-cyan-500 rounded-full cursor-nwse-resize shadow-lg hover:scale-150 transition-transform" onPointerDown={(e) => onDown(e, l.handleId!, 'scale-br')} />
                      
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 text-[9px] font-black uppercase text-cyan-400 shadow-xl pointer-events-none">
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportPreview, setExportPreview] = useState<string | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');

  // Create a hidden form for downloads (guarantees filename preservation)
  const downloadFormRef = useRef<HTMLFormElement>(null);
  const [downloadFormData, setDownloadFormData] = useState({ base64: '', filename: '', format: '' });

  useEffect(() => {
    if (downloadFormData.base64 && downloadFormRef.current) {
      downloadFormRef.current.submit();
      // Clear after submit to prevent re-submission
      setDownloadFormData({ base64: '', filename: '', format: '' });
    }
  }, [downloadFormData]);

  // Helper for "contain" logic
  const drawImageContain = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => {
    const imgAspect = img.width / img.height;
    const canvasAspect = w / h;
    let dx, dy, dw, dh;

    if (imgAspect > canvasAspect) {
      dw = w;
      dh = w / imgAspect;
      dx = 0;
      dy = (h - dh) / 2;
    } else {
      dh = h;
      dw = h * imgAspect;
      dx = (w - dw) / 2;
      dy = 0;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
  };

  // Find the single source connected to this node
  const sourceEdge = edges.find(e => e.target === id);
  const sourceNode = sourceEdge ? nodes.find(n => n.id === sourceEdge.source) : null;

  // Map handles to actual layer data (supports both ImageComposer and direct single connections)
  const layers = useMemo(() => {
    if (!sourceNode) return [];

    // Case 1: Source is a Composer (multiple layers)
    if (sourceNode.type === 'imageComposer') {
      // If the composer already has a flattened 'value', use it as a single layer
      if (sourceNode.data.value) {
        return [{
          type: 'flattened',
          value: sourceNode.data.value as string,
          x: 0,
          y: 0,
          scale: 1,
          width: 1920,
          height: 1080
        }];
      }

      // Fallback: Reconstruct (for compatibility during transition)
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
          x: config.x,
          y: config.y,
          scale: config.scale
        };
      }).filter(l => (l.value as string) || (l.color as string));
    }

    // Case 2: Source is a direct Node (MediaInput, Background, etc)
    return [{
      type: sourceNode.type,
      value: sourceNode.data.value as string | undefined,
      color: (sourceNode.data as any).color as string | undefined,
      width: (sourceNode.data as any).width as number || 0,
      height: (sourceNode.data as any).height as number || 0
    }].filter(l => l.value || l.color);
  }, [sourceNode, edges, nodes]);

  // Determine export dimensions intelligently
  const getDimensions = () => {
    // 1. Try to find a background node in the layers
    const bgLayer = layers.find(l => l.type === 'background');
    if (bgLayer && bgLayer.width && bgLayer.height) {
      return { w: bgLayer.width, h: bgLayer.height };
    }
    // 2. Default to 1920x1080 or the first layer's dimension
    return { w: 1920, h: 1080 };
  };

  const handleExport = async () => {
    if (!sourceNode) return alert("Connect an image first!");
    
    setIsExporting(true);
    try {
      const { w, h } = getDimensions();
      const extension = format === 'jpeg' ? 'jpg' : 'png';
      const filename = `AI_Space_Output_${new Date().getTime()}.${extension}`;

      console.log(`[Export] Requesting Lambda-style composition for ${filename}...`);

      const formData = new FormData();
      formData.append('layers', JSON.stringify(layers));
      formData.append('filename', filename);
      formData.append('format', format);
      formData.append('width', w.toString());
      formData.append('height', h.toString());
      
      // Coordinate Remapping Metadata
      // If we are coming from a Composer, our coordinates are already normalized to 1920x1080
      if (sourceNode.type === 'imageComposer') {
        formData.append('previewWidth', '1920');
        formData.append('previewHeight', '1080');
      } else {
        const composerPreview = document.querySelector(`[data-id="${sourceNode.id}"] .aspect-video`);
        if (composerPreview) {
          formData.append('previewWidth', composerPreview.clientWidth.toString());
          formData.append('previewHeight', composerPreview.clientHeight.toString());
        }
      }

      const res = await fetch('/api/spaces/compose', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Server composition failed");
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename; // This is the gold standard for filename preservation
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1500);

    } catch (error: any) {
      console.error("Export error details:", error);
      alert(`Export failed: ${error.message || "Unknown error"}`);
    } finally {
      // Small timeout to show the "Building" state briefly
      setTimeout(() => setIsExporting(false), 1500);
    }
  };

  return (
    <div className="custom-node export-node border-rose-500/30">
      <NodeLabel id={id} label={data.label} defaultLabel="Export" />
      {/* Hidden form for server-side Lambda-style Composition & Download */}
      <form 
        ref={downloadFormRef} 
        action="/api/spaces/compose" 
        method="POST" 
        style={{ display: 'none' }}
      >
        <input type="hidden" name="layers" />
        <input type="hidden" name="filename" />
        <input type="hidden" name="format" />
        <input type="hidden" name="width" />
        <input type="hidden" name="height" />
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
          <span>{layers[0]?.width || 1920}x{layers[0]?.height || 1080} PX</span>
          <span>COMPOSITION MODE</span>
        </div>

        <div className="relative w-full aspect-video bg-black/60 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
          {exportPreview || (sourceNode?.data.value && sourceNode.type !== 'imageComposer') ? (
            <img src={exportPreview || (sourceNode?.data.value as string)} className="w-full h-full object-contain" alt="Export Preview" />
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
  const isUploading = isUploadingLocal || nodeData.loading;
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>(nodeData.source === 'url' ? 'url' : 'upload');
  const [urlInput, setUrlInput] = useState(nodeData.source === 'url' ? nodeData.value : '');
  const [showFullSize, setShowFullSize] = useState(false);

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
          resolution: (type === 'video' || type === 'image') ? '1920x1080' : '-',
          duration: (type === 'video' || type === 'audio') ? '00:42' : '-',
          codec: file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN'
        };
        updateNodeData({ value: json.url, type, source: 'upload', metadata: mockMetadata });
      }
    } catch (err) { console.error("Upload error:", err); } 
    finally { setIsUploadingLocal(false); }
  };

  const handleUrlSubmit = () => {
    if (!urlInput) return;
    const type = getFileType(urlInput, '');
    updateNodeData({ 
      value: urlInput, 
      type, 
      source: 'url',
      metadata: { resolution: 'Remote URL', duration: 'Unknown' }
    });
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
      case 'pdf': return '#f97316';
      case 'txt': return '#f59e0b';
      case 'url': return '#10b981';
      default: return '#9ca3af';
    }
  };

  const handleClass = nodeData.type ? `handle-${nodeData.type}` : 'handle-video';

  const getSmartDefaultLabel = () => {
    if (nodeData.type === 'image') return "Image Input";
    if (nodeData.type === 'video') return "Video Input";
    if (nodeData.type === 'audio') return "Audio Input";
    return "Media Input";
  };

  return (
    <div className="custom-node media-node">
      <NodeLabel id={id} label={nodeData.label} defaultLabel={getSmartDefaultLabel()} />
      <div className="node-header flex-col items-start gap-0" style={{ color: getTitleColor() }}>
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-black tracking-tighter uppercase">{nodeData.type || 'Media'} Input</span>
        </div>
        {nodeData.type && (
          <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-gray-400">
            {nodeData.type}
          </span>
        )}
      </div>

      <div className="node-content">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-black/40 rounded-xl mb-4">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${activeTab === 'upload' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <FilePlus size={12} /> Upload
          </button>
          <button 
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${activeTab === 'url' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Link size={12} /> URL
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div className="flex flex-col items-center">
            <div className="drop-zone min-h-[140px] w-full max-w-[250px]" onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }} onDragOver={(e) => e.preventDefault()}>
              {isUploading ? <Loader2 className="animate-spin text-rose-500" /> : 
               nodeData.value && nodeData.type === 'video' ? <video src={nodeData.value} className="video-preview !max-w-[250px]" muted /> : 
               nodeData.value && nodeData.type === 'image' ? <img src={nodeData.value} className="video-preview object-contain !max-w-[250px]" alt="Preview" /> :
               nodeData.value && nodeData.type === 'audio' ? (
                 <div className="flex flex-col items-center gap-2">
                   <Music size={32} className="text-rose-500" />
                   <span className="text-[10px] text-gray-400">Audio Track Loaded</span>
                 </div>
               ) :
               <div className="flex flex-col items-center gap-2">
                 <FilePlus size={24} className="text-gray-700" />
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight text-center">Drag and drop file or click to choose</span>
               </div>}
            </div>
            
            {nodeData.value && (nodeData.type === 'video' || nodeData.type === 'image') && (
              <button 
                onClick={() => setShowFullSize(true)}
                className="mt-2 flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-white transition-colors py-1 px-3 bg-white/5 rounded-full"
              >
                <Maximize2 size={12} /> VER TAMAÑO COMPLETO
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
             <div className="relative">
               <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
               <input 
                 type="text"
                 placeholder="Paste media link here..."
                 className="node-input pl-9 text-xs"
                 value={urlInput || ''}
                 onChange={(e) => setUrlInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
               />
             </div>
             <button 
               onClick={handleUrlSubmit}
               className="execute-btn w-full justify-center"
             >
               FETCH MEDIA
             </button>
             {nodeData.value && (nodeData.type === 'video' || nodeData.type === 'image') && (
               <div className="flex justify-center">
                 <img src={nodeData.value} className="max-w-[250px] rounded-lg border border-white/10 mb-2" alt="Preview" />
               </div>
             )}
             {nodeData.value && (nodeData.type === 'video' || nodeData.type === 'image') && (
                <button 
                  onClick={() => setShowFullSize(true)}
                  className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 hover:text-white transition-colors py-2 bg-white/5 rounded-lg border border-white/5"
                >
                  <Maximize2 size={12} /> VER TAMAÑO COMPLETO
                </button>
             )}
          </div>
        )}

        {/* Fullsize Backdrop */}
        {showFullSize && nodeData.value && (
          <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-10 cursor-zoom-out nodrag nopan" onClick={() => setShowFullSize(false)}>
            <div className="absolute top-10 right-10 text-white hover:scale-110 transition-transform">
              <X size={40} strokeWidth={3} />
            </div>
            {nodeData.type === 'video' ? (
              <video src={nodeData.value} className="max-w-full max-h-full rounded-2xl shadow-2xl" controls autoPlay />
            ) : (
              <img src={nodeData.value} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" alt="Full size" />
            )}
          </div>
        )}

        {/* Metadata section */}
        {nodeData.metadata && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Info size={10} className="text-gray-600" />
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Asset Metadata</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(nodeData.metadata).map(([key, val]) => (
                <div key={key} className="bg-black/20 p-2 rounded-lg border border-white/[0.02]">
                  <span className="block text-[8px] text-gray-600 uppercase font-bold mb-0.5">{key}</span>
                  <span className="block text-[10px] text-gray-300 font-mono truncate">{val as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="handle-wrapper handle-right">
        <span className="handle-label">Media Asset</span>
        <Handle type="source" position={Position.Right} className={handleClass} />
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

  // Handle generation: connected ones + 1 empty one at the end
  const handleIds = useMemo(() => {
    const ids = connectedInputs.map((e: any) => e.targetHandle || 'p0');
    // Ensure we always have at least one empty handle, or one extra after the last connected one
    const lastNum = ids.length > 0 ? parseInt(ids[ids.length - 1].replace('p', '')) : -1;
    return [...new Set([...ids, `p${lastNum + 1}`])];
  }, [connectedInputs]);

  return (
    <div className="custom-node tool-node min-w-[180px]">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Concatenator" />
      {handleIds.map((hId: any, index: number) => (
        <div key={hId} className="handle-wrapper handle-left" style={{ top: `${(index + 1) * (100 / (handleIds.length + 1))}%` }}>
          <Handle type="target" position={Position.Left} id={hId} className="handle-prompt" />
          <span className="handle-label">In {index + 1}</span>
        </div>
      ))}
      
      <div className="node-header"><PlusSquare size={16} /> CONCATENATOR</div>
      <div className="node-content">
        <div className="p-3 bg-black/40 rounded-lg text-[10px] text-gray-400 font-mono italic min-h-[50px] max-h-[150px] overflow-y-auto">
          {nodeData.value || 'Connect prompts to combine them...'}
        </div>
        <div className="mt-2 text-[8px] text-gray-600 uppercase font-bold tracking-tighter">
          {connectedInputs.length} Inputs active
        </div>
      </div>
      
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Result</span>
        <Handle type="source" position={Position.Right} className="handle-prompt" />
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

  const handleEnhance = async () => {
    const connect = edges.find((e) => e.target === id);
    const source = nodes.find((n) => n.id === connect?.source);
    const input = source?.data.value;

    if (!input) return alert("Connect a prompt first!");

    setLoading(true);
    try {
      const res = await fetch('/api/openai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      const json = await res.json();
      setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, value: json.enhanced } } : n));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="custom-node tool-node">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Enhancer" />
      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} className="handle-prompt" />
        <span className="handle-label">Prompt in</span>
      </div>
      <div className="node-header">
        <Zap size={16} /> PROMPT ENHANCER
        {loading && <Loader2 size={12} className="animate-spin ml-auto" />}
      </div>
      <div className="node-content">
        <button className="execute-btn w-full justify-center mb-3" onClick={handleEnhance} disabled={loading}>
          {loading ? 'ENHANCING...' : 'ENHANCE WITH OPENAI'}
        </button>
        <div className="p-3 bg-black/40 rounded-lg text-[11px] text-gray-300 italic min-h-[80px]">
          {nodeData.value || 'Connect a prompt and click Enhance...'}
        </div>
      </div>
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Enhanced</span>
        <Handle type="source" position={Position.Right} className="handle-prompt" />
      </div>
    </div>
  );
});

// --- GENERATOR NODES ---

export const RunwayNode = memo(({ id, data }: NodeProps<any>) => {
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
      const res = await fetch('/api/runway/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: prompt, videoUrl: video, duration: nodeData.duration || 5 })
      });
      const json = await res.json();
      if (json.taskId) {
        // Simple polling simulation for spaces
        const check = setInterval(async () => {
          const sRes = await fetch(`/api/runway/status/${json.taskId}`);
          const sJson = await sRes.json();
          if (sJson.status === 'SUCCEEDED') {
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
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Runway Gen-3" />
      <div className="handle-wrapper handle-left" style={{ top: '30%' }}>
        <Handle type="target" position={Position.Left} id="video" className="handle-video" />
        <span className="handle-label">Video in</span>
      </div>
      <div className="handle-wrapper handle-left" style={{ top: '70%' }}>
        <Handle type="target" position={Position.Left} id="prompt" className="handle-prompt" />
        <span className="handle-label">Prompt in</span>
      </div>
      <div className="node-header"><Film size={16} /> RUNWAYML</div>
      <div className="node-content">
        <select className="node-input mb-3" value={nodeData.duration || 5} onChange={(e) => setNodes((nds: any) => nds.map((n: any) => n.id === id ? {...n, data: {...n.data, duration: parseInt(e.target.value)}} : n))}>
          <option value={5}>5 Seconds</option>
          <option value={10}>10 Seconds</option>
        </select>
        <button className="execute-btn w-full justify-center" onClick={onRun}>{status === 'running' ? 'PROCESSING...' : 'RUN GENERATION'}</button>
        {result && <video src={result} className="mt-4 rounded-lg w-full" controls />}
      </div>
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Video out</span>
        <Handle type="source" position={Position.Right} className="handle-video" />
      </div>
    </div>
  );
});

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
        <Handle type="source" position={Position.Right} className="handle-video" />
      </div>
    </div>
  );
});

export const NanoBananaNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const nodes = useNodes();
  const edges = useEdges();
  const { setNodes } = useReactFlow();
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const onRun = async () => {
    const prompt = nodes.find(n => n.id === edges.find(e => e.target === id && e.targetHandle === 'prompt')?.source)?.data.value;
    const image = nodes.find(n => n.id === edges.find(e => e.target === id && e.targetHandle === 'image')?.source)?.data.value;
    
    if (!prompt) return alert("Need prompt!");

    setStatus('running');
    setProgress(0);
    
    // Simulate progress increment while waiting for API
    const progressInterval = setInterval(() => {
      setProgress((prev: number) => {
        if (prev >= 95) return prev;
        return prev + (prev < 50 ? 5 : 2);
      });
    }, 300);

    try {
      const res = await fetch('/api/replicate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: 'lucataco/flux-dev-nano-banana',
          input: { 
            prompt,
            image: image || undefined // Use image if provided for img2img
          }
        })
      });
      const json = await res.json();
      
      clearInterval(progressInterval);
      setProgress(100);

      if (json.output) {
        const outUrl = typeof json.output === 'string' ? json.output : json.output[0];
        setResult(outUrl);
        setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, value: outUrl, type: 'image' } } : n)));
        setStatus('success');
      }
    } catch (e) { 
      clearInterval(progressInterval);
      console.error(e);
      setStatus('error'); 
    }
  };

  return (
    <div className={`custom-node processor-node ${status === 'running' ? 'node-glow-running' : ''}`}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Nano Banana" />
      <div className="handle-wrapper handle-left !top-[25%]">
        <Handle type="target" position={Position.Left} id="image" className="handle-image" />
        <span className="handle-label">Image in</span>
      </div>
      <div className="handle-wrapper handle-left !top-[75%]">
        <Handle type="target" position={Position.Left} id="prompt" className="handle-prompt" />
        <span className="handle-label">Prompt in</span>
      </div>

      <div className="node-content">
        <button className="execute-btn w-full justify-center mb-2" onClick={onRun} disabled={status === 'running'}>
          {status === 'running' ? 'GENERATE...' : 'GENERATE IMAGE'}
        </button>

        {status === 'running' && (
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-4 border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(236,72,153,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="drop-zone overflow-hidden bg-black/60 min-h-[160px]">
          {result ? <img src={result} className="w-full h-full object-cover" alt="Result" /> : 
           <ImageIcon className="text-gray-800" size={32} />}
        </div>
      </div>
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Image out</span>
        <Handle type="source" position={Position.Right} id="image" className="handle-image" />
      </div>
    </div>
  );
});

export const MaskExtractionNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & { 
    mask_type?: string, 
    expansion?: number, 
    feather?: number,
    edgeSmooth?: number,
    confidence?: number,
    customPrompt?: string,
    result_rgba?: string,
    result_mask?: string
  };
  const nodes = useNodes();
  const edges = useEdges();
  const { setNodes } = useReactFlow();
  const [status, setStatus] = useState('idle');
  const [previewMode, setPreviewMode] = useState<'original' | 'mask' | 'cutout' | 'overlay'>('cutout');

  const updateNestedData = (key: string, val: any) => {
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n));
  };

  const onRun = async () => {
    const sourceEdge = edges.find(e => e.target === id && e.targetHandle === 'media');
    const sourceNode = nodes.find(n => n.id === sourceEdge?.source);
    const media = sourceNode?.data.value;

    if (!media) return alert("Need media input!");

    setStatus('running');
    try {
      const res = await fetch('/api/spaces/matte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: media,
          target: nodeData.mask_type || 'person',
          customPrompt: nodeData.customPrompt || '',
          expansion: nodeData.expansion ?? 0,
          feather: nodeData.feather ?? 5,
          edgeSmooth: nodeData.edgeSmooth ?? 2,
          confidence: nodeData.confidence ?? 0.5
        })
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setNodes((nds: any) => nds.map((n: any) => n.id === id ? { 
        ...n, 
        data: { 
          ...n.data, 
          result_rgba: json.rgba_image, 
          result_mask: json.mask,
          value: json.rgba_image, // Primary output is the RGBA image
          metadata: json.metadata
        } 
      } : n));
      
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      alert(`Matte Error: ${err.message}`);
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
      case 'overlay': return original; 
      default: return original;
    }
  };

  return (
    <div className={`custom-node mask-node w-[400px] ${status === 'running' ? 'node-glow-running' : ''}`}>
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Matte Mask" />
      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="media" className="handle-image" />
        <span className="handle-label">Source</span>
      </div>
      
      <div className="node-header">
        <Scissors size={16} /> AI MATTE EXTRACTION
        {status === 'running' && <Loader2 size={12} className="animate-spin ml-auto" />}
      </div>
      
      <div className="flex flex-col">
        {/* TOP: PREVIEW AREA */}
        <div className="relative group/preview overflow-hidden bg-black/80 h-[220px] flex items-center justify-center border-b border-white/5">
           <div className="absolute top-2 left-2 z-10 flex gap-1">
              {(['original', 'mask', 'cutout'] as const).map(mode => (
                <button 
                  key={mode}
                  onClick={() => setPreviewMode(mode)}
                  className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest transition-all ${previewMode === mode ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
                >
                  {mode}
                </button>
              ))}
           </div>

           {getPreviewImage() ? (
             <img 
               src={getPreviewImage()} 
               className={`w-full h-full object-contain ${previewMode === 'mask' ? 'invert brightness-150' : ''}`} 
               alt="Matte Preview" 
             />
           ) : (
             <div className="flex flex-col items-center gap-2 opacity-20">
                <ImageIcon size={40} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Connect Image</span>
             </div>
           )}

           {status === 'running' && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <div className="w-12 h-1 h-32 bg-cyan-500/20 rounded-full overflow-hidden mb-3">
                   <div className="h-full bg-cyan-500 animate-pulse width-full" style={{ width: '100%' }} />
                </div>
                <span className="text-[10px] font-black text-cyan-400 uppercase animate-pulse">Computing Matte...</span>
             </div>
           )}
        </div>

        {/* BOTTOM: SETTINGS AREA */}
        <div className="node-content space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="node-label">Detection Target</label>
              <select 
                className="node-input"
                value={nodeData.mask_type || 'person'}
                onChange={(e) => updateNestedData('mask_type', e.target.value)}
              >
                <option value="person">Person (Matting)</option>
                <option value="hair">Focus Hair</option>
                <option value="face">Face Det.</option>
                <option value="object">General Object</option>
                <option value="clothes">Clothing</option>
                <option value="background">Background</option>
                <option value="custom">Custom Prompt</option>
              </select>
            </div>
            {nodeData.mask_type === 'custom' && (
              <div>
                <label className="node-label">Custom Target</label>
                <input 
                  type="text"
                  placeholder="e.g. car, dog..."
                  className="node-input text-[10px]"
                  value={nodeData.customPrompt || ''}
                  onChange={(e) => updateNestedData('customPrompt', e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="node-label">Confidence</label>
              <input 
                type="range" min="0.1" max="1" step="0.05"
                value={nodeData.confidence ?? 0.5}
                onChange={(e) => updateNestedData('confidence', parseFloat(e.target.value))}
                className="w-full h-1 accent-cyan-500 rounded-lg appearance-none bg-white/10"
              />
              <div className="text-[8px] text-gray-500 mt-1 font-bold">MIN CONF: {(nodeData.confidence ?? 0.5).toFixed(2)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-3">
                <div>
                   <label className="node-label flex justify-between uppercase">Expansion <span className="text-cyan-400">{nodeData.expansion ?? 0}px</span></label>
                   <input 
                    type="range" min="-100" max="100" step="1"
                    value={nodeData.expansion ?? 0}
                    onChange={(e) => updateNestedData('expansion', parseInt(e.target.value))}
                    className="w-full h-1 accent-cyan-500 rounded-lg appearance-none bg-white/10"
                   />
                </div>
                <div>
                   <label className="node-label flex justify-between uppercase">Feather <span className="text-pink-500">{nodeData.feather ?? 5}px</span></label>
                   <input 
                    type="range" min="0" max="50" step="0.5"
                    value={nodeData.feather ?? 5}
                    onChange={(e) => updateNestedData('feather', parseFloat(e.target.value))}
                    className="w-full h-1 accent-pink-500 rounded-lg appearance-none bg-white/10"
                   />
                </div>
             </div>
             <div className="space-y-3">
                <div>
                   <label className="node-label flex justify-between uppercase">Edge Smooth <span className="text-purple-400">{nodeData.edgeSmooth ?? 2}px</span></label>
                   <input 
                    type="range" min="0" max="10" step="0.2"
                    value={nodeData.edgeSmooth ?? 2}
                    onChange={(e) => updateNestedData('edgeSmooth', parseFloat(e.target.value))}
                    className="w-full h-1 accent-purple-500 rounded-lg appearance-none bg-white/10"
                   />
                </div>
                <div className="flex items-end h-full">
                   <button 
                    onClick={onRun}
                    disabled={status === 'running'}
                    className={`execute-btn w-full justify-center group/btn relative overflow-hidden ${status === 'running' ? 'opacity-50' : 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}
                   >
                     {status === 'running' ? <Loader2 size={12} className="animate-spin" /> : <Play size={10} className="mr-2" />}
                     {status === 'running' ? 'PROCESSING' : 'RUN EXTRACTOR'}
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* MULTI OUTPUTS */}
      <div className="flex flex-col gap-2 absolute right-[-45px] top-[40px]">
          <div className="relative group/h">
             <Handle type="source" position={Position.Right} id="rgba" className="handle-image !right-0" />
             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase text-pink-500 bg-black/80 px-1 border border-pink-500/20 rounded opacity-0 group-hover/h:opacity-100 transition-opacity">RGBA</span>
          </div>
          <div className="relative mt-8 group/h">
             <Handle type="source" position={Position.Right} id="mask" className="handle-mask !right-0" />
             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase text-cyan-400 bg-black/80 px-1 border border-cyan-400/20 rounded opacity-0 group-hover/h:opacity-100 transition-opacity whitespace-nowrap">MASK ONLY</span>
          </div>
          <div className="relative mt-8 group/h">
             <Handle type="source" position={Position.Right} id="meta" className="handle-txt !right-0" />
             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[7px] font-black uppercase text-amber-500 bg-black/80 px-1 border border-amber-500/20 rounded opacity-0 group-hover/h:opacity-100 transition-opacity">META</span>
          </div>
      </div>
    </div>
  );
});

export const SpaceNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & { 
    outputType?: string, 
    spaceId?: string,
    hasInput?: boolean,
    hasOutput?: boolean,
    internalCategories?: string[]
  };
  const { setNodes } = useReactFlow();

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
      default: return <Layers size={16} className="text-cyan-400" />;
    }
  };

  const getHandleClass = () => {
    switch (nodeData.outputType) {
      case 'image': return 'handle-image';
      case 'video': return 'handle-video';
      case 'prompt': return 'handle-prompt';
      case 'mask': return 'handle-mask';
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
    <div className="custom-node space-node border-cyan-500/30">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Space" />
      
      {/* Input handle only if space has an internal InputNode */}
      {nodeData.hasInput !== false && (
        <div className="handle-wrapper handle-left">
          <Handle type="target" position={Position.Left} id="in" />
          <span className="handle-label">Data In</span>
        </div>
      )}
      
      <div className="node-header">
        {getIcon()} <span className="uppercase">{nodeData.outputType ? `${nodeData.outputType} Space` : 'NESTED SPACE'}</span>
      </div>
      
      <div className="node-content">
        {/* Internal Blueprint Summary - MORE PROMINENT */}
        <div className="flex flex-col gap-1.5 mb-5 p-2 bg-black/40 border border-white/5 rounded-xl shadow-inner">
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
  );
});

export const SpaceInputNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  return (
    <div className="custom-node space-io-node border-emerald-500/30">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Input" />
      <div className="node-header">
        <ChevronRight size={16} className="text-emerald-400" /> SPACE INPUT
      </div>
      <div className="node-content text-center py-4">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mx-auto mb-2">
          <ArrowRight size={24} className="text-emerald-500" />
        </div>
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Entry Point</span>
      </div>
      <div className="handle-wrapper handle-right">
        <Handle type="source" position={Position.Right} id="out" className="handle-emerald" />
      </div>
    </div>
  );
});

export const SpaceOutputNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  return (
    <div className="custom-node space-io-node border-rose-500/30">
      <NodeLabel id={id} label={nodeData.label} defaultLabel="Output" />
      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="in" className="handle-rose" />
      </div>
      <div className="node-header">
        <ChevronLeft size={16} className="text-rose-400" /> SPACE OUTPUT
      </div>
      <div className="node-content text-center py-4">
        <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 mx-auto mb-2">
          <CheckCircle size={24} className="text-rose-500" />
        </div>
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Exit Point</span>
      </div>
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
    const mediaUrl = inputNode?.data.value;
    const mediaType = inputNode?.data.type;
    
    if (!mediaUrl) return alert("Need media input to describe!");

    setStatus('running');
    
    try {
      const res = await fetch('/api/spaces/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: mediaUrl, 
          type: mediaType,
          metadata: inputNode?.data.metadata
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
      
      <div className="node-header">
        <Eye size={16} /> MEDIA DESCRIBER
        {status === 'running' && <Loader2 size={12} className="animate-spin ml-auto" />}
      </div>
      
      <div className="node-content">
        <p className="text-[10px] text-gray-500 mb-3 italic">Analyze any media and generate a detailed prompt description.</p>
        
        <button className="execute-btn w-full justify-center mb-4" onClick={onRun} disabled={status === 'running'}>
          {status === 'running' ? 'ANALYZING...' : 'GENERATE DESCRIPTION'}
        </button>

        <div className="p-3 bg-black/40 rounded-xl border border-white/5 min-h-[80px]">
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
