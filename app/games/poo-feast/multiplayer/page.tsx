import type { Metadata } from "next";
import { Suspense } from "react";

import { PooFeastMultiplayerGame } from "@/components/games/poo-feast/poo-feast-multiplayer-game";

import { PooFeastMpSuspenseFallback } from "./multiplayer-suspense-fallback";

export const metadata: Metadata = {
  title: "Festín olfativo multijugador — Duende",
  description: "Sala con código — duelo de índice de aroma entre dos jugadores.",
};

export default function PooFeastMultiplayerPage() {
  return (
    <Suspense fallback={<PooFeastMpSuspenseFallback />}>
      <PooFeastMultiplayerGame />
    </Suspense>
  );
}
