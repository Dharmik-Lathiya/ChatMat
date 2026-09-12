"use client";

import { useEffect, useState } from "react";
import { subscribePublicNotes } from "@/services/publicNotes";
import { Spinner, Input } from "@/components/ui";
import { richTextToPlain } from "@/lib/tiptap";
import type { PublicNote } from "@/services/publicNotes";

function relativeTime(ts?: PublicNote["updatedAt"]) {
  if (!ts) return "";
  const ms = typeof ts === "object" && "toMillis" in ts ? ts.toMillis() : 0;
  if (!ms) return "";
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function preview(content: string, title?: string) {
  if (title) return title;
  return richTextToPlain(content).slice(0, 60) || "Empty note";
}

export default function AdminNotesList() {
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsub = subscribePublicNotes(
      (list) => {
        setNotes(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-200 px-4 py-3 dark:border-gray-800">
        <p className="mt-0.5 text-xs text-ink-400 dark:text-gray-500">
          Read-only view · {notes.length} public notes
        </p>
        <Input
          placeholder="Search public notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2 h-8 text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="h-5 w-5 text-brand-500" />
          </div>
        ) : notes.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-ink-400 dark:text-gray-500">
            No public notes found.
          </div>
        ) : (
          notes
            .filter((note) => {
              const term = search.trim().toLowerCase();
              if (!term) return true;
              return (
                note.slug.toLowerCase().includes(term) ||
                (note.title || "").toLowerCase().includes(term) ||
                richTextToPlain(note.content).toLowerCase().includes(term)
              );
            })
            .map((note) => (
            <a
              key={note.slug}
              href={`/p/${note.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-start gap-3 border-b border-ink-100 px-4 py-3 text-left transition-colors hover:bg-ink-50 dark:border-gray-800 dark:hover:bg-white/5"
            >
              <div className="mt-0.5 shrink-0 rounded-md bg-brand-50 p-1.5 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-ink-800 dark:text-gray-100">
                    /{note.slug}
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-400 dark:text-gray-500">
                    {relativeTime(note.updatedAt)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-400 dark:text-gray-500">
                  {preview(note.content, note.title)}
                </p>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
