import type { Metadata } from "next";

import { PooFeastLocalGame } from "@/components/games/poo-feast/poo-feast-local-game";

export const metadata: Metadata = {
  title: "Festín olfativo (local) — Duende",
  description: "Dos jugadores en el mismo dispositivo — índice de aroma.",
};

export default function PooFeastLocalPage() {
  return <PooFeastLocalGame />;
}
