"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
  subscribeConversations,
  messageTime,
} from "@/services/chat";
import { subscribeNotes, countNotes } from "@/services/notes";
import { Avatar } from "@/components/Avatar";
import { getUserProfile } from "@/services/users";
import { Spinner, EmptyState } from "@/components/ui";
import type { Conversation, Note, UserProfile } from "@/types";

function relativeTime(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteCount, setNoteCount] = useState(0);
  const [convCount, setConvCount] = useState(0);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let loaded = 0;
    const done = () => {
      loaded++;
      if (loaded >= 2) setLoading(false);
    };

    const unsubConv = subscribeConversations(
      user.uid,
      (list) => {
        setConversations(list.slice(0, 4));
        setConvCount(list.length);
        done();
        // Load profiles
        const uids = new Set<string>();
        list.forEach((c) =>
          c.participantIds.forEach((pid) => {
            if (pid !== user.uid) uids.add(pid);
          })
        );
        const uidArr = Array.from(uids);
        Promise.allSettled(uidArr.map((uid) => getUserProfile(uid))).then(
          (results) => {
            const updates: Record<string, UserProfile> = {};
            results.forEach((r, i) => {
              if (r.status === "fulfilled" && r.value) {
                updates[uidArr[i]] = r.value;
              }
            });
            setProfiles((prev) => ({ ...prev, ...updates }));
          }
        );
      },
      () => done()
    );

    const unsubNotes = subscribeNotes(
      user.uid,
      (list) => {
        setNotes(list.filter((n) => !n.archived).slice(0, 4));
        setNoteCount(list.length);
        done();
      },
      () => done()
    );

    return () => {
      unsubConv();
      unsubNotes();
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-20 md:pb-0">
      <div className="px-6 py-6">
        {/* Greeting */}
        <h1 className="text-2xl font-bold text-ink-900">
          Hello, {profile?.displayName || user.displayName || "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Welcome to your Chatmat workspace.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-6 w-6 text-brand-500" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Conversations
                </p>
                <p className="mt-1 text-2xl font-bold text-ink-900">
                  {convCount}
                </p>
              </div>
              <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Notes
                </p>
                <p className="mt-1 text-2xl font-bold text-ink-900">
                  {noteCount}
                </p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-6 flex gap-3">
              <Link
                href="/chat"
                className="flex-1 rounded-xl border border-ink-200 bg-white px-4 py-3 text-center text-sm font-medium text-ink-700 shadow-card transition-colors hover:bg-ink-50"
              >
                💬 New Chat
              </Link>
              <Link
                href="/notes"
                className="flex-1 rounded-xl border border-ink-200 bg-white px-4 py-3 text-center text-sm font-medium text-ink-700 shadow-card transition-colors hover:bg-ink-50"
              >
                📝 New Note
              </Link>
            </div>

            {/* Recent conversations */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink-800">
                  Recent Chats
                </h2>
                {conversations.length > 0 && (
                  <Link
                    href="/chat"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    View all
                  </Link>
                )}
              </div>
              {conversations.length === 0 ? (
                <EmptyState
                  title="No conversations yet"
                  description="Start chatting with someone."
                  action={
                    <Link
                      href="/chat"
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                    >
                      Start a chat
                    </Link>
                  }
                />
              ) : (
                <div className="mt-2 space-y-2">
                  {conversations.map((c) => {
                    const title =
                      c.type === "group"
                        ? c.name || "Group"
                        : (() => {
                            const otherId = c.participantIds.find(
                              (pid) => pid !== user.uid
                            );
                            return otherId && profiles[otherId]
                              ? profiles[otherId].displayName
                              : "Chat";
                          })();
                    const photo =
                      c.type === "group"
                        ? ""
                        : (() => {
                            const otherId = c.participantIds.find(
                              (pid) => pid !== user.uid
                            );
                            return otherId && profiles[otherId]
                              ? profiles[otherId].photoURL
                              : "";
                          })();
                    return (
                      <Link
                        key={c.id}
                        href={`/chat/${c.id}`}
                        className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-card transition-colors hover:bg-ink-50"
                      >
                        <Avatar
                          name={title}
                          photoURL={photo || undefined}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-medium text-ink-800">
                            {title}
                          </h4>
                          <p className="truncate text-xs text-ink-400">
                            {c.lastMessage?.text || "No messages"}
                          </p>
                        </div>
                        {c.lastMessage && (
                          <span className="shrink-0 text-[10px] text-ink-400">
                            {relativeTime(c.lastMessage.at)}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent notes */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink-800">
                  Recent Notes
                </h2>
                {notes.length > 0 && (
                  <Link
                    href="/notes"
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    View all
                  </Link>
                )}
              </div>
              {notes.length === 0 ? (
                <EmptyState
                  title="No notes yet"
                  description="Create your first note."
                  action={
                    <Link
                      href="/notes"
                      className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                    >
                      Create a note
                    </Link>
                  }
                />
              ) : (
                <div className="mt-2 space-y-2">
                  {notes.map((n) => (
                    <Link
                      key={n.id}
                      href="/notes"
                      className="block rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-card transition-colors hover:bg-ink-50"
                    >
                      <h4 className="truncate text-sm font-medium text-ink-800">
                        {n.title || "Untitled"}
                      </h4>
                      <p className="mt-0.5 truncate text-xs text-ink-400">
                        {n.content || "Empty note"} · {relativeTime(n.updatedAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
