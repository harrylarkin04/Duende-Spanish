import { normalizeAnswer } from "@/lib/games/palabra-vortex/game-utils";

import type { ListeningPrompt } from "./types";

export function matchesListeningType(input: string, prompt: ListeningPrompt): boolean {
  const n = normalizeAnswer(input);
  const candidates = [prompt.spanish, ...(prompt.typeAccepted ?? [])].map((s) => normalizeAnswer(s));
  return candidates.some((c) => c === n);
}
