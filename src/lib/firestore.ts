import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Generic get single document
export async function getDocument<T = DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T;
}

// Generic get collection with optional query constraints
export async function getCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

// Generic create document
export async function createDocument(
  collectionName: string,
  data: DocumentData
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Generic update document
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Generic delete document
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

// Set document with merge
export async function setDocument(
  collectionName: string,
  docId: string,
  data: DocumentData,
  merge = true
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge });
}

// Increment a field
export async function incrementField(
  collectionName: string,
  docId: string,
  field: string,
  value = 1
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { [field]: increment(value) });
}

// Convenience: get published posts (ordered by date)
export async function getPublishedPosts<T = DocumentData>(
  limitCount = 10
): Promise<T[]> {
  return getCollection<T>("posts", [
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
    limit(limitCount),
  ]);
}

// Convenience: get published projects
export async function getPublishedProjects<T = DocumentData>(): Promise<T[]> {
  return getCollection<T>("projects", [
    where("status", "==", "published"),
    orderBy("publishedAt", "desc"),
  ]);
}
