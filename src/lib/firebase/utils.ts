import { clientDB } from "./client";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";

/**
 * Cleanly fetches a single document and handles the "exists" check.
 */
export async function getDocument<T>(
  path: string,
  id: string,
): Promise<T | null> {
  const docRef = doc(clientDB, path, id);
  const snap = await getDoc(docRef);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

/**
 * Deep merges data into a document or creates it if it doesn't exist.
 */
export async function setDocument(path: string, id: string, data: any) {
  const docRef = doc(clientDB, path, id);
  return await setDoc(docRef, data, { merge: true });
}

/**
 * Updates or sets a document with an initial timestamp if missing.
 */
export async function updateOrSet(path: string, id: string, data: any) {
  const docRef = doc(clientDB, path, id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return await updateDoc(docRef, data);
  } else {
    return await setDoc(docRef, { ...data, createdAt: Date.now() });
  }
}
