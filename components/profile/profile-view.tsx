"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Flame, Gamepad2, Gift, Pencil, Sparkles, Trophy, BookMarked } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { updateProfile } from "@/app/(protected)/actions/profile";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProfilePageData } from "@/lib/data/profile-page";
import { ProfileLeaderboardSection } from "@/components/profile/profile-leaderboard-section";
import { SOUVENIR_LABELS } from "@/lib/games/culture-quest/badges";
import { duendeEaseOutExpo } from "@/lib/design-system";
import { useRealtimeProfileGameSync } from "@/hooks/use-supabase-game-sync";

type Props = {
  data: ProfilePageData;
};

const gameLabels: Record<string, string> = {
  "palabra-vortex": "Palabra Vortex",
  "palabra-vortex-multiplayer": "Palabra Vortex (2P)",
  "grammar-gladiator": "Grammar Gladiator",
  "listening-duel": "Listening Duel",
  "culture-quest": "Culture Quest",
};

export function ProfileView({ data }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion() === true;
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  useRealtimeProfileGameSync(() => router.refresh());

  const p = data.profile;
  const displayName = p?.username ?? data.email?.split("@")[0] ?? "Explorador";
  const avatar = p?.avatar_url;

  async function onSubmit(formData: FormData) {
    setMsg(null);
    setErr(null);
    const res = await updateProfile(formData);
    if (res.ok) setMsg("Perfil actualizado.");
    else setErr(res.error);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-8 sm:px-6 sm:pb-12">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: duendeEaseOutExpo }}
        className="mb-10 text-center sm:text-left"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-fiesta-gold/30 bg-fiesta-crimson/15 px-3 py-1 text-xs font-medium text-fiesta-gold">
          <Trophy className="size-3.5" />
          Tu perfil Duende
        </div>
        <h1 className="mt-3 font-[family-name:var(--font-heading)] text-3xl font-bold sm:text-4xl">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Hola, {displayName}
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Todo guardado en Supabase — seguí desde cualquier dispositivo.
        </p>
      </motion.header>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.5, ease: duendeEaseOutExpo }}
        className="mb-10 flex flex-col items-center gap-6 sm:flex-row sm:items-start"
      >
        <div className="relative">
          <motion.div
            className="relative size-32 overflow-hidden rounded-3xl border-2 border-fiesta-gold/40 bg-fiesta-crimson/20 shadow-[0_0_40px_rgba(251,191,36,0.25)] sm:size-36"
            animate={
              reduce
                ? undefined
                : {
                    boxShadow: [
                      "0 0 40px rgba(251,191,36,0.2)",
                      "0 0 52px rgba(251,191,36,0.45)",
                      "0 0 40px rgba(251,191,36,0.2)",
                    ],
                  }
            }
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL
              <img src={avatar} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-5xl">🎭</div>
            )}
          </motion.div>
          <motion.div
            className="absolute -bottom-2 -right-2 flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-fiesta-orange to-fiesta-crimson text-primary-foreground shadow-lg"
            animate={reduce ? undefined : { rotate: [0, -6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          >
            <Flame className="size-6" />
          </motion.div>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-foreground">
            {displayName}
          </p>
          <p className="text-sm text-muted-foreground">{data.email}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
            <StatPill icon={Sparkles} label="Fluidez" value={`${p?.total_fluency_score ?? 0}/100`} />
            <StatPill icon={BookMarked} label="Palabras" value={String(data.wordsSaved)} />
            <StatPill icon={Gamepad2} label="Partidas" value={String(data.gamesPlayed)} />
          </div>
        </div>
      </motion.div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0, duration: 0.4 }}
        >
          <Card className="h-full border-fiesta-gold/20 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Racha actual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-[family-name:var(--font-heading)] text-4xl font-bold text-fiesta-gold tabular-nums">
                {p?.current_streak ?? 0}
                <span className="text-lg text-muted-foreground"> días</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.06, duration: 0.4 }}
        >
          <Card className="h-full border-fiesta-orange/25 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mejor racha</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-[family-name:var(--font-heading)] text-4xl font-bold text-fiesta-orange tabular-nums">
                {p?.longest_streak ?? 0}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12, duration: 0.4 }}
        >
          <Card className="h-full border-fiesta-crimson/25 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Miembro desde</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium text-foreground">
                {p?.created_at
                  ? new Date(p.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ProfileLeaderboardSection
        initialEntries={data.leaderboardPreview}
        selfId={data.userId}
        initialFollowingIds={data.followingIds}
      />

      {data.cultureBadges.length > 0 && (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <h2 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-semibold">
            <Gift className="size-5 text-fiesta-gold" aria-hidden />
            Souvenirs (Culture Quest)
          </h2>
          <ul className="flex flex-wrap gap-2">
            {data.cultureBadges.map((id) => {
              const meta = SOUVENIR_LABELS[id];
              return (
                <li
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-fiesta-gold/30 bg-fiesta-crimson/10 px-3 py-1.5 text-sm font-medium text-foreground"
                >
                  <span aria-hidden>{meta?.emoji ?? "🎁"}</span>
                  {meta?.title ?? id}
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-10"
      >
        <h2 className="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
          Mejores puntuaciones
        </h2>
        {data.highScores.length === 0 ? (
          <p className="rounded-xl border border-dashed border-fiesta-gold/25 bg-muted/20 p-6 text-sm text-muted-foreground">
            Jugá Palabra Vortex para ver tus récords aquí.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.highScores.map((g, i) => (
              <motion.li
                key={g.game_name}
                initial={reduce ? false : { opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border/70 bg-card/70">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">
                      {gameLabels[g.game_name] ?? g.game_name}
                    </CardTitle>
                    <CardDescription>{g.plays} partidas</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 pt-0">
                    <p className="text-2xl font-bold text-fiesta-gold tabular-nums">{g.best_score}</p>
                  </CardContent>
                </Card>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.section>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Card className="border-fiesta-gold/25 bg-linear-to-br from-fiesta-crimson/10 to-card/90">
          <CardHeader>
            <div className="flex items-center gap-2 text-fiesta-gold">
              <Pencil className="size-5" />
              <CardTitle>Editar perfil</CardTitle>
            </div>
            <CardDescription>Nombre visible, foto y preferencias de estudio.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={onSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Nombre de usuario
                </label>
                <input
                  id="username"
                  name="username"
                  defaultValue={p?.username ?? ""}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/30"
                />
              </div>
              <div>
                <label htmlFor="avatar_url" className="mb-1 block text-xs font-medium text-muted-foreground">
                  URL del avatar
                </label>
                <input
                  id="avatar_url"
                  name="avatar_url"
                  type="url"
                  defaultValue={p?.avatar_url ?? ""}
                  placeholder="https://…"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/30"
                />
              </div>
              <div>
                <label
                  htmlFor="preferred_dialect"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  Dialecto preferido
                </label>
                <input
                  id="preferred_dialect"
                  name="preferred_dialect"
                  defaultValue={data.preferences?.preferred_dialect ?? ""}
                  placeholder="ej. España, México, Rioplatense"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/30"
                />
              </div>
              <div>
                <label
                  htmlFor="difficulty_preference"
                  className="mb-1 block text-xs font-medium text-muted-foreground"
                >
                  Dificultad preferida
                </label>
                <input
                  id="difficulty_preference"
                  name="difficulty_preference"
                  defaultValue={data.preferences?.difficulty_preference ?? ""}
                  placeholder="ej. A2, intermedio"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/30"
                />
              </div>
              {err && (
                <p className="text-sm text-fiesta-orange" role="alert">
                  {err}
                </p>
              )}
              {msg && (
                <p className="text-sm text-fiesta-gold" role="status">
                  {msg}
                </p>
              )}
              <Button type="submit" className="gap-2">
                Guardar cambios
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>La foto puede ser cualquier URL pública (p. ej. de Google tras OAuth).</span>
            <SignOutButton className="shrink-0 border-fiesta-orange/30" />
          </CardFooter>
        </Card>
      </motion.section>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-fiesta-gold/25 bg-fiesta-crimson/10 px-3 py-1.5 text-sm">
      <Icon className="size-4 text-fiesta-gold" aria-hidden />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
