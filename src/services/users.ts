import {
  collection,
  doc,
  endAt,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAt,
  updateDoc,
  where,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/types";

const usersCol = () => collection(db, "users");

/** Create the profile document if it doesn't exist yet (idempotent). */
export async function ensureUserDoc(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const name = user.displayName || emailToName(user.email);
  const email = user.email ?? "";
  await setDoc(ref, {
    displayName: name,
    displayNameLower: name.toLowerCase(),
    email,
    emailLower: email.toLowerCase(),
    photoURL: user.photoURL ?? "",
    role: "user",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null;
}

/**
 * Search users by display-name prefix or exact email (lowercased fields).
 * Returns at most 10 results, excluding a given uid.
 */
export async function searchUsers(
  term: string,
  excludeUid?: string
): Promise<UserProfile[]> {
  const clean = term.trim().toLowerCase();
  if (clean.length < 2) return [];

  const constraints = [
    orderBy("displayNameLower"),
    startAt(clean),
    endAt(clean + "\uf8ff"),
  ];

  let results: UserProfile[];
  if (clean.includes("@")) {
    // Email search is an exact match on the stored lowercase email.
    const snap = await getDocs(
      query(usersCol(), where("emailLower", "==", clean), limit(5))
    );
    results = snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile);
  } else {
    const snap = await getDocs(query(usersCol(), ...constraints, limit(10)));
    results = snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile);
  }

  if (excludeUid) results = results.filter((u) => u.uid !== excludeUid);
  return results;
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, "displayName" | "photoURL">>
): Promise<void> {
  const updates: Record<string, unknown> = { ...patch, updatedAt: Date.now() };
  if (patch.displayName !== undefined) {
    updates.displayNameLower = patch.displayName.toLowerCase();
  }
  await updateDoc(doc(db, "users", uid), updates);
}

function emailToName(email?: string | null): string {
  if (!email) return "New user";
  const name = email.split("@")[0].replace(/[._-]+/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}
