"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPublicNote,
  savePublicNote,
  slugExists,
} from "@/services/publicNotes";
import { Spinner } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TipTapEditor } from "@/components/editor/TipTapEditor";

export default function PublicNotePage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || "";
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "">("");
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load note
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getPublicNote(slug)
      .then((note) => {
        if (note) {
          setContent(note.content);
          setLoading(false);
        } else {
          setNotFound(true);
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Failed to load note.");
        setLoading(false);
      });
  }, [slug]);

// Autosave debounced
  const scheduleSave = useCallback(
    (text: string) => {
      clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = setTimeout(async () => {
        try {
          await savePublicNote(slug, text);
          setSaveStatus("saved");
          setNotFound(false);
          setTimeout(() => setSaveStatus(""), 2000);
        } catch {
          setSaveStatus("");
          setError("Failed to save. Check your connection.");
        }
      }, 600);
    },
    [slug]
  );

  function handleChange(value: string) {
    setContent(value);
    setError("");
    scheduleSave(value);
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await savePublicNote(slug, content || "");
      setNotFound(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch {
      setError("Failed to create note.");
    } finally {
      setCreating(false);
    }
  }

  if (!slug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-ink-50 to-sky-50 dark:from-gray-950 dark:via-black dark:to-gray-900">
        <p className="text-ink-500 dark:text-gray-400">No note name provided.</p>
      </div>
    );
  }

  const mediaTarget = { kind: "note", slug } as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-ink-50 to-sky-50 dark:from-gray-950 dark:via-black dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-ink-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
              C
            </div>
            <span className="text-sm font-semibold text-ink-700 dark:text-gray-200">Chatmat</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {saveStatus && (
              <span className="text-xs text-ink-400 dark:text-gray-500">
                {saveStatus === "saving" ? "Saving…" : "Saved ✓"}
              </span>
            )}
            <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
              #{slug}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-6 w-6 text-brand-500" />
          </div>
        ) : notFound ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-3xl dark:bg-brand-900/30">
              📝
            </div>
            <h2 className="text-lg font-semibold text-ink-800 dark:text-white">
              Note <span className="text-brand-600 dark:text-brand-400">#{slug}</span> doesn&apos;t
              exist yet
            </h2>
            <p className="mt-2 text-sm text-ink-500 dark:text-gray-400">
              Start typing to create it. Your content will be saved
              automatically.
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
            <div className="mx-auto mt-6 max-w-xl">
              <TipTapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing here…"
                minHeight="min-h-[200px]"
                autoFocus
                mediaTarget={mediaTarget}
              />
              <button
                onClick={handleCreate}
                disabled={creating}
                className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:bg-brand-300"
              >
                {creating ? "Creating…" : "Create & Save"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <TipTapEditor
              content={content}
              onChange={handleChange}
              placeholder="Start writing…"
              minHeight="min-h-[400px]"
              mediaTarget={mediaTarget}
            />
            {error && (
              <p className="mt-2 text-center text-sm text-red-500">{error}</p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-100 py-4 text-center text-xs text-ink-400 dark:border-gray-800 dark:text-gray-500">
        Public notepad · Anyone with this URL can view and edit
      </footer>
    </div>
  );
}
