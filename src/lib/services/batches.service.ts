import { db } from "@/lib/firebase/client";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export interface TestBatch {
  id: string;
  productId: string;
  name: string;
  status: "draft" | "active" | "completed";
  variantsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const batchesService = {
  /**
   * Fetch all test batches for a given product
   */
  async getProductBatches(productId: string): Promise<TestBatch[]> {
    const q = query(
      collection(db, "testBatches"),
      where("productId", "==", productId),
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
      } as TestBatch;
    });
  },

  /**
   * Create a new test batch
   */
  async createBatch(productId: string, data: { name: string; variantsCount: number; sourceCreativeId?: string }): Promise<string> {
    const payload: any = {
      productId,
      name: data.name,
      status: "draft",
      variantsCount: data.variantsCount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (data.sourceCreativeId) {
      payload.sourceCreativeId = data.sourceCreativeId;
    }
    const docRef = await addDoc(collection(db, "testBatches"), payload);
    return docRef.id;
  },

  /**
   * Get a single test batch by ID
   */
  async getBatch(batchId: string): Promise<TestBatch | null> {
    const docRef = doc(db, "testBatches", batchId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as TestBatch;
  },

  /**
   * Update the status of a test batch
   */
  async updateBatchStatus(batchId: string, status: "draft" | "active" | "completed"): Promise<void> {
    const docRef = doc(db, "testBatches", batchId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Duplicate a batch and all its creatives
   */
  async duplicateBatch(batchId: string): Promise<string> {
    const batch = await this.getBatch(batchId);
    if (!batch) throw new Error("Batch not found");

    // 1. Create the new batch
    const newBatchRef = await addDoc(collection(db, "testBatches"), {
      productId: batch.productId,
      name: `${batch.name} (Copy)`,
      status: "active",
      variantsCount: batch.variantsCount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const newBatchId = newBatchRef.id;

    // 2. Fetch original creatives
    const q = query(
      collection(db, "creatives"),
      where("batchId", "==", batchId)
    );
    const creativesSnap = await getDocs(q);

    // 3. Clone creatives
    const promises = creativesSnap.docs.map(creativeDoc => {
      const data = creativeDoc.data();
      const payload: any = {
        batchId: newBatchId,
        productId: batch.productId,
        name: data.name,
        type: data.type,
        storageUrl: data.storageUrl || "",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      if (data.metadata) {
        payload.metadata = data.metadata;
      }
      // Note: we don't copy metrics and we set status to pending

      return addDoc(collection(db, "creatives"), payload);
    });

    await Promise.all(promises);

    return newBatchId;
  }
};
