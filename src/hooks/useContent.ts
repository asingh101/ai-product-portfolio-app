"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

function stripUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return obj;
}

export function useContent<T extends object>(pageId: string, initialData: T) {
  const [content, setContent] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const isSyncingFromRemote = useRef(false);

  const initialDataRef = useRef(initialData);
  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "site_content", pageId),
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as T;
          if (!isSyncingFromRemote.current) {
            setContent((prev) => ({ ...initialDataRef.current, ...prev, ...remoteData }));
          }
        } else if (!isSyncingFromRemote.current) {
          setContent(initialDataRef.current);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`[useContent] site_content/${pageId} listener:`, err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [pageId]);

  /** Updates only the local state */
  const setLocalContent = useCallback((newData: Partial<T>) => {
    setContent((prev) => ({ ...prev, ...newData }));
  }, []);

  /** Pushes the current local state to Firestore */
  const saveToFirestore = useCallback(async (dataToPersist?: T) => {
    isSyncingFromRemote.current = true;
    try {
      const data = stripUndefined(dataToPersist || content);
      await setDoc(doc(db, "site_content", pageId), data, { merge: true });
    } catch (err) {
      console.error(`Failed to save content for ${pageId}:`, err);
      throw err;
    } finally {
      // Small delay to let onSnapshot catch up if needed
      setTimeout(() => {
        isSyncingFromRemote.current = false;
      }, 1000);
    }
  }, [pageId, content]);

  return { content, loading, setLocalContent, saveToFirestore };
}
