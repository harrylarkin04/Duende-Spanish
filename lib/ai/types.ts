export type CompanionId = "spain" | "mexico" | "argentina" | "colombia";

export type CorrectionSpan = {
  /** User phrase that was off */
  original: string;
  /** Natural fix */
  corrected: string;
  /** Short teaching note */
  tip: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  corrections?: CorrectionSpan[];
};

export type ChatCompletionResult = {
  content: string;
  corrections?: CorrectionSpan[];
};

export type ConversationSummary = {
  grammarNotes: string[];
  vocabulary: string[];
  culturalTips: string[];
  encouragement: string;
};

/** Tap-to-translate in immersive reader (server / mock). */
export type ReaderTranslateResult = {
  lemma: string;
  glossEn: string;
  microTip?: string;
};

export type CompanionProfile = {
  id: CompanionId;
  name: string;
  flag: string;
  region: string;
  tagline: string;
  /** BCP-47-ish for speech synthesis */
  speechLang: string;
  voiceHint: string;
};
