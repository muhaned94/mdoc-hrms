
// CompanyMap v1.1 - Updated Layout
import React, { useMemo, useEffect, useState } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from './CustomNodes';
import { calculateLayout } from './layoutUtils';
import './CompanyMap.css';

const CompanyMap = ({ data }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        if (data) {
            const { nodes: layoutNodes, edges: layoutEdges } = calculateLayout(data);
            setNodes(layoutNodes);
            setEdges(layoutEdges);
        }
    }, [data, setNodes, setEdges]);

    // Default Edge Options
    const defaultEdgeOptions = {
        type: 'smoothstep',
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#b1b1b7',
        },
        style: { stroke: '#b1b1b7', strokeWidth: 1.5 },
    };

    return (
        <div className="company-map-container">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                attributionPosition="bottom-right"
                minZoom={0.1}
                connectOnClick={false}
                nodesDraggable={true} // Allow manual adjustments if needed
                nodesConnectable={false}
            >
                <Controls />
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
};

export default CompanyMap;
