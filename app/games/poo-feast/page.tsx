import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Gamepad2, Globe } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Festín olfativo — Duende",
  description: "Duelo de menús: índice de aroma local o sala en línea con código.",
};

export default function PooFeastLauncherPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/25 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
          <Flame className="size-3.5" aria-hidden />
          Festín olfativo
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold text-foreground sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Elige modo
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Mismo sofá o rival en otro país — mismo caos benigno.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <Link
            href="/games/poo-feast/local"
            className={cn(
              "inline-flex min-h-32 w-full flex-col items-start justify-center gap-3 rounded-lg border border-fiesta-gold/25 border-border bg-card/60 px-4 py-5 text-left text-sm font-medium whitespace-normal text-foreground transition-colors hover:border-fiesta-gold/45 hover:bg-card/80",
            )}
          >
            <Gamepad2 className="size-8 text-fiesta-gold" aria-hidden />
            <span className="font-[family-name:var(--font-heading)] text-lg font-semibold">Mismo dispositivo</span>
            <span className="text-xs font-normal text-muted-foreground">
              Dos jugadores pasando el móvil — sin cuenta extra.
            </span>
          </Link>
        </li>
        <li>
          <Link
            href="/games/poo-feast/multiplayer"
            className={cn(
              "inline-flex min-h-32 w-full flex-col items-start justify-center gap-3 rounded-lg border border-fiesta-gold/25 border-border bg-card/60 px-4 py-5 text-left text-sm font-medium whitespace-normal text-foreground transition-colors hover:border-fiesta-gold/45 hover:bg-card/80",
            )}
          >
            <Globe className="size-8 text-fiesta-orange" aria-hidden />
            <span className="font-[family-name:var(--font-heading)] text-lg font-semibold">Sala en línea</span>
            <span className="text-xs font-normal text-muted-foreground">
              Código de 6 caracteres — como Palabra Vortex multijugador.
            </span>
          </Link>
        </li>
      </ul>

      <Card className="mt-8 border-border/50 bg-card/40">
        <CardHeader>
          <CardTitle className="text-base">Tip</CardTitle>
          <CardDescription>
            El modo en línea requiere iniciar sesión y la migración SQL <code className="text-xs">009_poo_feast_multiplayer.sql</code>{" "}
            aplicada en tu proyecto Supabase.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
