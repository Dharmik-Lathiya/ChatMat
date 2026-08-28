"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeAllMessages } from "@/services/admin";
import { getConversation, messageTime } from "@/services/chat";
import { getUserProfile } from "@/services/users";
import { Avatar } from "@/components/Avatar";
import { Spinner, EmptyState } from "@/components/ui";
import type { Conversation, Message, UserProfile } from "@/types";

function formatTime(ts: Message["createdAt"]) {
  const ms = messageTime(ts);
  if (!ms) return "";
  return new Date(ms).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminChatView({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [visibleCount, setVisibleCount] = useState(50);
  const [loading, setLoading] = useState(true);
  const profileCacheRef = useRef<Map<string, UserProfile>>(new Map());

  useEffect(() => {
    setLoading(true);
    getConversation(conversationId).then((c) => {
      setConversation(c);
      setLoading(false);
    });
  }, [conversationId]);

  useEffect(() => {
    const unsub = subscribeAllMessages(
      conversationId,
      visibleCount,
      (list) => {
        setMessages(list);
        const uids = new Set<string>();
        list.forEach((m) => {
          if (!profileCacheRef.current.has(m.senderId)) uids.add(m.senderId);
        });
        if (uids.size > 0) {
          const uidArr = Array.from(uids);
          Promise.allSettled(uidArr.map((uid) => getUserProfile(uid))).then(
            (results) => {
              const updates: Record<string, UserProfile> = {};
              results.forEach((r, i) => {
                if (r.status === "fulfilled" && r.value) {
                  profileCacheRef.current.set(uidArr[i], r.value);
                  updates[uidArr[i]] = r.value;
                }
              });
              if (Object.keys(updates).length > 0) {
                setProfiles((prev) => ({ ...prev, ...updates }));
              }
            }
          );
        }
      },
      () => {}
    );
    return unsub;
  }, [conversationId, visibleCount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [conversationId, messages.length]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-6 w-6 text-brand-500" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          title="Conversation not found"
          description="This conversation may have been deleted."
        />
      </div>
    );
  }

  const isGroup = conversation.type === "group";
  const title = isGroup
    ? conversation.name || "Group"
    : (conversation.participantIds
        .map((pid) => profiles[pid]?.displayName)
        .filter(Boolean)
        .join(", ") || "Chat");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-ink-200 bg-white px-4 py-3">
        <button
          onClick={onBack ? onBack : () => router.push("/admin")}
          className="mr-1 rounded-lg p-1 text-ink-500 hover:bg-ink-100 md:hidden"
          aria-label="Back to admin"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
        <Avatar name={title} size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-ink-900">
            {title}
          </h2>
          <p className="text-xs text-ink-400">
            {isGroup
              ? `${conversation.participantIds.length} members`
              : "Direct conversation"}
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
          Read-only
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              title="No messages"
              description="This conversation has no messages yet."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {messages
              .filter((msg) => !msg.deleted)
              .map((msg) => {
                const sender = profiles[msg.senderId];
                return (
                  <div key={msg.id} className="flex items-start gap-2">
                    <Avatar
                      name={sender?.displayName || "U"}
                      photoURL={sender?.photoURL || undefined}
                      size="sm"
                    />
                    <div className="max-w-[75%]">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-semibold text-ink-700">
                          {sender?.displayName || "Unknown user"}
                        </span>
                        <span className="text-[10px] text-ink-400">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 rounded-2xl rounded-bl-md bg-ink-100 px-3.5 py-2 text-sm text-ink-800">
                        <p className="whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>
                        {msg.file && (
                          <a
                            href={msg.file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block max-w-full truncate rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-brand-600 underline"
                          >
                            {msg.file.name}
                          </a>
                        )}
                        {msg.edited && (
                          <span className="ml-1 text-[10px] text-ink-400">
                            (edited)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
