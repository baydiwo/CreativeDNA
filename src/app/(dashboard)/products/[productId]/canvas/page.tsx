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
  NodeChange,
  addEdge,
  Connection
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
        const { batchesService } = await import("@/lib/services/batches.service");

        // Fetch batches, creatives, and edges concurrently
        const [batchesData, creativesSnap, edgesSnap] = await Promise.all([
          batchesService.getProductBatches(productId),
          getDocs(query(collection(db, "creatives"), where("productId", "==", productId))),
          getDocs(query(collection(db, "creativeEdges"), where("productId", "==", productId)))
        ]);

        const creativesList = creativesSnap.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date()
        } as CreativeAsset));

        // Sort batches by ascending date (oldest first)
        batchesData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];
        
        // Map explicit manual edges
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

        // Group creatives by batchId
        const batchCreativeMap = new Map<string, CreativeAsset[]>();
        batchesData.forEach(b => batchCreativeMap.set(b.id, []));
        creativesList.forEach(c => {
          if (!batchCreativeMap.has(c.batchId)) {
            batchCreativeMap.set(c.batchId, []);
          }
          batchCreativeMap.get(c.batchId)!.push(c);
        });

        const orderedBatchIds = batchesData.map(b => b.id);
        const orphanCreatives = creativesList.filter(c => !orderedBatchIds.includes(c.batchId));
        if (orphanCreatives.length > 0) orderedBatchIds.push("orphans");

        let level = 0;
        const NODE_WIDTH = 280; // slightly wider to avoid cramped labels
        const Y_SPACING = 380;

        orderedBatchIds.forEach((batchId, batchIndex) => {
          const batchCreatives = batchId === "orphans" ? orphanCreatives : batchCreativeMap.get(batchId) || [];
          
          // Sort creatives in a batch chronologically
          batchCreatives.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

          const totalWidth = batchCreatives.length * NODE_WIDTH;
          let startX = -totalWidth / 2; // Center row horizontally

          batchCreatives.forEach((creative, idx) => {
            initialNodes.push({
              id: creative.id,
              type: 'creative',
              position: { x: startX + idx * NODE_WIDTH, y: level * Y_SPACING + 100 },
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
          });

          // Auto-link winners to winners in the NEXT batch
          if (batchIndex < orderedBatchIds.length - 1) {
            const nextBatchId = orderedBatchIds[batchIndex + 1];
            const nextBatchCreatives = nextBatchId === "orphans" ? orphanCreatives : batchCreativeMap.get(nextBatchId) || [];
            
            const currentWinners = batchCreatives.filter(c => c.status === 'winner');
            const nextWinners = nextBatchCreatives.filter(c => c.status === 'winner');

            currentWinners.forEach(winner => {
              nextWinners.forEach(nextWinner => {
                // Check if a manual edge already exists
                const existingEdge = initialEdges.find(e => e.source === winner.id && e.target === nextWinner.id);
                if (!existingEdge) {
                  initialEdges.push({
                    id: `auto-e-${winner.id}-${nextWinner.id}`,
                    source: winner.id,
                    target: nextWinner.id,
                    animated: true,
                    label: "Scaled Winner",
                    style: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5,5' } // Green dashed line
                  });
                }
              });
            });
          }

          level++;
        });

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

  const onConnect = useCallback(async (params: Connection) => {
    if (!params.source || !params.target) return;
    
    // Optimistic UI update
    const newEdge: Edge = { 
      ...params, 
      id: `e-${params.source}-${params.target}`,
      animated: true,
      label: "Manual Link",
      style: { stroke: '#94a3b8', strokeWidth: 2 }
    };
    setEdges((eds) => addEdge(newEdge, eds));
    
    try {
      // Save to backend
      const { creativesService } = await import("@/lib/services/creatives.service");
      await creativesService.createEdge(params.source, params.target, "Manual Link");
    } catch (err) {
      console.error("Failed to save edge", err);
      // Revert if error
      setEdges((eds) => eds.filter(e => e.id !== newEdge.id));
    }
  }, []);

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
        onConnect={onConnect}
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
