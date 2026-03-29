import type { Metadata } from "next";

import { CultureQuestGame } from "@/components/games/culture-quest/culture-quest-game";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Culture Quest — Duende",
  description:
    "Mini aventura por Madrid, Ciudad de México y Buenos Aires: decisiones en español, datos culturales y souvenirs en tu perfil.",
};

export default function CultureQuestPage() {
  return <CultureQuestGame />;
}
