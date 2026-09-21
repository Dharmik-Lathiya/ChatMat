"use client";

import { useEffect, useRef, useState } from "react";
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
import { uploadToCloudinary } from "@/lib/cloudinary";
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
  onFocusChange?: (focused: boolean) => void;
  sync?: boolean;
  /** Show the built-in width controls (narrower/wider/full + drag handle). */
  resizable?: boolean;
  /** localStorage key used to persist the chosen width. */
  resizeStorageKey?: string;
  /** Fill the parent's height and scroll the content inside the box. */
  fillHeight?: boolean;
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

function isImage(file: File): boolean {
  return file.type.startsWith("image/");
}

function isVideo(file: File): boolean {
  return file.type.startsWith("video/");
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  toolbar = true,
  minHeight = "min-h-[320px]",
  onSubmit,
  autoFocus = false,
  onInit,
  onFocusChange,
  sync = true,
  resizable = false,
  resizeStorageKey = "chatmat:tiptapWidth",
  fillHeight = false,
}: TipTapEditorProps) {
  const [upload, setUpload] = useState<{
    label: string;
    percent: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // null = full width (span the whole container on both sides)
  const [width, setWidth] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(resizeStorageKey);
    const parsed = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  });

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
      editor.on("focus", () => onFocusChange?.(true));
      editor.on("blur", () => onFocusChange?.(false));
    },
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose max-w-none focus:outline-none ${fillHeight ? "min-h-0" : minHeight} p-4`,
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
const clipboard = event.clipboardData;
        if (!clipboard) return false;
        const files = Array.from(clipboard.files).filter(
          (f) => isImage(f) || isVideo(f)
        );
        // Only take over the paste when the clipboard carries image/video
        // files and no HTML/text fallback (e.g. a screenshot copy). When
        // rich content is available, let ProseMirror's normal paste
        // handling preserve the formatting.
        if (!files.length) return false;
        if (clipboard.getData("text/html") || clipboard.getData("text/plain")) {
          return false;
        }
        event.preventDefault();
        const from = view.state.selection.from;
        files.forEach((file, index) => {
          void insertUploaded(view, file, from + index);
        });
        return true;
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (!files.length) return false;
        event.preventDefault();
        const dropPos =
          view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ??
          view.state.selection.from;
        files.forEach((file, index) => {
          void insertUploaded(view, file, dropPos + index);
        });
        return true;
      },
      // Convert plain-text list lines ("- x", "1. x", "• x") into real
      // list nodes instead of the default per-line paragraphs.
      clipboardTextParser(text, $context) {
        const schema = $context.doc.type.schema;
        const { bulletList, orderedList, listItem, paragraph } = schema.nodes;
        const lines = text.split(/(?:\r\n?|\n)+/);
        type PMNode = ReturnType<typeof paragraph.create>;
        const nodes: PMNode[] = [];
        let current: { type: "bullet" | "ordered"; texts: string[] } | null =
          null;

        const flushList = () => {
          if (!current) return;
          const listType = current.type === "bullet" ? bulletList : orderedList;
          const items = current.texts.map((value) =>
            listItem.create(
              null,
              paragraph.create(null, value ? [schema.text(value)] : [])
            )
          );
          nodes.push(listType.create(null, items));
          current = null;
        };

        for (const raw of lines) {
          const line = raw.trim();
          const bullet = /^([-*•])\s+(.*)$/.exec(line);
          const ordered = /^(\d+)[.)]\s+(.*)$/.exec(line);
          if (bullet && !ordered) {
            if (current?.type !== "bullet") {
              flushList();
              current = { type: "bullet", texts: [] };
            }
            current.texts.push(bullet[2]);
          } else if (ordered) {
            if (current?.type !== "ordered") {
              flushList();
              current = { type: "ordered", texts: [] };
            }
            current.texts.push(ordered[2]);
          } else {
            flushList();
            nodes.push(
              paragraph.create(null, line ? [schema.text(line)] : [])
            );
          }
        }
        flushList();
        if (!nodes.length) {
          nodes.push(paragraph.create(null));
        }
        // Build a closed slice (open depths 0) from a throwaway doc node so
        // no direct ProseMirror classes need importing.
        const doc = schema.topNodeType.create(null, nodes);
        return doc.slice(0, doc.content.size, false);
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

  async function insertUploaded(
    view: Editor["view"],
    file: File,
    pos: number
  ) {
    const label = isVideo(file)
      ? "Uploading video…"
      : isImage(file)
        ? "Uploading image…"
        : "Uploading file…";
    setUpload({ label, percent: 0 });
    try {
      const { url } = await uploadToCloudinary(file, (percent) =>
        setUpload({ label, percent })
      );
      const schema = view.state.schema;
      const from = pos >= 0 ? pos : view.state.selection.from;
      if (isImage(file)) {
        const node = schema.nodes.image?.create({ src: url });
        if (node) view.dispatch(view.state.tr.insert(from, node));
      } else if (isVideo(file)) {
        const node = schema.nodes.video?.create({ src: url });
        if (node) view.dispatch(view.state.tr.insert(from, node));
      } else {
        const mark = schema.marks.link?.create({ href: url });
        const text = schema.text(file.name || "Attachment", mark ? [mark] : []);
        const paragraph = schema.nodes.paragraph.create(null, text);
        view.dispatch(view.state.tr.insert(from, paragraph));
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUpload(null);
    }
  }

  const MIN_WIDTH = 360;

  const currentWidth = () =>
    width ??
    containerRef.current?.parentElement?.getBoundingClientRect().width ??
    1024;

  const applyWidth = (px: number, persist: boolean) => {
    const max =
      containerRef.current?.parentElement?.getBoundingClientRect().width ??
      1024;
    const next = Math.max(MIN_WIDTH, Math.min(Math.round(px), max));
    setWidth(next);
    if (persist) {
      window.localStorage.setItem(resizeStorageKey, String(next));
    }
  };

  const handleResizeStart = (
    e: React.PointerEvent<HTMLDivElement>,
    fromLeft = false
  ) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = currentWidth();
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
    const delta = (clientX: number) =>
      fromLeft ? startX - clientX : clientX - startX;
    const onMove = (ev: PointerEvent) => {
      applyWidth(startWidth + delta(ev.clientX), false);
    };
    const onUp = (ev: PointerEvent) => {
      applyWidth(startWidth + delta(ev.clientX), true);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const resetWidth = () => {
    setWidth(null);
    window.localStorage.removeItem(resizeStorageKey);
  };

  function pickMedia(file: File, kind: "image" | "video") {
    if (!file || !editor) return;
    const label = kind === "video" ? "Uploading video…" : "Uploading image…";
    setUpload({ label, percent: 0 });
    void uploadToCloudinary(file, (percent) => setUpload({ label, percent }))
      .then(({ url }) => {
        if (kind === "video") {
          editor.chain().focus().setVideo({ src: url }).run();
        } else {
          editor.chain().focus().setImage({ src: url }).run();
        }
      })
      .catch(console.error)
      .finally(() => setUpload(null));
  }

  return (
    <div
      ref={containerRef}
      className={`relative mx-auto overflow-hidden rounded-lg border border-ink-200 bg-white text-ink-900 focus-within:ring-1 focus-within:ring-brand-500/30 dark:border-brand-900 dark:bg-gray-950 dark:text-gray-200 dark:focus-within:border-brand-500 dark:focus-within:ring-brand-500/20 ${
        fillHeight ? "flex min-h-0 flex-1 flex-col" : ""
      }`}
      style={width ? { width: `${width}px`, maxWidth: "100%" } : undefined}
    >
      {toolbar && (
        <EditorToolbar
          editor={editor}
          onPickImage={(file) => pickMedia(file, "image")}
          onPickVideo={(file) => pickMedia(file, "video")}
        />
      )}
      {fillHeight ? (
        <div className="tiptap-scroll min-h-0 flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}
      {upload && (
        <div className="flex items-center gap-2 border-t border-ink-200 px-3 py-1.5 text-xs text-ink-600 dark:border-brand-900 dark:text-ink-300">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ink-100 dark:bg-brand-900/40">
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
      {resizable && (
        <>
          <div className="flex items-center gap-1 border-t border-ink-200 px-2 py-1 dark:border-brand-900">
            <span className="mr-auto pl-1 text-xs tabular-nums text-ink-400 dark:text-brand-300/70">
              {width ? `${Math.round(width)}px` : "Full width"}
            </span>
            <button
              type="button"
              title="Narrower"
              aria-label="Narrower editor"
              onClick={() => applyWidth(currentWidth() - 96, true)}
              className="flex h-6 w-6 items-center justify-center rounded text-sm text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 dark:text-brand-300/70 dark:hover:bg-brand-500/15 dark:hover:text-brand-300"
            >
              −
            </button>
            <button
              type="button"
              title="Wider"
              aria-label="Wider editor"
              onClick={() => applyWidth(currentWidth() + 96, true)}
              className="flex h-6 w-6 items-center justify-center rounded text-sm text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 dark:text-brand-300/70 dark:hover:bg-brand-500/15 dark:hover:text-brand-300"
            >
              +
            </button>
            <button
              type="button"
              title="Full width"
              aria-label="Full width"
              onClick={resetWidth}
              className="flex h-6 w-6 items-center justify-center rounded text-xs text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600 dark:text-brand-300/70 dark:hover:bg-brand-500/15 dark:hover:text-brand-300"
            >
              ⇔
            </button>
          </div>
          {/* Drag hands — resize from either side; double-click for full width */}
          <div
            onPointerDown={(e) => handleResizeStart(e, true)}
            onDoubleClick={resetWidth}
            title="Drag to resize — double-click for full width"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor width"
            className="absolute inset-y-0 left-0 z-10 hidden w-2.5 cursor-ew-resize items-center justify-center md:flex"
          >
            <div className="h-12 w-1 rounded-full bg-ink-300/70 transition-colors hover:bg-brand-400 dark:bg-brand-500/40 dark:hover:bg-brand-400" />
          </div>
          <div
            onPointerDown={handleResizeStart}
            onDoubleClick={resetWidth}
            title="Drag to resize — double-click for full width"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor width"
            className="absolute inset-y-0 right-0 z-10 hidden w-2.5 cursor-ew-resize items-center justify-center md:flex"
          >
            <div className="h-12 w-1 rounded-full bg-ink-300/70 transition-colors hover:bg-brand-400 dark:bg-brand-500/40 dark:hover:bg-brand-400" />
          </div>
        </>
      )}
    </div>
  );
}