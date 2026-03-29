/**
 * Rotating copy for loading UI — warm, Spanish-first Duende voice.
 */
export const SPANISH_LOADING_PHRASES = [
  "Encendiendo el compás…",
  "El Duende afina las cuerdas…",
  "Un momento — buen español no tiene prisa.",
  "Cargando con sabor a café y plaza…",
  "Revisando acentos y buena energía…",
  "Preparando la magia del idioma…",
  "Sujetando las erres con cariño…",
  "Calentando la voz del servidor…",
] as const;

export function pickLoadingPhrase(seed = 0): string {
  const i = Math.abs(Math.floor(seed)) % SPANISH_LOADING_PHRASES.length;
  return SPANISH_LOADING_PHRASES[i]!;
}
