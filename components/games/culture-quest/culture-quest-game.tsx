"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Compass, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { recordCultureQuest } from "@/app/(protected)/actions/record-culture-quest";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SOUVENIR_LABELS, souvenirId } from "@/lib/games/culture-quest/badges";
import {
  CITIES,
  EPILOGUES,
  getNode,
  scoreForTier,
  startNodeId,
  tierFromFlags,
} from "@/lib/games/culture-quest/story";
import type { CityId, QuestFlags } from "@/lib/games/culture-quest/types";
import { cn } from "@/lib/utils";
import { useRealtimeProfileGameSync } from "@/hooks/use-supabase-game-sync";

const LS_KEY = "duende.culture-quest.v1";

type Persist = {
  city: CityId;
  nodeId: string;
  flags: QuestFlags;
  runId: string;
};

function loadPersist(): Persist | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Persist;
    if (!o.city || !o.nodeId || !o.flags || !o.runId) return null;
    if (!["madrid", "cdmx", "ba"].includes(o.city)) return null;
    return o;
  } catch {
    return null;
  }
}

function savePersist(p: Persist) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

function clearPersist() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

function matchesText(input: string, accept: string[]) {
  const n = stripAccents(input.toLowerCase().trim());
  if (!n) return false;
  return accept.some((a) => {
    const t = stripAccents(a.toLowerCase().trim());
    return n === t || n.includes(t);
  });
}

type Phase = "menu" | "play" | "end";

