import type { Metadata } from "next";

import { ListeningDuelGame } from "@/components/games/listening-duel/listening-duel-game";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Listening Duel — Duende",
  description:
    "Juego de escucha: clips en español, opción múltiple y dictado, combo y poderes Duende.",
};

export default function ListeningDuelPage() {
  return <ListeningDuelGame />;
}
