"use client";

import { useEffect, useState } from "react";
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
import { uploadMedia, type MediaTarget } from "@/lib/media";
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
  mediaTarget?: MediaTarget;
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
  mediaTarget,
}: TipTapEditorProps) {
  const [upload, setUpload] = useState<{
    label: string;
    percent: number;
  } | null>(null);

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
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
          f.type.startsWith("image/") || f.type.startsWith("video/")
        );
        if (!files.length) return false;
        event.preventDefault();
        const from = view.state.selection.from;
        files.forEach((file, index) =>
          void insertMedia(file, view, from + index)
        );
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith("image/") || f.type.startsWith("video/")
        );
        if (!files.length) return false;
        event.preventDefault();
        const dropPos =
          view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ??
          view.state.selection.from;
        files.forEach((file, index) =>
          void insertMedia(file, view, dropPos + index)
        );
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

  const fileToLabel = (file: File) =>
    file.type.startsWith("video/") ? "Uploading video…" : "Uploading image…";

  async function uploadAndInsert(
    file: File,
    insert: (src: string) => void
  ) {
    if (!mediaTarget) {
      console.warn("Media upload requires a `mediaTarget` prop.");
      return;
    }
    setUpload({ label: fileToLabel(file), percent: 0 });
    try {
      const src = await uploadMedia(mediaTarget, file, (percent) =>
        setUpload({ label: fileToLabel(file), percent })
      );
      insert(src);
    } catch (err) {
      console.error("Media upload failed:", err);
    } finally {
      setUpload(null);
    }
  }

  async function insertMedia(file: File, view: Editor["view"], pos: number) {
    const isVideo = file.type.startsWith("video/");
    const kind = isVideo ? "video" : "image";
    await uploadAndInsert(file, (src) => {
      const node = view.state.schema.nodes[kind]?.create({ src });
      if (!node) return;
      view.dispatch(view.state.tr.insert(pos, node));
    });
  }

  const pickImage = (file: File) =>
    void uploadAndInsert(file, (src) =>
      editor?.chain().focus().setImage({ src }).run()
    );

  const pickVideo = (file: File) =>
    void uploadAndInsert(file, (src) =>
      editor?.chain().focus().setVideo({ src }).run()
    );

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
      {upload && (
        <div className="flex items-center gap-2 border-t border-ink-200 px-3 py-1.5 text-xs text-ink-600 dark:border-ink-600 dark:text-ink-300">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-700">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${upload.percent}%` }}
            />
          </div>
          <span className="shrink-0">{upload.label}</span>
          <span className="shrink-0 font-medium text-brand-600 dark:text-brand-400">
            {upload.percent}%
          </span>
        </div>
      )}
    </div>
  );
}