export function CultureQuestGame() {
  const router = useRouter();
  const reduce = useReducedMotion() === true;
  useRealtimeProfileGameSync(() => router.refresh());

  const [phase, setPhase] = React.useState<Phase>("menu");
  const [city, setCity] = React.useState<CityId | null>(null);
  const [nodeId, setNodeId] = React.useState<string>("");
  const [flags, setFlags] = React.useState<QuestFlags>({ wise: false, trivia: false, phrase: false });
  const [textDraft, setTextDraft] = React.useState("");

  const [tier, setTier] = React.useState<"bad" | "good" | "legendary" | null>(null);
  const [finalScore, setFinalScore] = React.useState(0);
  const [savedCloud, setSavedCloud] = React.useState<boolean | null>(null);
  const [serverSouvenirs, setServerSouvenirs] = React.useState<string[] | null>(null);
  const submittedRef = React.useRef(false);
  const runIdRef = React.useRef<string>("");
  const flagsRef = React.useRef<QuestFlags>(flags);
  flagsRef.current = flags;

  React.useEffect(() => {
    const p = loadPersist();
    if (p && p.nodeId && getNode(p.nodeId)) {
      runIdRef.current = p.runId;
      setCity(p.city);
      setNodeId(p.nodeId);
      setFlags(p.flags);
      if (p.nodeId.endsWith("-fin")) {
        setPhase("end");
        const t = tierFromFlags(p.flags);
        setTier(t);
        setFinalScore(scoreForTier(t));
      } else {
        setPhase("play");
      }
    }
  }, []);

  React.useEffect(() => {
    if (phase === "play" && city && nodeId && runIdRef.current) {
      savePersist({ city, nodeId, flags, runId: runIdRef.current });
    }
  }, [phase, city, nodeId, flags]);

  const pickCity = (c: CityId) => {
    clearPersist();
    runIdRef.current =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${c}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    submittedRef.current = false;
    setSavedCloud(null);
    setServerSouvenirs(null);
    setTier(null);
    setCity(c);
    setFlags({ wise: false, trivia: false, phrase: false });
    setNodeId(startNodeId(c));
    setTextDraft("");
    setPhase("play");
    savePersist({
      city: c,
      nodeId: startNodeId(c),
      flags: { wise: false, trivia: false, phrase: false },
      runId: runIdRef.current,
    });
  };

  const applyChoiceFlags = React.useCallback((patch?: Partial<QuestFlags>) => {
    setFlags((f) => ({
      ...f,
      ...patch,
      wise: f.wise || Boolean(patch?.wise),
      trivia: patch?.trivia !== undefined ? f.trivia || patch.trivia : f.trivia,
      phrase: patch?.phrase !== undefined ? f.phrase || patch.phrase : f.phrase,
    }));
  }, []);

  const goScene = (next: string, patch?: Partial<QuestFlags>) => {
    applyChoiceFlags(patch);
    setNodeId(next);
    setTextDraft("");
  };

  const goMc = (correct: boolean, nextCorrect: string, nextWrong: string) => {
    setFlags((f) => ({
      ...f,
      trivia: f.trivia || correct,
    }));
    setNodeId(correct ? nextCorrect : nextWrong);
    setTextDraft("");
  };

  const submitText = (accept: string[], nextOk: string, nextBad: string) => {
    const ok = matchesText(textDraft, accept);
    if (ok) setFlags((f) => ({ ...f, phrase: true }));
    setNodeId(ok ? nextOk : nextBad);
    setTextDraft("");
  };

  React.useEffect(() => {
    if (phase !== "play" || !city || !nodeId) return;
    const n = getNode(nodeId);
    if (!n || n.t !== "fin") return;
    if (submittedRef.current) return;
    submittedRef.current = true;

    const f = flagsRef.current;
    const t = tierFromFlags(f);
    const sc = scoreForTier(t);
    setTier(t);
    setFinalScore(sc);
    setPhase("end");
    clearPersist();

    const sid = souvenirId(city, t);
    const rid = runIdRef.current;
    const dedupe = `cq-record:${rid}`;
    if (typeof window !== "undefined" && rid && sessionStorage.getItem(dedupe)) {
      return;
    }
    if (typeof window !== "undefined" && rid) sessionStorage.setItem(dedupe, "1");

    void recordCultureQuest({
      city,
      endingTier: t,
      score: sc,
      souvenirs: [sid],
    }).then((res) => {
      if (res.ok) {
        setSavedCloud(true);
        setServerSouvenirs(res.souvenirs);
      } else {
        setSavedCloud(false);
      }
    });
  }, [phase, city, nodeId]);

  const restart = () => {
    submittedRef.current = false;
    clearPersist();
    setCity(null);
    setNodeId("");
    setFlags({ wise: false, trivia: false, phrase: false });
    setTier(null);
    setFinalScore(0);
    setSavedCloud(null);
    setServerSouvenirs(null);
    setTextDraft("");
    setPhase("menu");
  };

  const node = city && nodeId ? getNode(nodeId) : undefined;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-10">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/25 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
          <Compass className="size-3.5" />
          Aventura corta
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Culture Quest
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Elegí ciudad, decidí en español y desbloqueá souvenirs en tu perfil.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {phase === "menu" && (
          <motion.div
            key="menu"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            className="space-y-4"
          >
            <p className="text-center text-sm text-muted-foreground sm:text-left">¿A dónde viajamos hoy?</p>
            <ul className="grid gap-3">
              {CITIES.map((c, i) => (
                <motion.li
                  key={c.id}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduce ? 0 : i * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => pickCity(c.id)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl border border-fiesta-gold/20 bg-card/70 p-4 text-left transition-all",
                      "hover:border-fiesta-gold/40 hover:shadow-md hover:shadow-fiesta-gold/10",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/40",
                    )}
                  >
                    <span className="text-3xl" aria-hidden>
                      {c.emoji}
                    </span>
                    <span>
                      <span className="block font-[family-name:var(--font-heading)] text-lg font-semibold">
                        {c.name}
                      </span>
                      <span className="text-sm text-muted-foreground">{c.subtitle}</span>
                    </span>
                    <MapPin className="ml-auto size-5 shrink-0 text-fiesta-gold/60" aria-hidden />
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {phase === "play" && city && node && node.t !== "fin" && (
          <motion.div
            key={nodeId}
            initial={reduce ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -12 }}
          >
            <Card className="border-fiesta-gold/20 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="size-5 text-fiesta-gold" />
                  {CITIES.find((x) => x.id === city)?.name}
                </CardTitle>
                <CardDescription>Una decisión a la vez — ideal para el café de la mañana.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base leading-relaxed text-foreground">{node.body}</p>
                {node.t === "scene" && node.fact && (
                  <p className="rounded-xl border border-fiesta-orange/20 bg-fiesta-crimson/10 px-3 py-2 text-sm text-muted-foreground">
                    <span className="font-medium text-fiesta-orange">Dato: </span>
                    {node.fact}
                  </p>
                )}
                {node.t === "mc" && node.fact && (
                  <p className="rounded-xl border border-fiesta-orange/20 bg-fiesta-crimson/10 px-3 py-2 text-sm text-muted-foreground">
                    <span className="font-medium text-fiesta-orange">Dato: </span>
                    {node.fact}
                  </p>
                )}

                {node.t === "scene" && (
                  <div className="flex flex-col gap-2">
                    {node.choices.map((ch) => (
                      <Button
                        key={ch.label}
                        type="button"
                        variant="outline"
                        className="h-auto min-h-11 justify-start whitespace-normal border-fiesta-gold/25 py-2 text-left"
                        onClick={() => goScene(ch.next, ch.set)}
                      >
                        {ch.label}
                      </Button>
                    ))}
                  </div>
                )}

                {node.t === "mc" && (
                  <div className="flex flex-col gap-2">
                    {node.options.map((opt) => (
                      <Button
                        key={opt.label}
                        type="button"
                        variant="secondary"
                        className="h-auto min-h-11 justify-start whitespace-normal bg-fiesta-crimson/15 py-2 text-left hover:bg-fiesta-crimson/25"
                        onClick={() => goMc(opt.correct, node.nextCorrect, node.nextWrong)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                )}

                {node.t === "text" && (
                  <div className="space-y-2">
                    <input
                      value={textDraft}
                      onChange={(e) => setTextDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitText(node.accept, node.nextOk, node.nextBad);
                      }}
                      placeholder="Escribí aquí…"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/30"
                      autoComplete="off"
                    />
                    <Button type="button" onClick={() => submitText(node.accept, node.nextOk, node.nextBad)}>
                      Enviar
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                <Button type="button" variant="ghost" size="sm" onClick={restart}>
                  Otra ciudad
                </Button>
                <Link
                  href="/games"
                  className="inline-flex h-7 items-center rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Volver a juegos
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {phase === "end" && city && tier && (
          <motion.div
            key="end"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <Card
              className={cn(
                "border-fiesta-gold/30 bg-linear-to-br from-fiesta-crimson/15 to-card/90",
                tier === "legendary" && "shadow-lg shadow-fiesta-gold/15",
              )}
            >
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-heading)] text-2xl">
                  {EPILOGUES[city][tier].title}
                </CardTitle>
                <CardDescription>
                  Puntuación: <span className="font-semibold text-fiesta-gold">{finalScore}</span> / 100
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-foreground">{EPILOGUES[city][tier].body}</p>
                <div className="rounded-xl border border-fiesta-gold/25 bg-background/50 p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Souvenirs
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {(serverSouvenirs ?? [souvenirId(city, tier)]).map((id) => {
                      const meta = SOUVENIR_LABELS[id];
                      return (
                        <li
                          key={id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-fiesta-gold/30 bg-fiesta-crimson/10 px-3 py-1 text-xs font-medium"
                        >
                          <span aria-hidden>{meta?.emoji ?? "🎁"}</span>
                          {meta?.title ?? id}
                        </li>
                      );
                    })}
                  </ul>
                  {savedCloud === false && (
                    <p className="mt-2 text-xs text-fiesta-orange">
                      No pudimos guardar en la nube (¿iniciaste sesión?). Tu run igual cuenta en pantalla.
                    </p>
                  )}
                  {savedCloud === true && (
                    <p className="mt-2 text-xs text-fiesta-gold">Guardado en tu perfil.</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button type="button" onClick={restart}>
                  Jugar otra vez
                </Button>
                <Link
                  href="/profile"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Ver perfil
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
