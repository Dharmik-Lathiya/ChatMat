"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Video } from "./Video";
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

// Stored content may be a TipTap JSON string (notes serialize editor.getJSON()).
// TipTap's `content` accepts a JSON object or HTML string, but not a JSON
// string, so parse it before handing it to the editor.
function parseContent(content: string): string | Record<string, unknown> {
  const trimmed = content.trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through to plain text / HTML
    }
  }
  return content;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
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
      TaskItem,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "tiptap-image",
        },
      }),
      Video,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: parseContent(content),
    immediatelyRender: false,
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
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter(
          (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
        );
        if (!files.length) return false;
        event.preventDefault();
        const from = view.state.selection.from;
        files.forEach((file, index) => {
          void fileToDataUrl(file)
            .then((src) => {
              const kind = file.type.startsWith("video/") ? "video" : "image";
              const node = view.state.schema.nodes[kind]?.create({ src });
              if (!node) return;
              view.dispatch(view.state.tr.insert(from + index, node));
            })
            .catch(console.error);
        });
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []).filter(
          (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
        );
        if (!files.length) return false;
        event.preventDefault();
        const dropPos =
          view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ??
          view.state.selection.from;
        files.forEach((file, index) => {
          void fileToDataUrl(file)
            .then((src) => {
              const kind = file.type.startsWith("video/") ? "video" : "image";
              const node = view.state.schema.nodes[kind]?.create({ src });
              if (!node) return;
              view.dispatch(view.state.tr.insert(dropPos + index, node));
            })
            .catch(console.error);
        });
        return true;
      },
    },
  });

  // Keep the editor in sync when the `content` prop changes (e.g. switching
  // notes), without wiping the user's own in-flight typing. Set `sync={false}`
  // when the parent never updates `content` (chat composer / edit box).
  useEffect(() => {
    if (!editor || !sync) return;
    const desired = parseContent(content);
    if (!desired) return;
    const desiredKey = typeof desired === "string" ? desired : JSON.stringify(desired);
    const currentKey = JSON.stringify(editor.getJSON());
    if (desiredKey !== currentKey) {
      editor.commands.setContent(desired);
    }
  }, [content, editor, sync]);

  const pickImage = (file: File) =>
    void fileToDataUrl(file)
      .then((src) => editor?.chain().focus().setImage({ src }).run())
      .catch(console.error);

  const pickVideo = (file: File) =>
    void fileToDataUrl(file)
      .then((src) => editor?.chain().focus().setVideo({ src }).run())
      .catch(console.error);

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 dark:border-ink-600">
      {toolbar && (
        <EditorToolbar
          editor={editor}
          onPickImage={pickImage}
          onPickVideo={pickVideo}
        />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}