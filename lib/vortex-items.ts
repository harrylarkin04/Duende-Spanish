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

const BASE_ITEMS: VortexJsonRow[] = raw as VortexJsonRow[];

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function spanishWordCountOk(spanish: string): boolean {
  return wordCount(spanish) <= 6;
}

function englishWordCountOk(english: string): boolean {
  return wordCount(english) <= 3;
}

// Avoid showing the exact same Spanish prompt twice in the same difficulty.
// (Type/English can differ in the source data, but the gameplay prompt should stay unique.)
const BASE_DIFF_SPAN_KEYS = new Set(BASE_ITEMS.map((r) => `${r.difficulty}|${r.spanish}`));
const EXTRA_DIFF_SPAN_KEYS = new Set<string>();

const EXTRA_ITEMS: VortexJsonRow[] = [];

function addExtra(row: VortexJsonRow) {
  const key = `${row.difficulty}|${row.spanish}`;
  if (BASE_DIFF_SPAN_KEYS.has(key)) return;
  if (EXTRA_DIFF_SPAN_KEYS.has(key)) return;
  if (!spanishWordCountOk(row.spanish)) {
    throw new Error(`[vortex extra] Spanish too long: "${row.spanish}"`);
  }
  if (!englishWordCountOk(row.english)) {
    throw new Error(`[vortex extra] English too long: "${row.english}"`);
  }
  for (const a of row.acceptedEn ?? []) {
    if (!englishWordCountOk(a)) {
      throw new Error(`[vortex extra] acceptedEn too long: "${a}" (${row.spanish})`);
    }
  }
  EXTRA_ITEMS.push(row);
  EXTRA_DIFF_SPAN_KEYS.add(key);
}

// ----------------------------
// Generated “extra” vocab
// ----------------------------
type FoodPair = { es: string; en: string };

const WANT_FOODS: FoodPair[] = [
  { es: "el agua", en: "water" },
  { es: "el pan", en: "bread" },
  { es: "la leche", en: "milk" },
  { es: "el queso", en: "cheese" },
  { es: "el huevo", en: "egg" },
  { es: "la manzana", en: "apple" },
  { es: "la banana", en: "banana" },
  { es: "la naranja", en: "orange" },
  { es: "la uva", en: "grapes" },
  { es: "el tomate", en: "tomato" },
  { es: "la ensalada", en: "salad" },
  { es: "la sopa", en: "soup" },
  { es: "la pizza", en: "pizza" },
  { es: "la pasta", en: "pasta" },
  { es: "el arroz", en: "rice" },
  { es: "el pollo", en: "chicken" },
  { es: "el pescado", en: "fish" },
  { es: "el jamón", en: "ham" },
  { es: "el yogur", en: "yogurt" },
  { es: "el café", en: "coffee" },
  { es: "el té", en: "tea" },
  { es: "el chocolate", en: "chocolate" },
  { es: "la fruta", en: "fruit" },
  { es: "la carne", en: "meat" },
  { es: "la patata", en: "potato" },
  { es: "el limón", en: "lemon" },
  { es: "la zanahoria", en: "carrot" },
  { es: "la cebolla", en: "onion" },
  { es: "la mantequilla", en: "butter" },
  { es: "el azúcar", en: "sugar" },
  { es: "la sal", en: "salt" },
  { es: "el zumo", en: "juice" },
  { es: "el té helado", en: "iced tea" },
  { es: "el helado", en: "ice cream" },
  { es: "la agua con gas", en: "sparkling water" },
  { es: "el té con hielo", en: "iced tea" },
  { es: "la cerveza", en: "beer" },
  { es: "la cola", en: "cola" },
];

for (const f of WANT_FOODS) {
  addExtra({
    spanish: `quiero ${f.es}`,
    english: `want ${f.en}`,
    difficulty: "easy",
    type: "phrase",
    category: "food",
    note: "Requesting a simple item.",
  });
}

