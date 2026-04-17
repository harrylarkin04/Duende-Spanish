import { getFoodById } from "./foods";
import type { FoodCategory } from "./types";

export type SmellBreakdownLine = {
  labelEs: string;
  labelEn: string;
  points: number;
};

export type SmellResult = {
  total: number;
  baseSum: number;
  lines: SmellBreakdownLine[];
};

/** Normalize typo risk — combos reference canonical ids */
const CANONICAL_IDS = new Map<string, string>(
  [["huevos-duro", "huevo-duro"]].map(([alias, canon]) => [alias, canon]),
);

function canonicalFoodId(id: string): string {
  return CANONICAL_IDS.get(id) ?? id;
}

function hasPair(ids: Set<string>, a: string, b: string): boolean {
  return ids.has(canonicalFoodId(a)) && ids.has(canonicalFoodId(b));
}

export function computeSmellScore(rawIds: readonly string[]): SmellResult {
  const ids = rawIds.map(canonicalFoodId);
  const foods = ids
    .map((id) => getFoodById(id))
    .filter((f): f is NonNullable<typeof f> => f != null);
  const baseSum = foods.reduce((s, f) => s + f.smellBase, 0);

  const lines: SmellBreakdownLine[] = [];
  let bonus = 0;

  const idSet = new Set(ids);
  const categories = new Set<FoodCategory>();
  for (const f of foods) categories.add(f.category);

  if (categories.size >= 4) {
    const pts = 14;
    bonus += pts;
    lines.push({
      labelEs: "Cóctel imposible (muchas familias de sabor)",
      labelEn: "Impossible cocktail (too many flavor families)",
      points: pts,
    });
  } else if (categories.size === 3) {
    const pts = 10;
    bonus += pts;
    lines.push({
      labelEs: "Variedad campeona",
      labelEn: "Champion variety",
      points: pts,
    });
  }

  if (hasPair(idSet, "judias", "queso-cabra")) {
    const pts = 16;
    bonus += pts;
    lines.push({
      labelEs: "Combo clásico: judías + queso",
      labelEn: "Classic combo: beans + cheese",
      points: pts,
    });
  }
  if (hasPair(idSet, "kimchi", "morcilla")) {
    const pts = 18;
    bonus += pts;
    lines.push({
      labelEs: "Fiesta fermentada + carnaza",
      labelEn: "Ferment party + rich meat",
      points: pts,
    });
  }
  if (hasPair(idSet, "cebolla", "ajo")) {
    const pts = 12;
    bonus += pts;
    lines.push({
      labelEs: "Dúo aromático (cebolla + ajo)",
      labelEn: "Aromatic duo (onion + garlic)",
      points: pts,
    });
  }
  if (hasPair(idSet, "guiso-lentejas", "chorizo-picante")) {
    const pts = 14;
    bonus += pts;
    lines.push({
      labelEs: "Guiso de lentejas con chispa",
      labelEn: "Lentil stew with spark",
      points: pts,
    });
  }

  // Egg combo uses canonical id huevo-duro
  if (hasPair(idSet, "brocoli", "huevo-duro")) {
    const pts = 9;
    bonus += pts;
    lines.push({
      labelEs: "Brócoli con huevo (sorpresa noble)",
      labelEn: "Broccoli + egg (noble surprise)",
      points: pts,
    });
  }

  // Double-ferment if player stacked ferments + legumes without exact pair
  const fermentCount = foods.filter((f) => f.category === "ferment").length;
  const legumeCount = foods.filter((f) => f.category === "legume").length;
  if (fermentCount >= 1 && legumeCount >= 1 && !hasPair(idSet, "kimchi", "morcilla")) {
    const pts = 8;
    bonus += pts;
    lines.push({
      labelEs: "Choque fermentado + legumbre",
      labelEn: "Ferment clash + legume",
      points: pts,
    });
  }

  const total = baseSum + bonus;
  return { total, baseSum, lines };
}
