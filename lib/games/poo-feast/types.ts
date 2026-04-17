export type FoodCategory =
  | "legume"
  | "dairy"
  | "spicy"
  | "ferment"
  | "greasy"
  | "fiber"
  | "sweet"
  | "protein";

export type FoodItem = {
  id: string;
  emoji: string;
  smellBase: number;
  category: FoodCategory;
};

export type GamePhase =
  | "intro"
  | "pick_p1"
  | "pick_p2"
  | "digest"
  | "reveal"
  | "results";
