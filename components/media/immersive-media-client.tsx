"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bookmark,
  BookOpen,
  ChevronDown,
  Headphones,
  Loader2,
  Trash2,
  Volume2,
  X,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { speechOutputSupported } from "@/components/chat/use-web-speech";
import type { ReaderTranslateResult } from "@/lib/ai/types";
import { MEDIA_PASSAGES, type MediaPassage } from "@/lib/media/passages";
import {
  listSavedReaderWords,
  removeSavedReaderWord,
  saveReaderWord,
  type SavedReaderWord,
} from "@/lib/media/saved-words";
import {
  segmentTranscript,
  sentenceAt,
  type TranscriptSegment,
} from "@/lib/media/segment-transcript";
import { cn } from "@/lib/utils";

type LookupState =
  | { status: "idle" }
  | { status: "loading"; surface: string }
  | { status: "error"; message: string }
  | {
      status: "ready";
      surface: string;
      sentence: string;
      result: ReaderTranslateResult;
    };

export function ImmersiveMediaClient() {
  const reduce = useReducedMotion();
  const [passageId, setPassageId] = React.useState(MEDIA_PASSAGES[0]!.id);
  const passage = React.useMemo(
    () => MEDIA_PASSAGES.find((p) => p.id === passageId) ?? MEDIA_PASSAGES[0]!,
    [passageId],
  );

  const segments = React.useMemo(
    () => segmentTranscript(passage.text),
    [passage.text],
  );

  const [lookup, setLookup] = React.useState<LookupState>({ status: "idle" });
  const [savedOpen, setSavedOpen] = React.useState(false);
  const [saved, setSaved] = React.useState<SavedReaderWord[]>([]);
  const [ttsOk, setTtsOk] = React.useState(false);
  const [speaking, setSpeaking] = React.useState(false);

  React.useEffect(() => {
    setTtsOk(speechOutputSupported());
  }, []);

  const refreshSaved = React.useCallback(() => {
    setSaved(listSavedReaderWords());
  }, []);

  React.useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  React.useEffect(() => {
    setLookup({ status: "idle" });
  }, [passage.id]);

  const playListening = () => {
    if (!ttsOk || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = passage.text.replace(/\s+/g, " ").trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = passage.speechLang;
    u.rate = 0.92;
    u.pitch = 1.02;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const onWordTap = async (seg: Extract<TranscriptSegment, { kind: "word" }>) => {
    const sentence = sentenceAt(passage.text, seg.start);
    setLookup({ status: "loading", surface: seg.text });
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "readerTranslate",
          tokenSurface: seg.text,
          lemma: seg.lemma,
          sentence,
        }),
      });
      const data = (await res.json()) as ReaderTranslateResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No se pudo traducir.");
      setLookup({
        status: "ready",
        surface: seg.text,
        sentence,
        result: {
          lemma: data.lemma,
          glossEn: data.glossEn,
          microTip: data.microTip,
        },
      });
    } catch (e) {
      setLookup({
        status: "error",
        message: e instanceof Error ? e.message : "Error de red.",
      });
    }
  };

  const canSave =
    lookup.status === "ready" &&
    !saved.some(
      (s) => s.lemma.toLowerCase() === lookup.result.lemma.toLowerCase(),
    );

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-8">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/30 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
          <Headphones className="size-3.5" />
          Lectura inmersiva
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Toca, escucha, guarda
          </span>
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:mx-0">
          Transcripción interactiva: pulsa cualquier palabra para una glosa al
          instante (IA en servidor o modo demo). Guarda vocabulario en este
          dispositivo.
        </p>
      </motion.header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-4">
          <Card className="border-fiesta-gold/20 bg-card/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div>
                <CardTitle className="text-lg">{passage.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {passage.subtitle} · {passage.level} · ~{passage.minutes} min
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={speaking ? "secondary" : "default"}
                  size="sm"
                  className="gap-1.5"
                  disabled={!ttsOk}
                  onClick={playListening}
                  title={
                    ttsOk
                      ? "Escuchar con voz del sistema"
                      : "Tu navegador no expone síntesis de voz"
                  }
                >
                  <Volume2 className="size-3.5" />
                  {speaking ? "Sonando…" : "Escuchar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-fiesta-gold/30"
                  onClick={() => {
                    setSavedOpen(true);
                    refreshSaved();
                  }}
                >
                  <Bookmark className="size-3.5" />
                  Palabras ({saved.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <label className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <BookOpen className="size-3.5 text-fiesta-gold" />
                Elegir texto
                <select
                  value={passageId}
                  onChange={(e) => setPassageId(e.target.value)}
                  className="ml-auto max-w-[12rem] rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground sm:max-w-xs"
                >
                  {MEDIA_PASSAGES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none hidden size-4 sm:block" />
              </label>

              <TranscriptBody segments={segments} onWordTap={onWordTap} activeLemma={lookup} />
            </CardContent>
          </Card>
        </div>

        <aside className="lg:w-80 lg:shrink-0">
          <TranslationPanel
            passage={passage}
            lookup={lookup}
            canSave={canSave}
            onDismiss={() => setLookup({ status: "idle" })}
            onSave={() => {
              if (lookup.status !== "ready") return;
              saveReaderWord({
                lemma: lookup.result.lemma,
                glossEn: lookup.result.glossEn,
                microTip: lookup.result.microTip,
                sentence: lookup.sentence,
                passageTitle: passage.title,
              });
              refreshSaved();
            }}
          />
        </aside>
      </div>

      <AnimatePresence>
        {savedOpen && (
          <SavedSheet
            saved={saved}
            onClose={() => setSavedOpen(false)}
            onRemove={(id) => {
              removeSavedReaderWord(id);
              refreshSaved();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TranscriptBody({
  segments,
  onWordTap,
  activeLemma,
}: {
  segments: TranscriptSegment[];
  onWordTap: (seg: Extract<TranscriptSegment, { kind: "word" }>) => void;
  activeLemma: LookupState;
}) {
  const activeSurface =
    activeLemma.status === "loading" || activeLemma.status === "ready"
      ? activeLemma.surface
      : null;

  return (
    <div
      className="rounded-xl border border-fiesta-crimson/15 bg-background/40 p-4 text-base leading-[1.75] text-foreground sm:p-6 sm:text-lg"
      lang="es"
    >
      {segments.map((seg, i) => {
        if (seg.kind === "ws") {
          return <span key={i}>{seg.text}</span>;
        }
        if (seg.kind === "plain") {
          return (
            <span key={i} className="text-muted-foreground">
              {seg.text}
            </span>
          );
        }
        const isActive = activeSurface === seg.text;
        const isLoading = activeLemma.status === "loading" && isActive;
        return (
          <button
            key={i}
            type="button"
            title="Traducir"
            onClick={() => onWordTap(seg)}
            className={cn(
              "mx-px inline rounded-md px-0.5 align-baseline transition-colors",
              "hover:bg-fiesta-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/40",
              isActive && "bg-fiesta-gold/25 ring-1 ring-fiesta-gold/30",
              isLoading && "animate-pulse",
            )}
          >
            {seg.text}
            {isLoading && (
              <Loader2 className="ml-0.5 inline size-3.5 align-middle text-fiesta-gold" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function TranslationPanel({
  passage,
  lookup,
  canSave,
  onDismiss,
  onSave,
}: {
  passage: MediaPassage;
  lookup: LookupState;
  canSave: boolean;
  onDismiss: () => void;
  onSave: () => void;
}) {
  return (
    <Card className="sticky top-4 border-fiesta-orange/25 bg-linear-to-b from-fiesta-orange/10 to-card/95 shadow-lg backdrop-blur-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <CardTitle className="text-base">Significado</CardTitle>
        {lookup.status !== "idle" && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0"
            onClick={onDismiss}
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {lookup.status === "idle" && (
          <p className="text-sm text-muted-foreground">
            Pulsa una palabra en «{passage.title}» para ver la glosa en inglés y
            un tip corto.
          </p>
        )}
        {lookup.status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-fiesta-gold" />
            Traduciendo…
          </div>
        )}
        {lookup.status === "error" && (
          <p className="text-sm text-fiesta-orange">{lookup.message}</p>
        )}
        {lookup.status === "ready" && (
          <>
            <p className="font-[family-name:var(--font-heading)] text-xl font-semibold text-fiesta-gold">
              {lookup.result.lemma}
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              {lookup.result.glossEn}
            </p>
            {lookup.result.microTip && (
              <p className="rounded-lg border border-fiesta-gold/20 bg-fiesta-crimson/10 p-2 text-xs text-muted-foreground">
                {lookup.result.microTip}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Contexto:{" "}
              <span className="italic text-foreground/90">{lookup.sentence}</span>
            </p>
            <Button
              type="button"
              size="sm"
              className="w-full gap-1.5"
              disabled={!canSave}
              onClick={onSave}
            >
              <Bookmark className="size-3.5" />
              {canSave ? "Guardar palabra" : "Ya está guardada"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SavedSheet({
  saved,
  onClose,
  onRemove,
}: {
  saved: SavedReaderWord[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="relative z-10 flex max-h-[min(78dvh,32rem)] w-full max-w-lg flex-col rounded-t-2xl border border-fiesta-gold/25 bg-card shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <p className="font-medium text-foreground">Palabras guardadas</p>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <ul className="divide-y divide-border/50 overflow-y-auto px-2 py-2">
          {saved.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              Aún no guardas vocabulario. Toca una palabra y pulsa «Guardar».
            </li>
          )}
          {saved.map((s) => (
            <li
              key={s.id}
              className="flex gap-3 px-3 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-fiesta-gold">{s.lemma}</p>
                <p className="text-foreground/90">{s.glossEn}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {s.passageTitle}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Eliminar ${s.lemma}`}
                onClick={() => onRemove(s.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
