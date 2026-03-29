import type { Metadata } from "next";

import { GrammarGladiatorGame } from "@/components/games/grammar-gladiator/grammar-gladiator-game";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Grammar Gladiator — Duende",
  description:
    "Batalla de gramática española: conjuga, elige tiempos y derrota al jefe en 10 asaltos.",
};

export default function GrammarGladiatorPage() {
  return <GrammarGladiatorGame />;
}
