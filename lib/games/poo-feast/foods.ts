import type { FoodItem } from "./types";

/** Playable bites — potency is a tongue-in-cheek “aroma index” for the gag. */
export const POO_FEAST_FOODS: readonly FoodItem[] = [
  { id: "judias", emoji: "🫘", smellBase: 16, category: "legume" },
  { id: "queso-cabra", emoji: "🧀", smellBase: 14, category: "dairy" },
  { id: "chorizo-picante", emoji: "🌶️", smellBase: 13, category: "spicy" },
  { id: "kimchi", emoji: "🥬", smellBase: 17, category: "ferment" },
  { id: "brocoli", emoji: "🥦", smellBase: 10, category: "fiber" },
  { id: "huevo-duro", emoji: "🥚", smellBase: 9, category: "protein" },
  { id: "cebolla", emoji: "🧅", smellBase: 12, category: "fiber" },
  { id: "ajo", emoji: "🧄", smellBase: 11, category: "spicy" },
  { id: "helado", emoji: "🍨", smellBase: 7, category: "dairy" },
  { id: "tacos", emoji: "🌮", smellBase: 12, category: "greasy" },
  { id: "pulpo", emoji: "🐙", smellBase: 8, category: "fiber" },
  { id: "morcilla", emoji: "🍽️", smellBase: 15, category: "greasy" },
  { id: "chocolate-negro", emoji: "🍫", smellBase: 6, category: "sweet" },
  { id: "guiso-lentejas", emoji: "🍲", smellBase: 15, category: "legume" },
];

const byId = new Map(POO_FEAST_FOODS.map((f) => [f.id, f]));

export function getFoodById(id: string): FoodItem | undefined {
  return byId.get(id);
}
