"use client";

import Link from "next/link";
import { Plus, Loader2, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { productsService, Product } from "@/lib/services/products.service";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    productsService.getUserProducts(user.uid)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Products</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your products and their creative test batches.
          </p>
        </div>
        <Link
          href="/products/new"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No products found</h3>
          <p className="mt-2 text-sm text-slate-500">
            Get started by creating your first product.
          </p>
          <div className="mt-6">
            <Link
              href="/products/new"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group block rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                  {product.name}
                </h3>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  product.status === "active" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"
                }`}>
                  {product.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                {product.description || "No description provided."}
              </p>
              <div className="mt-4 text-xs text-slate-400">
                Created {new Date(product.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
