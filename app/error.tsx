"use client";

import { useEffect } from "react";
import Link from "next/link";

import { ErrorState } from "@/components/ui/error-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[40dvh] max-w-md flex-col justify-center px-4 py-16">
      <ErrorState
        title="Uy — el Duende tropezó"
        message={
          error.message ||
          "Algo falló al renderizar esta vista. Podés reintentar o volver al inicio."
        }
        onRetry={reset}
        retryLabel="Reintentar"
      />
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "mt-6 self-center border-fiesta-gold/30",
        )}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
