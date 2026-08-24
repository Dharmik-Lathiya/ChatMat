"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { searchUsers } from "@/services/users";
import {
  openDirectConversation,
  createGroupConversation,
} from "@/services/chat";
import { Avatar } from "@/components/Avatar";
import { Input, Button, Modal } from "@/components/ui";
import type { UserProfile } from "@/types";

export default function NewChatModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(
    (term: string) => {
      if (!user) return;
      clearTimeout(timer.current);
      if (term.trim().length < 2) {
        setResults([]);
        return;
      }
      timer.current = setTimeout(async () => {
        const users = await searchUsers(term, user.uid);
        setResults(users);
      }, 300);
    },
    [user]
  );

  function toggle(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function handleCreate() {
    if (!user) return;
    const ids = Array.from(selected);
    setLoading(true);
    try {
      if (ids.length === 1) {
        const id = await openDirectConversation(user.uid, ids[0]);
        router.push(`/chat/${id}`);
        onCreated?.(id);
      } else {
        const id = await createGroupConversation(groupName, [
          user.uid,
          ...ids,
        ]);
        router.push(`/chat/${id}`);
        onCreated?.(id);
      }
    } catch {
      // errors handled by UI
    } finally {
      setLoading(false);
    }
  }

  const isGroup = selected.size >= 2;

  return (
    <Modal open onClose={onClose} title="New conversation">
      <div className="space-y-4">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            doSearch(e.target.value);
          }}
        />

        {results.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-ink-200">
            {results.map((u) => (
              <button
                key={u.uid}
                onClick={() => toggle(u.uid)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  selected.has(u.uid)
                    ? "bg-brand-50"
                    : "hover:bg-ink-50"
                }`}
              >
                <Avatar name={u.displayName} photoURL={u.photoURL || undefined} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink-800">
                    {u.displayName}
                  </div>
                  <div className="truncate text-xs text-ink-400">
                    {u.email}
                  </div>
                </div>
                <div
                  className={`h-4 w-4 rounded-full border-2 ${
                    selected.has(u.uid)
                      ? "border-brand-500 bg-brand-500"
                      : "border-ink-300"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {search.trim().length >= 2 && results.length === 0 && (
          <p className="text-center text-sm text-ink-400">No users found.</p>
        )}

        {isGroup && (
          <Input
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        )}

        <Button
          onClick={handleCreate}
          loading={loading}
          disabled={
            selected.size === 0 || (isGroup && !groupName.trim())
          }
          className="w-full"
        >
          {selected.size === 1 ? "Start chat" : `Create group (${selected.size})`}
        </Button>
      </div>
    </Modal>
  );
}
