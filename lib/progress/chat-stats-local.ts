const STORAGE_KEY = "duende.progress.chat-v1";

export type ChatProgressSnapshot = {
  userMessagesTotal: number;
  assistantMessagesTotal: number;
  voiceTurns: number;
  lastAt: string | null;
};

function read(): ChatProgressSnapshot {
  if (typeof window === "undefined") {
    return {
      userMessagesTotal: 0,
      assistantMessagesTotal: 0,
      voiceTurns: 0,
      lastAt: null,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        userMessagesTotal: 0,
        assistantMessagesTotal: 0,
        voiceTurns: 0,
        lastAt: null,
      };
    }
    const p = JSON.parse(raw) as Record<string, unknown>;
    return {
      userMessagesTotal:
        typeof p.userMessagesTotal === "number" ? p.userMessagesTotal : 0,
      assistantMessagesTotal:
        typeof p.assistantMessagesTotal === "number"
          ? p.assistantMessagesTotal
          : 0,
      voiceTurns: typeof p.voiceTurns === "number" ? p.voiceTurns : 0,
      lastAt: typeof p.lastAt === "string" ? p.lastAt : null,
    };
  } catch {
    return {
      userMessagesTotal: 0,
      assistantMessagesTotal: 0,
      voiceTurns: 0,
      lastAt: null,
    };
  }
}

function write(s: ChatProgressSnapshot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function getChatProgress(): ChatProgressSnapshot {
  return read();
}

/** Call when the user sends a text message in Companions chat. */
export function recordChatUserMessage() {
  const cur = read();
  write({
    ...cur,
    userMessagesTotal: cur.userMessagesTotal + 1,
    lastAt: new Date().toISOString(),
  });
}

/** Call when the assistant replies (for balance / stats). */
export function recordChatAssistantMessage() {
  const cur = read();
  write({
    ...cur,
    assistantMessagesTotal: cur.assistantMessagesTotal + 1,
    lastAt: new Date().toISOString(),
  });
}

/** Call when the user completes a speech-to-text turn. */
export function recordChatVoiceTurn() {
  const cur = read();
  write({
    ...cur,
    voiceTurns: cur.voiceTurns + 1,
    lastAt: new Date().toISOString(),
  });
}
