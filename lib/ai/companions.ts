import type { CompanionProfile } from "./types";

export const COMPANIONS: CompanionProfile[] = [
  {
    id: "spain",
    name: "Sofía",
    flag: "🇪🇸",
    region: "España",
    tagline: "Castellano con calor de Madrid — directa, musical, nada de prisa.",
    speechLang: "es-ES",
    voiceHint: "Peninsular seseo/distinction varies; clear Madrid energy.",
  },
  {
    id: "mexico",
    name: "Diego",
    flag: "🇲🇽",
    region: "México",
    tagline: "Chilango soul — cálido, chistoso, te explica el mundo entre tacos.",
    speechLang: "es-MX",
    voiceHint: "Mexican Spanish intonation; vos no, tú y usted.",
  },
  {
    id: "argentina",
    name: "Valentina",
    flag: "🇦🇷",
    region: "Argentina",
    tagline: "Río y mate — voseo natural, pasión en cada sílaba.",
    speechLang: "es-AR",
    voiceHint: "Vos, tenés, ¿qué querés? — she leans into it kindly.",
  },
  {
    id: "colombia",
    name: "Camilo",
    flag: "🇨🇴",
    region: "Colombia",
    tagline: "Bogotá bonita — pronunciación clara, ritmo amable.",
    speechLang: "es-CO",
    voiceHint: "Colombian clarity; usted can feel extra warm.",
  },
];

export function getCompanion(id: CompanionProfile["id"]): CompanionProfile {
  return COMPANIONS.find((c) => c.id === id) ?? COMPANIONS[0];
}
