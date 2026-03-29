import type { PalabraDifficultyLevel, PalabraEntry } from "@/lib/games/palabra-vortex/types";

import raw from "./vortex-items.json";

export type VortexItemType = "word" | "phrase" | "idiom" | "collocation";

export type VortexJsonRow = {
  spanish: string;
  english: string;
  difficulty: PalabraDifficultyLevel;
  type: VortexItemType;
  category?: string;
  acceptedEn?: string[];
  note?: string;
};

export const VORTEX_ITEMS: VortexJsonRow[] = raw as VortexJsonRow[];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function defaultHint(row: VortexJsonRow): string {
  const cat = row.category ? `${row.category} · ` : "";
  const typeLabel =
    row.type === "word"
      ? "Palabra clave"
      : row.type === "phrase"
        ? "Frase útil"
        : row.type === "collocation"
          ? "Colocación fija"
          : "Expresión idiomática";
  return `${cat}${typeLabel} — respuesta corta en inglés (1–3 palabras).`;
}

/** Pool entries for Palabra Vortex — English glosses capped at 3 words in source data. */
export function vortexWordsToVocabulary(): PalabraEntry[] {
  return VORTEX_ITEMS.map((row, i) => {
    const id = `vx-${row.difficulty}-${slugify(row.spanish)}-${i}`;
    return {
      id,
      es: row.spanish,
      en: row.english,
      acceptedEn: row.acceptedEn,
      hint: row.note ?? defaultHint(row),
      difficulty: row.difficulty,
      topic: row.category ?? "general",
      dialect: "neutral",
      itemType: row.type,
    };
  });
}

if (process.env.NODE_ENV === "development") {
  const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
  for (const r of VORTEX_ITEMS) {
    if (countWords(r.english) > 3) console.error("[vortex] English >3 words:", r.spanish, r.english);
    if (countWords(r.spanish) > 6) console.error("[vortex] Spanish >6 words:", r.spanish);
    for (const a of r.acceptedEn ?? []) {
      if (countWords(a) > 3) console.error("[vortex] acceptedEn >3:", a);
    }
  }
  if (VORTEX_ITEMS.length < 300) {
    console.warn(`[vortex] Expected 300+ items, got ${VORTEX_ITEMS.length}`);
  }
}
