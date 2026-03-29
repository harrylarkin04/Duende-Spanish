import type { Metadata } from "next";

import { ChatExperience } from "@/components/chat/chat-experience";

export const metadata: Metadata = {
  title: "Compañeros AI — Duende",
  description:
    "Voice and text chat with passionate Spanish-native AI companions. Accents from Spain, Mexico, Argentina, and Colombia.",
};

export default function ChatPage() {
  return <ChatExperience />;
}
