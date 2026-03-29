"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, PartyPopper, Sparkles, Wine } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  duendeColors,
  duendeMotion,
  duendeSpacing,
  duendeTypeScale,
} from "@/lib/design-system";
import { cn } from "@/lib/utils";

const brandSwatches = [
  { key: "crimson", label: "Crimson", hex: duendeColors.brand.crimson },
  { key: "gold", label: "Gold", hex: duendeColors.brand.gold },
  { key: "orange", label: "Orange", hex: duendeColors.brand.orange },
] as const;

const semanticTiles = [
  { label: "Primary", className: "bg-primary text-primary-foreground" },
  { label: "Secondary", className: "bg-secondary text-secondary-foreground" },
  { label: "Accent", className: "bg-accent text-accent-foreground" },
  { label: "Muted", className: "bg-muted text-muted-foreground" },
  { label: "Card", className: "bg-card text-card-foreground ring-1 ring-border" },
  { label: "Destructive", className: "bg-destructive text-destructive-foreground" },
] as const;

const demoButtonVariants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

export function DesignShowcaseView() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="px-5 pb-24 pt-8 sm:px-8 sm:pb-32 sm:pt-12">
      <motion.header
        className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
        {...(reduceMotion ? {} : duendeMotion.fadeUp)}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Duende design system
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Fiesta night &amp;{" "}
            <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
              sunny Spain
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Tokens from <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">lib/design-system.ts</code>{" "}
            mirror <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">globals.css</code>. Toggle theme
            to compare modes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft data-icon="inline-start" className="size-4" />
            Home
          </Link>
          <ThemeToggle />
        </div>
      </motion.header>

      {/* Brand colors */}
      <section
        className="mx-auto mt-16 max-w-6xl sm:mt-20"
        style={{ scrollMarginTop: duendeSpacing.xl }}
      >
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-foreground">
          Brand colors
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Fixed hex anchors for confetti, gradients, and data viz. Tailwind:{" "}
          <span className="font-mono text-xs">bg-fiesta-crimson</span>,{" "}
          <span className="font-mono text-xs">text-fiesta-gold</span>,{" "}
          <span className="font-mono text-xs">border-fiesta-orange</span>.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {brandSwatches.map((swatch, i) => (
            <motion.li
              key={swatch.key}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="overflow-hidden border-border/60">
                <div
                  className="h-28 w-full"
                  style={{ backgroundColor: swatch.hex }}
                />
                <CardHeader className="pb-2">
                  <CardTitle>{swatch.label}</CardTitle>
                  <CardDescription className="font-mono text-xs">{swatch.hex}</CardDescription>
                </CardHeader>
              </Card>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* Semantic colors */}
      <section className="mx-auto mt-16 max-w-6xl sm:mt-20">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-foreground">
          Semantic surfaces
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Theme-aware tokens — swap with the sun/moon control in the header.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {semanticTiles.map((tile) => (
            <li
              key={tile.label}
              className={`flex min-h-[5.5rem] items-center justify-center rounded-xl px-4 py-6 text-center text-sm font-medium ${tile.className}`}
            >
              {tile.label}
            </li>
          ))}
        </ul>
      </section>

      {/* Typography */}
      <section className="mx-auto mt-16 max-w-6xl sm:mt-20">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-foreground">
          Typography
        </h2>
        <Card className="mt-8 border-border/60">
          <CardHeader>
            <CardTitle>Scale reference</CardTitle>
            <CardDescription>
              Display: Playfair · Body: Geist Sans · Mono: Geist Mono
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-xs text-muted-foreground">Heading / {duendeTypeScale["4xl"]}</p>
              <p className="font-[family-name:var(--font-heading)] text-4xl font-semibold text-foreground">
                ¡Viva la fiesta!
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Body / {duendeTypeScale.base}</p>
              <p className="text-base leading-relaxed text-foreground">
                Warm rhythm, crisp type, and generous spacing keep the UI feeling premium without
                losing playfulness.
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Mono / {duendeTypeScale.sm}</p>
              <p className="font-mono text-sm text-muted-foreground">
                duendeMotion.staggerContainer · --duende-particle-opacity
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Buttons */}
      <section className="mx-auto mt-16 max-w-6xl sm:mt-20">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-foreground">
          Buttons
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">shadcn/ui variants + icon slots.</p>
        <Card className="mt-8 border-border/60">
          <CardContent className="flex flex-col gap-4 pt-8">
            <div className="flex flex-wrap gap-2">
              {demoButtonVariants.map((v) => (
                <Button key={v} variant={v} size="sm" className="capitalize">
                  {v}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <motion.div {...(reduceMotion ? {} : duendeMotion.springButton)}>
                <Button>
                  <Sparkles data-icon="inline-start" className="size-4" />
                  Spring CTA
                </Button>
              </motion.div>
              <Button variant="outline" size="icon" aria-label="Wine">
                <Wine className="size-4" />
              </Button>
              <Button variant="secondary" size="lg">
                <PartyPopper data-icon="inline-start" className="size-4" />
                Large
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Cards + stagger */}
      <section className="mx-auto mt-16 max-w-6xl sm:mt-20">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-foreground">
          Cards &amp; motion
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Staggered entrance uses <code className="font-mono text-xs">duendeMotion.staggerContainer</code>.
        </p>
        <motion.ul
          className="mt-8 grid gap-6 lg:grid-cols-3"
          variants={duendeMotion.staggerContainer}
          initial={reduceMotion ? "show" : "hidden"}
          whileInView={reduceMotion ? undefined : "show"}
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.li variants={duendeMotion.staggerItem}>
            <Card className="h-full border-border/60 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Confetti density</CardTitle>
                <CardDescription>Particle layer opacity scales with theme.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Canvas pseudo-elements stay pointer-events: none so Three.js / canvas confetti can
                  sit above without fighting hit targets.
                </p>
              </CardContent>
              <CardFooter className="justify-end">
                <Button size="sm" variant="ghost">
                  Details
                </Button>
              </CardFooter>
            </Card>
          </motion.li>
          <motion.li variants={duendeMotion.staggerItem}>
            <Card className="h-full border-fiesta-gold/25 bg-linear-to-br from-card to-secondary/30">
              <CardHeader>
                <CardTitle>Sunny gold trim</CardTitle>
                <CardDescription>Luxury accents on elevated surfaces.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use gold sparingly for badges, focus rings, and celebratory moments.
                </p>
              </CardContent>
            </Card>
          </motion.li>
          <motion.li variants={duendeMotion.staggerItem}>
            <Card className="relative h-full overflow-hidden border-border/60">
              <div
                aria-hidden
                className="absolute -right-6 -top-6 size-32 rounded-full bg-fiesta-crimson/20 blur-2xl"
              />
              <CardHeader>
                <CardTitle>Flamenco pulse</CardTitle>
                <CardDescription>Soft radial glow + spring interactions.</CardDescription>
              </CardHeader>
              <CardContent className="relative flex flex-col items-center gap-6">
                <motion.div
                  className="size-20 rounded-full bg-linear-to-br from-fiesta-gold via-fiesta-orange to-fiesta-crimson shadow-lg shadow-fiesta-crimson/25"
                  {...(reduceMotion ? {} : duendeMotion.gentleFloat)}
                />
                <p className="text-center text-sm text-muted-foreground">
                  Float animation respects <code className="font-mono text-xs">prefers-reduced-motion</code>.
                </p>
              </CardContent>
            </Card>
          </motion.li>
        </motion.ul>
      </section>
    </div>
  );
}
