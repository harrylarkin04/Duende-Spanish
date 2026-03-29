"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";

/**
 * Switches between dark (fiesta night) and light (sunny Spain).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="size-9" disabled aria-label="Toggle theme">
        <Sun className="size-4 opacity-0" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-9 border-border/80 bg-background/60 backdrop-blur-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to sunny Spain (light) theme" : "Switch to fiesta night (dark) theme"}
    >
      {isDark ? <Sun className="size-4 text-fiesta-gold" /> : <Moon className="size-4 text-primary" />}
    </Button>
  );
}
