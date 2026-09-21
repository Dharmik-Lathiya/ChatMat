"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeNotes,
  createNote,
  updateNote,
  deleteNote,
  shareNote,
} from "@/services/notes";
import { Button, EmptyState, Modal } from "@/components/ui";
import { TipTapEditor } from "@/components/editor/TipTapEditor";
import { useToast } from "@/components/ui/Toaster";
import type { Note } from "@/types";

function relativeTime(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotesView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "">("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Subscribe to notes
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotes(
      user.uid,
      (list) => {
        setNotes(list);
        setLoaded(true);
      },
      () => {}
    );
    return unsub;
  }, [user]);

  // Load selected note content
  useEffect(() => {
    if (!selectedId || !loaded) return;
    const note = notes.find((n) => n.id === selectedId);
    if (note) {
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  }, [selectedId, notes, loaded]);

  // Autosave debounced
  const scheduleSave = useCallback(
    (title: string, content: string) => {
      if (!user || !selectedId) return;
      clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = setTimeout(async () => {
        try {
          await updateNote(user.uid, selectedId, { title, content });
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus(""), 2000);
        } catch {
          setSaveStatus("");
          toast("Failed to save note.");
        }
      }, 600);
    },
    [user, selectedId, toast]
  );

  function handleTitleChange(value: string) {
    setEditTitle(value);
    scheduleSave(value, editContent);
  }

  function handleContentChange(value: string) {
    setEditContent(value);
    scheduleSave(editTitle, value);
  }

  async function handleCreate() {
    if (!user) return;
    setCreating(true);
    try {
      const id = await createNote(user.uid);
      setSelectedId(id);
    } catch {
      toast("Failed to create note.");
    } finally {
      setCreating(false);
    }
  }

  async function handleShare(note: Note) {
    if (!user) return;
    try {
      const shareId = await shareNote(user.uid, note.id);
      const url = `${window.location.origin}/p/${shareId}`;
      await navigator.clipboard.writeText(url);
      toast("Share link copied to clipboard!", "success");
    } catch {
      toast("Failed to share note.");
    }
  }

  async function handlePin(note: Note) {
    if (!user) return;
    try {
      await updateNote(user.uid, note.id, { pinned: !note.pinned });
    } catch {
      toast("Failed to update note.");
    }
  }

  async function handleArchive(note: Note) {
    if (!user) return;
    try {
      await updateNote(user.uid, note.id, { archived: !note.archived });
    } catch {
      toast("Failed to update note.");
    }
  }

  async function handleDelete() {
    if (!user || !deleteId) return;
    try {
      await deleteNote(user.uid, deleteId);
      if (selectedId === deleteId) {
        setSelectedId(null);
      }
      setDeleteId(null);
    } catch {
      toast("Failed to delete note.");
    }
  }

  const selectedNote = notes.find((n) => n.id === selectedId);

  return (
    <div className="flex h-full flex-col bg-white dark:bg-black">
      {selectedNote ? (
        <>
          {/* Editor header */}
          <div className="flex shrink-0 items-center gap-3 border-b border-ink-200 px-4 py-2 dark:border-gray-800 md:px-6">
            <input
              value={editTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Untitled"
              className="min-w-0 flex-1 border-none bg-transparent text-lg font-semibold text-ink-900 placeholder:text-ink-300 focus:outline-none dark:text-white dark:placeholder:text-gray-600"
            />
            <span className="hidden shrink-0 text-xs text-ink-400 dark:text-gray-500 sm:block">
              Updated {relativeTime(selectedNote.updatedAt)}
            </span>
            {saveStatus && (
              <span className="shrink-0 text-xs text-ink-400 dark:text-gray-500">
                {saveStatus === "saving" ? "Saving…" : "Saved ✓"}
              </span>
            )}
            <Button
              onClick={handleCreate}
              loading={creating}
              className="shrink-0 px-2.5 py-1 text-xs"
            >
              + New
            </Button>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => handlePin(selectedNote)}
                className={`rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 ${
                  selectedNote.pinned ? "text-brand-500" : ""
                }`}
                title={selectedNote.pinned ? "Unpin" : "Pin"}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill={selectedNote.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.4 5.7 21l2.3-7L2 9.4h7.6z" />
                </svg>
              </button>
              <button
                onClick={() => handleArchive(selectedNote)}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100"
                title={selectedNote.archived ? "Unarchive" : "Archive"}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="21,8 21,21 3,21 3,8" />
                  <rect x="1" y="3" width="22" height="5" rx="1" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
              </button>
              <button
                onClick={() => handleShare(selectedNote)}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
                title="Share"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
              <button
                onClick={() => setDeleteId(selectedNote.id)}
                className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-500"
                title="Delete"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="3,6 5,6 21,6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Editor — fills the panel and scrolls inside the box */}
          <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
            <TipTapEditor
              content={editContent}
              onChange={handleContentChange}
              placeholder="Start writing your note..."
              minHeight="min-h-[320px]"
              fillHeight
            />
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <EmptyState
            icon={<span className="text-3xl">📝</span>}
            title="No note open"
            description="Create a new note to start writing."
            action={
              <Button onClick={handleCreate} loading={creating}>
                + New Note
              </Button>
            }
          />
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete note"
      >
        <p className="mb-4 text-sm text-ink-600">
          Are you sure you want to delete this note? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setDeleteId(null)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}