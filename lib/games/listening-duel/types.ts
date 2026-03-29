import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";

export type ListeningTopicId =
  | "numbers"
  | "greetings"
  | "food"
  | "time"
  | "places"
  | "verbs"
  | "questions"
  | "culture";

export type ListeningPrompt = {
  id: string;
  topic: ListeningTopicId;
  levels: PalabraDifficultyLevel[];
  /** Text spoken by TTS (and correct answer for type mode) */
  spanish: string;
  mode: "mc" | "type";
  /** Distractors for multiple choice (correct is always `spanish`) */
  wrongMc: [string, string, string];
  /** Extra acceptable strings for type mode (normalized match) */
  typeAccepted?: string[];
  duendeHint: string;
};

export type ShuffledListeningRound = {
  prompt: ListeningPrompt;
  choices: string[];
  correctIndex: number;
};

export const LISTENING_TOPIC_LABELS: Record<ListeningTopicId, string> = {
  numbers: "Números",
  greetings: "Saludos",
  food: "Comida",
  time: "Tiempo",
  places: "Lugares",
  verbs: "Verbos",
  questions: "Preguntas",
  culture: "Cultura",
};
