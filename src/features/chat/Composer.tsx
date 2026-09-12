"use client";

import { useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { useAuth } from "@/hooks/useAuth";
import { sendMessage } from "@/services/chat";
import { setTyping } from "@/services/presence";
import { useToast } from "@/components/ui/Toaster";
import { TipTapEditor } from "@/components/editor/TipTapEditor";

export default function Composer({
  conversationId,
}: {
  conversationId: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const typingRef = useRef(false);
  const editorRef = useRef<Editor | null>(null);

  const handleInit = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  const handleSend = useCallback(async () => {
    if (!user) return;
    const editor = editorRef.current;
    if (!editor) return;
    const html = editor.getHTML();
    const plain = editor.getText().trim();
    if (!plain) return;
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
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TipTapEditor
            content=""
            onChange={onChange}
            placeholder="Type a message..."
            toolbar={false}
            minHeight="min-h-[40px]"
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