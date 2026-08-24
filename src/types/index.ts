import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  /** Lowercased copies used for search. */
  displayNameLower?: string;
  emailLower?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface LastMessage {
  text: string;
  senderId: string;
  at: number;
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  participantIds: string[];
  lastMessage?: LastMessage;
  /** Per-participant read markers (ms epoch). */
  readAt?: Record<string, number>;
  updatedAt: number | Timestamp;
  createdAt: number | Timestamp;
}

export interface MessageFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  file?: MessageFile;
  edited?: boolean;
  editedAt?: number;
  deleted?: boolean;
  reactions?: Record<string, string[]>;
  createdAt: Timestamp | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}
