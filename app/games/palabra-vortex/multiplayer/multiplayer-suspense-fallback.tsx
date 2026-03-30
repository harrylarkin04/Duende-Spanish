"use client";

import { MultiplayerConnectingSpinner } from "@/components/games/palabra-vortex/multiplayer-page-ui";

/** Client wrapper so we can log when the route Suspense boundary is showing. */
export function MultiplayerSuspenseFallback() {
  return <MultiplayerConnectingSpinner context="Next.js Suspense (search params loading)" />;
}
