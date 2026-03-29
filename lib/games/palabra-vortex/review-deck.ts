import type { PalabraEntry } from "./types";

const STORAGE_KEY = "duende.palabra-vortex.review-v1";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota / private mode */
  }
}

/** Append missed word id (deduped, newest last cap 500) */
export function saveMissedToReviewDeck(entryId: string) {
  const cur = readIds().filter((id) => id !== entryId);
  cur.push(entryId);
  const capped = cur.slice(-500);
  writeIds(capped);
}

export function getReviewDeckIds(): string[] {
  return readIds();
}

export function clearReviewDeck() {
  writeIds([]);
}

export function reviewDeckCount(): number {
  return readIds().length;
}

/** Resolve ids to entries (unknown ids dropped) */
export function resolveReviewEntries(
  ids: string[],
  bank: PalabraEntry[],
): PalabraEntry[] {
  const map = new Map(bank.map((e) => [e.id, e]));
  return ids.map((id) => map.get(id)).filter((e): e is PalabraEntry => e != null);
}
