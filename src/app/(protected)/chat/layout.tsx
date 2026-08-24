"use client";

import ConversationList from "@/features/chat/ConversationList";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      {/* Desktop sidebar — always visible */}
      <div className="hidden w-80 shrink-0 border-r border-ink-200 md:block">
        <ConversationList />
      </div>
      {/* Content — full width on mobile, flex-1 on desktop */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
