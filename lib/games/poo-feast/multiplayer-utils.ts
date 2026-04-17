import { guessBrowserCountry, countryLabel, flagEmoji } from "@/lib/games/palabra-vortex/multiplayer-utils";

export const POO_FEAST_CHANNEL_PREFIX = "poo-feast-mp-";
export const POO_FEAST_BROADCAST = "poo_feast_taunt";

export function pooFeastChannelName(roomCode: string): string {
  return `${POO_FEAST_CHANNEL_PREFIX}${roomCode}`;
}

export function normalizePooRoomCode(raw: string | null): string {
  if (!raw) return "";
  return raw.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
}

export { guessBrowserCountry, countryLabel, flagEmoji };
