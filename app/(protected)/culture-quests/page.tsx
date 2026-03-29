import type { Metadata } from "next";

import { PlaceholderScreen } from "@/components/layout/placeholder-screen";

export const metadata: Metadata = {
  title: "Culture Quests — Duende",
  description: "Fiestas, food, and history — culture-first Spanish learning.",
};

export default function CultureQuestsPage() {
  return (
    <PlaceholderScreen
      kicker="Próximamente"
      title="Culture Quests"
      description="Misiones cortas sobre fiestas, cocina regional, arte y memoria colectiva — no trivia fría, sino textura viva que te conecta con cada rincón del español."
    />
  );
}
