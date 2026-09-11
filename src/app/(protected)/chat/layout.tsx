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
      <div className="hidden w-64 shrink-0 border-r border-ink-200 dark:border-gray-800 md:block lg:w-80">
        <ConversationList />
      </div>
      {/* Content — full width on mobile, flex-1 on desktop */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
