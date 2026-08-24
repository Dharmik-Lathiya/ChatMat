"use client";

import { use } from "react";
import ChatWindow from "@/features/chat/ChatWindow";

export default function ChatIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ChatWindow conversationId={id} />;
}
