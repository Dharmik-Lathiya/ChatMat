"use client";

import { useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sendMessage } from "@/services/chat";
import { uploadConversationFile } from "@/services/storage";
import { useToast } from "@/components/ui/Toaster";
import { Spinner } from "@/components/ui";

export default function Composer({
  conversationId,
}: {
  conversationId: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  const handleSend = useCallback(async () => {
    if (!user) return;
    const trimmed = text.trim();
    if (!trimmed && !pendingFile) return;
    setSending(true);
    try {
      let file: { url: string; name: string; size: number; type: string } | undefined;
      if (pendingFile) {
        setUploading(true);
        file = await uploadConversationFile(conversationId, pendingFile);
        setUploading(false);
      }
      await sendMessage({
        conversationId,
        senderId: user.uid,
        text: trimmed,
        file,
      });
      setText("");
      setPendingFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      toast("Failed to send message. Please try again.");
    } finally {
      setSending(false);
      setUploading(false);
    }
  }, [text, pendingFile, user, conversationId, toast]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-ink-200 bg-white px-4 py-3">
      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-1.5 text-xs text-ink-600">
          <span className="truncate">{pendingFile.name}</span>
          <button
            onClick={() => setPendingFile(null)}
            className="ml-auto shrink-0 text-ink-400 hover:text-ink-600"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPendingFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="shrink-0 rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
          disabled={uploading || sending}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || uploading || (!text.trim() && !pendingFile)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:bg-brand-300"
        >
          {uploading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
