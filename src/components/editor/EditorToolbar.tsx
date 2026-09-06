"use client";

import { Editor } from "@tiptap/react";

function ToolbarButton({
  onClick,
  isActive,
  icon,
  tooltip,
}: {
  onClick: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  tooltip: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded p-1.5 transition-colors ${
        isActive
          ? "bg-ink-200 text-ink-800 dark:bg-ink-600 dark:text-ink-100"
          : "text-ink-500 hover:bg-ink-100 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-700 dark:hover:text-ink-200"
      }`}
      title={tooltip}
      type="button"
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-6 w-px bg-ink-200 dark:bg-ink-600" />;
}

function BoldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
      <path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function HeadingIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v16" />
      <path d="M18 4v16" />
      <path d="M6 12h12" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function ListOrderedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16,18 22,12 16,6" />
      <polyline points="8,6 2,12 8,18" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,4 1,10 7,10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23,4 23,10 17,10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

function TaskListIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="6" height="6" rx="1" />
      <path d="M5 8l1.5 1.5L9 6" />
      <line x1="13" y1="8" x2="21" y2="8" />
      <rect x="3" y="14" width="6" height="6" rx="1" />
      <line x1="13" y1="17" x2="21" y2="17" />
    </svg>
  );
}

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-ink-200 px-2 py-1.5 dark:border-ink-600">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        icon={<BoldIcon />}
        tooltip="Bold (Ctrl+B)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        icon={<ItalicIcon />}
        tooltip="Italic (Ctrl+I)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        icon={<HeadingIcon />}
        tooltip="Heading"
      />
      <Divider />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        icon={<ListIcon />}
        tooltip="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        icon={<ListOrderedIcon />}
        tooltip="Ordered List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive("taskList")}
        icon={<TaskListIcon />}
        tooltip="Task List"
      />
      <Divider />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        icon={<CodeIcon />}
        tooltip="Code Block"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        icon={<QuoteIcon />}
        tooltip="Quote"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        isActive={false}
        icon={<TableIcon />}
        tooltip="Insert Table"
      />
      <div className="flex-1" />
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        isActive={false}
        icon={<UndoIcon />}
        tooltip="Undo (Ctrl+Z)"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        isActive={false}
        icon={<RedoIcon />}
        tooltip="Redo (Ctrl+Shift+Z)"
      />
    </div>
  );
}
