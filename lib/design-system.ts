import type { Transition, Variants } from "framer-motion";

/**
 * Duende design tokens — fiesta energy + modern luxury.
 * Keep hex / oklch semantic intent aligned with `app/globals.css`.
 */

/** Brand palette (matches Tailwind `fiesta-*` and CSS vars) */
export const duendeColors = {
  brand: {
    /** Deep crimson — passion, flamenco, wine */
    crimson: "#9f1239",
    /** Gold — sun, confetti, luxury trim */
    gold: "#fbbf24",
    /** Sunset orange — warmth, citrus, late plaza light */
    orange: "#fb923c",
  },
  /** Named aliases for charts, badges, and motion accents */
  accent: {
    sangria: "#9f1239",
    sol: "#fbbf24",
    azahar: "#fb923c",
    /** Deep midnight violet (fiesta night sky) */
    noche: "#1a0f24",
    /** Warm limestone (sunny Spain walls) */
    cal: "#f5f0e6",
  },
} as const;

/** Tailwind class references for semantic UI (theme-aware via CSS variables) */
export const duendeSemanticClasses = {
  background: "bg-background",
  foreground: "text-foreground",
  card: "bg-card text-card-foreground",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  muted: "bg-muted text-muted-foreground",
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  border: "border-border",
  ring: "ring-ring",
} as const;

/** Font stacks — mirror `next/font` variables applied on `<body>` */
export const duendeFonts = {
  sans: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
  mono: "var(--font-geist-mono), ui-monospace, monospace",
  /** Display / editorial — Playfair + sans fallback */
  heading: "var(--font-playfair), var(--font-sans), ui-serif, serif",
} as const;

/** Type scale (rem) — pair with Tailwind `text-*` where possible */
export const duendeTypeScale = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
} as const;

/**
 * Spacing rhythm: section gutters, component gaps, tap targets.
 * Values are rem; map to Tailwind: 4 → 1rem, 6 → 1.5rem, etc.
 */
export const duendeSpacing = {
  /** Tight inline gaps */
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  /** Major section padding (mobile-first; scale up with sm: / lg:) */
  sectionY: "4rem",
  sectionX: "1.25rem",
  /** Minimum touch target */
  touchMin: "2.75rem",
} as const;

export const duendeRadius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.625rem",
  xl: "1rem",
  full: "9999px",
} as const;

/** CSS custom properties consumed by `duende-bg-canvas` and future particle layers */
export const duendeCssVars = {
  particleOpacity: "--duende-particle-opacity",
  particleHighlight: "--duende-particle-highlight",
  glowStrength: "--duende-glow-strength",
  gridOpacity: "--duende-grid-opacity",
} as const;

/** Standard Duende easing — route transitions, cards, modals */
export const duendeEaseOutExpo: [number, number, number, number] = [
  0.22, 1, 0.36, 1,
];

/** Framer Motion presets — compose with `motion` components */
export const duendeMotion = {
  /** Hero lines drifting into view */
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: duendeEaseOutExpo } as Transition,
  },

  fadeUpDelayed: (delay: number) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: duendeEaseOutExpo } as Transition,
  }),

  /** Card grid / list reveals */
  staggerContainer: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.06 },
    },
  } satisfies Variants,

  staggerItem: {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: duendeEaseOutExpo },
    },
  } satisfies Variants,

  /** Playful CTA micro-interaction */
  springButton: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring" as const, stiffness: 420, damping: 24 },
  },

  /** Subtle perpetual float for decorative orbs */
  gentleFloat: {
    animate: { y: [0, -6, 0] },
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    } satisfies Transition,
  },

  /** Use with `useReducedMotion()` — snap animations when user prefers reduced motion */
  reducedTransition: { duration: 0.01 } satisfies Transition,

  /** Cards / list rows — subtle lift on hover (use as Tailwind-friendly class pair) */
  cardHoverClass:
    "transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg",

  /** Links and icon buttons — keyboard + hover micro-motion */
  focusLiftClass:
    "transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
};

export type DuendeBrandColor = keyof typeof duendeColors.brand;
