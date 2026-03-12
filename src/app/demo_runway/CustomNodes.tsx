import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Video, Type, Play, Loader2, CheckCircle, AlertCircle, Film } from 'lucide-react';
import './nodes.css';

interface BaseNodeData {
  value?: string;
  duration?: number;
  onChange?: (val: string) => void;
  onDurationChange?: (val: number) => void;
  getInputs?: () => { prompt: string; video: string; duration: number };
}

export const VideoNode = memo(({ data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
        nodeData.onChange?.(json.url);
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
            <video className="video-preview" src={nodeData.value} muted autoPlay loop />
          ) : (
            <div className="drop-zone-info">
              <Film size={24} />
              <span>Drop video here</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <label className="node-label" style={{ fontSize: '0.65rem' }}>Or paste URL</label>
          <input 
            className="node-input"
            type="text" 
            placeholder="https://..." 
            onChange={(e) => nodeData.onChange?.(e.target.value)}
            defaultValue={nodeData.value as string}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

export const PromptNode = memo(({ data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  return (
    <div className="custom-node prompt-node">
      <div className="node-header">
        <Type size={16} /> PROMPT
      </div>
      <div className="node-content">
        <label className="node-label">Instruction</label>
        <textarea 
          className="node-textarea"
          placeholder="Describe the motion or transformation..."
          onChange={(e) => nodeData.onChange?.(e.target.value)}
          defaultValue={nodeData.value as string}
        />
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

export const RunwayNode = memo(({ data }: NodeProps<any>) => {
  const nodeData = data as BaseNodeData;
  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    const inputs = nodeData.getInputs ? nodeData.getInputs() : { prompt: '', video: '', duration: 5 };
    
    if (!inputs.prompt) {
      setError("Connect a prompt node first");
      return;
    }

    setStatus('starting');
    setError(null);
    setResultUrl(null);

    try {
      const res = await fetch('/api/runway/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: inputs.prompt,
          videoUrl: inputs.video,
          duration: inputs.duration
        })
      });

      const json = await res.json();
      if (json.taskId) {
        startPolling(json.taskId);
      } else {
        throw new Error(json.error || "Failed to start task");
      }
    } catch (err: any) {
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

        if (json.status === 'SUCCEEDED') {
          setResultUrl(json.output?.[0]);
          setStatus('succeeded');
          clearInterval(interval);
        } else if (json.status === 'FAILED') {
          setError(json.error || "Generation failed");
          setStatus('failed');
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);
  };

  return (
    <div className="custom-node runway-node">
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
            className="node-input" 
            style={{ padding: '4px 8px' }}
            value={nodeData.duration || 5}
            onChange={(e) => nodeData.onDurationChange?.(parseInt(e.target.value))}
          >
            <option value={5}>5 Seconds</option>
            <option value={10}>10 Seconds</option>
          </select>
        </div>

        {status === 'idle' || status === 'failed' ? (
          <button className="execute-btn" onClick={handleExecute}>
            <Play size={14} style={{ marginRight: 6 }} /> GENERATE VIDEO
          </button>
        ) : (
          <div className="node-input" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {status === 'running' ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
            <span>{status === 'running' ? `Processing... ${Math.round(progress * 100)}%` : 'Done!'}</span>
          </div>
        )}

        {error && (
          <div style={{ color: '#ff4444', fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={12} /> {error}
          </div>
        )}

        {resultUrl && (
          <div className="video-preview" style={{ marginTop: 8 }}>
            <video src={resultUrl} controls autoPlay loop style={{ width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
});
