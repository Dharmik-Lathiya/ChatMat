import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

async function upload(path: string, file: File): Promise<string> {
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file for your avatar.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Avatar must be smaller than 5 MB.");
  }
  const ext = file.name.split(".").pop() || "jpg";
  return upload(`users/${userId}/avatar/${Date.now()}.${ext}`, file);
}

export interface AttachmentResult {
  url: string;
  name: string;
  size: number;
  type: string;
}

export async function uploadConversationFile(
  conversationId: string,
  file: File
): Promise<AttachmentResult> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Attachments must be smaller than 10 MB.");
  }
  const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
  const url = await upload(
    `conversations/${conversationId}/files/${Date.now()}_${safeName}`,
    file
  );
  return { url, name: file.name, size: file.size, type: file.type };
}
