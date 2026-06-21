"use client";

import { use, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, Loader2, X, FileImage, FileVideo } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { storageService } from "@/lib/services/storage.service";
import { batchesService } from "@/lib/services/batches.service";
import { creativesService, CreativeType } from "@/lib/services/creatives.service";

interface FileWithPreview {
  file: File;
  previewUrl: string;
  type: CreativeType;
  mutationType: string;
}

function ScaleBatchForm({ productId }: { productId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceId = searchParams.get("sourceId");
  
  const [batchName, setBatchName] = useState("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!sourceId) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-700">
        Missing source creative ID. You must create a scale batch from a winning creative.
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const selectedFiles = Array.from(e.target.files);
    const newFilesWithPreview = selectedFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" as CreativeType : "image" as CreativeType,
      mutationType: "Variation"
    }));
    
    setFiles(prev => [...prev, ...newFilesWithPreview]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].previewUrl);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateMutationType = (index: number, mutationType: string) => {
    setFiles(prev => {
      const newFiles = [...prev];
      newFiles[index].mutationType = mutationType;
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!batchName.trim()) {
      setError("Batch name is required");
      return;
    }
    if (files.length === 0) {
      setError("At least one creative asset is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create the Batch document
      const batchId = await batchesService.createBatch(productId, {
        name: batchName,
        variantsCount: files.length,
        sourceCreativeId: sourceId
      });

      // 2. Upload files and create Creative documents in parallel
      const uploadPromises = files.map(async ({ file, type, mutationType }) => {
        // Upload to Storage
        const downloadUrl = await storageService.uploadCreativeAsset(
          user.uid,
          productId,
          batchId,
          file
        );

        // Save Creative metadata to Firestore
        await creativesService.createCreative({
          batchId,
          productId,
          name: file.name,
          type,
          storageUrl: downloadUrl,
          status: "pending",
          parentCreativeId: sourceId,
          mutationType: mutationType
        });
      });

      await Promise.all(uploadPromises);

      // 3. Mark Batch as active
      await batchesService.updateBatchStatus(batchId, "active");

      // Navigate back to product detail page
      router.push(`/products/${productId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create scale batch");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-slate-700">Batch Name</label>
        <input
          type="text"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
          placeholder="e.g., Summer Hook Iteration Batch"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Upload Derived Creatives</label>
        
        <div 
          className="flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-10 hover:bg-slate-50 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
            <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
              <span className="relative rounded-md font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                Upload files
              </span>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs leading-5 text-slate-500">PNG, JPG, MP4 up to 50MB</p>
          </div>
        </div>
        
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        {files.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-900 mb-3">Selected Mutations ({files.length})</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {files.map((fileObj, index) => (
                <div key={index} className="relative group rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -right-2 -top-2 z-10 hidden rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200 group-hover:block"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="aspect-video w-full overflow-hidden rounded-md bg-slate-100 flex items-center justify-center relative mb-3">
                    {fileObj.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fileObj.previewUrl} alt={fileObj.file.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <FileVideo className="h-8 w-8 mb-1" />
                        <span className="text-xs">Video</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto">
                    <p className="truncate text-xs font-medium text-slate-900 mb-2" title={fileObj.file.name}>
                      {fileObj.file.name}
                    </p>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Mutation Type</label>
                    <select
                      value={fileObj.mutationType}
                      onChange={(e) => updateMutationType(index, e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="New Hook, Same Visual">New Hook, Same Visual</option>
                      <option value="Same Hook, New Visual">Same Hook, New Visual</option>
                      <option value="Format Change">Format Change (e.g. Image to Video)</option>
                      <option value="Variation">General Variation</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={loading || files.length === 0 || !batchName.trim()}
          className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Scaling..." : "Create Scale Batch"}
        </button>
      </div>
    </form>
  );
}

export default function ScaleBatchPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/products/${productId}`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Scale Batch</h2>
        <p className="text-slate-500 mb-8">
          Upload new variations derived from the winning creative. This will automatically track the lineage.
        </p>

        <Suspense fallback={<div>Loading form...</div>}>
          <ScaleBatchForm productId={productId} />
        </Suspense>
      </div>
    </div>
  );
}
