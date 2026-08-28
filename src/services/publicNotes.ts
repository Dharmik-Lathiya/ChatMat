import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface PublicNote {
  slug: string;
  title?: string;
  content: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

const col = "publicNotes";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 60);
}

/** Get a public note by slug. Returns null if not found. */
export async function getPublicNote(slug: string): Promise<PublicNote | null> {
  const clean = slugify(slug);
  if (!clean) return null;
  const snap = await getDoc(doc(db, col, clean));
  if (!snap.exists()) return null;
  return { slug: snap.id, ...snap.data() } as PublicNote;
}

/** Create or update a public note. */
export async function savePublicNote(
  slug: string,
  content: string
): Promise<void> {
  const clean = slugify(slug);
  if (!clean) return;
  const ref = doc(db, col, clean);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, { content, updatedAt: serverTimestamp() }, { merge: true });
  }
}

/** Check if a slug is already taken. */
export async function slugExists(slug: string): Promise<boolean> {
  const clean = slugify(slug);
  if (!clean) return false;
  const snap = await getDoc(doc(db, col, clean));
  return snap.exists();
}

export { slugify };

/** Realtime list of all public notes (newest first). */
export function subscribePublicNotes(
  onChange: (notes: PublicNote[]) => void,
  onError: (error: unknown) => void
): () => void {
  const q = query(
    collection(db, col),
    orderBy("updatedAt", "desc"),
    limit(200)
  );
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => ({ slug: d.id, ...d.data() })) as PublicNote[]
      );
    },
    onError
  );
}
