"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getConversation,
  subscribeMessages,
  markConversationRead,
  editMessage,
  deleteMessage,
  messageTime,
  renameGroup,
} from "@/services/chat";
import { getUserProfile } from "@/services/users";
import { Avatar } from "@/components/Avatar";
import { Spinner, Modal, Input, Button, EmptyState } from "@/components/ui";
import { useToast } from "@/components/ui/Toaster";
import type { Conversation, Message, UserProfile } from "@/types";
import Composer from "./Composer";

function formatTime(ts: Message["createdAt"]) {
  const ms = messageTime(ts);
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatWindow({
  conversationId,
}: {
  conversationId: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [visibleCount, setVisibleCount] = useState(30);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const isNearBottomRef = useRef(true);
  const profileCacheRef = useRef<Map<string, UserProfile>>(new Map());

  // Fetch conversation metadata
  useEffect(() => {
    setLoading(true);
    getConversation(conversationId).then((c) => {
      setConversation(c);
      setLoading(false);
    });
  }, [conversationId]);

  // Subscribe to messages
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMessages(
      conversationId,
      visibleCount,
      (list) => {
        setMessages(list);
        // Load profiles for message senders
        const uids = new Set<string>();
        list.forEach((m) => {
          if (m.senderId !== user.uid && !profileCacheRef.current.has(m.senderId)) {
            uids.add(m.senderId);
          }
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
  }, [conversationId, visibleCount, user]);

  // Auto-scroll to bottom on new messages if near bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark conversation as read
  useEffect(() => {
    if (!user || !conversation) return;
    const lastAt = conversation.lastMessage?.at;
    if (lastAt) {
      markConversationRead(conversationId, user.uid, lastAt);
    }
  }, [conversationId, user, conversation]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    isNearBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < 80;

    // Load more on scroll to top
    if (
      container.scrollTop < 80 &&
      messages.length === visibleCount &&
      messages.length > 0
    ) {
      const prevScrollHeight = container.scrollHeight;
      setVisibleCount((c) => c + 30);
      // Preserve approximate scroll position
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop =
            containerRef.current.scrollHeight - prevScrollHeight;
        }
      });
    }
  }, [messages.length, visibleCount]);

  async function handleEdit(id: string) {
    if (!editText.trim()) return;
    try {
      await editMessage(conversationId, id, editText.trim());
      setEditingId(null);
      setEditText("");
    } catch {
      toast("Failed to edit message.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteMessage(conversationId, id);
    } catch {
      toast("Failed to delete message.");
    }
  }

  async function handleRename() {
    if (!renameValue.trim()) return;
    try {
      await renameGroup(conversationId, renameValue.trim());
      setConversation((c) =>
        c ? { ...c, name: renameValue.trim() } : c
      );
      setRenameOpen(false);
    } catch {
      toast("Failed to rename group.");
    }
  }

  // Close menu on outside click
  useEffect(() => {
    if (!menuId) return;
    const close = () => setMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuId]);

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
        <EmptyState title="Conversation not found" description="This conversation may have been deleted." />
      </div>
    );
  }

  // Check if current user is a participant
  if (user && !conversation.participantIds.includes(user.uid)) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState title="Access denied" description="You're not a member of this conversation." />
      </div>
    );
  }

  const isGroup = conversation.type === "group";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-ink-200 bg-white px-4 py-3">
        <Link
          href="/chat"
          className="mr-1 rounded-lg p-1 text-ink-500 hover:bg-ink-100 md:hidden"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </Link>

        <Avatar
          name={
            isGroup
              ? conversation.name || "Group"
              : (() => {
                  const otherId = conversation.participantIds.find(
                    (pid) => pid !== user?.uid
                  );
                  return otherId && profiles[otherId]
                    ? profiles[otherId].displayName
                    : "Chat";
                })()
          }
          photoURL={
            !isGroup
              ? (() => {
                  const otherId = conversation.participantIds.find(
                    (pid) => pid !== user?.uid
                  );
                  return otherId && profiles[otherId]
                    ? profiles[otherId].photoURL || undefined
                    : undefined;
                })()
              : undefined
          }
        />

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-ink-900">
            {isGroup
              ? conversation.name || "Group"
              : (() => {
                  const otherId = conversation.participantIds.find(
                    (pid) => pid !== user?.uid
                  );
                  return otherId && profiles[otherId]
                    ? profiles[otherId].displayName
                    : "Chat";
                })()}
          </h2>
          {isGroup && (
            <p className="text-xs text-ink-400">
              {conversation.participantIds.length} members
            </p>
          )}
        </div>

        {isGroup && (
          <button
            onClick={() => {
              setRenameValue(conversation.name || "");
              setRenameOpen(true);
            }}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {visibleCount > messages.length && messages.length > 0 && (
          <div className="mb-4 text-center text-xs text-ink-400">
            Loaded all messages
          </div>
        )}
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              title="No messages yet"
              description="Send the first message to start the conversation."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.senderId === user?.uid;
              const senderProfile = profiles[msg.senderId];

              if (msg.deleted) {
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <p className="text-xs italic text-ink-400">
                      Message deleted
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  {!isOwn && (
                    <Avatar
                      name={senderProfile?.displayName || "U"}
                      photoURL={senderProfile?.photoURL || undefined}
                      size="sm"
                    />
                  )}
                  <div
                    className={`group relative mx-2 max-w-[75%] ${
                      isOwn ? "order-first" : ""
                    }`}
                  >
                    {!isOwn && (
                      <span className="mb-0.5 block text-[11px] font-medium text-ink-500">
                        {senderProfile?.displayName || "User"}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm ${
                        isOwn
                          ? "rounded-br-md bg-brand-500 text-white"
                          : "rounded-bl-md bg-ink-100 text-ink-800"
                      }`}
                    >
                      {editingId === msg.id ? (
                        <div className="flex flex-col gap-1">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="min-h-[60px] resize-none rounded-lg border border-ink-300 bg-white p-1.5 text-sm text-ink-900"
                            autoFocus
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(msg.id)}
                              className="rounded bg-brand-500 px-2 py-0.5 text-xs text-white"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditText("");
                              }}
                              className="rounded bg-ink-200 px-2 py-0.5 text-xs text-ink-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                          {msg.edited && (
                            <span
                              className={`ml-1 text-[10px] ${
                                isOwn ? "text-brand-200" : "text-ink-400"
                              }`}
                            >
                              (edited)
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <div
                      className={`mt-0.5 text-[10px] ${
                        isOwn ? "text-right text-brand-200" : "text-ink-400"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </div>

                    {/* Own message hover menu */}
                    {isOwn && editingId !== msg.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuId(menuId === msg.id ? null : msg.id);
                        }}
                        className="absolute -left-8 top-1 rounded p-1 text-ink-400 opacity-0 transition-opacity hover:text-ink-600 group-hover:opacity-100"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                    )}
                    {isOwn && menuId === msg.id && (
                      <div
                        className="absolute -left-36 top-0 z-10 rounded-lg border border-ink-200 bg-white shadow-pop"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingId(msg.id);
                            setEditText(msg.text);
                            setMenuId(null);
                          }}
                          className="block w-full px-3 py-1.5 text-left text-xs text-ink-700 hover:bg-ink-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(msg.id);
                            setMenuId(null);
                          }}
                          className="block w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <Composer conversationId={conversationId} />

      {/* Rename modal */}
      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Rename group"
      >
        <div className="space-y-3">
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Group name"
            autoFocus
          />
          <Button onClick={handleRename} className="w-full">
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
