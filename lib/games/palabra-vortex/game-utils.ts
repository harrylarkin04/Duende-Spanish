import type { PalabraEntry, TranslationDirection } from "./types";

/** Lowercase, trim, collapse inner spaces — strip accents & punctuation for lenient match */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/-/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

/** Ignored when comparing flexible multi-word answers (e.g. "piece cake" ≈ "piece of cake"). */
// Keep this focused on common "glue" words so we can be forgiving without becoming too fuzzy.
const EN_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "of",
  "to",
  "for",
  "and",
  // common pronouns/auxiliaries people type even though we ask for short answers
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "my",
  "your",
  "our",
  "their",
  "is",
  "are",
  "am",
  "was",
  "were",
  // contractions after `normalizeAnswer` (apostrophes removed)
  "im",
  "ive",
  "ill",
  "dont",
  "cant",
  "wont",
  "isnt",
  "arent",
  "wasnt",
  "werent",
]);

function coreEnglishTokens(s: string): string[] {
  return normalizeAnswer(s)
    .split(" ")
    .filter((t) => t && !EN_STOPWORDS.has(t));
}

function normalizeTokenLoose(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ing") && token.length > 5) return token.slice(0, -3);
  if (token.endsWith("ed") && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 4) return token.slice(0, -1);
  return token;
}

/** Same meaning, allowing dropped articles/prepositions in English. */
export function answersMatchLoose(input: string, entry: PalabraEntry): boolean {
  const inputCore = coreEnglishTokens(input).map(normalizeTokenLoose);
  if (inputCore.length === 0) return false;
  const candidates = [entry.en, ...(entry.acceptedEn ?? [])];
  return candidates.some((can) => {
    const canCore = coreEnglishTokens(can).map(normalizeTokenLoose);
    if (canCore.length === 0) return false;
    const canStr = canCore.join(" ");
    const inStr = inputCore.join(" ");
    if (canStr === inStr) return true;

    // Allow the expected core tokens to appear in order inside the user's input.
    // Example: "piece of cake" ≈ expected "piece cake"
    // Example: "speak it frankly" ≈ expected "speak frankly"
    let i = 0;
    for (let j = 0; j < inputCore.length && i < canCore.length; j++) {
      if (inputCore[j] === canCore[i]) i++;
    }
    return i === canCore.length;
  });
}

export function buildMaskedEnglishHint(english: string, seed: number): string {
  const text = normalizeAnswer(english);
  let out = "";
  let seenInWord = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (!/[a-z0-9]/.test(ch)) {
      out += ch;
      seenInWord = 0;
      continue;
    }
    seenInWord += 1;
    if (seenInWord === 1) {
      out += ch;
      continue;
    }
    const hide = ((seed + i * 37) % 100) < 56;
    out += hide ? "•" : ch;
  }
  return out;
}

export function answersMatch(input: string, entry: PalabraEntry): boolean {
  const n = normalizeAnswer(input);
  if (!n) return false;
  const candidates = [
    entry.en,
    ...(entry.acceptedEn ?? []),
  ].map((a) => normalizeAnswer(a));
  if (candidates.some((c) => c === n)) return true;
  return answersMatchLoose(input, entry);
}

/** Spanish → English or English → Spanish */
export function checkTranslation(
  input: string,
  entry: PalabraEntry,
  direction: TranslationDirection,
): boolean {
  if (direction === "es-en") return answersMatch(input, entry);
  const n = normalizeAnswer(input);
  if (!n) return false;
  const esForm = normalizeAnswer(entry.es);
  return n === esForm;
}

/** Points for one correct answer; streak is post-answer streak count */
export function scoreForCorrect(streakAfter: number): number {
  const base = 100;
  const bonus = Math.max(0, streakAfter - 1) * 15;
  return base + bonus;
}

/** Seeded shuffle — deterministic for daily mode */
export function shuffleSeeded<T>(items: T[], seed: string): T[] {
  const rng = seededMulberry32(hashSeed(seed));
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleRandom<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hashSeed(s: string): number {
  let h = 1779033703;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function seededMulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailySeedDate(): string {
  return new Date().toISOString().slice(0, 10);
}
