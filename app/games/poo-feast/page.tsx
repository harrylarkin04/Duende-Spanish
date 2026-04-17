import type { Metadata } from "next";

import { PooFeastGame } from "@/components/games/poo-feast/poo-feast-game";

export const metadata: Metadata = {
  title: "Festín olfativo — Duende",
  description: "Duelo local para dos jugadores: el menú con más ‘índice de aroma’ gana.",
};

export default function PooFeastPage() {
  return <PooFeastGame />;
}
