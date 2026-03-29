"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50dvh] max-w-lg flex-col justify-center px-4 py-16">
      <EmptyState
        icon={Compass}
        title="Página no encontrada"
        description="Esta ruta no existe o se mudó. El Duende te devuelve al mapa."
      >
        <Link
          href="/"
          className={cn(buttonVariants({ size: "lg" }), "shadow-md shadow-fiesta-crimson/15")}
        >
          Ir al inicio
        </Link>
        <Link href="/games" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Sala de juegos
        </Link>
      </EmptyState>
    </div>
  );
}
