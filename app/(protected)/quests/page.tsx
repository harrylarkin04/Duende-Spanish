import type { Metadata } from "next";

import { NarrativeAdventure } from "@/components/quests/narrative-adventure";

export const metadata: Metadata = {
  title: "Aventuras — Duende",
  description:
    "Interactive Spanish narrative quests. Choose your path through Buenos Aires and beyond.",
};

export default function QuestsPage() {
  return <NarrativeAdventure />;
}
