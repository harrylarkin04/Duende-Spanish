import type { CityId, EndingTier, QuestNode } from "./types";

export const CITIES: { id: CityId; name: string; subtitle: string; emoji: string }[] = [
  { id: "madrid", name: "Madrid", subtitle: "España", emoji: "🇪🇸" },
  { id: "cdmx", name: "Ciudad de México", subtitle: "México", emoji: "🇲🇽" },
  { id: "ba", name: "Buenos Aires", subtitle: "Argentina", emoji: "🇦🇷" },
];

const graph: Record<string, QuestNode> = {
  "madrid-1": {
    t: "scene",
    id: "madrid-1",
    body: "Llegás a Atocha. El aire huele a café y pan recién hecho. ¿Cómo arrancás el día?",
    fact: "En muchas ciudades de España la comida principal es tarde: alrededor de las 14:00.",
    choices: [
      {
        label: "Saludo con un «buenos días» y pido un café con leche en la barra",
        next: "madrid-2",
        set: { wise: true },
      },
      {
        label: "Grito «HELLO!» en voz alta en medio del andén",
        next: "madrid-2",
      },
      {
        label: "Ignoro a todo el mundo y sigo con el móvil",
        next: "madrid-2",
      },
    ],
  },
  "madrid-2": {
    t: "scene",
    id: "madrid-2",
    body: "Caminás hacia un bar de barrio. El camarero pregunta: «¿Qué te pongo?»",
    fact: "Pedir «una caña» es pedir cerveza pequeña; es muy típico con unas tapas.",
    choices: [
      { label: "«Dos cañas y lo que recomiendes para picar»", next: "madrid-mc", set: { wise: true } },
      { label: "«Solo agua, y rápido»", next: "madrid-mc" },
      { label: "«Lo más caro del menú, sin mirar»", next: "madrid-mc" },
    ],
  },
  "madrid-mc": {
    t: "mc",
    id: "madrid-mc",
    body: "¿En qué franja suele cenar la gente en Madrid un día normal?",
    fact: "La cena suele ser ligera y bastante tarde respecto a EE. UU. o el norte de Europa.",
    options: [
      { label: "Entre las 21:00 y las 23:00", correct: true },
      { label: "A las 18:00 en punto", correct: false },
      { label: "Solo a mediodía, nunca por la noche", correct: false },
      { label: "A las 6 de la mañana", correct: false },
    ],
    nextCorrect: "madrid-text",
    nextWrong: "madrid-text",
  },
  "madrid-text": {
    t: "text",
    id: "madrid-text",
    body: "Escribí una frase corta para pedir la cuenta (sin tilde en la respuesta cuenta igual).",
    accept: ["la cuenta", "cuenta", "me cobras", "me cobra", "quiero pagar", "pagar"],
    nextOk: "madrid-fin",
    nextBad: "madrid-fin",
  },
  "madrid-fin": { t: "fin", id: "madrid-fin" },

  "cdmx-1": {
    t: "scene",
    id: "cdmx-1",
    body: "Aterrizás en la Ciudad de México. El Zócalo brilla bajo el sol. ¿Tu primer movimiento?",
    fact: "«Por favor» y «gracias» abren puertas en cualquier puesto o museo.",
    choices: [
      { label: "Saludo al vendedor de dulces con «buenas tardes»", next: "cdmx-2", set: { wise: true } },
      { label: "Tomo fotos sin mirar a nadie", next: "cdmx-2" },
      { label: "Critico en voz alta el tráfico frente a locales", next: "cdmx-2" },
    ],
  },
  "cdmx-2": {
    t: "scene",
    id: "cdmx-2",
    body: "Entrás a una fondita. Huele a comino y cilantro. ¿Qué pedís?",
    fact: "Pedir «de la casa» o preguntar el platillo del día suele ser delicioso y honesto.",
    choices: [
      { label: "«¿Qué recomienda hoy el chef?»", next: "cdmx-mc", set: { wise: true } },
      { label: "«Lo mismo que el turista de al lado»", next: "cdmx-mc" },
      { label: "«Solo hamburguesa, nada picante»", next: "cdmx-mc" },
    ],
  },
  "cdmx-mc": {
    t: "mc",
    id: "cdmx-mc",
    body: "¿Qué significa «¿Mande?» en muchos contextos en México?",
    fact: "No es mandato militar: es atención cortés, como «¿diga?» o «¿sí?».",
    options: [
      { label: "Una forma respetuosa de decir «¿sí?» / «¿diga?»", correct: true },
      { label: "Que alguien te está ordenando algo", correct: false },
      { label: "Que la comida está lista", correct: false },
      { label: "Que debés gritar más fuerte", correct: false },
    ],
    nextCorrect: "cdmx-text",
    nextWrong: "cdmx-text",
  },
  "cdmx-text": {
    t: "text",
    id: "cdmx-text",
    body: "Escribí cómo pedirías agua en un puesto (una palabra o frase corta en español).",
    accept: ["agua", "un agua", "una botella de agua", "agua por favor", "agua, por favor"],
    nextOk: "cdmx-fin",
    nextBad: "cdmx-fin",
  },
  "cdmx-fin": { t: "fin", id: "cdmx-fin" },

  "ba-1": {
    t: "scene",
    id: "ba-1",
    body: "Llegás a Buenos Aires. El subte huele a café y a tango lejano. ¿Cómo te presentás?",
    fact: "En el Río de la Plata el «vos» es cotidiano; entenderlo ayuda muchísimo.",
    choices: [
      { label: "«Che, buenas — ¿de casualidad sabés dónde hay un buen café?»", next: "ba-2", set: { wise: true } },
      { label: "Hablo solo en inglés más fuerte", next: "ba-2" },
      { label: "Me quejo del calor sin saludar", next: "ba-2" },
    ],
  },
  "ba-2": {
    t: "scene",
    id: "ba-2",
    body: "Entrás a una confitería porteña. Hay medialunas y debate de fútbol suave.",
    fact: "Compartir mesa y charla corta es parte del ritual; no siempre es «solo negocio».",
    choices: [
      { label: "Pido medialunas y un café, y agradezco al mozo", next: "ba-mc", set: { wise: true } },
      { label: "Pido y me voy sin mirar", next: "ba-mc" },
      { label: "Insulto al árbitro por la tele aunque nadie preguntó", next: "ba-mc" },
    ],
  },
  "ba-mc": {
    t: "mc",
    id: "ba-mc",
    body: "¿Qué es lo más habitual con «el mate» en Argentina?",
    fact: "El mate es ritual social: se comparte la misma bombilla en un círculo de confianza.",
    options: [
      { label: "Una infusión que a menudo se comparte en ronda", correct: true },
      { label: "Un postre helado exclusivo de invierno", correct: false },
      { label: "Un tipo de taxi", correct: false },
      { label: "Solo se bebe en silencio absoluto, nunca en grupo", correct: false },
    ],
    nextCorrect: "ba-text",
    nextWrong: "ba-text",
  },
  "ba-text": {
    t: "text",
    id: "ba-text",
    body: "Escribí «gracias» de forma coloquial rioplatense (una palabra).",
    accept: ["gracias", "muchas gracias", "mil gracias", "gracias che"],
    nextOk: "ba-fin",
    nextBad: "ba-fin",
  },
  "ba-fin": { t: "fin", id: "ba-fin" },
};

