"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import "./editor-styles.css";

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  toolbar?: boolean;
  minHeight?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  onInit?: (editor: Editor) => void;
  sync?: boolean;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  toolbar = true,
  minHeight = "min-h-[200px]",
  onSubmit,
  autoFocus = false,
  onInit,
  sync = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    autofocus: autoFocus ? "end" : false,
    onCreate: ({ editor }) => {
      onInit?.(editor);
    },
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose focus:outline-none ${minHeight} p-4`,
      },
      handleKeyDown(_, event) {
        if (onSubmit && event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSubmit();
          return true;
        }
        return false;
      },
    },
  });

  // Keep the editor in sync when the `content` prop changes (e.g. switching
  // notes), without wiping the user's own in-flight typing. Set `sync={false}`
  // when the parent never updates `content` (chat composer / edit box).
  useEffect(() => {
    if (!editor || !sync) return;
    const current = JSON.stringify(editor.getJSON());
    if (current !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor, sync]);

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-600">
      {toolbar && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}