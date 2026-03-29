import "server-only";

import { buildSystemPrompt } from "./prompts";
import type {
  ChatCompletionResult,
  ChatMessage,
  CompanionId,
  ConversationSummary,
  ReaderTranslateResult,
} from "./types";

type SlimMsg = { role: "user" | "assistant"; content: string };

/**
 * Server-side chat + summary.
 * Set `OPENAI_API_KEY` (optionally `OPENAI_API_BASE`, `OPENAI_MODEL`)
 * or `GROK_API_KEY` (optionally `GROK_API_BASE`, `GROK_MODEL`) for live models.
 * Without keys, Duende uses warm mock replies so the UI stays fully usable.
 */

function getProvider(): "grok" | "openai" | "mock" {
  if (process.env.GROK_API_KEY) return "grok";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "mock";
}

async function callChatCompletions(
  messages: { role: string; content: string }[],
  opts?: { temperature?: number; max_tokens?: number },
): Promise<string> {
  const provider = getProvider();
  if (provider === "mock") {
    throw new Error("mock");
  }

  const isGrok = provider === "grok";
  const apiKey = isGrok ? process.env.GROK_API_KEY! : process.env.OPENAI_API_KEY!;
  const base =
    (isGrok ? process.env.GROK_API_BASE : process.env.OPENAI_API_BASE)?.replace(
      /\/$/,
      "",
    ) ?? (isGrok ? "https://api.x.ai" : "https://api.openai.com");
  const model =
    (isGrok ? process.env.GROK_MODEL : process.env.OPENAI_MODEL) ??
    (isGrok ? "grok-2-latest" : "gpt-4o-mini");

  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts?.temperature ?? 0.85,
      max_tokens: opts?.max_tokens ?? 900,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI HTTP ${res.status}: ${err.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty AI response");
  return text;
}

function mockComplete(lastUser: string, companionId: CompanionId): ChatCompletionResult {
  const t = lastUser.trim();
  const lower = t.toLowerCase();

  const corrections: ChatCompletionResult["corrections"] = [];
  if (/\byo gusto\b/i.test(t)) {
    corrections.push({
      original: "yo gusto",
      corrected: "me gusta / me gustan",
      tip: "`Gustar` va con el objeto que te gusta como sujeto: Me gusta el café.",
    });
  }
  if (/\bme llamo es\b/i.test(t)) {
    corrections.push({
      original: "me llamo es…",
      corrected: "me llamo… / soy…",
      tip: "O me llamo Sofía o soy Sofía — no mezcles con *es*.",
    });
  }
  if (/\bmucho grande\b/i.test(t)) {
    corrections.push({
      original: "mucho grande",
      corrected: "muy grande",
      tip: "`Muy` intensifica adjetivos; *mucho* suele ir con sustantivos o verbos.",
    });
  }

  let content: string;
  if (/^(hola|buenas|hey|hi)\b/i.test(t) || t.length < 4) {
    content =
      companionId === "argentina"
        ? `¡Hola, vos! 💃 Mirá qué lindo que estés acá. Contame: ¿qué te trae por el chat hoy? Podemos charlar de lo que quieras — música, mate, o practicar una frase que te cueste.`
        : companionId === "mexico"
          ? `¡Qué onda! Qué gusto saludarte. Oye, cuéntame: ¿cómo va tu español hoy? Si quieres practicamos algo relajado, con todo el tiempo del mundo.`
          : companionId === "colombia"
            ? `¡Hola, qué bien verte por acá! Cuéntame en qué te puedo ayudar hoy — con calma, paso a paso, como entre amigos en una esquina de Bogotá.`
            : `¡Hola, corazón! Me alegra un montón leerte. ¿Qué tal llevas el día? Si te animas, escríbeme algo en español — aunque sea una línea — y seguimos desde ahí con calma.`;
  } else if (/cansad|trist|mal|difícil|estres/i.test(lower)) {
    content =
      companionId === "mexico"
        ? `Uy, se siente eso en cómo escribes. Mira: aprender idioma también es cuidarte. ¿Quieres que hablemos de algo liviano un rato? Un chiste, una serie, lo que te haga sentir más en casa con el español.`
        : `Oye… primero un abrazo virtual, ¿sí? El español puede frustrar, pero no estás sola/o. Respiramos, y si quieres seguimos con una frase cortita que domines bien — para recuperar confianza.`;
  } else if (/comida|comer|restaurant|tapas|taco|asado|paella/i.test(lower)) {
    content =
      companionId === "spain"
        ? `¡Uy, comida! En España la mesa es religión. Si me dices qué plato te flipa (o te da miedo pedir en un bar), te enseño cómo pedirlo con estilo — sin sonar guiri forzado.`
        : companionId === "mexico"
          ? `¡Ándale! La comida es idioma también: tacos, salsas, el arte del \"con todo\". Dime qué probaste o qué te da curiosidad y armamos vocabulario delicioso.`
          : `Me encanta cuando el hambre mete las narices en el chat. Contame qué comida asociás con tu español — y le damos sabor con palabras nuevas.`;
  } else {
    content =
      companionId === "argentina"
        ? `Che, me encanta lo que contás. Te respondo con todo el cariño: seguí escribiendo como se te ocurre, y entre charla te voy marcando matices del voseo sin asustarte. ¿Querés que repitamos algo en voz alta mentalmente?`
        : companionId === "colombia"
          ? `Qué rico leerte. Lo que dices tiene sentido; si querés lo pulimos juntos sin drama. En Colombia a veces el \"usted\" es ternura, no distancia — te cuento cuando toque.`
          : `Me quedo con lo que dijiste — suena a voz propia, eso es oro. Sigo en español para que el oído se acostumbre; si atascas, me dices \"explain\" y cambiamos un segundo al inglés.`;
  }

  return {
    content,
    corrections: corrections.length ? corrections : undefined,
  };
}

export async function completeChatTurn(
  messages: SlimMsg[],
  companionId: CompanionId,
): Promise<ChatCompletionResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const system = buildSystemPrompt(companionId);

  try {
    const apiMessages = [
      { role: "system" as const, content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const text = await callChatCompletions(apiMessages);
    return { content: text };
  } catch {
    return mockComplete(lastUser, companionId);
  }
}

function mockReaderTranslate(lemma: string): ReaderTranslateResult {
  const t = lemma.toLowerCase();
  const table: Record<string, { glossEn: string; microTip?: string }> = {
    mañana: {
      glossEn: "tomorrow; morning (with *por la mañana*)",
      microTip: "*Hasta mañana* = see you tomorrow; *mañana por la mañana* = tomorrow morning.",
    },
    tarde: {
      glossEn: "afternoon; late",
      microTip: "*Por la tarde* = in the afternoon; *llegar tarde* = to arrive late.",
    },
    noche: { glossEn: "night", microTip: "*Buenas noches* greets or says goodnight." },
    calle: { glossEn: "street", microTip: "Often with article: *la calle*." },
    mercado: { glossEn: "market", microTip: "Can be indoor market or open-air." },
    abuelas: { glossEn: "grandmothers", microTip: "Singular *abuela*." },
    recuerdos: { glossEn: "memories; souvenirs", microTip: "Context picks sense: emotional vs objects." },
    risas: { glossEn: "laughter; laughs", microTip: "Plural of *risa*." },
    vecinos: { glossEn: "neighbors", microTip: "Singular *vecino / vecina*." },
    silbido: { glossEn: "whistle", microTip: "From *silbar* (to whistle)." },
    tejado: { glossEn: "roof", microTip: "Tiles on top of the house." },
    vendedor: { glossEn: "seller; vendor", microTip: "*Vender* = to sell." },
    hierbas: { glossEn: "herbs; grasses", microTip: "Kitchen herbs vs wild plants by context." },
    olor: { glossEn: "smell; odor", microTip: "Neutral; *aroma* is often pleasant." },
    pan: { glossEn: "bread", microTip: "*El pan* is a staple in many Spanish routines." },
    café: { glossEn: "coffee; café", microTip: "Place vs drink from context." },
    plaza: { glossEn: "square; plaza", microTip: "Social heart of many towns." },
    sombra: { glossEn: "shade; shadow", microTip: "*Hacer sombra* = to cast shade." },
    verano: { glossEn: "summer", microTip: "Opposite *invierno*." },
    historia: { glossEn: "history; story", microTip: "Same word for history and a tale." },
    cielo: { glossEn: "sky; heaven", microTip: "Poetic register uses *cielo* for darling too." },
    estrellas: { glossEn: "stars", microTip: "Singular *estrella*." },
    ciudad: { glossEn: "city", microTip: "Contrast *pueblo* (town)." },
    gente: { glossEn: "people", microTip: "Singular verb often: *la gente camina*." },
    acuerdo: { glossEn: "agreement; memory (*me acuerdo*)", microTip: "*De acuerdo* = okay / agreed." },
    palabras: { glossEn: "words", microTip: "Singular *palabra*." },
    música: { glossEn: "music", microTip: "Stress on *sí* in many accents." },
    voz: { glossEn: "voice", microTip: "*Alta voz* = aloud." },
  };
  const hit = table[t];
  if (hit) {
    return { lemma, glossEn: hit.glossEn, microTip: hit.microTip };
  }
  return {
    lemma,
    glossEn: `“${lemma}” — keep the sentence in mind; repetition locks meaning in.`,
    microTip:
      "With an API key on the server you get sharper, context-specific glosses.",
  };
}

export async function translateReaderToken(args: {
  tokenSurface: string;
  lemma: string;
  sentence: string;
}): Promise<ReaderTranslateResult> {
  const { tokenSurface, lemma, sentence } = args;
  const system = [
    "You help Spanish learners reading a passage.",
    "Output ONLY valid JSON with keys: lemma (string, dictionary form if clear), glossEn (concise English gloss in context, max 22 words),",
    "microTip (optional string, max 140 chars, or empty string).",
    "No markdown fences. Be accurate and warm, not verbose.",
  ].join(" ");

  const user = [
    `Word tapped (surface): ${tokenSurface}`,
    `Lemma hint: ${lemma}`,
    `Sentence: ${sentence}`,
  ].join("\n");

  try {
    const text = await callChatCompletions(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0.25, max_tokens: 220 },
    );
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const le = typeof parsed.lemma === "string" ? parsed.lemma : lemma;
    const glossEn =
      typeof parsed.glossEn === "string" ? parsed.glossEn : mockReaderTranslate(lemma).glossEn;
    const microTip =
      typeof parsed.microTip === "string" && parsed.microTip.trim()
        ? parsed.microTip.trim()
        : undefined;
    if (!glossEn.trim()) throw new Error("empty gloss");
    return { lemma: le || lemma, glossEn: glossEn.trim(), microTip };
  } catch {
    return mockReaderTranslate(lemma || tokenSurface);
  }
}

export async function generateConversationSummary(
  messages: SlimMsg[],
  companionId: CompanionId,
): Promise<ConversationSummary> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Learner" : "Companion"}: ${m.content}`)
    .join("\n\n");

  const system = [
    "You are a Spanish coach. Read the dialogue and output ONLY valid JSON with keys:",
    "grammarNotes (string array, max 4 short bullets), vocabulary (string array, max 8 Spanish words or phrases worth saving),",
    "culturalTips (string array, max 3), encouragement (one warm sentence in Spanish).",
    "Be specific to what was actually discussed. No markdown fences.",
  ].join(" ");

  try {
    const text = await callChatCompletions([
      { role: "system", content: system },
      {
        role: "user",
        content: `Companion accent region id: ${companionId}\n\nTranscript:\n${transcript}`,
      },
    ]);
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as ConversationSummary;
    if (!parsed.grammarNotes || !parsed.vocabulary || !parsed.culturalTips || !parsed.encouragement) {
      throw new Error("bad shape");
    }
    return parsed;
  } catch {
    return mockSummary(companionId, messages.length);
  }
}

