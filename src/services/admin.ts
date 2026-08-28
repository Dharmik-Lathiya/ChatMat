import {
  collection,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Conversation, Message } from "@/types";

/* ------------------------------------------------------------------ */
/* Admin — read-only visibility over all conversations.               */
/* Access is enforced by Firestore rules (role == 'admin').            */
/* ------------------------------------------------------------------ */

export function subscribeAllConversations(
  onChange: (conversations: Conversation[]) => void,
  onError: (error: unknown) => void
): () => void {
  const q = query(
    collection(db, "conversations"),
    orderBy("updatedAt", "desc"),
    limit(200)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Conversation[];
      onChange(list);
    },
    onError
  );
}

export function subscribeAllMessages(
  conversationId: string,
  visibleCount: number,
  onChange: (messages: Message[]) => void,
  onError: (error: unknown) => void
): () => void {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
    limitToLast(visibleCount)
  );
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[]
      );
    },
    onError
  );
}
