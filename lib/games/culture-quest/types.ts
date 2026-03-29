export type CityId = "madrid" | "cdmx" | "ba";

export type EndingTier = "bad" | "good" | "legendary";

export type QuestFlags = {
  wise: boolean;
  trivia: boolean;
  phrase: boolean;
};

export type Choice = {
  label: string;
  next: string;
  set?: Partial<QuestFlags>;
};

export type QuestNode =
  | {
      t: "scene";
      id: string;
      body: string;
      fact?: string;
      choices: Choice[];
    }
  | {
      t: "mc";
      id: string;
      body: string;
      fact?: string;
      options: { label: string; correct: boolean }[];
      nextCorrect: string;
      nextWrong: string;
    }
  | {
      t: "text";
      id: string;
      body: string;
      accept: string[];
      nextOk: string;
      nextBad: string;
    }
  | { t: "fin"; id: string };
