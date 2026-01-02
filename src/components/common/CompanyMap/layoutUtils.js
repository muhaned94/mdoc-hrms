
/**
 * Layout utility for Company Map using ReactFlow
 * Positions nodes based on their roles:
 * - Root (General Manager): Center (0, 0)
 * - Assistants (المعاون): Top, distributed horizontally
 * - Authorities (هيئات): Bottom, distributed horizontally
 * - Direct Departments: Left/Right sides
 * - Sub-departments (children of Authorities): Tree structure below them
 */

export const calculateLayout = (rootNode) => {
    if (!rootNode) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    let idCounter = 0;

    // Constants
    const CENTER_X = 0;
    const CENTER_Y = 0;
    const ASSISTANT_Y = -250;
    const AUTHORITY_Y = 400; // Increased spacing for better visibility
    const SIDE_Y_START = -100;
    const SIDE_Y_GAP = 100;
    const SIDE_X_OFFSET = 500;

    // Helper to generate unique IDs if needed, though we should prefer API IDs
    const getStringId = (node) => node.id?.toString() || `node-${idCounter++}`;

    // Process Root (General Manager)
    const rootId = getStringId(rootNode);
    nodes.push({
        id: rootId,
        type: 'manager',
        data: { label: rootNode.name },
        position: { x: CENTER_X, y: CENTER_Y },
    });

    if (!rootNode.children || rootNode.children.length === 0) {
        return { nodes, edges };
    }

    // Categorize Children
    const assistants = [];
    const authorities = [];
    const departments = [];

    rootNode.children.forEach(child => {
        const name = (child.name || '').trim();
        // More robust categorization for Arabic terms
        if (name.includes('معاون') || name.startsWith('المعاون')) {
            assistants.push(child);
        } else if (name.includes('هيئة') || name.includes('الهيئة')) {
            authorities.push(child);
        } else {
            departments.push(child);
        }
    });

    // 1. Position Assistants (Top)
    const assistantWidth = 220;
    const totalAssistantWidth = assistants.length * assistantWidth;
    let currentAssistantX = CENTER_X - (totalAssistantWidth / 2) + (assistantWidth / 2);

    assistants.forEach((node) => {
        const nodeId = getStringId(node);
        nodes.push({
            id: nodeId,
            type: 'assistant',
            data: { label: node.name },
            position: { x: currentAssistantX, y: ASSISTANT_Y },
        });
        edges.push({
            id: `e-${rootId}-${nodeId}`,
            source: rootId,
            target: nodeId,
            sourceHandle: 's-top',
            targetHandle: 't-bottom',
            type: 'smoothstep',
        });
        currentAssistantX += assistantWidth;
    });

    // 2. Position Authorities (Bottom) -> And their children!
    const authorityWidth = 400; // Increased spacing
    const totalAuthorityWidth = authorities.length * authorityWidth;
    let currentAuthorityX = CENTER_X - (totalAuthorityWidth / 2) + (authorityWidth / 2);

    authorities.forEach((node) => {
        const nodeId = getStringId(node);

        // Create Authority Node
        nodes.push({
            id: nodeId,
            type: 'authority',
            data: { label: node.name },
            position: { x: currentAuthorityX, y: AUTHORITY_Y },
        });

        // Connect to Root
        edges.push({
            id: `e-${rootId}-${nodeId}`,
            source: rootId,
            target: nodeId,
            sourceHandle: 's-bottom',
            targetHandle: 't-top',
            type: 'smoothstep',
        });

        // Process Children of Authority (Sub-tree)
        if (node.children && node.children.length > 0) {
            processSubTree(node, nodeId, currentAuthorityX, AUTHORITY_Y + 250, nodes, edges);
        }

        currentAuthorityX += authorityWidth;
    });

    // 3. Position Departments (Sides)
    // Split into Left and Right lists
    const rightDepts = departments.slice(0, Math.ceil(departments.length / 2));
    const leftDepts = departments.slice(Math.ceil(departments.length / 2));

    // Right Side
    let currentY = SIDE_Y_START;
    rightDepts.forEach((node) => {
        const nodeId = getStringId(node);
        nodes.push({
            id: nodeId,
            type: 'department',
            data: { label: node.name },
            position: { x: SIDE_X_OFFSET, y: currentY },
        });
        edges.push({
            id: `e-${rootId}-${nodeId}`,
            source: rootId,
            target: nodeId,
            sourceHandle: 's-right',
            targetHandle: 't-left',
            type: 'smoothstep',
        });
        currentY += SIDE_Y_GAP;

        if (node.children && node.children.length > 0) {
            processSubTree(node, nodeId, SIDE_X_OFFSET + 200, currentY, nodes, edges, 'horizontal');
        }
    });

    // Left Side
    currentY = SIDE_Y_START;
    leftDepts.forEach((node) => {
        const nodeId = getStringId(node);
        nodes.push({
            id: nodeId,
            type: 'department',
            data: { label: node.name },
            position: { x: -SIDE_X_OFFSET, y: currentY },
        });
        edges.push({
            id: `e-${rootId}-${nodeId}`,
            source: rootId,
            target: nodeId,
            sourceHandle: 's-left',
            targetHandle: 't-right',
            type: 'smoothstep',
        });
        currentY += SIDE_Y_GAP;

        if (node.children && node.children.length > 0) {
            processSubTree(node, nodeId, -SIDE_X_OFFSET - 200, currentY, nodes, edges, 'horizontal');
        }
    });

    return { nodes, edges };
};

// Recursive function to layout children below authorities or departments
const processSubTree = (parentNode, parentId, parentX, startY, nodes, edges, orientation = 'vertical') => {
    if (!parentNode.children || parentNode.children.length === 0) return;

    const childWidth = 160;
    const childHeight = 80;
    const totalWidth = parentNode.children.length * childWidth;
    let currentX = parentX - (totalWidth / 2) + (childWidth / 2);
    let currentY = startY;

    parentNode.children.forEach(child => {
        const childId = child.id?.toString() || `sub-${Math.random()}`;

        nodes.push({
            id: childId,
            type: 'department',
            data: { label: child.name },
            position: {
                x: orientation === 'vertical' ? currentX : parentX,
                y: orientation === 'vertical' ? startY : currentY
            },
        });

        edges.push({
            id: `e-${parentId}-${childId}`,
            source: parentId,
            target: childId,
            sourceHandle: orientation === 'vertical' ? 's-bottom' : (parentX > 0 ? 's-right' : 's-left'),
            targetHandle: orientation === 'vertical' ? 't-top' : (parentX > 0 ? 't-left' : 't-right'),
            type: 'smoothstep',
        });

        if (child.children?.length > 0) {
            processSubTree(
                child,
                childId,
                orientation === 'vertical' ? currentX : (parentX > 0 ? parentX + 200 : parentX - 200),
                orientation === 'vertical' ? startY + 150 : currentY,
                nodes,
                edges,
                orientation
            );
        }

        if (orientation === 'vertical') {
            currentX += childWidth;
        } else {
            currentY += childHeight;
        }
    });
};
