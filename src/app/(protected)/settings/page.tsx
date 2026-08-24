"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile } from "@/services/users";
import { uploadAvatar } from "@/services/storage";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { logout } from "@/services/auth";
import { Button, Input, Alert, Spinner } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { useToast } from "@/components/ui/Toaster";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Initialize display name from profile
  if (profile && !nameLoaded) {
    setDisplayName(profile.displayName);
    setNameLoaded(true);
  }

  async function handleSave() {
    if (!user || !profile) return;
    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateUserProfile(user.uid, { displayName: displayName.trim() });
      await updateProfile(auth.currentUser!, { displayName: displayName.trim() });
      await refreshProfile();
      setSuccess("Profile updated!");
      setTimeout(() => setSuccess(""), 2000);
    } catch {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadAvatar(user.uid, file);
      await updateUserProfile(user.uid, { photoURL: url });
      await updateProfile(auth.currentUser!, { photoURL: url });
      await refreshProfile();
    } catch {
      setError("Failed to upload avatar.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (!user || !profile) return null;

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-20 md:pb-0">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <h1 className="text-xl font-bold text-ink-900">Settings</h1>

        {/* Profile section */}
        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-800">Profile</h2>

          <div className="mt-4 flex items-center gap-4">
            <div className="relative">
              <Avatar
                name={profile.displayName}
                photoURL={profile.photoURL || undefined}
                size="lg"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-sm transition-colors hover:bg-ink-50 hover:text-ink-700"
              >
                {uploading ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </button>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-800">
                {profile.displayName}
              </p>
              <p className="text-xs text-ink-400">{profile.email}</p>
            </div>
          </div>

          {error && (
            <Alert tone="error" key={error}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert tone="success">
              {success}
            </Alert>
          )}

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
                Email
              </label>
              <Input value={profile.email} disabled className="bg-ink-50" />
            </div>
            <Button onClick={handleSave} loading={saving} className="w-full">
              Save Changes
            </Button>
          </div>
        </div>

        {/* Account section */}
        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-6 shadow-card">
          <h2 className="text-sm font-semibold text-ink-800">Account</h2>
          <p className="mt-1 text-xs text-ink-500">
            Signed in as {profile.email}
          </p>
          <Button
            variant="danger"
            onClick={handleLogout}
            className="mt-4 w-full"
          >
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
