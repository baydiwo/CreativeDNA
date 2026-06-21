"use client";

import { use, useCallback, useEffect, useState } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  Node, 
  Edge,
  applyNodeChanges,
  NodeChange
} from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { CreativeAsset } from "@/lib/services/creatives.service";
import CreativeNode from "@/components/canvas/CreativeNode";
import { CreativeDetailDrawer } from "@/components/creatives/CreativeDetailDrawer";
import { Loader2 } from "lucide-react";

const nodeTypes = {
  creative: CreativeNode,
};

export default function LineageCanvasPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCreative, setSelectedCreative] = useState<CreativeAsset | null>(null);
  const [rawCreatives, setRawCreatives] = useState<CreativeAsset[]>([]);

  useEffect(() => {
    async function loadGraph() {
      try {
        // Fetch all creatives for this product
        const qCreatives = query(collection(db, "creatives"), where("productId", "==", productId));
        const creativesSnap = await getDocs(qCreatives);
        const creativesList = creativesSnap.docs.map(d => ({ id: d.id, ...d.data() } as CreativeAsset));
        
        // Fetch all edges for this product
        const qEdges = query(collection(db, "creativeEdges"), where("productId", "==", productId));
        const edgesSnap = await getDocs(qEdges);
        
        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];
        
        // Map edges
        edgesSnap.forEach(doc => {
          const data = doc.data();
          initialEdges.push({
            id: doc.id,
            source: data.sourceAssetId,
            target: data.targetAssetId,
            animated: true,
            label: data.mutationType,
            style: { stroke: '#94a3b8', strokeWidth: 2 }
          });
        });

        // Basic layout engine
        // We'll separate into roots and children
        const childrenIds = new Set(initialEdges.map(e => e.target));
        const roots = creativesList.filter(c => !childrenIds.has(c.id));
        
        let currentX = 100;
        const NODE_WIDTH = 250;
        const Y_SPACING = 300;

        // Recursive placement
        const placeNode = (creativeId: string, level: number, parentX?: number) => {
          const creative = creativesList.find(c => c.id === creativeId);
          if (!creative) return;

          // Check if already placed
          if (initialNodes.find(n => n.id === creativeId)) return;

          const x = parentX !== undefined ? parentX : currentX;
          if (parentX === undefined) currentX += NODE_WIDTH;

          initialNodes.push({
            id: creative.id,
            type: 'creative',
            position: { x, y: level * Y_SPACING + 100 },
            data: {
              id: creative.id,
              name: creative.name,
              type: creative.type,
              status: creative.status,
              storageUrl: creative.storageUrl,
              onClick: (id: string) => {
                const c = creativesList.find(cr => cr.id === id);
                if (c) setSelectedCreative(c);
              }
            }
          });

          // Find children and place them below
          const children = initialEdges.filter(e => e.source === creativeId).map(e => e.target);
          
          let childXStart = x - ((children.length - 1) * NODE_WIDTH) / 2;
          children.forEach(childId => {
            placeNode(childId, level + 1, childXStart);
            childXStart += NODE_WIDTH;
          });
        };

        roots.forEach(root => placeNode(root.id, 0));

        setRawCreatives(creativesList);
        setNodes(initialNodes);
        setEdges(initialEdges);
      } catch (error) {
        console.error("Error loading canvas:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGraph();
  }, [productId]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-150px)] w-full rounded-xl border border-slate-200 bg-white overflow-hidden relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-50"
      >
        <Background gap={16} size={1} color="#cbd5e1" />
        <Controls />
        <MiniMap zoomable pannable nodeColor="#94a3b8" maskColor="rgba(248, 250, 252, 0.7)" />
      </ReactFlow>

      {/* Floating Header info */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-900">Creative Lineage</h3>
        <p className="text-xs text-slate-500">Drag nodes to organize. Click a node to view DNA.</p>
      </div>

      <CreativeDetailDrawer 
        creative={selectedCreative} 
        isOpen={!!selectedCreative} 
        onClose={() => setSelectedCreative(null)} 
      />
    </div>
  );
}
