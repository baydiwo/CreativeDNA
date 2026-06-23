"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { CreativeAsset } from "@/lib/services/creatives.service";
import { batchesService, TestBatch } from "@/lib/services/batches.service";
import { CreativeCard } from "@/components/creatives/CreativeCard";
import { CreativeDetailDrawer } from "@/components/creatives/CreativeDetailDrawer";

export default function WinnerLibraryPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  
  const [winners, setWinners] = useState<CreativeAsset[]>([]);
  const [batches, setBatches] = useState<TestBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreative, setSelectedCreative] = useState<CreativeAsset | null>(null);

  const fetchData = async () => {
    try {
      // Fetch batches for grouping
      const productBatches = await batchesService.getProductBatches(productId);
      setBatches(productBatches);

      // Fetch winning creatives
      const q = query(
        collection(db, "creatives"),
        where("productId", "==", productId),
        where("status", "==", "winner")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
        updatedAt: d.data().updatedAt?.toDate() || new Date(),
      } as CreativeAsset));
      
      // Sort client-side to avoid composite index requirement
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setWinners(data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Group winners by batchId
  const groupedWinners = winners.reduce((acc, creative) => {
    if (!acc[creative.batchId]) {
      acc[creative.batchId] = [];
    }
    acc[creative.batchId].push(creative);
    return acc;
  }, {} as Record<string, CreativeAsset[]>);

  const exportToCSV = () => {
    const headers = ["Batch ID", "Creative Name", "Status", "Hook", "Angle", "Primary Text", "Spend", "Purchases", "Revenue", "CPA", "ROAS", "CTR"];
    
    const rows = winners.map(c => [
      c.batchId,
      `"${c.name.replace(/"/g, '""')}"`,
      c.status,
      `"${(c.metadata?.hook || "").replace(/"/g, '""')}"`,
      `"${(c.metadata?.angle || "").replace(/"/g, '""')}"`,
      `"${(c.metadata?.primaryText || "").replace(/"/g, '""')}"`,
      c.metrics?.spend || 0,
      c.metrics?.purchases || 0,
      c.metrics?.revenue || 0,
      c.metrics?.cpa || 0,
      c.metrics?.roas || 0,
      c.metrics?.ctr || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `creative_winners_${productId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/products/${productId}`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product
        </Link>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Winner Library
          </h2>
          <p className="mt-2 text-slate-500">
            All your best-performing creatives for this product, in one place.
          </p>
        </div>
        {winners.length > 0 && (
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Export CSV
          </button>
        )}
      </div>

      {winners.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
          <Trophy className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p>No winning creatives yet.</p>
          <p className="text-sm mt-1">Mark creatives as &quot;Winner&quot; during your test batches to see them here.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedWinners).map(([batchId, batchWinners]) => {
            const batch = batches.find(b => b.id === batchId);
            return (
              <div key={batchId} className="border-t border-slate-200 pt-8 first:border-0 first:pt-0">
                <div className="mb-4 flex items-baseline justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    {batch ? batch.name : `Batch: ${batchId}`}
                  </h3>
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {batchWinners.length} {batchWinners.length === 1 ? 'Winner' : 'Winners'}
                  </span>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {batchWinners.map((creative) => (
                    <div key={creative.id} onClick={() => setSelectedCreative(creative)} className="cursor-pointer h-full">
                      <CreativeCard creative={creative} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreativeDetailDrawer
        creative={selectedCreative}
        isOpen={!!selectedCreative}
        onClose={() => setSelectedCreative(null)}
        onUpdate={() => {
          fetchData();
          if (selectedCreative) {
            setSelectedCreative(winners.find(w => w.id === selectedCreative.id) || null);
          }
        }}
      />
    </div>
  );
}
