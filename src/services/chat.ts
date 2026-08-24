import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Conversation, LastMessage, Message } from "@/types";

const conversationsCol = () => collection(db, "conversations");
const messagesCol = (conversationId: string) =>
  collection(db, "conversations", conversationId, "messages");

export function directConversationId(a: string, b: string): string {
  return ["dm", ...[a, b].sort()].join("_");
}

/* ------------------------------------------------------------------ */
/* Conversations                                                       */
/* ------------------------------------------------------------------ */

export function subscribeConversations(
  uid: string,
  onChange: (conversations: Conversation[]) => void,
  onError: (error: unknown) => void
): () => void {
  const q = query(
    conversationsCol(),
    where("participantIds", "array-contains", uid),
    orderBy("updatedAt", "desc"),
    limit(30)
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

export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const snap = await getDoc(doc(db, "conversations", conversationId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Conversation) : null;
}

/** Find or create the deterministic direct conversation between two users. */
export async function openDirectConversation(
  meUid: string,
  otherUid: string
): Promise<string> {
  const id = directConversationId(meUid, otherUid);
  const ref = doc(db, "conversations", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      type: "direct",
      participantIds: [meUid, otherUid].sort(),
      readAt: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  return id;
}

export async function createGroupConversation(
  name: string,
  memberUids: string[]
): Promise<string> {
  const ref = doc(conversationsCol());
  await setDoc(ref, {
    type: "group",
    name: name.trim(),
    participantIds: memberUids.sort(),
    readAt: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return ref.id;
}

export async function renameGroup(
  conversationId: string,
  name: string
): Promise<void> {
  await updateDoc(doc(db, "conversations", conversationId), {
    name: name.trim(),
    updatedAt: Date.now(),
  });
}

export async function markConversationRead(
  conversationId: string,
  uid: string,
  lastMessageAtMs: number | undefined
): Promise<void> {
  if (!lastMessageAtMs) return;
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as Conversation;
  if ((data.readAt?.[uid] ?? 0) >= lastMessageAtMs) return;
  await updateDoc(ref, { [`readAt.${uid}`]: lastMessageAtMs });
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

/**
 * Realtime listener over the latest `visibleCount` messages in ascending
 * order. Raising visibleCount loads older pages; Firestore fetches only
 * the delta.
 */
export function subscribeMessages(
  conversationId: string,
  visibleCount: number,
  onChange: (messages: Message[]) => void,
  onError: (error: unknown) => void
): () => void {
  const q = query(
    messagesCol(conversationId),
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

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  text: string;
  file?: {
    url: string;
    name: string;
    size: number;
    type: string;
  };
}

export async function sendMessage(input: SendMessageInput): Promise<void> {
  const { conversationId, senderId } = input;

  const message: Record<string, unknown> = {
    senderId,
    text: input.text.slice(0, 4000),
    deleted: false,
    edited: false,
    createdAt: serverTimestamp(),
  };
  if (input.file) {
    message.file = input.file;
  }

  // Local preview timestamp so the conversation list can sort immediately;
  // the authoritative value is written by updatedAt below.
  const nowMs = Date.now();
  const lastMessage: LastMessage = {
    text: input.text || (input.file ? input.file.name : ""),
    senderId,
    at: nowMs,
  };

  await addDoc(messagesCol(conversationId), message);
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage,
    updatedAt: nowMs,
  });
}

export async function editMessage(
  conversationId: string,
  messageId: string,
  text: string
): Promise<void> {
  await updateDoc(doc(db, "conversations", conversationId, "messages", messageId), {
    text: text.slice(0, 4000),
    edited: true,
    editedAt: Date.now(),
  });
}

export async function deleteMessage(
  conversationId: string,
  messageId: string
): Promise<void> {
  await deleteDoc(
    doc(db, "conversations", conversationId, "messages", messageId)
  );
}

export function messageTime(msLike?: Timestamp | number | null): number {
  if (!msLike) return 0;
  if (msLike instanceof Timestamp) return msLike.toMillis();
  if (typeof msLike === "number") return msLike;
  return 0;
}
