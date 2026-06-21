import { db } from "@/lib/firebase/client";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

export interface Product {
  id: string;
  name: string;
  description: string;
  userId: string;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = "products";

export const productsService = {
  /**
   * Fetch all products for a specific user
   */
  async getUserProducts(userId: string): Promise<Product[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
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
      } as Product;
    });
  },

  /**
   * Get a single product by ID
   */
  async getProduct(productId: string): Promise<Product | null> {
    const docRef = doc(db, COLLECTION_NAME, productId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Product;
  },

  /**
   * Create a new product
   */
  async createProduct(
    userId: string,
    data: { name: string; description?: string }
  ): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name: data.name,
      description: data.description || "",
      userId,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Update an existing product
   */
  async updateProduct(
    productId: string,
    data: Partial<{ name: string; description: string; status: "active" | "archived" }>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, productId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, productId);
    await deleteDoc(docRef);
  },
};
