"use client";

import * as React from "react";

/**
 * Web Speech API placeholders — works in Chromium / Safari with permissions.
 * Swap for cloud STT/TTS later without changing call sites much.
 */

type RecognitionResultList = ArrayLike<{ 0?: { transcript?: string } }>;

type RecognitionEventLike = {
  results: RecognitionResultList;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: RecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(lang: string) {
  const [supported, setSupported] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const recRef = React.useRef<SpeechRecognitionLike | null>(null);

  React.useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  const start = React.useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    const r = new Ctor();
    r.lang = lang;
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (ev: RecognitionEventLike) => {
      let line = "";
      const { results } = ev;
      for (let i = 0; i < results.length; i++) {
        line += results[i]?.[0]?.transcript ?? "";
      }
      setTranscript(line.trim());
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recRef.current = r;
    setListening(true);
    setTranscript("");
    r.start();
  }, [lang]);

  const stop = React.useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  return {
    supported,
    listening,
    transcript,
    setTranscript,
    start,
    stop,
  };
}

export function speakText(text: string, lang: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return;
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = lang;
  u.rate = 0.92;
  u.pitch = 1.02;
  window.speechSynthesis.speak(u);
}

export function speechOutputSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}
