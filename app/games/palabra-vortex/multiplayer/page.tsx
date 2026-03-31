import type { Metadata } from "next";
import { Suspense } from "react";

import { PalabraMultiplayerGame } from "@/components/games/palabra-vortex/palabra-multiplayer-game";

import { MultiplayerSuspenseFallback } from "./multiplayer-suspense-fallback";

export const metadata: Metadata = {
  title: "Palabra Vortex Multijugador — Duende",
  description:
    "Grammar Gladiators: synced 2–3 player rounds with full answer reveal on fail, 10s masked-English hints, and skip-for-all with cooldown in Supabase Realtime.",
};

export default function PalabraMultiplayerPage() {
  return (
    <Suspense fallback={<MultiplayerSuspenseFallback />}>
      <PalabraMultiplayerGame />
    </Suspense>
  );
}
