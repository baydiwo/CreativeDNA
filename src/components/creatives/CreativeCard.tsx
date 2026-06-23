import { CreativeAsset } from "@/lib/services/creatives.service";
import { FileVideo, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

interface CreativeCardProps {
  creative: CreativeAsset;
  onStatusChange?: (id: string, status: "pending" | "winner" | "loser") => void;
}

export function CreativeCard({ creative, onStatusChange }: CreativeCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="relative aspect-[3/4] w-full bg-slate-100 overflow-hidden">
        {creative.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creative.storageUrl}
            alt={creative.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
            <FileVideo className="h-12 w-12 mb-2" />
            <span className="text-sm">Video Asset</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shadow-sm ${
            creative.status === "winner" ? "bg-green-100 text-green-800 border border-green-200" :
            creative.status === "loser" ? "bg-red-100 text-red-800 border border-red-200" :
            "bg-yellow-100 text-yellow-800 border border-yellow-200"
          }`}>
            {creative.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900">
            {creative.type === "image" ? <ImageIcon className="h-4 w-4 text-slate-400" /> : <FileVideo className="h-4 w-4 text-slate-400" />}
            <h3 className="truncate font-semibold text-sm" title={creative.name}>
              {creative.name}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(creative.createdAt).toLocaleDateString()}
          </p>
        </div>

        {creative.metrics && Object.keys(creative.metrics).length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            <div>
              <span className="text-slate-500">Spend:</span>{" "}
              <span className="font-semibold text-slate-900">${creative.metrics.spend?.toLocaleString() || "0"}</span>
            </div>
            <div>
              <span className="text-slate-500">CPA:</span>{" "}
              <span className="font-semibold text-blue-700">${creative.metrics.cpa || "-"}</span>
            </div>
            <div>
              <span className="text-slate-500">ROAS:</span>{" "}
              <span className="font-semibold text-green-700">{creative.metrics.roas || "-"}x</span>
            </div>
          </div>
        )}

        {onStatusChange && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
            <select
              value={creative.status}
              onChange={(e) => onStatusChange(creative.id, e.target.value as any)}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
            >
              <option value="pending">Pending</option>
              <option value="winner">Winner</option>
              <option value="loser">Loser</option>
            </select>
          </div>
        )}

        {creative.status === "winner" && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <Link
              href={`/products/${creative.productId}/batches/scale?sourceId=${creative.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Create Scale Batch
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
