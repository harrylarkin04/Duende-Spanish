"use client";

import { motion } from "framer-motion";
import { MessageCircle, Mic, RotateCcw, Send, Sparkles } from "lucide-react";
import * as React from "react";

import { ChatMessageBubble } from "@/components/chat/chat-message-bubble";
import { CompanionPicker } from "@/components/chat/companion-picker";
import { ConversationSummaryCard } from "@/components/chat/conversation-summary-card";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import {
  speechOutputSupported,
  speakText,
  useSpeechRecognition,
} from "@/components/chat/use-web-speech";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import {
  COMPANIONS,
  getCompanion,
  type ChatMessage,
  type CompanionId,
  type ConversationSummary,
} from "@/lib/ai";
import {
  recordChatAssistantMessage,
  recordChatUserMessage,
  recordChatVoiceTurn,
} from "@/lib/progress/chat-stats-local";
function openingLine(companionId: CompanionId): string {
  switch (companionId) {
    case "mexico":
      return "¿Qué onda? Platícame de lo que sea — aquí nadie te juzga, prometido.";
    case "argentina":
      return "Che, qué bueno verte. Tirame una frase en español y seguimos la charla con mate virtual.";
    case "colombia":
      return "Qué tal, parce. Cuéntame qué querés practicar hoy, con calma y buena energía.";
    default:
      return "Hola, corazón. Estoy aquí para charlar, reír un poco y empujarte suave con el español.";
  }
}

