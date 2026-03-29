import type { Metadata } from "next";

import { GamesHub } from "@/components/games/games-hub";

export const metadata: Metadata = {
  title: "Games — Duende",
  description: "Palabra Vortex and more Spanish learning games.",
};

export default function GamesPage() {
  return <GamesHub />;
}
