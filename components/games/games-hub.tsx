"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Compass, Flame, Gamepad2, Headphones, Heart, Sparkles, Swords } from "lucide-react";
import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const games = [
  {
    href: "/games/palabra-vortex",
    title: "Palabra Vortex",
    desc: "High-speed Spanish ↔ English — sprint, endless, and daily decks.",
    icon: Sparkles,
    ready: true,
  },
  {
    href: "/games/palabra-vortex/multiplayer",
    title: "Palabra Vortex · 2 jugadores",
    desc: "Sala con código, misma palabra en dos países — presencia, enlaces y rivalidad cariñosa.",
    icon: Heart,
    ready: true,
  },
  {
    href: "/games/grammar-gladiator",
    title: "Grammar Gladiator",
    desc: "Arena épica: verbos, subjuntivo, ser/estar — 10 asaltos y un jefe gramatical.",
    icon: Swords,
    ready: true,
  },
  {
    href: "/games/listening-duel",
    title: "Listening Duel",
    desc: "Escucha clips en español: ondas, vinilo, combo — dictado y test.",
    icon: Headphones,
    ready: true,
  },
  {
    href: "/games/culture-quest",
    title: "Culture Quest",
    desc: "Tres ciudades, decisiones en español y souvenirs en tu perfil — ideal para el café.",
    icon: Compass,
    ready: true,
  },
  {
    href: "/games/poo-feast",
    title: "Festín olfativo",
    desc: "Local o sala con código: menú secreto, digestión sincronizada y índice de aroma.",
    icon: Flame,
    ready: true,
  },
  {
    href: "#",
    title: "Más pronto",
    desc: "Nuevos modos de juego están en la cocina del Duende.",
    icon: Gamepad2,
    ready: false,
  },
];

export function GamesHub() {
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/25 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
          <Gamepad2 className="size-3.5" />
          Sala de juegos
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Juega en serio
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Ritmo, rachas y palabras — todo lo que engancha sin perder el alma.
        </p>
      </motion.div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {games.map((g, i) => {
          const Icon = g.icon;
          const inner = (
            <Card
              className={cn(
                "h-full border-fiesta-gold/15 bg-card/60 transition-shadow",
                g.ready && "hover:border-fiesta-gold/35 hover:shadow-lg hover:shadow-fiesta-gold/10",
                !g.ready && "opacity-60",
              )}
            >
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-xl bg-fiesta-crimson/20 text-fiesta-gold">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="font-[family-name:var(--font-heading)] pt-2 text-xl">
                  {g.title}
                </CardTitle>
                <CardDescription>{g.desc}</CardDescription>
              </CardHeader>
            </Card>
          );

          return (
            <motion.li
              key={g.title}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : i * 0.06, duration: 0.35 }}
              whileHover={g.ready && !reduce ? { y: -3 } : undefined}
            >
              {g.ready ? (
                <Link
                  href={g.href}
                  className="block h-full rounded-xl transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  className="block h-full cursor-not-allowed rounded-xl"
                  aria-disabled="true"
                  title="Próximamente"
                >
                  {inner}
                </div>
              )}
            </motion.li>
          );
        })}
      </ul>

      <p className="mt-8 text-center text-xs text-muted-foreground sm:text-left">
        ¿Ideas para un juego? Cuéntanoslo cuando conectemos la comunidad.
      </p>
    </div>
  );
}
