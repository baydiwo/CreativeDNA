import { X } from "lucide-react";
import { CreativeAsset } from "@/lib/services/creatives.service";

interface CreativeDetailDrawerProps {
  creative: CreativeAsset | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CreativeDetailDrawer({ creative, isOpen, onClose }: CreativeDetailDrawerProps) {
  if (!isOpen || !creative) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col border-l border-slate-200 transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 truncate" title={creative.name}>
            {creative.name}
          </h2>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Media Preview */}
          <div className="aspect-video w-full bg-slate-100 flex items-center justify-center border-b border-slate-200">
            {creative.type === "image" && creative.storageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creative.storageUrl} alt={creative.name} className="h-full w-full object-cover" />
            ) : (
              <div className="text-slate-400 font-medium">Video Asset</div>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Status Section */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Status & Tracking</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Status</div>
                  <div className="font-medium capitalize text-slate-900">{creative.status}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Format</div>
                  <div className="font-medium capitalize text-slate-900">{creative.type}</div>
                </div>
              </div>
            </section>

            {/* Creative DNA Section */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Creative DNA</h3>
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Hook</div>
                  <div className="text-sm text-slate-900 whitespace-pre-wrap">{creative.metadata?.hook || "No hook provided"}</div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Angle</div>
                  <div className="text-sm text-slate-900 whitespace-pre-wrap">{creative.metadata?.angle || "No angle provided"}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Primary Text</div>
                  <div className="text-sm text-slate-900 whitespace-pre-wrap">{creative.metadata?.primaryText || "No primary text provided"}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Visual Prompt / Notes</div>
                  <div className="text-sm text-slate-900 whitespace-pre-wrap">{creative.metadata?.visualNotes || "No visual notes provided"}</div>
                </div>
              </div>
            </section>

            {/* Metrics Section (Placeholder for future sprint) */}
            <section>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Metrics</h3>
              <div className="rounded-md border border-slate-200 border-dashed p-6 flex flex-col items-center justify-center text-center bg-slate-50">
                <span className="text-sm text-slate-500">Metrics tracking will be available in the next sprint</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
