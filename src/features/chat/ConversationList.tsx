"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { subscribeConversations } from "@/services/chat";
import { getUserProfile } from "@/services/users";
import { Avatar } from "@/components/Avatar";
import { Spinner } from "@/components/ui";
import type { Conversation, UserProfile } from "@/types";
import NewChatModal from "./NewChatModal";

function relativeTime(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function ConversationList() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const profileCache = useRef<Map<string, UserProfile>>(new Map());

  const loadProfiles = useCallback(
    async (convos: Conversation[]) => {
      if (!user) return;
      const needed = new Set<string>();
      for (const c of convos) {
        for (const pid of c.participantIds) {
          if (pid !== user.uid && !profileCache.current.has(pid)) {
            needed.add(pid);
          }
        }
      }
      if (needed.size === 0) return;

      const neededArr = Array.from(needed);
      const results = await Promise.allSettled(
        neededArr.map((uid) => getUserProfile(uid))
      );
      const updates: Record<string, UserProfile> = {};
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value) {
          profileCache.current.set(neededArr[i], r.value);
          updates[neededArr[i]] = r.value;
        }
      });
      if (Object.keys(updates).length > 0) {
        setProfiles((prev) => ({ ...prev, ...updates }));
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeConversations(
      user.uid,
      (list) => {
        setConversations(list);
        setLoading(false);
        loadProfiles(list);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [user, loadProfiles]);

  function getTitle(c: Conversation) {
    if (c.type === "group") return c.name || "Group";
    const otherId = c.participantIds.find((pid) => pid !== user?.uid);
    if (otherId && profiles[otherId]) return profiles[otherId].displayName;
    return "Chat";
  }

  function getPhoto(c: Conversation) {
    if (c.type === "group") return "";
    const otherId = c.participantIds.find((pid) => pid !== user?.uid);
    if (otherId && profiles[otherId]) return profiles[otherId].photoURL;
    return "";
  }

  function getOtherUid(c: Conversation) {
    if (c.type === "group") return "";
    return c.participantIds.find((pid) => pid !== user?.uid) || "";
  }

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink-900">Messages</h2>
          <button
            onClick={() => setShowNewChat(true)}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600"
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner className="h-5 w-5 text-brand-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-ink-400">
              No conversations yet.
              <br />
              Start one by tapping + New above.
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = pathname === `/chat/${c.id}`;
              const title = getTitle(c);
              const photo = getPhoto(c);
              const isUnread =
                c.lastMessage &&
                c.lastMessage.senderId !== user?.uid &&
                (c.lastMessage.at > (c.readAt?.[user?.uid || ""] || 0));
              return (
                <Link
                  key={c.id}
                  href={`/chat/${c.id}`}
                  className={`flex items-center gap-3 border-b border-ink-100 px-4 py-3 transition-colors ${
                    isActive ? "bg-brand-50" : "hover:bg-ink-50"
                  }`}
                >
                  <Avatar
                    name={title}
                    photoURL={photo || undefined}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`truncate text-sm ${
                          isUnread ? "font-semibold text-ink-900" : "font-medium text-ink-700"
                        }`}
                      >
                        {title}
                      </span>
                      {c.lastMessage && (
                        <span className="ml-2 shrink-0 text-[11px] text-ink-400">
                          {relativeTime(c.lastMessage.at)}
                        </span>
                      )}
                    </div>
                    {c.lastMessage && (
                      <p
                        className={`mt-0.5 truncate text-xs ${
                          isUnread ? "font-medium text-ink-700" : "text-ink-400"
                        }`}
                      >
                        {c.lastMessage.text || "File"}
                      </p>
                    )}
                  </div>
                  {isUnread && (
                    <span className="ml-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={(id) => {
            setShowNewChat(false);
            // Navigation handled by Link in the list
          }}
        />
      )}
    </>
  );
}
