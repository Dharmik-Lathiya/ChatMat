"use client";

import { useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { useAuth } from "@/hooks/useAuth";
import { sendMessage } from "@/services/chat";
import { setTyping } from "@/services/presence";
import { useToast } from "@/components/ui/Toaster";
import { TipTapEditor } from "@/components/editor/TipTapEditor";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export default function Composer({
  conversationId,
}: {
  conversationId: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const typingRef = useRef(false);
  const editorRef = useRef<Editor | null>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  const handleInit = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  const handleAttach = useCallback(
    (type: "image" | "video", file: File | undefined) => {
      if (!file) return;
      const editor = editorRef.current;
      if (!editor) return;
      void fileToDataUrl(file)
        .then((src) => {
          if (type === "video") {
            editor.chain().focus().setVideo({ src }).run();
          } else {
            editor.chain().focus().setImage({ src }).run();
          }
        })
        .catch(() => toast("Could not attach file. Please try again."));
    },
    [toast]
  );

  const handleSend = useCallback(async () => {
    if (!user) return;
    const editor = editorRef.current;
    if (!editor) return;
    const html = editor.getHTML();
    const plain = editor.getText().trim();
    const hasMedia = (editor.getJSON().content ?? []).some(
      (n) => n.type === "image" || n.type === "video"
    );
    if (!plain && !hasMedia) return;
    try {
      await sendMessage({
        conversationId,
        senderId: user.uid,
        text: plain,
        html,
        plainText: plain,
      });
      editor.commands.clearContent();
      if (typingRef.current) {
        setTyping(conversationId, user.uid, false);
        typingRef.current = false;
      }
    } catch {
      toast("Failed to send message. Please try again.");
    }
  }, [user, conversationId, toast]);

  const handleTyping = useCallback(
    (hasContent: boolean) => {
      if (!user) return;
      if (typingRef.current !== hasContent) {
        typingRef.current = hasContent;
        setTyping(conversationId, user.uid, hasContent);
      }
    },
    [user, conversationId]
  );

  const onChange = useCallback(
    () => {
      handleTyping((editorRef.current?.getText().trim().length ?? 0) > 0);
    },
    [handleTyping]
  );

  return (
    <div className="border-t border-ink-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-black">
      <input
        ref={imageFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleAttach("image", e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={videoFileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          handleAttach("video", e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="flex items-end gap-1.5">
        <div className="flex flex-col gap-0.5 pb-0.5">
          <button
            onClick={() => imageFileRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-200/60 hover:text-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-200"
            title="Attach image"
            type="button"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
          <button
            onClick={() => videoFileRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-200/60 hover:text-ink-600 dark:hover:bg-ink-700 dark:hover:text-ink-200"
            title="Attach video"
            type="button"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="14" height="14" rx="2" ry="2" />
              <path d="M16 10l6-4v12l-6-4" />
            </svg>
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <TipTapEditor
            content=""
            onChange={onChange}
            placeholder="Type a message..."
            toolbar={false}
            minHeight="min-h-[36px]"
            autoFocus
            sync={false}
            onSubmit={handleSend}
            onInit={handleInit}
          />
        </div>
        <button
          onClick={() => void handleSend()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition-colors hover:bg-brand-600"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}