function mockSummary(
  companionId: CompanionId,
  turns: number,
): ConversationSummary {
  const regional =
    companionId === "argentina"
      ? [
          "El voseo (vos tenés) es gramaticalmente regular — practicá una misma plantilla hasta que salga solo.",
        ]
      : companionId === "mexico"
        ? [
            "Las muletillas (¿verdad?, o sea) dan naturalidad — úsalas con moderación en formal.",
          ]
        : companionId === "colombia"
          ? [
              "En Colombia \"parce\" y \"chévere\" abren puertas sociales suaves.",
            ]
          : [
              "En España \"vale\" cierra acuerdos; \"bueno\" puede ser transición, no solo 'good'.",
            ];

  return {
    grammarNotes: [
      ...regional,
      "Encadena dos oraciones con un conector (por eso, además, entonces) en tu próxima práctica.",
      turns < 4
        ? "Cuando puedas, escribe una mini-historia de 3 frases en pasado — el pretérito vs imperfecto se siente con contexto."
        : "Buen volumen de turnos: prueba repetir una frase del chat en voz alta para fijar ritmo.",
    ],
    vocabulary: ["alegría", "charlar", "matices", "confianza", "ternura", "sabor", "aguante", "compás"],
    culturalTips: [
      companionId === "argentina"
        ? "Compartir mate es ritual: no tocar la bombilla de otros es señal de respeto."
        : companionId === "mexico"
          ? "El humor mexicano a menudo va con ironía suave — si no captas el chiste, pedir que te lo expliquen es señal de confianza."
          : companionId === "colombia"
            ? "Preguntar \"¿bien o qué?\" puede ser saludo cotidiano, no solo pregunta literal."
            : "La sobremesa larga no es impuntualidad — es conversación como arte.",
    ],
    encouragement:
      "Seguís construyendo un español con alma; cada mensaje cuenta, en serio.",
  };
}

/** Map full messages to slim payload for API */
export function toSlimMessages(messages: ChatMessage[]): SlimMsg[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}
