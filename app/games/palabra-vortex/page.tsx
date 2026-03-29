import type { Metadata } from "next";

import { PalabraVortexGame } from "@/components/games/palabra-vortex/palabra-vortex-game";
import { getPalabraPersonalBests } from "@/lib/data/palabra-bests";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Palabra Vortex — Duende",
  description:
    "High-speed Spanish ↔ English translation game. Mixed words, phrases, collocations, and short idioms — answers stay to 1–3 words in English.",
};

export default async function PalabraVortexPage() {
  const difficultyBests = await getPalabraPersonalBests();
  return <PalabraVortexGame initialDifficultyBests={difficultyBests} />;
}
