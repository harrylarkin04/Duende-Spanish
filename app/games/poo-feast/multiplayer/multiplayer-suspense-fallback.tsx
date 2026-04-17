"use client";

import { MultiplayerConnectingSpinner } from "@/components/games/palabra-vortex/multiplayer-page-ui";

export function PooFeastMpSuspenseFallback() {
  return (
    <MultiplayerConnectingSpinner
      context="poo-feast-mp-suspense"
      title="Loading room link…"
      description="Preparing Festín olfativo multiplayer."
    />
  );
}
