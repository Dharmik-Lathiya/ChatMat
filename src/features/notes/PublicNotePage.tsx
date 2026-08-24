"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPublicNote,
  savePublicNote,
  slugExists,
} from "@/services/publicNotes";
import { Spinner } from "@/components/ui";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(el.scrollHeight, 300) + "px";
    }
  }, [content, loading]);

  if (!slug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-ink-50 to-sky-50">
        <p className="text-ink-500">No note name provided.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-ink-50 to-sky-50">
      {/* Header */}
      <header className="border-b border-ink-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
              C
            </div>
            <span className="text-sm font-semibold text-ink-700">Chatmat</span>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className="text-xs text-ink-400">
                {saveStatus === "saving" ? "Saving…" : "Saved ✓"}
              </span>
            )}
            <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-3xl">
              📝
            </div>
            <h2 className="text-lg font-semibold text-ink-800">
              Note <span className="text-brand-600">#{slug}</span> doesn&apos;t
              exist yet
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              Start typing to create it. Your content will be saved
              automatically.
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
            <div className="mx-auto mt-6 max-w-xl">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Start writing here…"
                className="min-h-[200px] w-full resize-none rounded-xl border border-ink-200 bg-white p-4 text-sm text-ink-900 placeholder:text-ink-400 shadow-card focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                autoFocus
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
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Start writing…"
              className="min-h-[400px] w-full resize-none rounded-xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-900 placeholder:text-ink-400 shadow-card focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {error && (
              <p className="mt-2 text-center text-sm text-red-500">{error}</p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-100 py-4 text-center text-xs text-ink-400">
        Public notepad · Anyone with this URL can view and edit
      </footer>
    </div>
  );
}
