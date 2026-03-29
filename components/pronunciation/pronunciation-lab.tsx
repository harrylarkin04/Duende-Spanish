"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Loader2, Mic, Square, Volume2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PRACTICE_PHRASE =
  "Tres tristes tigres tragaban trigo en un trigal, en un trigal tres tristes tigres tragaban trigo.";

type Feedback = {
  overall: number;
  clarity: number;
  rhythm: number;
  vowels: number;
  summary: string;
};

function placeholderFeedback(durationMs: number): Feedback {
  const base = Math.min(95, Math.max(52, 58 + Math.round((durationMs / 400) % 28)));
  const clarity = Math.min(10, Math.max(4, Math.round((base / 9 + durationMs / 800) % 7) + 4));
  const rhythm = Math.min(10, Math.max(4, clarity + ((durationMs >> 3) % 3) - 1));
  const vowels = Math.min(10, Math.max(4, (clarity + rhythm) >> 1));
  const overall = Math.round((clarity + rhythm + vowels) / 3 * 10);

  const summaries = [
    "Buen control del aire: las erres suenan con intención. Practicá el final de palabra con más relax en la mandíbula.",
    "Ritmo estable: se nota que escuchás el patrón. Subí un poco el contraste entre sílabas tónicas y átonas.",
    "Las vocales abiertas están claras; el trigo y el trigal ganan si alargás la E y la I sin tensar la garganta.",
    "Dato de vista previa: con IA real compararemos tu grabación con un modelo nativo y marcaremos fonemas puntuales.",
  ];
  const summary = summaries[Math.abs(Math.floor(durationMs / 137)) % summaries.length]!;

  return { overall, clarity, rhythm, vowels, summary };
}

function ScoreBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums text-foreground">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-linear-to-r from-fiesta-crimson to-fiesta-gold transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function PronunciationLab() {
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const startedAtRef = React.useRef<number>(0);

  const [micState, setMicState] = React.useState<"idle" | "requesting" | "recording" | "denied">(
    "idle",
  );
  const [feedback, setFeedback] = React.useState<Feedback | null>(null);
  const [durationMs, setDurationMs] = React.useState(0);

  const stopVisualLoop = React.useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const drawWaveform = React.useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w <= 0 || h <= 0) {
      rafRef.current = requestAnimationFrame(drawWaveform);
      return;
    }
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const half = h / 2;
    const bufferLength = analyser.fftSize;
    const data = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(data);

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "oklch(0.55 0.02 280 / 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, half);
    ctx.lineTo(w, half);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(251, 191, 36)";
    ctx.beginPath();
    const slice = w / (bufferLength - 1);
    for (let i = 0; i < bufferLength; i++) {
      const v = (data[i]! - 128) / 128;
      const y = half + v * half * 0.85;
      const x = i * slice;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    rafRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const teardown = React.useCallback(() => {
    stopVisualLoop();
    recorderRef.current?.stop();
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    chunksRef.current = [];
  }, [stopVisualLoop]);

  React.useEffect(() => () => teardown(), [teardown]);

  const startRecording = async () => {
    setFeedback(null);
    setMicState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start(200);
      recorderRef.current = rec;
      startedAtRef.current = performance.now();
      setMicState("recording");
      drawWaveform();
    } catch {
      setMicState("denied");
      teardown();
    }
  };

  const stopRecording = () => {
    if (micState !== "recording") return;
    const rec = recorderRef.current;
    const end = performance.now();
    const dur = Math.max(0, Math.round(end - startedAtRef.current));
    setDurationMs(dur);

    stopVisualLoop();

    if (rec && rec.state !== "inactive") {
      rec.stop();
    }
    recorderRef.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;

    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    chunksRef.current = [];
    setMicState("idle");
    setFeedback(placeholderFeedback(dur));

    const c = canvasRef.current;
    const cx = c?.getContext("2d");
    if (c && cx) {
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.clearRect(0, 0, c.width, c.height);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6 sm:max-w-xl sm:px-6 sm:pb-12 sm:pt-8">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/30 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
          <Mic className="size-3.5" />
          Laboratorio de pronunciación
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Grabá y observá tu voz
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Onda en vivo mientras hablás. La puntuación de abajo es una{" "}
          <span className="font-medium text-foreground">vista previa simulada</span> hasta conectar
          un modelo de pronunciación real.
        </p>
      </motion.header>

      <Card className="border-fiesta-gold/20 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Frase de práctica</CardTitle>
          <CardDescription className="text-base leading-relaxed text-foreground/90">
            {PRACTICE_PHRASE}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Forma de onda
            </p>
            <div className="overflow-hidden rounded-xl border border-fiesta-gold/25 bg-muted/30 ring-1 ring-fiesta-crimson/10">
              <canvas
                ref={canvasRef}
                className="block h-28 w-full"
                aria-label="Visualización de forma de onda del micrófono"
              />
            </div>
            {micState === "recording" && (
              <p className="mt-2 flex items-center justify-center gap-2 text-xs text-fiesta-orange">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-fiesta-crimson/60 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-fiesta-crimson" />
                </span>
                Grabando… hablá cerca del micrófono
              </p>
            )}
          </div>

          {micState === "denied" && (
            <p className="rounded-lg border border-fiesta-orange/30 bg-fiesta-orange/10 p-3 text-sm text-fiesta-orange">
              No pudimos acceder al micrófono. Revisá permisos del navegador y probá de nuevo (HTTPS
              o localhost).
            </p>
          )}

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {micState === "recording" ? (
              <Button
                type="button"
                size="lg"
                variant="destructive"
                className="min-w-[12rem] gap-2"
                onClick={stopRecording}
              >
                <Square className="size-4 fill-current" />
                Detener
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="min-w-[12rem] gap-2 shadow-lg shadow-fiesta-crimson/20"
                disabled={micState === "requesting"}
                onClick={() => void startRecording()}
              >
                {micState === "requesting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Preparando…
                  </>
                ) : (
                  <>
                    <Mic className="size-4" />
                    Grabar
                  </>
                )}
              </Button>
            )}
          </div>

          {feedback && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 rounded-xl border border-dashed border-fiesta-gold/35 bg-fiesta-crimson/5 p-4"
            >
              <div className="flex items-center gap-2 text-fiesta-gold">
                <Volume2 className="size-4" />
                <span className="text-sm font-semibold">Retroalimentación (IA — placeholder)</span>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  Puntuación general
                </span>
                <span className="font-[family-name:var(--font-heading)] text-3xl font-bold tabular-nums text-foreground">
                  {feedback.overall}
                  <span className="text-lg font-medium text-muted-foreground">/100</span>
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <ScoreBar label="Claridad" value={feedback.clarity} />
                <ScoreBar label="Ritmo" value={feedback.rhythm} />
                <ScoreBar label="Vocales" value={feedback.vowels} />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{feedback.summary}</p>
              <p className="text-[11px] text-muted-foreground">
                Grabación: {Math.round(durationMs / 100) / 10}s · Los valores no reflejan análisis
                real todavía.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
