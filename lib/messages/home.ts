/**
 * Centralized copy for the home screen — swap locale when i18n is wired up.
 */
export const homeMessages = {
  en: {
    badge: "Bienvenido · Welcome",
    title: "Duende",
    subtitle:
      "Where rhythm, color, and craft meet — a digital fiesta with room to grow.",
    ctaPrimary: "Start the fiesta",
    ctaSecondary: "Explore",
    footnote:
      "Spanish / English language toggle will live here — strings are structured for it.",
  },
  es: {
    badge: "Bienvenido · Welcome",
    title: "Duende",
    subtitle:
      "Donde el ritmo, el color y el oficio se encuentran — una fiesta digital con espacio para crecer.",
    ctaPrimary: "Empezar la fiesta",
    ctaSecondary: "Explorar",
    footnote:
      "El interruptor de idioma español / inglés irá aquí — el texto ya está pensado para eso.",
  },
} as const;

export type HomeLocale = keyof typeof homeMessages;

/** Default locale until a switcher exists */
export const defaultHomeLocale: HomeLocale = "en";
