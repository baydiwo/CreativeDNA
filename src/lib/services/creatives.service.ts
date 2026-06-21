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

export interface CreativeAsset {
  id: string;
  batchId: string;
  productId: string;
  name: string;
  type: CreativeType;
  storageUrl: string;
  status: CreativeStatus;
  metadata?: Record<string, any>;
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
  }
};
