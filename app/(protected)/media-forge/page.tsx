import type { Metadata } from "next";

import { PlaceholderScreen } from "@/components/layout/placeholder-screen";

export const metadata: Metadata = {
  title: "Media Forge — Duende",
  description: "Immersive Spanish media — films, music, and podcasts coming soon.",
};

export default function MediaForgePage() {
  return (
    <PlaceholderScreen
      kicker="Próximamente"
      title="Media Forge"
      description="Aquí forjaremos playlists vivas, clips con subtítulos inteligentes y rutas de inmersión con cine, música y podcasts del mundo hispanohablante."
    />
  );
}
