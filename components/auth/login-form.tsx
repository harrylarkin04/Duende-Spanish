"use client";

import { Loader2, Mail } from "lucide-react";
import * as React from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function LoginForm() {
  const supabase = React.useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const afterLogin = safeNextPath(searchParams.get("next"));
  const configured = Boolean(supabase);
  const [mode, setMode] = React.useState<Mode>("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callbackNext = encodeURIComponent(afterLogin);

  const onEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase no está configurado. Añadí URL y anon key en .env.local.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${origin}/auth/callback?next=${callbackNext}` },
        });
        if (err) throw err;
        setMessage("Revisá tu correo para confirmar la cuenta (si está activado en Supabase).");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        window.location.href = afterLogin;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const onMagicLink = async () => {
    if (!supabase) {
      setError("Supabase no está configurado. Añadí URL y anon key en .env.local.");
      return;
    }
    if (!email.trim()) {
      setError("Escribí tu email para el enlace mágico.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${origin}/auth/callback?next=${callbackNext}` },
      });
      if (err) throw err;
      setMessage("Te enviamos un enlace mágico. Revisá la bandeja de entrada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el enlace");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    if (!supabase) {
      setError("Supabase no está configurado. Añadí URL y anon key en .env.local.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/auth/callback?next=${callbackNext}` },
      });
      if (err) throw err;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google no disponible");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-fiesta-gold/25 bg-card/80 p-6 shadow-xl backdrop-blur-md sm:p-8">
      <div className="text-center">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-foreground">
          Entrá al Duende
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu progreso y perfil viven en la nube con Supabase.
        </p>
      </div>

      {!configured && (
        <p className="rounded-xl border border-fiesta-orange/40 bg-fiesta-orange/10 px-3 py-2 text-sm text-foreground" role="alert">
          Falta configuración: copiá <code className="rounded bg-muted px-1 text-xs">.env.local.example</code> a{" "}
          <code className="rounded bg-muted px-1 text-xs">.env.local</code> y pegá tu URL y anon key de Supabase.
        </p>
      )}

      <div
        className="flex rounded-xl border border-border bg-muted/30 p-1"
        role="tablist"
        aria-label="Modo de acceso"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/50 ${
            mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
          onClick={() => setMode("signin")}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/50 ${
            mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
          onClick={() => setMode("signup")}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={onEmailPassword} className="space-y-4">
        <div>
          <label htmlFor="duende-email" className="sr-only">
            Email
          </label>
          <input
            id="duende-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:border-fiesta-gold/40 focus-visible:ring-2 focus-visible:ring-fiesta-gold/25"
          />
        </div>
        <div>
          <label htmlFor="duende-password" className="sr-only">
            Contraseña
          </label>
          <input
            id="duende-password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña (mín. 6 caracteres)"
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:border-fiesta-gold/40 focus-visible:ring-2 focus-visible:ring-fiesta-gold/25"
          />
        </div>

        {error && (
          <p className="text-sm text-fiesta-orange" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm text-fiesta-gold" role="status">
            {message}
          </p>
        )}

        <Button type="submit" className="w-full gap-2" size="lg" disabled={loading || !configured}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "signup" ? "Registrarse" : "Entrar con email"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">o</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 border-fiesta-gold/30"
          disabled={loading || !configured}
          onClick={() => void onMagicLink()}
        >
          <Mail className="size-4" />
          Enlace mágico al email
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full gap-2"
          disabled={loading || !configured}
          onClick={() => void onGoogle()}
        >
          <span aria-hidden>🔷</span>
          Continuar con Google
        </Button>
      </div>
    </div>
  );
}
