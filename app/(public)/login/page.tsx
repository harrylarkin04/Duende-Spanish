import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar — Duende",
  description: "Inicia sesión en Duende con Supabase Auth.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-linear-to-b from-fiesta-crimson/10 via-background to-background px-4 py-12">
      <div className="mb-8 text-center">
        <p className="font-[family-name:var(--font-heading)] text-3xl font-bold">
          <span className="bg-linear-to-r from-fiesta-gold via-fiesta-orange to-fiesta-crimson bg-clip-text text-transparent">
            Duende
          </span>
        </p>
        <p className="text-sm text-muted-foreground">Spanish immersion</p>
      </div>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
