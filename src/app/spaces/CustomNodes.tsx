"use client";

import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Paintbrush
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
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: '#666', strokeWidth: 3 }} />
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
      <div className="node-header">
        <Paintbrush size={16} /> BACKGROUND / CANVAS
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

// --- IMAGE COMPOSER NODE ---

// --- IMAGE COMPOSER NODE ---

export const ImageComposerNode = memo(({ id, data }: NodeProps<any>) => {
  const nodes = useNodes();
  const edges = useEdges();
  
  // Find all edges connected TO this node, sorted by handle ID (layer-0, layer-1...)
  const connectedInputs = useMemo(() => 
    edges.filter((e: any) => e.target === id).sort((a: any, b: any) => (a.targetHandle || '').localeCompare(b.targetHandle || '')),
    [edges, id]
  );

  // Map handles to actual layer data
  const layers = useMemo(() => {
    return connectedInputs.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      return {
        id: sourceNode?.id,
        handleId: edge.targetHandle,
        type: sourceNode?.data.type,
        value: sourceNode?.data.value as string | undefined,
        color: sourceNode?.data.color as string | undefined,
        width: sourceNode?.data.width as number | undefined,
        height: sourceNode?.data.height as number | undefined
      };
    }).filter(l => l.value || l.color);
  }, [connectedInputs, nodes]);

  // Dynamic Handle IDs: used ones + 1 extra
  const handleIds = useMemo(() => {
    const ids = connectedInputs.map((e: any) => e.targetHandle || 'layer-0');
    const lastNum = ids.length > 0 ? parseInt(ids[ids.length - 1].replace('layer-', '')) : -1;
    return [...new Set([...ids, `layer-${lastNum + 1}`])];
  }, [connectedInputs]);

  return (
    <div className="custom-node composer-node min-w-[300px]">
      {handleIds.map((hId: any, index: number) => (
        <div key={hId} className="handle-wrapper handle-left" style={{ top: `${(index + 1) * (100 / (handleIds.length + 1))}%` }}>
          <Handle type="target" position={Position.Left} id={hId} className="handle-image" />
          <span className="handle-label">Layer {index + 1}</span>
        </div>
      ))}

      <div className="node-header">
        <Layers size={16} /> IMAGE COMPOSER
      </div>
      <div className="node-content">
        <div className="mb-2 flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase tracking-widest">
          <span>Active Layers</span>
          <span className="bg-white/10 px-2 py-0.5 rounded-full text-white">{layers.length}</span>
        </div>
        
        {/* Composition Preview Stack with Checkerboard Background */}
        <div className="relative w-full aspect-video bg-black/60 rounded-xl overflow-hidden border border-white/10 group shadow-inner" 
             style={{ backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px' }}>
          
          {layers.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 gap-2">
              <Layers size={32} />
              <span className="text-[9px] font-black uppercase tracking-tighter">No layers connected</span>
            </div>
          ) : (
            layers.map((layer, idx) => (
              <div 
                key={layer.handleId || idx} 
                className="absolute inset-0 transition-all duration-500 animate-in fade-in zoom-in-95"
                style={{ zIndex: idx }}
              >
                {/* If it's a background node (has color) */}
                {layer.color ? (
                  <div className="w-full h-full" style={{ backgroundColor: layer.color }}></div>
                ) : (
                  <img src={layer.value} className="w-full h-full object-contain" alt={`Layer ${idx}`} />
                )}
              </div>
            ))
          )}
          
          {/* Overlay Info on Hover */}
          <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[8px] font-mono text-cyan-400 border border-cyan-500/30">
               MULTILAYER COMPOSITE
             </div>
          </div>
        </div>

        <div className="mt-4 space-y-1 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
          {layers.map((l, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/[0.02] text-[9px] hover:bg-white/10 transition-colors">
              <div className="w-4 h-4 rounded text-[8px] flex items-center justify-center bg-white/10 text-gray-400 font-bold">{i+1}</div>
              <span className="flex-1 truncate font-medium text-gray-400 uppercase tracking-tighter">
                {l.color ? `Canvas: ${l.color}` : `Image: Layer Asset`}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${l.color ? 'bg-amber-500 shadow-[0_0_5px_#f59e0b]' : 'bg-pink-500 shadow-[0_0_5px_#ec4899]'}`}></div>
            </div>
          ))}
        </div>
      </div>
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Image out</span>
        <Handle type="source" position={Position.Right} id="image" className="handle-image" />
      </div>
    </div>
  );
});

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

  // If source is a composer, get all its inputs
  const layers = useMemo(() => {
    if (!sourceNode || sourceNode.type !== 'imageComposer') return [];
    const composerEdges = edges.filter(e => e.target === sourceNode.id)
      .sort((a: any, b: any) => (a.targetHandle || '').localeCompare(b.targetHandle || ''));
    
    return composerEdges.map(edge => {
      const node = nodes.find(n => n.id === edge.source);
      return {
        type: node?.type,
        value: node?.data.value as string | undefined,
        color: node?.data.color as string | undefined,
        width: node?.data.width as number || 0,
        height: node?.data.height as number || 0
      };
    }).filter(l => (l.value as string) || (l.color as string));
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

      const res = await fetch('/api/spaces/compose', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error("Server composition failed");

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

  return (
    <div className="custom-node media-node">
      <div className="node-header flex justify-between items-center" style={{ color: getTitleColor() }}>
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
      <div className="node-header"><Type size={16} /> PROMPT</div>
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
  const nodeData = data as BaseNodeData & { mask_type?: string, expansion?: number, feather?: number };
  const nodes = useNodes();
  const edges = useEdges();
  const { setNodes } = useReactFlow();
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState<string | null>(null);

  const updateNestedData = (key: string, val: any) => {
    setNodes((nds: any) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n));
  };

  const onRun = async () => {
    const media = nodes.find(n => n.id === edges.find(e => e.target === id && e.targetHandle === 'media')?.source)?.data.value;
    if (!media) return alert("Need media input!");

    setStatus('running');
    // Simulated processing for demonstration
    setTimeout(() => {
      setStatus('success');
      setResult('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop'); // Placeholder for mask
    }, 2000);
  };

  return (
    <div className={`custom-node mask-node ${status === 'running' ? 'node-glow-running' : ''}`}>
      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="media" />
        <span className="handle-label">Media in</span>
      </div>
      
      <div className="node-header">
        <Scissors size={16} /> MASK / MATTE EXTRACTION
        {status === 'running' && <Loader2 size={12} className="animate-spin ml-auto" />}
      </div>
      
      <div className="node-content">
        <div className="mb-4">
          <label className="node-label">Mask Target</label>
          <select 
            className="node-input"
            value={nodeData.mask_type || 'person'}
            onChange={(e) => updateNestedData('mask_type', e.target.value)}
          >
            <option value="person">Subject (Person)</option>
            <option value="face">Face Focus</option>
            <option value="object">Custom Object</option>
            <option value="screen">Screen (Chroma)</option>
            <option value="background">Background Only</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="node-label">Expansion</label>
            <input 
              type="range" min="-50" max="50" step="1"
              value={nodeData.expansion ?? 0}
              onChange={(e) => updateNestedData('expansion', parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="text-[9px] text-center text-gray-500 mt-1">{nodeData.expansion ?? 0}px</div>
          </div>
          <div>
            <label className="node-label">Feather</label>
            <input 
              type="range" min="0" max="100" step="1"
              value={nodeData.feather ?? 5}
              onChange={(e) => updateNestedData('feather', parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="text-[9px] text-center text-gray-500 mt-1">{nodeData.feather ?? 5}px</div>
          </div>
        </div>

        <button className="execute-btn w-full justify-center mb-4" onClick={onRun} disabled={status === 'running'}>
          {status === 'running' ? 'EXTRACTING...' : 'EXTRACT MASK'}
        </button>

        <div className="drop-zone overflow-hidden bg-black/60 min-h-[140px] flex flex-col items-center justify-center border-dashed border-cyan-500/20">
          {result ? (
            <img src={result} className="w-full h-full object-contain mix-blend-screen opacity-80" alt="Mask Preview" />
          ) : (
            <>
              <Layers className="text-gray-800 mb-2" size={32} />
              <span className="text-[9px] text-gray-600 uppercase font-black">Mask Preview</span>
            </>
          )}
        </div>
      </div>

      <div className="handle-wrapper handle-right">
        <span className="handle-label">Mask Asset</span>
        <Handle type="source" position={Position.Right} id="mask" className="handle-mask" />
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
    const inputNode = nodes.find(n => n.id === edges.find(e => e.target === id && e.targetHandle === 'media')?.source);
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
        setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, value: json.description } } : n)));
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
;