type NeedPair = { es: string; en: string };
const NEED_THINGS: NeedPair[] = [
  { es: "el agua", en: "water" },
  { es: "el pan", en: "bread" },
  { es: "la leche", en: "milk" },
  { es: "el mapa", en: "map" },
  { es: "la dirección", en: "address" },
  { es: "el billete", en: "ticket" },
  { es: "el pasaporte", en: "passport" },
  { es: "el teléfono", en: "phone" },
  { es: "la llave", en: "key" },
  { es: "las llaves", en: "keys" },
  { es: "la mochila", en: "backpack" },
  { es: "la chaqueta", en: "jacket" },
  { es: "los zapatos", en: "shoes" },
  { es: "el paraguas", en: "umbrella" },
  { es: "la cama", en: "bed" },
  { es: "la habitación", en: "room" },
  { es: "el baño", en: "bathroom" },
  { es: "la salida", en: "exit" },
  { es: "la ayuda", en: "help" },
  { es: "la información", en: "info" },
  { es: "el coche", en: "car" },
  { es: "el taxi", en: "taxi" },
  { es: "el tren", en: "train" },
  { es: "el metro", en: "metro" },
  { es: "el autobús", en: "bus" },
];

for (const n of NEED_THINGS) {
  addExtra({
    spanish: `necesito ${n.es}`,
    english: `need ${n.en}`,
    difficulty: "easy",
    type: "phrase",
    category: "travel",
    note: "Useful request: I need…",
  });
}

type FeelAdj = { es: string; en: string; category?: string };
const FEEL_ADJS: FeelAdj[] = [
  { es: "feliz", en: "happy", category: "emotions" },
  { es: "triste", en: "sad", category: "emotions" },
  { es: "cansado", en: "tired", category: "emotions" },
  { es: "enfermo", en: "sick", category: "health" },
  { es: "nervioso", en: "nervous", category: "emotions" },
  { es: "tranquilo", en: "calm", category: "emotions" },
  { es: "preocupado", en: "worried", category: "emotions" },
  { es: "emocionado", en: "excited", category: "emotions" },
  { es: "soltero", en: "single", category: "love" },
  { es: "casado", en: "married", category: "love" },
  { es: "solitario", en: "lonely", category: "emotions" },
  { es: "motivado", en: "motivated", category: "work" },
  { es: "orgulloso", en: "proud", category: "emotions" },
  { es: "avergonzado", en: "embarrassed", category: "emotions" },
  // Use short "be in ..." English chunks so `feel ${adj.en}` stays <= 3 words.
  { es: "de mal humor", en: "bad mood", category: "emotions" },
  { es: "de buen humor", en: "good mood", category: "emotions" },
  { es: "listo", en: "ready", category: "daily" },
  { es: "ocupado", en: "busy", category: "work" },
  { es: "aburrido", en: "bored", category: "emotions" },
  { es: "hambriento", en: "hungry", category: "food" },
  { es: "sediento", en: "thirsty", category: "food" },
  { es: "somnoliento", en: "sleepy", category: "daily" },
];

for (const adj of FEEL_ADJS) {
  addExtra({
    spanish: `estoy ${adj.es}`,
    english: `feel ${adj.en}`,
    difficulty: "easy",
    type: "phrase",
    category: adj.category ?? "emotions",
    note: "Simple state of mind.",
  });
}

// Medium likes: “me gusta el/la …” (keeps Spanish natural, English short)
const LIKE_FOODS: FoodPair[] = [
  { es: "el pan", en: "bread" },
  { es: "la leche", en: "milk" },
  { es: "el queso", en: "cheese" },
  { es: "la pizza", en: "pizza" },
  { es: "la pasta", en: "pasta" },
  { es: "el pollo", en: "chicken" },
  { es: "el pescado", en: "fish" },
  { es: "la fruta", en: "fruit" },
  { es: "el café", en: "coffee" },
  { es: "el té", en: "tea" },
  { es: "el chocolate", en: "chocolate" },
  { es: "el yogur", en: "yogurt" },
  { es: "la sopa", en: "soup" },
  { es: "la ensalada", en: "salad" },
  { es: "el helado", en: "icecream" },
  { es: "la cerveza", en: "beer" },
  { es: "la cola", en: "cola" },
  { es: "el arroz", en: "rice" },
  { es: "la pizza", en: "pizza" },
  { es: "el tomate", en: "tomato" },
];

