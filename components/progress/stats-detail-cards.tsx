"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Flame,
  Gamepad2,
  MessageCircle,
  Mic,
  RotateCcw,
  Trophy,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProgressModel } from "@/lib/progress/compute-progress";
import { cn } from "@/lib/utils";

type Props = {
  model: ProgressModel;
  className?: string;
};

export function StatsDetailCards({ model, className }: Props) {
  const reduce = useReducedMotion();
  const { totals, modeBreakdown, chat } = model;

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-foreground">
          Detalle de tu práctica
        </h2>
        <p className="text-sm text-muted-foreground">
          Datos locales de Palabra Vortex y Compañeros AI en este navegador.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="h-full border-fiesta-crimson/25 bg-linear-to-b from-fiesta-crimson/10 to-card/90">
            <CardHeader className="border-b border-fiesta-gold/15 pb-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="size-4 text-fiesta-gold" />
                <CardTitle>Palabra Vortex</CardTitle>
              </div>
              <CardDescription>
                Mejores marcas y volumen por modo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4">
              <div className="flex flex-wrap gap-3">
                <StatChip
                  icon={Trophy}
                  label="Partidas totales"
                  value={String(totals.palabraRuns)}
                />
                <StatChip
                  icon={Flame}
                  label="Mejor racha"
                  value={String(totals.maxStreakEver)}
                />
                <StatChip
                  icon={RotateCcw}
                  label="Repaso pendiente"
                  value={String(totals.reviewDeckCount)}
                />
              </div>
              <ul className="space-y-2 text-sm">
                {modeBreakdown.map((m) => (
                  <li
                    key={m.mode}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/40 px-3 py-2"
                  >
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="text-right text-xs">
                      <span className="font-semibold text-foreground">
                        {m.runs} runs
                      </span>
                      <span className="block text-muted-foreground">
                        best {m.bestScore} · racha {m.bestStreak}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="border-t border-border/50">
              <Link
                href="/games/palabra-vortex"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full",
                )}
              >
                Jugar otra ronda
              </Link>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Card className="h-full border-fiesta-gold/25 bg-linear-to-b from-fiesta-orange/10 to-card/90">
            <CardHeader className="border-b border-fiesta-gold/15 pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4 text-fiesta-gold" />
                <CardTitle>Compañeros AI</CardTitle>
              </div>
              <CardDescription>
                Mensajes y voz que registramos para tu motivación.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4">
              <div className="flex flex-wrap gap-3">
                <StatChip
                  icon={MessageCircle}
                  label="Tus mensajes"
                  value={String(chat.userMessagesTotal)}
                />
                <StatChip
                  icon={MessageCircle}
                  label="Respuestas"
                  value={String(chat.assistantMessagesTotal)}
                />
                <StatChip
                  icon={Mic}
                  label="Turnos de voz"
                  value={String(chat.voiceTurns)}
                />
              </div>
              <p className="rounded-lg border border-dashed border-fiesta-gold/30 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                Cada charla refuerza expresión oral y comprensión. Si aún ves
                ceros, abre{" "}
                <Link
                  href="/chat"
                  className="font-medium text-fiesta-gold underline-offset-2 hover:underline"
                >
                  Compañeros
                </Link>{" "}
                y escribe o usa el micrófono: el palacio se actualiza al
                instante.
              </p>
            </CardContent>
            <CardFooter className="border-t border-border/50">
              <Link
                href="/chat"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full",
                )}
              >
                Ir al chat
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-[7.5rem] flex-1 items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-2">
      <Icon className="size-4 shrink-0 text-fiesta-orange" />
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-bold tabular-nums text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}
