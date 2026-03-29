import type { Metadata } from "next";

import { ProgressPalace } from "@/components/progress/progress-palace";

export const metadata: Metadata = {
  title: "Progress Palace — Duende",
  description: "Your fluency journey, streaks, and achievements in Duende.",
};

export default function ProgressPalacePage() {
  return <ProgressPalace />;
}