for (const f of LIKE_FOODS) {
  addExtra({
    spanish: `me gusta ${f.es}`,
    english: `I like ${f.en}`,
    difficulty: "medium",
    type: "phrase",
    category: "love",
    note: "Preference: I like …",
  });
}

type CollocationPair = { es: string; en: string; category?: string };
const TRANSPORTS: CollocationPair[] = [
  { es: "el tren", en: "train", category: "travel" },
  { es: "el metro", en: "metro", category: "travel" },
  { es: "el autobús", en: "bus", category: "travel" },
  { es: "el taxi", en: "taxi", category: "travel" },
  { es: "el avión", en: "plane", category: "travel" },
  { es: "el barco", en: "boat", category: "travel" },
  { es: "el ferry", en: "ferry", category: "travel" },
  { es: "la moto", en: "motorbike", category: "travel" },
  { es: "el coche", en: "car", category: "travel" },
  { es: "la bicicleta", en: "bike", category: "travel" },
  { es: "el patinete", en: "scooter", category: "travel" },
  { es: "el camión", en: "truck", category: "travel" },
];

for (const t of TRANSPORTS) {
  addExtra({
    spanish: `tomar ${t.es}`,
    english: `take ${t.en}`,
    difficulty: "medium",
    type: "collocation",
    category: t.category ?? "travel",
    note: "Common travel verb + transport.",
  });
}

const TASKS: CollocationPair[] = [
  { es: "la cama", en: "make bed", category: "home" },
  { es: "los deberes", en: "do homework", category: "school" },
  { es: "la tarea", en: "do homework", category: "school" },
  { es: "la cena", en: "cook dinner", category: "home" },
  { es: "la compra", en: "go shopping", category: "home" },
  { es: "la limpieza", en: "do cleaning", category: "home" },
  { es: "la ropa", en: "do laundry", category: "home" },
  { es: "las maletas", en: "pack bags", category: "travel" },
  { es: "una reserva", en: "book a table", category: "travel" },
  { es: "una pregunta", en: "ask a question", category: "daily" },
  { es: "una llamada", en: "make a call", category: "work" },
  { es: "planes", en: "make plans", category: "daily" },
  { es: "una lista", en: "make list", category: "daily" },
  { es: "ejercicio", en: "do exercise", category: "health" },
  { es: "la cama", en: "make bed", category: "home" },
  { es: "las manos", en: "wash hands", category: "health" },
  { es: "la bici", en: "ride bike", category: "daily" },
  { es: "un favor", en: "help out", category: "people" },
];

for (const task of TASKS) {
  addExtra({
    spanish: `hacer ${task.es}`,
    english: task.en,
    difficulty: "medium",
    type: "collocation",
    category: task.category ?? "daily",
    note: "Useful routine collocation.",
  });
}

