"use client";

import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeTypes,
  ReactFlowProvider,
  reconnectEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { VideoNode, PromptNode, RunwayNode, GrokNode, ButtonEdge } from './CustomNodes';
import './nodes.css';

const initialNodes: Node[] = [
  {
    id: 'video-1',
    type: 'videoInput',
    data: { value: 'https://runwayml.com/static/video/gen3/gen3_1.mp4' },
    position: { x: 50, y: 100 },
  },
  {
    id: 'prompt-1',
    type: 'promptInput',
    data: { value: 'A cinematic underwater scene with bioluminescent jellyfish, high detail, 4k' },
    position: { x: 50, y: 350 },
  },
  {
    id: 'runway-1',
    type: 'runwayProcessor',
    data: { taskId: null, duration: 5 },
    position: { x: 450, y: 50 },
  },
  {
    id: 'grok-1',
    type: 'grokProcessor',
    data: { taskId: null },
    position: { x: 450, y: 400 },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'video-1', target: 'runway-1', targetHandle: 'video' },
  { id: 'e2-2', source: 'prompt-1', target: 'runway-1', targetHandle: 'prompt' },
];

export default function RunwayDemoPage() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const edgeReconnectRoot = React.useRef<boolean>(false);

  const onReconnectStart = useCallback(() => {
    edgeReconnectRoot.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: any) => {
      edgeReconnectRoot.current = true;
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    []
  );

  const onReconnectEnd = useCallback((_: any, edge: Edge) => {
    if (!edgeReconnectRoot.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeReconnectRoot.current = false;
  }, []);

  // No need for helper functions here anymore, handled in custom nodes using hooks

  const nodeTypes: NodeTypes = useMemo(() => ({
    videoInput: VideoNode,
    promptInput: PromptNode,
    runwayProcessor: RunwayNode,
    grokProcessor: GrokNode,
  } as any), []);

  const edgeTypes = useMemo(() => ({
    buttonEdge: ButtonEdge,
  }), []);

  const defaultEdgeOptions = useMemo(() => ({
    type: 'buttonEdge',
    animated: true,
  }), []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        padding: '12px 24px', 
        background: '#0a0a0a', 
        borderBottom: '1px solid #222', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ color: 'white', fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>
          RUNWAY<span style={{ color: '#ff0080' }}>ML</span> NODE STUDIO
        </h1>
        <div style={{ color: '#666', fontSize: '0.8rem' }}>
          Connect Nodes & Generate Masterpieces
        </div>
      </header>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onReconnectStart={onReconnectStart}
            onReconnectEnd={onReconnectEnd}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            className="runway-node-canvas"
          >
            <Background color="#333" gap={20} />
            <Controls />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
