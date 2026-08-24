import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Note } from "@/types";

const notesCol = (uid: string) => collection(db, "users", uid, "notes");

/** Realtime list of a user's notes, newest-updated first. */
export function subscribeNotes(
  uid: string,
  onChange: (notes: Note[]) => void,
  onError: (error: unknown) => void
): () => void {
  const q = query(notesCol(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Note[]);
    },
    onError
  );
}

export async function createNote(uid: string): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(notesCol(uid), {
    title: "",
    content: "",
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateNote(
  uid: string,
  noteId: string,
  patch: Partial<Pick<Note, "title" | "content" | "pinned" | "archived">>
): Promise<void> {
  const cleanPatch: Record<string, unknown> = { ...patch, updatedAt: Date.now() };
  if (cleanPatch.title !== undefined) {
    cleanPatch.title = String(cleanPatch.title).slice(0, 200);
  }
  if (cleanPatch.content !== undefined) {
    cleanPatch.content = String(cleanPatch.content).slice(0, 100_000);
  }
  await updateDoc(doc(db, "users", uid, "notes", noteId), cleanPatch);
}

export async function deleteNote(uid: string, noteId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "notes", noteId));
}

export async function countNotes(uid: string): Promise<number> {
  const snap = await getCountFromServer(query(notesCol(uid)));
  return snap.data().count;
}

/**
 * Share a note: creates a copy in the sharedNotes collection
 * that anyone with the link can view.
 */
import { getDoc } from "firebase/firestore";

export async function shareNote(
  uid: string,
  noteId: string
): Promise<string> {
  const noteSnap = await getDoc(doc(db, "users", uid, "notes", noteId));
  if (!noteSnap.exists()) throw new Error("Note not found");
  const data = noteSnap.data();
  const ref = await addDoc(collection(db, "sharedNotes"), {
    title: data.title || "",
    content: data.content || "",
    ownerUid: uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}