// Curated idioms (hard/expert): keep them short in English + include a quick usage note.
const EXTRA_IDIOMS: Array<{ es: string; en: string; diff: PalabraDifficultyLevel; note: string; category?: string; acceptedEn?: string[] }> = [
  { es: "estar entre la espada y la pared", en: "in a bind", diff: "hard", note: "When you have no easy option." , category: "emotions"},
  { es: "echar leña al fuego", en: "add fuel", diff: "hard", note: "To make a conflict worse." , category: "social"},
  { es: "tomar el pelo", en: "pull your leg", diff: "hard", note: "To tease someone." , category: "social"},
  { es: "irse por las ramas", en: "ramble on", diff: "hard", note: "To talk too much without getting to the point." , category: "speech"},
  { es: "poner los puntos sobre las íes", en: "clarify fully", diff: "hard", note: "To clear up details properly." , category: "work"},
  { es: "cortar por lo sano", en: "cut it short", diff: "hard", note: "To end quickly and decisively." , category: "daily"},
  { es: "llorar lágrimas de cocodrilo", en: "crocodile tears", diff: "hard", note: "Fake sadness." , category: "emotions"},
  { es: "ir al grano", en: "get to point", diff: "hard", note: "To be direct." , category: "speech"},
  { es: "ponerse colorado", en: "blush", diff: "hard", note: "From embarrassment." , category: "emotions"},
  { es: "no tener ni idea", en: "no clue", diff: "medium", note: "When you truly don't know." , category: "daily"},
  { es: "hacer oídos sordos", en: "ignore completely", diff: "medium", note: "To pretend you didn't hear." , category: "daily"},
  { es: "poner en marcha", en: "get going", diff: "medium", note: "To start an activity." , category: "work"},
  { es: "poner la mano en el fuego", en: "vouch for", diff: "hard", note: "To strongly back someone." , category: "work"},
  { es: "estar hasta las narices", en: "be fed up", diff: "medium", note: "To be very annoyed." , category: "emotions"},
  { es: "estar hecho polvo", en: "be exhausted", diff: "medium", note: "To be very tired." , category: "health"},
  { es: "no es para tanto", en: "not big deal", diff: "medium", note: "To downplay something." , category: "daily"},
  { es: "dejar plantado", en: "leave hanging", diff: "hard", note: "To ditch someone at the last moment." , category: "social"},
  { es: "quedarse a cuadros", en: "be shocked", diff: "hard", note: "To be stunned." , category: "emotions"},
  { es: "estar en la luna", en: "daydream", diff: "medium", note: "To be distracted." , category: "mind"},
  { es: "a troche y moche", en: "here and there", diff: "hard", note: "Randomly / all over the place." , category: "daily"},
  { es: "ponerse las pilas", en: "get moving", diff: "medium", note: "To start working / trying." , category: "work"},
  { es: "a la ligera", en: "take lightly", diff: "hard", note: "To treat something as minor." , category: "daily"},
  { es: "a regañadientes", en: "reluctantly", diff: "hard", note: "With resistance / unwillingly." , category: "daily"},
  { es: "hacer caso omiso", en: "ignore completely", diff: "hard", note: "To ignore on purpose." , category: "daily"},
  { es: "poner pies en polvorosa", en: "run away", diff: "hard", note: "To flee quickly." , category: "daily"},
  { es: "no venir al caso", en: "not relevant", diff: "hard", note: "To be off-topic." , category: "speech"},
  { es: "no morderse la lengua", en: "speak up", diff: "hard", note: "To speak honestly / without holding back." , category: "speech"},
  { es: "estar al tanto", en: "stay informed", diff: "hard", note: "To keep up with what's happening." , category: "work"},
  { es: "ser pan comido", en: "piece cake", diff: "hard", note: "Very easy." , category: "daily"},
  { es: "costar un ojo de la cara", en: "cost arm", diff: "expert", note: "Very expensive." , category: "money"},
  { es: "salir rana", en: "turn out bad", diff: "expert", note: "To end up disappointing." , category: "daily"},
  { es: "estar como una cabra", en: "be crazy", diff: "expert", note: "To be acting weird." , category: "social"},
  { es: "caer bien", en: "seem nice", diff: "expert", note: "To be well-liked." , category: "social"},
  { es: "tener mala suerte", en: "have bad luck", diff: "expert", note: "To be unlucky." , category: "daily"},
  { es: "no dar pie con bola", en: "no luck", diff: "expert", note: "When everything goes wrong." , category: "daily"},
  { es: "dar la cara", en: "face the music", diff: "expert", note: "To face consequences." , category: "work"},
  { es: "de una vez por todas", en: "for good", diff: "expert", note: "Finally, once and for all." , category: "daily"},
];

for (const idm of EXTRA_IDIOMS) {
  addExtra({
    spanish: idm.es,
    english: idm.en,
    difficulty: idm.diff,
    type: "idiom",
    category: idm.category,
    note: idm.note,
    acceptedEn: idm.acceptedEn,
  });
}

export const VORTEX_ITEMS: VortexJsonRow[] = [...BASE_ITEMS, ...EXTRA_ITEMS];

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
  if (VORTEX_ITEMS.length < 600) {
    console.warn(`[vortex] Expected 600+ items, got ${VORTEX_ITEMS.length}.`);
  }
}
