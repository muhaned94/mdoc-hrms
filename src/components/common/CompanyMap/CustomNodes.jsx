
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CompanyMap.css';

// Manager Node (Center)
export const ManagerNode = memo(({ data }) => {
    return (
        <div className="node-manager">
            {/* Handles for connections from all sides */}
            <Handle type="target" position={Position.Top} id="top" style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Top} id="s-top" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} id="s-bottom" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Left} id="s-left" style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Right} id="s-right" style={{ opacity: 0 }} />

            <div className="node-label">{data.label}</div>
        </div>
    );
});

// Assistant Node (Top)
export const AssistantNode = memo(({ data }) => {
    return (
        <div className="node-assistant">
            <Handle type="target" position={Position.Bottom} style={{ opacity: 0 }} />
            <div className="node-label">{data.label}</div>
        </div>
    );
});

// Authority Node (Bottom)
export const AuthorityNode = memo(({ data }) => {
    return (
        <div className="node-authority">
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
            <div className="node-label">{data.label}</div>
        </div>
    );
});

// Department Node (General)
export const DepartmentNode = memo(({ data }) => {
    return (
        <div className="node-department">
            {/* Generic handles for flexibility */}
            <Handle type="target" position={Position.Top} id="t-top" style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Left} id="t-left" style={{ opacity: 0 }} />
            <Handle type="target" position={Position.Right} id="t-right" style={{ opacity: 0 }} />

            <Handle type="source" position={Position.Bottom} id="s-bottom" style={{ opacity: 0 }} />

            <div className="node-label">{data.label}</div>
        </div>
    );
});

export const nodeTypes = {
    manager: ManagerNode,
    assistant: AssistantNode,
    authority: AuthorityNode,
    department: DepartmentNode,
};
