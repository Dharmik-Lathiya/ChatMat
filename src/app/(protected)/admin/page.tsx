"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui";
import AdminConversationList from "@/features/admin/AdminConversationList";
import AdminChatView from "@/features/admin/AdminChatView";
import AdminNotesList from "@/features/admin/AdminNotesList";
import type { Conversation } from "@/types";

type Tab = "conversations" | "notes";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("conversations");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  function handleSelectConversation(conversation: Conversation) {
    setSelected(conversation);
    setTab("conversations");
    setMobileView("chat");
  }

  function handleBackToList() {
    setSelected(null);
    setMobileView("list");
  }

  return (
    <div className="flex h-full">
      {/* List pane */}
      <div
        className={`flex h-full w-full flex-col border-r border-ink-200 dark:border-gray-800 md:w-80 ${
          mobileView === "chat" && selected && tab === "conversations"
            ? "hidden md:flex"
            : "flex"
        }`}
      >
        {/* Tabs */}
        <div className="flex border-b border-ink-200 dark:border-gray-800">
          <button
            onClick={() => {
              setTab("conversations");
              setMobileView("list");
            }}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${
              tab === "conversations"
                ? "border-b-2 border-brand-500 text-brand-700 dark:text-brand-400"
                : "text-ink-500 hover:text-ink-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => {
              setTab("notes");
              setSelected(null);
              setMobileView("list");
            }}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${
              tab === "notes"
                ? "border-b-2 border-brand-500 text-brand-700 dark:text-brand-400"
                : "text-ink-500 hover:text-ink-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Public Notes
          </button>
        </div>

        {tab === "conversations" ? (
          <AdminConversationList
            activeId={selected?.id}
            onSelect={handleSelectConversation}
          />
        ) : (
          <AdminNotesList />
        )}
      </div>

      {/* Detail pane */}
      <div
        className={`flex h-full flex-1 flex-col ${
          mobileView === "list" || !selected ? "hidden md:flex" : "flex"
        }`}
      >
        {tab === "conversations" && selected ? (
          <AdminChatView
            conversationId={selected.id}
            onBack={handleBackToList}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              title={
                tab === "conversations"
                  ? "Select a conversation"
                  : "Public notes"
              }
              description={
                tab === "conversations"
                  ? "Choose any conversation from the list to view it read-only."
                  : "All public notes are listed on the left. Click one to open its shared link."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
