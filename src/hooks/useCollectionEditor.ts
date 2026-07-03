"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export interface CollectionItem {
  id: string;
  [key: string]: any;
}

interface UseCollectionEditorOptions {
  orderField?: string;
  orderDirection?: "asc" | "desc";
}

export function useCollectionEditor<T extends CollectionItem>(
  collectionName: string,
  options: UseCollectionEditorOptions = {}
) {
  const { orderField = "sortOrder", orderDirection = "asc" } = options;
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, collectionName);
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const docs = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as T))
          .sort((a: any, b: any) => {
            const aVal = a[orderField] ?? 0;
            const bVal = b[orderField] ?? 0;
            return orderDirection === "asc" ? aVal - bVal : bVal - aVal;
          });
        setItems(docs);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [collectionName, orderField, orderDirection]);

  const saveItem = useCallback(
    async (id: string, data: Partial<T>) => {
      const docRef = doc(db, collectionName, id);
      const existing = items.find((i) => i.id === id);
      const payload = {
        ...data,
        updatedAt: serverTimestamp(),
        ...(existing ? {} : { createdAt: serverTimestamp() }),
      };
      delete (payload as any).id;
      await setDoc(docRef, payload, { merge: true });
    },
    [collectionName, items]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await deleteDoc(doc(db, collectionName, id));
    },
    [collectionName]
  );

  const createItem = useCallback(
    async (id: string, data: Omit<T, "id">) => {
      const docRef = doc(db, collectionName, id);
      await setDoc(docRef, {
        ...data,
        sortOrder: items.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return id;
    },
    [collectionName, items.length]
  );

  return { items, loading, saveItem, deleteItem, createItem };
}
