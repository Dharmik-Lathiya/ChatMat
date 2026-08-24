"use client";

import { EmptyState } from "@/components/ui";
import ConversationList from "@/features/chat/ConversationList";

export default function ChatPage() {
  return (
    <>
      {/* Desktop: empty state placeholder (layout provides sidebar) */}
      <div className="hidden h-full items-center justify-center md:flex">
        <EmptyState
          title="Select a conversation"
          description="Choose a chat from the sidebar or start a new one."
        />
      </div>
      {/* Mobile: full-width conversation list (no sidebar on mobile) */}
      <div className="h-full md:hidden">
        <ConversationList />
      </div>
    </>
  );
}
