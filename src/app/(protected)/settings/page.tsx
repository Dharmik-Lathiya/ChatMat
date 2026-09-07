"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { updateUserProfile } from "@/services/users";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { logout } from "@/services/auth";
import { Button, Input, Alert } from "@/components/ui";
import { Avatar } from "@/components/Avatar";

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [displayName, setDisplayName] = useState("");
  const [nameLoaded, setNameLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
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
        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-6 shadow-card dark:border-gray-800 dark:bg-black">
          <h2 className="text-sm font-semibold text-ink-800 dark:text-white">Profile</h2>

          <div className="mt-4 flex items-center gap-4">
            <Avatar
              name={profile.displayName}
              photoURL={profile.photoURL || undefined}
              size="lg"
            />
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

        {/* Appearance */}
        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-6 shadow-card dark:border-gray-800 dark:bg-black">
          <h2 className="text-sm font-semibold text-ink-800 dark:text-white">Appearance</h2>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-700 dark:text-gray-300">Dark mode</p>
              <p className="text-xs text-ink-400 dark:text-gray-500">Switch between light and dark theme</p>
            </div>
            <button
              onClick={toggle}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                theme === "dark" ? "bg-brand-500" : "bg-ink-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  theme === "dark" ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Account section */}
        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-6 shadow-card dark:border-gray-800 dark:bg-black">
          <h2 className="text-sm font-semibold text-ink-800 dark:text-white">Account</h2>
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
