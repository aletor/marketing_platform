"use client";

import React, { memo, useState, useEffect, useMemo } from 'react';
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
  Globe
} from 'lucide-react';
import './spaces.css';

interface BaseNodeData {
  value?: string;
  value2?: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
  label?: string;
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

// --- UNIVERSAL MEDIA INPUT NODE ---

export const MediaInputNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData & { 
    type?: 'video' | 'image' | 'audio' | 'pdf' | 'txt' | 'url',
    source?: 'upload' | 'url' | 'asset',
    metadata?: { duration?: string, resolution?: string, fps?: number, size?: string, codec?: string }
  };
  const { setNodes } = useReactFlow();
  const [isUploading, setIsUploading] = useState(false);
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
    setIsUploading(true);
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
    finally { setIsUploading(false); }
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
        <Handle type="source" position={Position.Right} className="handle-prompt" />
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
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState<string | null>(null);

  const onRun = async () => {
    const prompt = nodes.find(n => n.id === edges.find(e => e.target === id && e.targetHandle === 'prompt')?.source)?.data.value;
    if (!prompt) return alert("Need prompt!");

    setStatus('running');
    try {
      const res = await fetch('/api/replicate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: 'lucataco/flux-dev-nano-banana',
          input: { prompt }
        })
      });
      const json = await res.json();
      if (json.output) {
        setResult(typeof json.output === 'string' ? json.output : json.output[0]);
        setStatus('success');
      }
    } catch (e) { setStatus('error'); }
  };

  return (
    <div className={`custom-node processor-node ${status === 'running' ? 'node-glow-running' : ''}`}>
      <div className="handle-wrapper handle-left">
        <Handle type="target" position={Position.Left} id="prompt" className="handle-prompt" />
        <span className="handle-label">Prompt in</span>
      </div>
      <div className="node-header"><ImageIcon size={16} /> NANO BANANA 2</div>
      <div className="node-content">
        <button className="execute-btn w-full justify-center mb-4" onClick={onRun}>
          {status === 'running' ? 'GENERATE...' : 'GENERATE IMAGE'}
        </button>
        <div className="drop-zone overflow-hidden bg-black/60 min-h-[160px]">
          {result ? <img src={result} className="w-full h-full object-cover" alt="Result" /> : 
           <ImageIcon className="text-gray-800" size={32} />}
        </div>
      </div>
      <div className="handle-wrapper handle-right">
        <span className="handle-label">Image out</span>
        <Handle type="source" position={Position.Right} className="handle-image" />
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
;
