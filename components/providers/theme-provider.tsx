"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
};

/**
 * Wraps the app with next-themes. Default: **dark** (fiesta night).
 * Light mode = “Sunny Spain” tokens from `:root` in `globals.css`.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="duende-theme"
      disableTransitionOnChange
    >
      {/* Stacking context above `duende-bg-canvas` pseudo-layers (z-0) */}
      <div className="relative z-[1] min-h-dvh">{children}</div>
    </NextThemesProvider>
  );
}
