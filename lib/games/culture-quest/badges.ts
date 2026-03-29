/** Human-readable labels for profile souvenirs (ids stored in Supabase). */
export const SOUVENIR_LABELS: Record<string, { title: string; emoji: string }> = {
  "cq-madrid-bad": { title: "Madrid — aprendizaje", emoji: "🧭" },
  "cq-madrid-good": { title: "Madrid — buen viaje", emoji: "🫒" },
  "cq-madrid-legend": { title: "Madrid — leyenda", emoji: "🎸" },
  "cq-cdmx-bad": { title: "CDMX — aprendizaje", emoji: "🌮" },
  "cq-cdmx-good": { title: "CDMX — buen viaje", emoji: "🌮" },
  "cq-cdmx-legend": { title: "CDMX — leyenda", emoji: "🦎" },
  "cq-ba-bad": { title: "Buenos Aires — aprendizaje", emoji: "🧉" },
  "cq-ba-good": { title: "Buenos Aires — buen viaje", emoji: "💃" },
  "cq-ba-legend": { title: "Buenos Aires — leyenda", emoji: "🎭" },
  "cq-globetrotter": { title: "Globetrotter hispano", emoji: "🌎" },
};

export function souvenirId(city: "madrid" | "cdmx" | "ba", tier: "bad" | "good" | "legendary"): string {
  return `cq-${city}-${tier === "legendary" ? "legend" : tier}`;
}
