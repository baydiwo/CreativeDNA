"use client";

import { productsService } from "@/lib/services/products.service";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProductForm, ProductFormValues } from "@/components/products/ProductForm";

export default function NewProductPage() {
  const { user } = useAuth();
  const router = useRouter();

  const onSubmit = async (data: ProductFormValues) => {
    if (!user) return;
    const productId = await productsService.createProduct(user.uid, data);
    router.push(`/products/${productId}`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/products"
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Create New Product</h2>
        <ProductForm onSubmit={onSubmit} submitLabel="Create Product" />
      </div>
    </div>
  );
}
