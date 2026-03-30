import type { Metadata } from "next";
import { Suspense } from "react";

import { PalabraMultiplayerGame } from "@/components/games/palabra-vortex/palabra-multiplayer-game";

import { MultiplayerSuspenseFallback } from "./multiplayer-suspense-fallback";

export const metadata: Metadata = {
  title: "Palabra Vortex Multijugador — Duende",
  description:
    "Duelo en tiempo casi real con código de sala, presencia y la misma ronda de spanish→english (1–3 palabras) en dos dispositivos.",
};

export default function PalabraMultiplayerPage() {
  return (
    <Suspense fallback={<MultiplayerSuspenseFallback />}>
      <PalabraMultiplayerGame />
    </Suspense>
  );
}
