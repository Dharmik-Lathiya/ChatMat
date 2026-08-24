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
import { Button, Input, Textarea, EmptyState, Modal } from "@/components/ui";
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
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "">("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [mobileEditor, setMobileEditor] = useState(false);

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
      setMobileEditor(true);
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
        setMobileEditor(false);
      }
      setDeleteId(null);
    } catch {
      toast("Failed to delete note.");
    }
  }

  // Filter notes
  const filtered = notes.filter((n) => {
    if (n.archived !== showArchived) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(term) ||
        n.content.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const pinned = filtered.filter((n) => n.pinned);
  const others = filtered.filter((n) => !n.pinned);
  const selectedNote = notes.find((n) => n.id === selectedId);

  return (
    <div className="flex h-full">
      {/* Note list */}
      <div
        className={`flex h-full w-full flex-col border-r border-ink-200 md:w-80 ${
          mobileEditor && selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-3">
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showArchived
                ? "border-brand-300 bg-brand-50 text-brand-700"
                : "border-ink-200 text-ink-500 hover:bg-ink-50"
            }`}
          >
            {showArchived ? "Archived" : "Active"}
          </button>
        </div>

        <div className="px-3 py-2">
          <Button
            onClick={handleCreate}
            loading={creating}
            className="w-full"
          >
            + New Note
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {pinned.length > 0 && (
            <div className="px-3 pt-2 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Pinned
              </span>
            </div>
          )}
          {pinned.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              selected={note.id === selectedId}
              onClick={() => {
                setSelectedId(note.id);
                setMobileEditor(true);
              }}
              onPin={() => handlePin(note)}
              onArchive={() => handleArchive(note)}
              onDelete={() => setDeleteId(note.id)}
            />
          ))}
          {others.length > 0 && (
            <div className="px-3 pt-2 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                {pinned.length > 0 ? "Others" : "Notes"}
              </span>
            </div>
          )}
          {others.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              selected={note.id === selectedId}
              onClick={() => {
                setSelectedId(note.id);
                setMobileEditor(true);
              }}
              onPin={() => handlePin(note)}
              onArchive={() => handleArchive(note)}
              onDelete={() => setDeleteId(note.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-ink-400">
              {search ? "No notes match your search." : "No notes yet."}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div
        className={`flex h-full flex-1 flex-col ${
          !mobileEditor || !selectedId ? "hidden md:flex" : "flex"
        }`}
      >
        {selectedNote ? (
          <>
            {/* Mobile back button */}
            <div className="flex items-center gap-2 border-b border-ink-200 px-4 py-2 md:hidden">
              <button
                onClick={() => setMobileEditor(false)}
                className="rounded-lg p-1 text-ink-500 hover:bg-ink-100"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
              <span className="text-sm font-medium text-ink-700">Back</span>
              {saveStatus && (
                <span className="ml-auto text-xs text-ink-400">
                  {saveStatus === "saving" ? "Saving…" : "Saved"}
                </span>
              )}
            </div>
            <div className="hidden items-center justify-between border-b border-ink-200 px-6 py-3 md:flex">
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-400">
                  Updated {relativeTime(selectedNote.updatedAt)}
                </span>
                {saveStatus && (
                  <span className="text-xs text-ink-400">
                    {saveStatus === "saving" ? "Saving…" : "Saved"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
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
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <input
                value={editTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled"
                className="mb-2 w-full border-none bg-transparent text-xl font-semibold text-ink-900 placeholder:text-ink-300 focus:outline-none"
              />
              <Textarea
                value={editContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Start writing..."
                className="min-h-[300px] border-none bg-transparent px-0 text-sm text-ink-700 placeholder:text-ink-300 focus:outline-none focus:ring-0"
              />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              title="Select a note"
              description="Choose a note from the sidebar or create a new one."
            />
          </div>
        )}
      </div>

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

function NoteRow({
  note,
  selected,
  onClick,
  onPin,
  onArchive,
  onDelete,
}: {
  note: Note;
  selected: boolean;
  onClick: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer border-b border-ink-100 px-3 py-2.5 transition-colors ${
        selected ? "bg-brand-50" : "hover:bg-ink-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-ink-800">
            {note.title || "Untitled"}
          </h4>
          <p className="mt-0.5 truncate text-xs text-ink-400">
            {note.content || "Empty note"}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="shrink-0 rounded p-1 text-ink-400 opacity-0 transition-opacity hover:text-ink-600 group-hover:opacity-100"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-400">
        <span>{relativeTime(note.updatedAt)}</span>
        {note.pinned && (
          <span className="text-brand-500">★ Pinned</span>
        )}
      </div>
      {menuOpen && (
        <div
          className="absolute right-2 top-8 z-10 rounded-lg border border-ink-200 bg-white shadow-pop"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onPin();
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-left text-xs text-ink-700 hover:bg-ink-50"
          >
            {note.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={() => {
              onArchive();
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-left text-xs text-ink-700 hover:bg-ink-50"
          >
            {note.archived ? "Unarchive" : "Archive"}
          </button>
          <button
            onClick={() => {
              onDelete();
              setMenuOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
