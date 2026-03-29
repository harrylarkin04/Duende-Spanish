export type SavedReaderWord = {
  id: string;
  lemma: string;
  glossEn: string;
  microTip?: string;
  sentence: string;
  passageTitle: string;
  savedAt: string;
};

const STORAGE_KEY = "duende.media.saved-words-v1";
const CAP = 200;

function read(): SavedReaderWord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter(
      (row): row is SavedReaderWord =>
        row != null &&
        typeof row === "object" &&
        typeof (row as SavedReaderWord).id === "string" &&
        typeof (row as SavedReaderWord).lemma === "string" &&
        typeof (row as SavedReaderWord).glossEn === "string" &&
        typeof (row as SavedReaderWord).sentence === "string" &&
        typeof (row as SavedReaderWord).passageTitle === "string" &&
        typeof (row as SavedReaderWord).savedAt === "string",
    );
  } catch {
    return [];
  }
}

function write(rows: SavedReaderWord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, CAP)));
  } catch {
    /* ignore */
  }
}

export function listSavedReaderWords(): SavedReaderWord[] {
  return read().sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

export function saveReaderWord(entry: {
  lemma: string;
  glossEn: string;
  microTip?: string;
  sentence: string;
  passageTitle: string;
}): SavedReaderWord {
  const rows = read().filter(
    (r) => r.lemma.toLowerCase() !== entry.lemma.toLowerCase(),
  );
  const item: SavedReaderWord = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    lemma: entry.lemma,
    glossEn: entry.glossEn,
    microTip: entry.microTip,
    sentence: entry.sentence,
    passageTitle: entry.passageTitle,
    savedAt: new Date().toISOString(),
  };
  rows.unshift(item);
  write(rows);
  return item;
}

export function removeSavedReaderWord(id: string) {
  write(read().filter((r) => r.id !== id));
}
