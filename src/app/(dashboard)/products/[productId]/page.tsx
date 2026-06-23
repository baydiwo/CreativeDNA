"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Loader2, Beaker } from "lucide-react";
import { productsService, Product } from "@/lib/services/products.service";
import { batchesService, TestBatch } from "@/lib/services/batches.service";
import { useRouter } from "next/navigation";

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [batches, setBatches] = useState<TestBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      productsService.getProduct(productId),
      batchesService.getProductBatches(productId)
    ])
      .then(([productData, batchesData]) => {
        if (!productData) {
          setError("Product not found");
        } else {
          setProduct(productData);
          setBatches(batchesData);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await productsService.deleteProduct(productId);
        router.push("/products");
      } catch (err: any) {
        alert(err.message || "Failed to delete product");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p>{error || "Product not found"}</p>
          <Link href="/products" className="mt-4 inline-block font-medium hover:underline">
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/products"
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <div className="flex items-center gap-3">
          <Link 
            href={`/products/${productId}/edit`}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{product.name}</h2>
            <p className="mt-2 text-sm text-slate-500">
              Product ID: <span className="font-mono">{productId}</span>
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            product.status === "active" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
          }`}>
            {product.status}
          </span>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8">
          <h3 className="text-lg font-medium text-slate-900">Description</h3>
          <p className="mt-2 text-slate-600 whitespace-pre-wrap">
            {product.description || "No description provided."}
          </p>
          <div className="mt-6 text-xs text-slate-400">
            Created: {new Date(product.createdAt).toLocaleString()} <br />
            Last Updated: {new Date(product.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">Creative Test Batches</h3>
          <div className="flex gap-3">
            <Link 
              href={`/products/${productId}/winners`}
              className="flex items-center justify-center rounded-md border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
            >
              Winner Library
            </Link>
            <Link 
              href={`/products/${productId}/canvas`}
              className="flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View Lineage Canvas
            </Link>
            <Link 
              href={`/products/${productId}/batches/new`}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              New Test Batch
            </Link>
          </div>
        </div>
        
        {batches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            <Beaker className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p>No test batches yet. Create one to start testing your creatives.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch) => (
              <Link
                key={batch.id}
                href={`/products/${productId}/batches/${batch.id}`}
                className="group block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                    {batch.name}
                  </h4>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    batch.status === "active" ? "bg-blue-100 text-blue-800" : 
                    batch.status === "completed" ? "bg-green-100 text-green-800" :
                    "bg-slate-100 text-slate-800"
                  }`}>
                    {batch.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>{batch.variantsCount} variants</span>
                  <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
