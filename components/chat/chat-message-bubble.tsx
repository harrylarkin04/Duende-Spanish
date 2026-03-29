"use client";

import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChatMessage, CorrectionSpan } from "@/lib/ai";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  speechLang: string;
  onSpeak?: (text: string, lang: string) => void;
  canSpeak?: boolean;
};

export function ChatMessageBubble({
  message,
  speechLang,
  onSpeak,
  canSpeak,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={`flex w-full flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}
    >
      <div
        className={`relative max-w-[90%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-md sm:max-w-[85%] ${
          isUser
            ? "rounded-br-md bg-linear-to-br from-fiesta-crimson to-fiesta-crimson/85 text-primary-foreground shadow-fiesta-crimson/25"
            : "rounded-bl-md border border-fiesta-gold/25 bg-card/90 text-foreground backdrop-blur-md"
        }`}
      >
        {!isUser && canSpeak && onSpeak && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute -right-1 -top-1 border border-fiesta-gold/20 bg-background/80 text-fiesta-gold hover:bg-fiesta-crimson/20"
            aria-label="Leer mensaje en voz alta"
            onClick={() => onSpeak(message.content, speechLang)}
          >
            <Volume2 className="size-3.5" />
          </Button>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>

      {!isUser && message.corrections && message.corrections.length > 0 && (
        <CorrectionPanel items={message.corrections} />
      )}
    </motion.div>
  );
}

function CorrectionPanel({ items }: { items: CorrectionSpan[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="w-full max-w-[90%] overflow-hidden sm:max-w-[85%]"
    >
      <div className="rounded-xl border border-fiesta-gold/35 bg-fiesta-crimson/10 px-3 py-2.5 text-xs backdrop-blur-sm">
        <p className="mb-2 font-semibold uppercase tracking-wider text-fiesta-gold">
          Duende te afina ✨
        </p>
        <ul className="space-y-2">
          {items.map((c, i) => (
            <li key={i} className="rounded-lg bg-background/40 p-2">
              <p className="text-muted-foreground line-through decoration-fiesta-orange/70">
                {c.original}
              </p>
              <p className="mt-1 font-medium text-fiesta-gold">{c.corrected}</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{c.tip}</p>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
