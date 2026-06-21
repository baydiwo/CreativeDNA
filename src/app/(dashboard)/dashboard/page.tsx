"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            Welcome to Creative DNA. Track your ad creatives and variants.
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder Stats */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Total Products</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Active Creatives</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Recent Tests</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
        </div>
      </div>
    </div>
  );
}
