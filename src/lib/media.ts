import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, auth } from "@/lib/firebase/client";

export type MediaTarget =
  | { kind: "conversation"; conversationId: string }
  | { kind: "note"; slug: string };

export function uploadMedia(
  target: MediaTarget,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return Promise.reject(new Error("You must be signed in to upload media."));
  }

  const prefix =
    target.kind === "conversation"
      ? `conversations/${target.conversationId}/files`
      : `notes/${target.slug}/files`;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "media";
  const storageRef = ref(storage, `${prefix}/${Date.now()}-${safeName}`);

  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        onProgress?.(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        );
      },
      reject,
      () => {
        void getDownloadURL(task.snapshot.ref)
          .then((url) => resolve(url))
          .catch(reject);
      }
    );
  });
}