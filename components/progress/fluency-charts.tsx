"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DuendeLoading } from "@/components/ui/duende-loading";
import type { ProgressModel } from "@/lib/progress/compute-progress";
import { cn } from "@/lib/utils";

type Props = {
  model: ProgressModel;
  className?: string;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { day: string; score: number; projected?: boolean } }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-fiesta-gold/25 bg-popover/95 px-2.5 py-1.5 text-xs shadow-md backdrop-blur-sm">
      <p className="text-muted-foreground">{p.day}</p>
      <p className="font-semibold text-foreground">
        {p.score}
        <span className="text-muted-foreground"> / 100</span>
      </p>
      {p.projected && (
        <p className="text-[10px] text-fiesta-orange">Proyección</p>
      )}
    </div>
  );
}

export function FluencyCharts({ model, className }: Props) {
  const reduce = useReducedMotion();
  const [chartsReady, setChartsReady] = React.useState(false);
  React.useEffect(() => {
    setChartsReady(true);
  }, []);

  const forecastEnd =
    model.fluencySeries[model.fluencySeries.length - 1]?.score ?? model.fluency;
  const delta = forecastEnd - model.fluency;

  const radarData = model.skillBranches.map((b) => ({
    skill: b.shortLabel,
    full: b.label,
    value: b.unlocked ? b.value : 0,
  }));

  return (
    <div className={cn("space-y-8", className)}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl border border-fiesta-gold/20 bg-linear-to-br from-fiesta-crimson/20 via-card/80 to-fiesta-orange/10 p-5 shadow-inner"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-fiesta-gold/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-fiesta-gold">
              <Sparkles className="size-3.5" />
              Puntuación de fluidez
            </p>
            <p className="mt-2 font-[family-name:var(--font-heading)] text-5xl font-bold tracking-tight text-foreground tabular-nums">
              {model.fluency}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Promedio de tus cinco pilares. Sube con Palabra Vortex, repaso y
              charlas con compañeros.
            </p>
          </div>
          <div className="rounded-xl border border-fiesta-gold/25 bg-background/40 px-4 py-3 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-xs font-medium text-fiesta-gold">
              <TrendingUp className="size-3.5" />
              Previsión a 7 días
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              ~{forecastEnd}
            </p>
            <p className="text-xs text-muted-foreground">
              {delta >= 0 ? "+" : ""}
              {delta} pts tendencia suave según tu ritmo reciente
            </p>
          </div>
        </div>

        <div className="relative mt-6 h-56 w-full min-w-0">
          {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={model.fluencySeries}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fluencyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="rgb(251 191 36)"
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="100%"
                      stopColor="rgb(159 18 57)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 6"
                  className="stroke-border/50"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  width={32}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="rgb(251 191 36)"
                  strokeWidth={2}
                  fill="url(#fluencyFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: "rgb(251 191 36)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <DuendeLoading
              compact
              className="h-full rounded-xl bg-muted/20"
              label="Cargando gráfica de fluidez"
            />
          )}
          <p className="pointer-events-none absolute bottom-0 right-0 text-[10px] text-muted-foreground">
            Línea continua: histórico · cola: proyección ilustrativa
          </p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm"
        >
          <p className="mb-1 text-sm font-medium text-foreground">
            Radar de pilares
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Forma de tu perfil hoy (0–100).
          </p>
          <div className="h-64 w-full min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={radarData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 6"
                    className="stroke-border/40"
                    horizontal={false}
                  />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    type="category"
                    dataKey="skill"
                    width={56}
                    tick={{ fontSize: 11, fill: "var(--foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-md border border-border bg-popover px-2 py-1 text-xs">
                          <p className="font-medium">
                            {(payload[0].payload as { full: string }).full}
                          </p>
                          <p className="text-fiesta-gold">
                            {Number(payload[0].value)}%
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    fill="url(#barGrad)"
                  />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgb(159 18 57)" />
                      <stop offset="100%" stopColor="rgb(251 191 36)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <DuendeLoading
                compact
                className="h-full rounded-xl bg-muted/20"
                label="Cargando gráfica de pilares"
              />
            )}
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-sm"
        >
          <p className="mb-1 text-sm font-medium text-foreground">
            Palabra Vortex por modo
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Partidas registradas en este dispositivo.
          </p>
          <div className="h-64 w-full min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={model.modeBreakdown.map((m) => ({
                    name: m.label,
                    runs: m.runs,
                  }))}
                  margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="4 6"
                    className="stroke-border/40"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={28}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-md border border-border bg-popover px-2 py-1 text-xs">
                          <p className="font-medium">{payload[0].payload.name}</p>
                          <p className="text-fiesta-gold">
                            {Number(payload[0].value)} partidas
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar
                    dataKey="runs"
                    radius={[6, 6, 0, 0]}
                    fill="rgb(159 18 57 / 0.85)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <DuendeLoading
                compact
                className="h-full rounded-xl bg-muted/20"
                label="Cargando gráfica de modos de juego"
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
