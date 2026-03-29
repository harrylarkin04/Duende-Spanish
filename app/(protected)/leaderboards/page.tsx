import type { Metadata } from "next";

import { LeaderboardsView } from "@/components/leaderboards/leaderboards-view";

export const metadata: Metadata = {
  title: "Leaderboards — Duende",
  description: "Rankings de fluidez, Palabra Vortex, Grammar Gladiator y rachas — global, amigos y semana.",
};

export default function LeaderboardsPage() {
  return <LeaderboardsView />;
}
