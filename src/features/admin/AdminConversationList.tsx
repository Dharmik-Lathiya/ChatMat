"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeAllConversations } from "@/services/admin";
import { getUserProfile } from "@/services/users";
import { Avatar } from "@/components/Avatar";
import { Spinner } from "@/components/ui";
import type { Conversation, UserProfile } from "@/types";

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

export default function AdminConversationList({
  activeId,
  onSelect,
}: {
  activeId?: string;
  onSelect: (conversation: Conversation) => void;
}) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const profileCache = useRef<Map<string, UserProfile>>(new Map());

  const loadProfiles = useCallback(async (convos: Conversation[]) => {
    const needed = new Set<string>();
    for (const c of convos) {
      for (const pid of c.participantIds) {
        if (!profileCache.current.has(pid)) needed.add(pid);
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
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeAllConversations(
      (list) => {
        setConversations(list);
        setLoading(false);
        loadProfiles(list);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [loadProfiles]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-200 px-4 py-3 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-ink-900 dark:text-white">All conversations</h2>
        <p className="mt-0.5 text-xs text-ink-400 dark:text-gray-500">
          Read-only view · {conversations.length} shown
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="h-5 w-5 text-brand-500" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-ink-400 dark:text-gray-500">
            No conversations found.
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeId;
            const isGroup = c.type === "group";
            const otherUids = c.participantIds.filter(
              (pid) => !(user && pid === user.uid)
            );
            const title = isGroup
              ? c.name || "Group"
              : (otherUids
                  .map((u) => profiles[u]?.displayName)
                  .filter(Boolean)
                  .join(", ") || "Chat");
            const photo =
              !isGroup && otherUids[0]
                ? profiles[otherUids[0]]?.photoURL || ""
                : "";
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`flex w-full items-center gap-3 border-b border-ink-100 px-4 py-3 text-left transition-colors dark:border-gray-800 ${
                  isActive ? "bg-brand-50 dark:bg-brand-900/20" : "hover:bg-ink-50 dark:hover:bg-white/5"
                }`}
              >
                <Avatar name={title} photoURL={photo || undefined} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink-800 dark:text-gray-100">
                      {title}
                    </span>
                    <span className="truncate text-[10px] uppercase tracking-wide text-ink-400 dark:text-gray-500">
                      {isGroup ? "group" : "direct"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-ink-400 dark:text-gray-500">
                      {c.lastMessage?.text || "No messages"}
                    </span>
                    {c.lastMessage && (
                      <span className="shrink-0 text-[11px] text-ink-400 dark:text-gray-500">
                        {relativeTime(c.lastMessage.at)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
