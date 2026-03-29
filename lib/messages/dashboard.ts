/**
 * Dashboard copy — structured for future Spanish / English switching.
 */
export const dashboardMessages = {
  en: {
    tagline: "Capture the soul of Spanish",
    badgeLive: "Your journey",
    fluencyLabel: "Overall fluency",
    fluencyCaption: "Overall",
    weeklyGoal: "Weekly goal",
    weeklyHint: "Sessions toward this week's flame",
    streakLabel: "Day streak",
    streakHint: "Day streak — don't break the compás",
    mapTitle: "Latin pulse",
    mapSubtitle: "Tap a region — feel the accent.",
    ritualTitle: "Daily Duende Ritual",
    ritualSubtitle: "3 minutes. One win. Keep the flame.",
    ritualCTA: "Begin ritual",
    ritualTime: "~3 min",
    ritualTask: "Shadow a native clip from Sevilla — focus on the “r” roll.",
    featuresTitle: "Quick paths",
    featuresSubtitle: "Dive where your curiosity pulls you.",
    features: {
      palabra: { title: "Palabra Vortex", desc: "High-speed vocabulary in the flow state." },
      ai: { title: "AI Companions", desc: "Role-play cafés, markets, and midnight confessions." },
      media: {
        title: "Immersive Media",
        desc: "Interactive transcripts: tap words to translate with AI and save vocabulary.",
      },
      culture: {
        title: "Story Adventures",
        desc: "Choose-your-path tales in Spanish — start with a day in Buenos Aires.",
      },
    },
    regionHint: "Region unlocked",
    weeklyRankTitle: "Your rank this week",
    weeklyRankHas: "You're #{rank} by games played this week ({games} sessions).",
    weeklyRankNone: "Play this week to climb the board — {games} sessions logged.",
    friendsStreaksTitle: "Friends' streaks",
    friendsStreaksEmpty: "Follow people from leaderboards to see their streak flames here.",
  },
  es: {
    tagline: "Captura el alma del español",
    badgeLive: "Tu camino",
    fluencyLabel: "Fluidez general",
    fluencyCaption: "General",
    weeklyGoal: "Meta semanal",
    weeklyHint: "Sesiones hacia la llama de esta semana",
    streakLabel: "Racha de días",
    streakHint: "Días de racha — no rompas el compás",
    mapTitle: "Pulso latino",
    mapSubtitle: "Toca una región — siente el acento.",
    ritualTitle: "Ritual Diario Duende",
    ritualSubtitle: "3 minutos. Una victoria. Mantén la llama.",
    ritualCTA: "Empezar ritual",
    ritualTime: "~3 min",
    ritualTask: "Imita un clip nativo de Sevilla — enfócate en la “erre”.",
    featuresTitle: "Accesos rápidos",
    featuresSubtitle: "Sumérgete donde tire tu curiosidad.",
    features: {
      palabra: { title: "Palabra Vortex", desc: "Vocabulario a toda velocidad en estado de flow." },
      ai: { title: "Compañeros IA", desc: "Role-play en cafés, mercados y confesiones de medianoche." },
      media: {
        title: "Media inmersiva",
        desc: "Transcripciones interactivas: toca palabras, traduce con IA y guarda vocabulario.",
      },
      culture: {
        title: "Aventuras narrativas",
        desc: "Historias donde elegís en español — empezá con un día en Buenos Aires.",
      },
    },
    regionHint: "Región desbloqueada",
    weeklyRankTitle: "Tu puesto esta semana",
    weeklyRankHas: "Sos #{rank} por partidas esta semana ({games} sesiones).",
    weeklyRankNone: "Jugá esta semana para entrar al ranking — {games} sesiones registradas.",
    friendsStreaksTitle: "Rachas de amigos",
    friendsStreaksEmpty: "Seguí gente desde los leaderboards para ver sus llamas acá.",
  },
} as const;

export type DashboardLocale = keyof typeof dashboardMessages;

export const defaultDashboardLocale: DashboardLocale = "en";
