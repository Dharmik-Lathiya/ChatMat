"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import "./editor-styles.css";

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TaskList,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-600">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
