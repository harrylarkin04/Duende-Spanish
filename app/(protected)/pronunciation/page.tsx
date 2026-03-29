import type { Metadata } from "next";

import { PronunciationLab } from "@/components/pronunciation/pronunciation-lab";

export const metadata: Metadata = {
  title: "Pronunciación — Duende",
  description:
    "Practice Spanish pronunciation with a live waveform and AI-style feedback (preview).",
};

export default function PronunciationPage() {
  return <PronunciationLab />;
}
