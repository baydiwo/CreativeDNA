import { useState, useEffect } from "react";
import { X, Save, Edit2, Loader2 } from "lucide-react";
import { CreativeAsset, creativesService, CreativeMetrics } from "@/lib/services/creatives.service";

interface CreativeDetailDrawerProps {
  creative: CreativeAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function CreativeDetailDrawer({ creative, isOpen, onClose, onUpdate }: CreativeDetailDrawerProps) {
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [metricsForm, setMetricsForm] = useState<Partial<CreativeMetrics>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (creative?.metrics) {
      setMetricsForm(creative.metrics);
    } else {
      setMetricsForm({});
    }
    setIsEditingMetrics(false);
  }, [creative]);

  if (!isOpen || !creative) return null;

  const handleSaveMetrics = async () => {
    setSaving(true);
    try {
      // Clean up empty strings
      const cleanedMetrics: any = {};
      Object.entries(metricsForm).forEach(([key, value]) => {
        if (String(value) !== "" && value !== undefined && !isNaN(Number(value))) {
          cleanedMetrics[key] = Number(value);
        }
      });
      
      await creativesService.updateCreativeMetrics(creative.id, cleanedMetrics);
      setIsEditingMetrics(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to save metrics", error);
      alert("Failed to save metrics");
    } finally {
      setSaving(false);
    }
  };

  const hasMetrics = creative.metrics && Object.keys(creative.metrics).length > 0;

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
          <div className="aspect-[3/4] w-full bg-slate-100 flex items-center justify-center border-b border-slate-200 relative group">
            {creative.type === "image" && creative.storageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creative.storageUrl} alt={creative.name} className="h-full w-full object-cover" />
            ) : creative.type === "video" && creative.storageUrl ? (
              <video src={creative.storageUrl} controls className="h-full w-full object-cover" />
            ) : (
              <div className="text-slate-400 font-medium capitalize">{creative.type} Asset</div>
            )}
          </div>

          <div className="p-6 space-y-8">
            {/* Status Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status & Tracking</h3>
                <button
                  onClick={async () => {
                    if (!confirm("Duplicate this creative?")) return;
                    try {
                      await creativesService.createCreative({
                        batchId: creative.batchId,
                        productId: creative.productId,
                        name: `${creative.name} (Copy)`,
                        type: creative.type,
                        storageUrl: creative.storageUrl || "",
                        status: "pending",
                        ...(creative.metadata && { metadata: creative.metadata })
                      });
                      alert("Creative duplicated successfully! Refresh to see it in the batch.");
                      if (onUpdate) onUpdate();
                    } catch (e) {
                      alert("Failed to duplicate creative");
                    }
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  Duplicate
                </button>
              </div>
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

            {/* Metrics Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance Metrics</h3>
                {!isEditingMetrics && (
                  <button 
                    onClick={() => setIsEditingMetrics(true)}
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    {hasMetrics ? "Edit Metrics" : "Add Metrics"}
                  </button>
                )}
              </div>
              
              {isEditingMetrics ? (
                <div className="bg-white rounded-md border border-blue-100 p-4 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Spend ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={metricsForm.spend || ""}
                        onChange={(e) => setMetricsForm(prev => ({ ...prev, spend: parseFloat(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Revenue ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={metricsForm.revenue || ""}
                        onChange={(e) => setMetricsForm(prev => ({ ...prev, revenue: parseFloat(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Purchases</label>
                      <input 
                        type="number" 
                        value={metricsForm.purchases || ""}
                        onChange={(e) => setMetricsForm(prev => ({ ...prev, purchases: parseInt(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Impressions</label>
                      <input 
                        type="number" 
                        value={metricsForm.impressions || ""}
                        onChange={(e) => setMetricsForm(prev => ({ ...prev, impressions: parseInt(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Clicks</label>
                      <input 
                        type="number" 
                        value={metricsForm.clicks || ""}
                        onChange={(e) => setMetricsForm(prev => ({ ...prev, clicks: parseInt(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setIsEditingMetrics(false);
                        setMetricsForm(creative.metrics || {});
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveMetrics}
                      disabled={saving}
                      className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : hasMetrics ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Spend</div>
                    <div className="font-semibold text-slate-900">${creative.metrics?.spend?.toLocaleString() || "0"}</div>
                  </div>
                  <div className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Purchases</div>
                    <div className="font-semibold text-slate-900">{creative.metrics?.purchases?.toLocaleString() || "0"}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                    <div className="text-xs text-blue-600 font-medium mb-1">CPA</div>
                    <div className="font-bold text-blue-900">${creative.metrics?.cpa || "0"}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md border border-green-100">
                    <div className="text-xs text-green-600 font-medium mb-1">ROAS</div>
                    <div className="font-bold text-green-900">{creative.metrics?.roas || "0"}x</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">CTR</div>
                    <div className="font-medium text-slate-900">{creative.metrics?.ctr || "0"}%</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-slate-200 border-dashed p-6 flex flex-col items-center justify-center text-center bg-slate-50">
                  <span className="text-sm text-slate-500 mb-2">No metrics recorded yet</span>
                  <button 
                    onClick={() => setIsEditingMetrics(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Add manual metrics (Optional)
                  </button>
                </div>
              )}
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
          </div>
        </div>
      </div>
    </>
  );
}
