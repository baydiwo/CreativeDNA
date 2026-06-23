import { db } from "@/lib/firebase/client";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export type CreativeType = "image" | "video";
export type CreativeStatus = "pending" | "winner" | "loser";

export interface CreativeMetrics {
  spend?: number;
  impressions?: number;
  clicks?: number;
  purchases?: number;
  revenue?: number;
  
  // Auto-calculated fields
  cpa?: number;
  roas?: number;
  ctr?: number;
}

export interface CreativeAsset {
  id: string;
  batchId: string;
  productId: string;
  name: string;
  type: CreativeType;
  storageUrl?: string;
  status: "pending" | "winner" | "loser";
  
  // Lineage Tracking
  parentCreativeId?: string;
  mutationType?: string; // e.g., "New Hook", "Different Visual"
  
  // Creative DNA
  metadata?: {
    hook?: string;
    angle?: string;
    primaryText?: string;
    headline?: string;
    visualNotes?: string;
  };
  
  // Optional Performance Metrics
  metrics?: CreativeMetrics;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreativeEdge {
  id: string;
  sourceAssetId: string;
  targetAssetId: string;
  mutationType: string;
  createdAt: Date;
}

export const creativesService = {
  /**
   * Fetch all creatives for a given test batch
   */
  async getBatchCreatives(batchId: string): Promise<CreativeAsset[]> {
    const q = query(
      collection(db, "creatives"),
      where("batchId", "==", batchId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as CreativeAsset;
    });
  },

  /**
   * Create a new creative asset document
   */
  async createCreative(data: Omit<CreativeAsset, "id" | "createdAt" | "updatedAt"> & { parentCreativeId?: string, mutationType?: string }): Promise<string> {
    const payload: any = {
      batchId: data.batchId,
      productId: data.productId,
      name: data.name,
      type: data.type,
      storageUrl: data.storageUrl,
      status: data.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (data.metadata) payload.metadata = data.metadata;
    if (data.parentCreativeId) payload.parentCreativeId = data.parentCreativeId;

    const docRef = await addDoc(collection(db, "creatives"), payload);
    
    // Automatically create edge if this is a child
    if (data.parentCreativeId) {
      await this.createEdge(data.parentCreativeId, docRef.id, data.mutationType || "Variation");
    }

    return docRef.id;
  },

  /**
   * Update a creative's status
   */
  async updateCreativeStatus(creativeId: string, status: CreativeStatus): Promise<void> {
    const docRef = doc(db, "creatives", creativeId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Create an edge (mutation) between two creatives to track lineage
   */
  async createEdge(sourceAssetId: string, targetAssetId: string, mutationType: string): Promise<string> {
    const docRef = await addDoc(collection(db, "creativeEdges"), {
      sourceAssetId,
      targetAssetId,
      mutationType,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Fetch all edges originating from or pointing to a batch of creatives
   * We will keep it simple and just fetch all edges. In a real app we might query by array of IDs
   */
  async getAllEdges(): Promise<CreativeEdge[]> {
    const snapshot = await getDocs(collection(db, "creativeEdges"));
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as CreativeEdge;
    });
  },

  /**
   * Update creative metrics
   */
  async updateCreativeMetrics(creativeId: string, metricsInput: Partial<CreativeMetrics>): Promise<void> {
    const docRef = doc(db, "creatives", creativeId);
    
    // Auto-calculate CPA (Spend / Purchases)
    let cpa = undefined;
    if (metricsInput.spend && metricsInput.purchases && metricsInput.purchases > 0) {
      cpa = Number((metricsInput.spend / metricsInput.purchases).toFixed(2));
    }
    
    // Auto-calculate ROAS (Revenue / Spend)
    let roas = undefined;
    if (metricsInput.revenue && metricsInput.spend && metricsInput.spend > 0) {
      roas = Number((metricsInput.revenue / metricsInput.spend).toFixed(2));
    }

    // Auto-calculate CTR (Clicks / Impressions)
    let ctr = undefined;
    if (metricsInput.clicks && metricsInput.impressions && metricsInput.impressions > 0) {
      ctr = Number(((metricsInput.clicks / metricsInput.impressions) * 100).toFixed(2));
    }

    const metrics: CreativeMetrics = {
      ...metricsInput,
      ...(cpa !== undefined && { cpa }),
      ...(roas !== undefined && { roas }),
      ...(ctr !== undefined && { ctr }),
    };

    await updateDoc(docRef, {
      metrics,
      updatedAt: serverTimestamp(),
    });
  }
};
