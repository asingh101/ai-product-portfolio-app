import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

/**
 * Uploads a file to Firebase Storage and returns the public download URL.
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

/** Backwards-compatible alias (historically used for images only). */
export async function uploadImage(file: File, path: string): Promise<string> {
  return uploadFile(file, path);
}

/**
 * Uploads multiple files in parallel and returns their download URLs.
 */
export async function uploadImages(
  files: File[],
  basePath: string
): Promise<string[]> {
  return Promise.all(
    files.map((file) => {
      const path = `${basePath}/${Date.now()}_${file.name}`;
      return uploadFile(file, path);
    })
  );
}

/**
 * Deletes a file from Firebase Storage by its full storage path.
 */
export async function deleteStorageFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch {
    // Ignore if file doesn't exist
  }
}
