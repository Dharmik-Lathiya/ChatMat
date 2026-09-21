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

const WIDTH_STORAGE_KEY = "chatmat:publicNoteWidth";
const MIN_CANVAS_WIDTH = 560;
const WIDTH_STEP = 96;

function clampWidth(px: number): number {
  const max = typeof window === "undefined" ? 1440 : window.innerWidth - 32;
  return Math.max(MIN_CANVAS_WIDTH, Math.min(Math.round(px), max));
}

function readStoredWidth(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(WIDTH_STORAGE_KEY);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

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
  const [canvasWidth, setCanvasWidth] = useState<number | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

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

  // Adjustable canvas width: restore the persisted width once on mount,
  // then keep it within bounds as the viewport changes.
  useEffect(() => {
    const stored = readStoredWidth();
    if (stored) setCanvasWidth(clampWidth(stored));
  }, []);

  useEffect(() => {
    if (!canvasWidth) return;
    const onResize = () => setCanvasWidth((w) => (w ? clampWidth(w) : w));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [canvasWidth]);

  const applyWidth = useCallback((px: number, persist: boolean) => {
    const w = clampWidth(px);
    setCanvasWidth(w);
    if (persist) {
      window.localStorage.setItem(WIDTH_STORAGE_KEY, String(w));
    }
  }, []);

  const currentWidth = useCallback(
    () =>
      canvasWidth ??
      mainRef.current?.getBoundingClientRect().width ??
      768,
    [canvasWidth]
  );

  const handleResizeStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth =
        mainRef.current?.getBoundingClientRect().width ?? 768;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ew-resize";
      const onMove = (ev: PointerEvent) => {
        applyWidth(startWidth + (ev.clientX - startX), false);
      };
      const onUp = (ev: PointerEvent) => {
        applyWidth(
          mainRef.current?.getBoundingClientRect().width ?? startWidth,
          true
        );
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        void ev;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [applyWidth]
  );

  const resetWidth = useCallback(() => {
    setCanvasWidth(null);
    window.localStorage.removeItem(WIDTH_STORAGE_KEY);
  }, []);

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

  const widthStyle = canvasWidth
    ? { width: `${canvasWidth}px`, maxWidth: "100%" }
    : undefined;

  const widthControls = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        title="Narrower canvas"
        aria-label="Narrower canvas"
        onClick={() => applyWidth(currentWidth() - WIDTH_STEP, true)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="9" y1="4" x2="9" y2="20" />
          <path d="M5 12H2" />
          <path d="M22 12h-3" />
        </svg>
      </button>
      <span
        className="w-11 text-center text-xs tabular-nums text-ink-400 dark:text-gray-500"
        title="Canvas width — double-click the right edge to reset"
      >
        {canvasWidth ? `${canvasWidth}px` : "auto"}
      </span>
      <button
        type="button"
        title="Wider canvas"
        aria-label="Wider canvas"
        onClick={() => applyWidth(currentWidth() + WIDTH_STEP, true)}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="9" y1="4" x2="9" y2="20" />
          <line x1="15" y1="4" x2="15" y2="20" />
          <path d="M2 12h3" />
          <path d="M19 12h3" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-ink-50 to-sky-50 dark:from-gray-950 dark:via-black dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-ink-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-black/80">
        <div
          className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3"
          style={widthStyle}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
              C
            </div>
            <span className="truncate text-sm font-semibold text-ink-700 dark:text-gray-200">Chatmat</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {widthControls}
            <ThemeToggle />
            {saveStatus && (
              <span className="text-xs text-ink-400 dark:text-gray-500">
                {saveStatus === "saving" ? "Saving…" : "Saved ✓"}
              </span>
            )}
            <span className="hidden rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 sm:inline">
              #{slug}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main
        ref={mainRef}
        className="relative mx-auto max-w-3xl px-4 py-6"
        style={widthStyle}
      >
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
            />
            {error && (
              <p className="mt-2 text-center text-sm text-red-500">{error}</p>
            )}
          </div>
        )}

        {/* Drag handle to resize the canvas */}
        <div
          onPointerDown={handleResizeStart}
          onDoubleClick={resetWidth}
          title="Drag to resize canvas — double-click to reset"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize canvas"
          className="absolute inset-y-0 right-0 z-10 hidden w-3 cursor-ew-resize md:block"
        >
          <div className="flex h-full items-center justify-center">
            <div className="h-16 w-1 rounded-full bg-ink-300/70 transition-colors hover:bg-brand-400 dark:bg-gray-700 dark:hover:bg-brand-500" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink-100 py-4 text-center text-xs text-ink-400 dark:border-gray-800 dark:text-gray-500">
        Public notepad · Anyone with this URL can view and edit
      </footer>
    </div>
  );
}
