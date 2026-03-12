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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { VideoNode, PromptNode, RunwayNode } from './CustomNodes';
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
    data: { taskId: null },
    position: { x: 450, y: 180 },
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

  // Helper for nodes to update their data in the main state
  const onNodeDataChange = useCallback((id: string, key: string, value: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, [key]: value } };
        }
        return node;
      })
    );
  }, []);

  // Helper for RunwayNode to get inputs from connected nodes
  const getInputsForNode = useCallback((id: string) => {
    const targetNode = nodes.find(n => n.id === id);
    const connectedEdges = edges.filter((e) => e.target === id);
    let prompt = '';
    let video = '';
    const duration = (targetNode?.data.duration as number) || 5;

    connectedEdges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode) {
        if (edge.targetHandle === 'prompt') {
          prompt = sourceNode.data.value as string;
        } else if (edge.targetHandle === 'video') {
          video = sourceNode.data.value as string;
        }
      }
    });

    return { prompt, video, duration };
  }, [nodes, edges]);

  const nodeTypes: NodeTypes = useMemo(() => ({
    videoInput: (props: any) => (
      <VideoNode {...props} data={{ ...props.data, onChange: (val: string) => onNodeDataChange(props.id, 'value', val) }} />
    ),
    promptInput: (props: any) => (
      <PromptNode {...props} data={{ ...props.data, onChange: (val: string) => onNodeDataChange(props.id, 'value', val) }} />
    ),
    runwayProcessor: (props: any) => (
      <RunwayNode {...props} data={{ 
        ...props.data, 
        getInputs: () => getInputsForNode(props.id),
        onDurationChange: (val: number) => onNodeDataChange(props.id, 'duration', val)
      }} />
    ),
  }), [onNodeDataChange, getInputsForNode]);

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
            nodeTypes={nodeTypes}
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