export function ChatExperience() {
  const [companionId, setCompanionId] = React.useState<CompanionId>("spain");
  const companion = getCompanion(companionId);

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [summary, setSummary] = React.useState<ConversationSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);

  const listRef = React.useRef<HTMLDivElement>(null);
  const {
    supported: sttSupported,
    listening,
    transcript,
    setTranscript,
    start: startListen,
    stop: stopListen,
  } = useSpeechRecognition(companion.speechLang);

  const [ttsOk, setTtsOk] = React.useState(false);
  React.useEffect(() => {
    setTtsOk(speechOutputSupported());
  }, []);

  React.useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, summaryLoading]);

  React.useEffect(() => {
    setTranscript("");
    stopListen();
  }, [companionId, setTranscript, stopListen]);

  const send = async () => {
    const text = draft.trim();
    if (!text || isTyping) return;
    setDraft("");
    setError(null);
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    const nextMessages = [...messages, userMsg];
    recordChatUserMessage();
    setMessages(nextMessages);
    setIsTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companionId,
          messages: nextMessages,
        }),
      });
      const data = (await res.json()) as {
        content?: string;
        corrections?: ChatMessage["corrections"];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "No se pudo completar el mensaje.");
      const assistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content ?? "",
        createdAt: Date.now(),
        corrections: data.corrections,
      };
      setMessages([...nextMessages, assistant]);
      recordChatAssistantMessage();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setIsTyping(false);
    }
  };

  const generateSummary = async () => {
    if (messages.length < 2) {
      setError("Charlá un poco más — al menos un intercambio — y vuelve a intentar.");
      return;
    }
    setSummaryLoading(true);
    setSummary(null);
    setError(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companionId,
          messages,
        }),
      });
      const data = (await res.json()) as ConversationSummary & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo generar el resumen.");
      setSummary({
        grammarNotes: data.grammarNotes ?? [],
        vocabulary: data.vocabulary ?? [],
        culturalTips: data.culturalTips ?? [],
        encouragement: data.encouragement ?? "¡Seguís brillando!",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      stopListen();
      if (transcript.trim()) {
        recordChatVoiceTurn();
        setDraft((d) => `${d}${d && !d.endsWith(" ") ? " " : ""}${transcript.trim()}`.trim());
        setTranscript("");
      }
    } else {
      setTranscript("");
      startListen();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSummary(null);
    setDraft("");
    setError(null);
    stopListen();
    setTranscript("");
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-8">
      <div className="mb-4 flex justify-end">
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={resetChat}>
          <RotateCcw className="size-3.5" />
          Nueva charla
        </Button>
      </div>

      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/25 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
          <MessageCircle className="size-3.5" />
          Compañeros AI
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Tu amigo español, siempre prendido
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Texto o voz (navegador). El alma del acento cambia con quien elijas.
        </p>
      </motion.header>

      <CompanionPicker companions={COMPANIONS} value={companionId} onChange={setCompanionId} />

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-fiesta-gold/20 bg-card/40 p-4 backdrop-blur-sm">
        <motion.span
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-fiesta-crimson/40 to-fiesta-orange/20 text-3xl shadow-inner"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          aria-hidden
        >
          {companion.flag}
        </motion.span>
        <div>
          <p className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground">
            {companion.name}
          </p>
          <p className="text-sm text-muted-foreground">{companion.tagline}</p>
        </div>
      </div>

      {messages.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 rounded-xl border border-dashed border-fiesta-gold/25 bg-muted/20 p-4 text-center text-sm italic text-muted-foreground"
        >
          {openingLine(companionId)}
        </motion.p>
      )}

      <div
        ref={listRef}
        className="mt-6 flex max-h-[min(52vh,28rem)] min-h-[12rem] flex-col gap-4 overflow-y-auto rounded-2xl border border-border/50 bg-background/30 p-4 backdrop-blur-sm"
      >
        {messages.map((m) => (
          <ChatMessageBubble
            key={m.id}
            message={m}
            speechLang={companion.speechLang}
            onSpeak={speakText}
            canSpeak={ttsOk}
          />
        ))}
        {isTyping && <TypingIndicator />}
      </div>

      {error && (
        <div className="mt-3">
          <ErrorState
            title="No se pudo completar"
            message={error}
            onRetry={() => setError(null)}
            retryLabel="Cerrar aviso"
          />
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 max-md:bottom-[calc(4.65rem+env(safe-area-inset-bottom))] border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-lg md:static md:z-0 md:mt-4 md:rounded-2xl md:border md:bg-card/60 md:py-4">
        {listening && transcript && (
          <p className="mb-2 text-xs italic text-fiesta-gold">Escuchando: {transcript}</p>
        )}
        <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            disabled={isTyping}
            rows={2}
            aria-label={`Mensaje para ${companion.name}`}
            placeholder={`Escribe a ${companion.name}…`}
            className="min-h-[3rem] w-full flex-1 resize-none rounded-xl border border-input bg-background/90 px-3 py-2.5 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:border-fiesta-gold/40 focus-visible:ring-2 focus-visible:ring-fiesta-gold/25 disabled:opacity-50"
          />
          <div className="flex gap-2 sm:flex-col">
            <Button
              type="button"
              variant={listening ? "destructive" : "secondary"}
              size="lg"
              className="flex-1 sm:w-full"
              disabled={!sttSupported || isTyping}
              onClick={toggleMic}
              title={sttSupported ? "Entrada de voz (Web Speech)" : "Voz no disponible en este navegador"}
            >
              <Mic className="size-4" data-icon="inline-start" />
              {listening ? "Parar" : "Voz"}
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1 shadow-lg shadow-fiesta-crimson/20 sm:w-full"
              disabled={isTyping || !draft.trim()}
              onClick={() => void send()}
            >
              <Send className="size-4" data-icon="inline-start" />
              Enviar
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-fiesta-gold/30"
            disabled={summaryLoading || messages.length < 2}
            onClick={() => void generateSummary()}
          >
            <Sparkles className="size-3.5" data-icon="inline-start" />
            Resumen de la charla
          </Button>
          <p className="w-full text-center text-[10px] text-muted-foreground sm:w-auto sm:text-left">
            OpenAI / Grok: variables en servidor · sin key, modo mock cálido.
          </p>
        </div>
      </div>

      <ConversationSummaryCard
        summary={summary}
        loading={summaryLoading}
        onDismiss={() => setSummary(null)}
      />
    </div>
  );
}
