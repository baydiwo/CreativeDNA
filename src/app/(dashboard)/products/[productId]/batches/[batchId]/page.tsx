"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { batchesService, TestBatch } from "@/lib/services/batches.service";
import { creativesService, CreativeAsset, CreativeStatus } from "@/lib/services/creatives.service";
import { CreativeCard } from "@/components/creatives/CreativeCard";

export default function BatchDetailPage({ params }: { params: Promise<{ productId: string, batchId: string }> }) {
  const { productId, batchId } = use(params);
  
  const [batch, setBatch] = useState<TestBatch | null>(null);
  const [creatives, setCreatives] = useState<CreativeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      batchesService.getBatch(batchId),
      creativesService.getBatchCreatives(batchId)
    ])
      .then(([batchData, creativesData]) => {
        if (!batchData) {
          setError("Test batch not found");
        } else {
          setBatch(batchData);
          setCreatives(creativesData);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [batchId]);

  const handleStatusChange = async (creativeId: string, status: CreativeStatus) => {
    try {
      await creativesService.updateCreativeStatus(creativeId, status);
      setCreatives(prev => prev.map(c => c.id === creativeId ? { ...c, status } : c));
    } catch (err: any) {
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p>{error || "Batch not found"}</p>
          <Link href={`/products/${productId}`} className="mt-4 inline-block font-medium hover:underline">
            Return to Product
          </Link>
        </div>
      </div>
    );
  }

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

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{batch.name}</h2>
            <p className="mt-2 text-sm text-slate-500">
              Batch ID: <span className="font-mono">{batchId}</span>
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            batch.status === "active" ? "bg-blue-100 text-blue-800" : 
            batch.status === "completed" ? "bg-green-100 text-green-800" :
            "bg-slate-100 text-slate-800"
          }`}>
            {batch.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-6">Creatives in this Batch ({creatives.length})</h3>
        
        {creatives.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            No creatives found in this batch.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creatives.map((creative) => (
              <CreativeCard 
                key={creative.id} 
                creative={creative} 
                onStatusChange={handleStatusChange} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
