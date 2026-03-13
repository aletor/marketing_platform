import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, BaseEdge, EdgeLabelRenderer, getBezierPath, EdgeProps, useReactFlow, useNodes, useEdges } from '@xyflow/react';
import { Video, Type, Play, Loader2, CheckCircle, AlertCircle, Film, Compass, MoreHorizontal, Maximize2, Download, Volume2, ArrowRight, X } from 'lucide-react';
import './nodes.css';

interface BaseNodeData {
  value?: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
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
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
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
          <button className="edgebutton" onClick={onEdgeClick}>
            <X size={10} strokeWidth={4} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export const VideoNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const { setNodes } = useReactFlow();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const updateValue = (val: string) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, value: val } } : n)));
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/runway/upload', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.url) {
        updateValue(json.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      handleFileUpload(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className={`custom-node video-node ${isDragging ? 'dragging' : ''}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="node-header">
        <Video size={16} /> VIDEO SOURCE {isUploading && <Loader2 size={12} className="animate-spin" />}
      </div>
      <div className="node-content">
        <label className="node-label">Video Source</label>
        
        <div className={`drop-zone ${nodeData.value ? 'has-value' : ''}`}>
          {isUploading ? (
            <div className="drop-zone-info">
              <Loader2 className="animate-spin" size={24} />
              <span>Uploading...</span>
            </div>
          ) : nodeData.value ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
              <video 
                className="video-preview" 
                src={nodeData.value} 
                muted 
                controls 
                style={{ maxHeight: '100%', maxWidth: '100%' }}
              />
            </div>
          ) : (
            <div className="drop-zone-info">
              <Film size={24} />
              <span>Drop video here</span>
            </div>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

export const PromptNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const { setNodes } = useReactFlow();

  const updateValue = (val: string) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, value: val } } : n)));
  };

  return (
    <div className="custom-node prompt-node" style={{ width: 450 }}>
      <div className="node-header">
        <Type size={16} /> PROMPT
      </div>
      <div className="node-content">
        <label className="node-label">Instruction</label>
        <textarea 
          className="node-textarea nowheel nodrag nokey"
          placeholder="Describe the motion or transformation in detail..."
          onChange={(e) => updateValue(e.target.value)}
          value={nodeData.value || ''}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
              e.stopPropagation();
            }
          }}
        />
      </div>
      <Handle type="source" position={Position.Right} style={{ top: '50%' }} />
    </div>
  );
});

export const RunwayNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const { setNodes } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();

  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateDuration = (val: number) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, duration: val } } : n)));
  };

  const getInputs = () => {
    const connectedEdges = edges.filter((e) => e.target === id);
    let promptText = '';
    let videoUrl = '';
    
    connectedEdges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode) {
        if (edge.targetHandle === 'prompt') promptText = sourceNode.data.value as string;
        else if (edge.targetHandle === 'video') videoUrl = sourceNode.data.value as string;
      }
    });
    return { promptText, videoUrl, duration: nodeData.duration || 5 };
  };

  const handleExecute = async () => {
    const inputs = getInputs();
    
    setError(null);

    if (!inputs.promptText) {
      const msg = "Missing input: Connect a PROMPT node first.";
      setError(msg);
      window.alert(msg);
      return;
    }

    if (!inputs.videoUrl) {
      const msg = "Missing input: Upload or drag a video to the source node first.";
      setError(msg);
      window.alert(msg);
      return;
    }

    setStatus('starting');
    console.log("Starting Runway generation with inputs:", inputs);

    try {
      const res = await fetch('/api/runway/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Server Error" }));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      console.log("Runway API response:", json);
      if (json.taskId) {
        startPolling(json.taskId);
      } else {
        throw new Error(json.error || "Failed to start Runway task (No TaskID)");
      }
    } catch (err: any) {
      console.error("Runway execution error:", err);
      setError(err.message);
      setStatus('failed');
    }
  };

  const startPolling = (taskId: string) => {
    setStatus('running');
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/runway/status/${taskId}`);
        const json = await res.json();
        
        setProgress(json.progress || 0);
        
        // Update status only if it's not a final state
        if (json.status === 'SUCCEEDED') {
          setResultUrl(json.output?.[0]);
          setStatus('succeeded');
          clearInterval(interval);
        } else if (json.status === 'FAILED') {
          setError(json.error || "Generation failed");
          setStatus('failed');
          clearInterval(interval);
        } else if (json.status) {
          setStatus(json.status.toLowerCase());
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  };

  return (
    <div className={`custom-node runway-node ${status === 'running' ? 'node-glow-running' : ''} ${status === 'succeeded' ? 'node-glow-succeeded' : ''}`}>
      <Handle type="target" position={Position.Left} id="video" style={{ top: '30%' }} />
      <Handle type="target" position={Position.Left} id="prompt" style={{ top: '70%' }} />
      
      <div className="node-header">
        <Film size={16} /> RUNWAY GENERATOR
      </div>
      
      <div className="node-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem' }}>Gen-3 Alpha Turbo</span>
          {status !== 'idle' && (
            <div className={`status-badge status-${status}`}>
              {status.toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <label className="node-label">Duration</label>
          <select 
            className="node-input nowheel nodrag nokey" 
            style={{ padding: '4px 8px' }}
            value={nodeData.duration || 5}
            onChange={(e) => updateDuration(parseInt(e.target.value))}
          >
            <option value={5}>5 Seconds</option>
            <option value={10}>10 Seconds</option>
          </select>
        </div>

        <div style={{ marginTop: 8, padding: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 4, fontSize: '0.65rem' }}>
          <div style={{ color: '#888', marginBottom: 2 }}>INPUTS CHECK:</div>
          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {getInputs().videoUrl ? '✅ Video Connected' : '❌ No Video'}
          </div>
          <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {getInputs().promptText ? '✅ Prompt Connected' : '❌ No Prompt'}
          </div>
        </div>

        {status === 'idle' || status === 'failed' || status === 'starting' ? (
          <button 
            className="execute-btn nodrag" 
            onClick={handleExecute}
            disabled={status === 'starting'}
          >
            {status === 'starting' ? (
              <Loader2 className="animate-spin" size={14} style={{ marginRight: 6 }} />
            ) : (
              <Play size={14} style={{ marginRight: 6 }} />
            )}
            {status === 'starting' ? 'INITIALIZING...' : 'GENERATE VIDEO'}
          </button>
        ) : (
          <div className="node-input" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {['running', 'pending', 'queued', 'starting'].includes(status) ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
              <span style={{ fontWeight: 600 }}>{status.toUpperCase()}</span>
            </div>
            {progress > 0 && (
              <div style={{ fontSize: '0.7rem', color: '#888' }}>
                Progress: {Math.round(progress * 100)}%
              </div>
            )}
          </div>
        )}

        {error && (
          <div style={{ color: '#ff4444', fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={12} /> {error}
          </div>
        )}

        {resultUrl && (
          <div className="video-preview" style={{ marginTop: 8 }}>
            <video src={resultUrl} controls style={{ width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
});

export const GrokNode = memo(({ id, data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const { setNodes } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();

  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateDuration = (val: number) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, duration: val } } : n)));
  };

  const updateParam = (key: string, val: string) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, [key]: val } } : n)));
  };

  const getInputs = () => {
    const connectedEdges = edges.filter((e) => e.target === id);
    let promptText = '';
    let videoUrl = '';
    
    connectedEdges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode) {
        if (edge.targetHandle === 'prompt') promptText = sourceNode.data.value as string;
        else if (edge.targetHandle === 'video') videoUrl = sourceNode.data.value as string;
      }
    });

    return { 
      promptText, 
      videoUrl, 
      duration: nodeData.duration || 5,
      resolution: nodeData.resolution || '720p',
      aspect_ratio: nodeData.aspect_ratio || '16:9'
    };
  };

  const handleExecute = async () => {
    const inputs = getInputs();
    
    setError(null);

    if (!inputs.promptText) {
      const msg = "Missing Connection: Please connect a PROMPT node to Grok.";
      setError(msg);
      window.alert(msg);
      return;
    }

    if (!inputs.videoUrl) {
      const msg = "Missing Video: Please drag a video source to its node first.";
      setError(msg);
      window.alert(msg);
      return;
    }

    // High Fidelity Prompt Injection
    const enhancedPrompt = `STRICT SCENE PRESERVATION MODE. MAINTAIN ORIGINAL COMPOSITION, CAMERA ANGLE, AND MOVING SUBJECTS EXACTLY. Only modify content within specified areas. Original video content MUST remain recognizable as the base. ${inputs.promptText}`;

    setStatus('starting');
    setResultUrl(null);
    console.log("Starting Grok generation with enhanced fidelity inputs:", { ...inputs, promptText: enhancedPrompt });

    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...inputs, 
          promptText: enhancedPrompt,
          resolution: inputs.resolution,
          aspect_ratio: inputs.aspect_ratio
        })
      });

      const json = await res.json().catch(() => ({ error: "Failed to parse JSON" }));

      if (!res.ok) {
        throw new Error(json.error || `HTTP error! status: ${res.status}`);
      }

      console.log("Grok API response:", json);
      if (json.taskId) startPolling(json.taskId);
      else throw new Error(json.error || "Failed to start Grok task (No TaskID)");
    } catch (err: any) {
      console.error("Grok execution error:", err);
      setError(err.message);
      setStatus('failed');
    }
  };

  const startPolling = (taskId: string) => {
    setStatus('running');
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/grok/status/${taskId}`);
        const json = await res.json();
        setProgress(json.progress || 0);
        
        const currentStatus = (json.status || '').toUpperCase();

        if (['SUCCEEDED', 'DONE', 'COMPLETED'].includes(currentStatus)) {
          setResultUrl(json.output?.[0]);
          setStatus('succeeded');
          clearInterval(interval);
        } else if (['FAILED', 'EXPIRED', 'ERROR'].includes(currentStatus)) {
          setError(json.error || "Generation failed");
          setStatus('failed');
          clearInterval(interval);
        } else if (json.status) {
          setStatus(json.status.toLowerCase());
        }
      } catch (err) { console.error("Polling error:", err); }
    }, 3000);
  };

  return (
    <div className={`custom-node grok-node ${status === 'running' ? 'node-glow-running' : ''} ${status === 'succeeded' ? 'node-glow-succeeded' : ''}`} style={{ width: 400 }}>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="prompt" 
        style={{ top: 80 }} 
      />
      <span className="handle-label handle-label-left" style={{ top: 80 }}>Prompt*</span>
      
      <Handle 
        type="target" 
        position={Position.Left} 
        id="video" 
        style={{ top: 180 }} 
        className="handle-video" 
      />
      <span className="handle-label handle-label-left" style={{ top: 180, color: '#fb7185' }}>Video*</span>

      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ top: 130 }} 
        className="handle-output" 
      />
      <span className="handle-label handle-label-right" style={{ top: 130, color: '#fda4af' }}>Video</span>

      <div className="node-header">
        <div className="node-header-title">
          <Compass size={18} />
          Grok Imagine – Video edit
        </div>
        <MoreHorizontal size={18} color="#888" />
      </div>
      
      <div className="node-content">
        <div className="video-display-area" style={{ 
          width: '100%', 
          aspectRatio: '1/1', 
          background: '#000', 
          borderRadius: 8, 
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid #333'
        }}>
          {resultUrl ? (
            <video 
              src={resultUrl} 
              controls 
              autoPlay
              loop
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          ) : (
            <div className="video-area-empty" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ position: 'absolute', top: 12, left: 12, width: 8, height: 8, background: '#444', borderRadius: 1 }} />
               <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                  <Maximize2 size={14} color="#aaa" />
                  <Download size={14} color="#aaa" />
               </div>
               <Film size={48} color="#333" />
            </div>
          )}
          <div className="video-metadata" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 8px', background: 'rgba(0,0,0,0.6)', fontSize: '10px' }}>
            {nodeData.resolution || '720p'} | {nodeData.duration || 5}.00s | {nodeData.aspect_ratio || '16:9'}
          </div>
        </div>

        <div className="video-controls">
          <div className="video-info-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Play size={14} fill="white" />
              <span>140 / 209 frames</span>
            </div>
            <Volume2 size={14} />
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: resultUrl ? '100%' : '60%' }}></div>
            <div className="progress-bar-handle" style={{ left: resultUrl ? '100%' : '60%' }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
             <label className="node-label">DURATION</label>
             <input 
               type="number" 
               className="node-input nowheel nodrag nokey" 
               style={{ width: 60, background: '#111', border: '1px solid #333' }}
               value={nodeData.duration || 5}
               onChange={(e) => updateDuration(parseInt(e.target.value))}
             />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
             <label className="node-label">RES</label>
             <select 
               className="node-input nowheel nodrag" 
               style={{ width: 70, background: '#111', border: '1px solid #333', fontSize: '10px' }}
               value={nodeData.resolution || '720p'}
               onChange={(e) => updateParam('resolution', e.target.value)}
             >
               <option value="720p">720p</option>
               <option value="480p">480p</option>
             </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
             <label className="node-label">ASPECT</label>
             <select 
               className="node-input nowheel nodrag" 
               style={{ width: 70, background: '#111', border: '1px solid #333', fontSize: '10px' }}
               value={nodeData.aspect_ratio || '16:9'}
               onChange={(e) => updateParam('aspect_ratio', e.target.value)}
             >
               <option value="16:9">16:9</option>
               <option value="9:16">9:16</option>
               <option value="1:1">1:1</option>
               <option value="4:3">4:3</option>
             </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, marginLeft: 10 }}>
             <label className="node-label">INPUTS STATUS</label>
             <div style={{ fontSize: '0.65rem', color: '#888' }}>
               V: {getInputs().videoUrl ? '✅ OK' : '❌ ERR'} | P: {getInputs().promptText ? '✅ OK' : '❌ ERR'}
             </div>
             <div style={{ fontSize: '0.6rem', color: '#888', marginTop: 2, fontStyle: 'italic' }}>
               Max: 15s (Grok limitation)
             </div>
          </div>

          <button 
            className="execute-btn nodrag" 
            onClick={handleExecute} 
            disabled={status !== 'idle' && status !== 'failed' && status !== 'succeeded'}
          >
            {['starting', 'running', 'pending', 'queued'].includes(status) ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (status === 'succeeded' ? <CheckCircle size={16} /> : <ArrowRight size={16} />)}
            {status === 'starting' ? 'INITIALIZING...' : 
             (status === 'pending' || status === 'queued') ? 'QUEUED...' :
             status === 'running' ? 'GENERATING...' :
             status === 'succeeded' ? 'DONE' : 'Run Model'}
          </button>
        </div>

        {error && (
          <div className="error-alert" style={{ marginTop: 16 }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span style={{ wordBreak: 'break-word' }}>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
});
