import type { Metadata } from "next";
import { Suspense } from "react";

import { PalabraMultiplayerGame } from "@/components/games/palabra-vortex/palabra-multiplayer-game";

import { MultiplayerSuspenseFallback } from "./multiplayer-suspense-fallback";

export const metadata: Metadata = {
  title: "Palabra Vortex Multijugador — Duende",
  description:
    "Grammar Gladiators: 12 rondas, monstruos por ronda, barras de vida, Skip temprano, Duende Rage (2× puntos una vez) y pistas — duelo spanish→english (1–3 palabras) sincronizado con Supabase Realtime.",
};

export default function PalabraMultiplayerPage() {
  return (
    <Suspense fallback={<MultiplayerSuspenseFallback />}>
      <PalabraMultiplayerGame />
    </Suspense>
  );
}
