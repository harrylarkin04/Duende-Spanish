const LETTER = /[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9]/;

export type TranscriptSegment =
  | { kind: "ws"; text: string }
  | { kind: "plain"; text: string }
  | { kind: "word"; text: string; lemma: string; start: number; end: number };

/** Split passage into whitespace, plain punctuation chunks, and tappable words. */
export function segmentTranscript(full: string): TranscriptSegment[] {
  const out: TranscriptSegment[] = [];
  let i = 0;
  const n = full.length;

  while (i < n) {
    const c = full[i]!;
    if (/\s/.test(c)) {
      let j = i;
      while (j < n && /\s/.test(full[j]!)) j++;
      out.push({ kind: "ws", text: full.slice(i, j) });
      i = j;
      continue;
    }

    let j = i;
    while (j < n && !/\s/.test(full[j]!)) j++;
    const chunk = full.slice(i, j);

    let s = 0;
    while (s < chunk.length && !LETTER.test(chunk[s]!)) s++;
    let e = chunk.length - 1;
    while (e >= s && !LETTER.test(chunk[e]!)) e--;

    if (s <= e) {
      const lemma = chunk.slice(s, e + 1).toLowerCase();
      out.push({ kind: "word", text: chunk, lemma, start: i, end: j });
    } else {
      out.push({ kind: "plain", text: chunk });
    }
    i = j;
  }

  return out;
}

/** Sentence (rough split) that contains `charIndex` in `full`. */
export function sentenceAt(full: string, charIndex: number): string {
  if (!full.trim()) return "";
  const re = /[^.!?…]+[.!?…]+|[^.!?…]+$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(full)) !== null) {
    const start = m.index;
    const end = m.index + m[0].length;
    if (charIndex >= start && charIndex < end) {
      return m[0].replace(/\s+/g, " ").trim();
    }
  }
  return full.replace(/\s+/g, " ").trim();
}