export function startNodeId(city: CityId): string {
  return `${city}-1`;
}

export function getNode(id: string): QuestNode | undefined {
  return graph[id];
}

export function tierFromFlags(f: { wise: boolean; trivia: boolean; phrase: boolean }): "bad" | "good" | "legendary" {
  const n = (f.wise ? 1 : 0) + (f.trivia ? 1 : 0) + (f.phrase ? 1 : 0);
  if (n >= 3) return "legendary";
  if (n >= 2) return "good";
  return "bad";
}

export function scoreForTier(tier: "bad" | "good" | "legendary"): number {
  if (tier === "legendary") return 100;
  if (tier === "good") return 68;
  return 40;
}

export const EPILOGUES: Record<
  CityId,
  Record<EndingTier, { title: string; body: string }>
> = {
  madrid: {
    bad: {
      title: "Fin del viaje — tropiezos",
      body: "Te perdiste algunos matices, pero Madrid te dejó huella. Mañana otro intento: el tapeo te espera.",
    },
    good: {
      title: "Buen viaje por Madrid",
      body: "Leíste la sala, pediste con calma y respetaste el ritmo. Volvé cuando quieras otra caña.",
    },
    legendary: {
      title: "Leyenda madrileña",
      body: "Caminás la ciudad como quien escucha jazz: ritmo, cortesía y hambre de vida. ¡Eso es duende!",
    },
  },
  cdmx: {
    bad: {
      title: "CDMX — todavía hay mapa por recorrer",
      body: "Chocaste con choques culturales, pero la ciudad es paciente. Un «mande» bien puesto cambia todo.",
    },
    good: {
      title: "CDMX te abrió la puerta",
      body: "Saboreaste el caos con respeto. La próxima vuelta: más puestos, menos prisa.",
    },
    legendary: {
      title: "Leyenda del Zócalo",
      body: "Entendiste el calor humano y el picor del idioma. ¡Qué envidia da tu viaje!",
    },
  },
  ba: {
    bad: {
      title: "Buenos Aires — primer round",
      body: "A veces el tango pisa fuerte. No pasa nada: el mate en ronda todavía te espera.",
    },
    good: {
      title: "Buen viaje porteño",
      body: "Cortaste onda con el «che», el café y la cortesía. La ciudad te saluda de vuelta.",
    },
    legendary: {
      title: "Leyenda de la milonga",
      body: "Navegaste el vos, el humor y la calle. Sos de la casa.",
    },
  },
};
