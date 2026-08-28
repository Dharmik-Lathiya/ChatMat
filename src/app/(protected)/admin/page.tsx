"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui";
import AdminConversationList from "@/features/admin/AdminConversationList";
import AdminChatView from "@/features/admin/AdminChatView";
import type { Conversation } from "@/types";

export default function AdminPage() {
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  function handleSelect(conversation: Conversation) {
    setSelected(conversation);
    setMobileView("chat");
  }

  return (
    <div className="flex h-full">
      {/* List pane */}
      <div
        className={`flex h-full w-full flex-col border-r border-ink-200 md:w-80 ${
          mobileView === "chat" && selected ? "hidden md:flex" : "flex"
        }`}
      >
        <AdminConversationList
          activeId={selected?.id}
          onSelect={handleSelect}
        />
      </div>

      {/* Detail pane */}
      <div
        className={`flex h-full flex-1 flex-col ${
          mobileView === "list" || !selected ? "hidden md:flex" : "flex"
        }`}
      >
        {selected ? (
          <AdminChatView conversationId={selected.id} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              title="Select a conversation"
              description="Choose any conversation from the list to view it read-only."
            />
          </div>
        )}
      </div>
    </div>
  );
}
