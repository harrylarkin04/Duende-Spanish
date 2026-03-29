import type { Metadata } from "next";

import { ImmersiveMediaClient } from "@/components/media/immersive-media-client";

export const metadata: Metadata = {
  title: "Immersive Media — Duende",
  description:
    "AI-powered Spanish reading and listening with interactive transcripts. Tap words to translate and save.",
};

export default function MediaPage() {
  return <ImmersiveMediaClient />;
}
