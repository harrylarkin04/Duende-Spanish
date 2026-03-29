import { COMPANIONS } from "@/lib/ai/companions";
import type { CompanionId } from "@/lib/ai/types";

export const COMPANION_IDS: CompanionId[] = COMPANIONS.map((c) => c.id);

export function isCompanionId(x: unknown): x is CompanionId {
  return typeof x === "string" && COMPANION_IDS.includes(x as CompanionId);
}
