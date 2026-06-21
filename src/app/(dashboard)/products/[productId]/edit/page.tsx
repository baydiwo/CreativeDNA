"use client";

import { use, useEffect, useState } from "react";
import { productsService, Product } from "@/lib/services/products.service";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ProductForm, ProductFormValues } from "@/components/products/ProductForm";

export default function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    productsService.getProduct(productId)
      .then((data) => {
        if (!data) {
          setError("Product not found");
        } else {
          setProduct(data);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId]);

  const onSubmit = async (data: ProductFormValues) => {
    await productsService.updateProduct(productId, data);
    router.push(`/products/${productId}`);
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
      <div className="mx-auto max-w-3xl">
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/products/${productId}`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit Product</h2>
        <ProductForm 
          defaultValues={{ name: product.name, description: product.description }} 
          onSubmit={onSubmit} 
          submitLabel="Save Changes" 
        />
      </div>
    </div>
  );
}
