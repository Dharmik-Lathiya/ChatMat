import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { auth } from "@/lib/firebase/client";

/** Set the current user as online (updates every 30s while tab is open). */
export function startPresence(uid: string): () => void {
  const ref = doc(db, "users", uid);

  // Set online now
  updateDoc(ref, { lastSeen: Date.now(), online: true }).catch(() => {});

  // Heartbeat every 30s
  const interval = setInterval(() => {
    updateDoc(ref, { lastSeen: Date.now(), online: true }).catch(() => {});
  }, 30000);

  // On unload, mark offline
  const handleUnload = () => {
    updateDoc(ref, { online: false, lastSeen: Date.now() }).catch(() => {});
  };
  window.addEventListener("beforeunload", handleUnload);

  return () => {
    clearInterval(interval);
    window.removeEventListener("beforeunload", handleUnload);
    updateDoc(ref, { online: false, lastSeen: Date.now() }).catch(() => {});
  };
}

/** Subscribe to a user's online status. */
export function subscribeOnline(
  uid: string,
  onChange: (online: boolean) => void
): () => void {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    const data = snap.data();
    if (!data) return;
    const isOnline = data.online === true;
    const lastSeen = data.lastSeen || 0;
    // Consider offline if last seen > 60s ago
    const actuallyOnline = isOnline && Date.now() - lastSeen < 60000;
    onChange(actuallyOnline);
  });
}

/** Set typing state for a conversation. */
export function setTyping(
  conversationId: string,
  uid: string,
  isTyping: boolean
): void {
  const ref = doc(db, "conversations", conversationId);
  updateDoc(ref, {
    [`typing.${uid}`]: isTyping ? Date.now() : null,
  }).catch(() => {});
}

/** Subscribe to typing indicators (returns map of uid → isTyping). */
export function subscribeTyping(
  conversationId: string,
  myUid: string,
  onChange: (typingUids: string[]) => void
): () => void {
  return onSnapshot(doc(db, "conversations", conversationId), (snap) => {
    const data = snap.data();
    if (!data?.typing) {
      onChange([]);
      return;
    }
    const now = Date.now();
    const typingUids: string[] = [];
    for (const [uid, ts] of Object.entries(data.typing as Record<string, number | null>)) {
      if (uid !== myUid && ts && now - ts < 5000) {
        typingUids.push(uid);
      }
    }
    onChange(typingUids);
  });
}
