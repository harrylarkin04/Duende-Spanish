/**
 * Audio hooks — replace with Howler / Web Audio / MP3 assets later.
 * Call sites stay stable; implementations are no-ops in dev.
 */

export type PalabraSoundId =
  | "correct"
  | "wrong"
  | "tick"
  | "gameOver"
  | "powerup"
  | "whoosh";

/** Set from a settings panel later */
let soundEnabled = true;

export function setPalabraSoundEnabled(on: boolean) {
  soundEnabled = on;
}

export function playPalabraSound(id: PalabraSoundId) {
  if (!soundEnabled || typeof window === "undefined") return;
  // TODO: map id → Audio buffer or Howler sprite
  if (process.env.NODE_ENV === "development") {
    console.debug(`[palabra-vortex] sound: ${id}`);
  }
}
