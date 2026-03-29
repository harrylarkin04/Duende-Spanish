"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export type RegionId = "spain" | "mexico" | "argentina" | "colombia" | "peru";

export type RegionConfig = {
  id: RegionId;
  label: string;
  flag: string;
  /** Position within the map panel (percent) */
  x: string;
  y: string;
};

const REGIONS: RegionConfig[] = [
  { id: "spain", label: "Spain", flag: "🇪🇸", x: "50%", y: "28%" },
  { id: "mexico", label: "Mexico", flag: "🇲🇽", x: "18%", y: "42%" },
  { id: "colombia", label: "Colombia", flag: "🇨🇴", x: "28%", y: "52%" },
  { id: "peru", label: "Peru", flag: "🇵🇪", x: "26%", y: "68%" },
  { id: "argentina", label: "Argentina", flag: "🇦🇷", x: "32%", y: "82%" },
];

type InteractiveGlobeProps = {
  selected: RegionId | null;
  onSelect: (id: RegionId) => void;
};

export function InteractiveGlobe({ selected, onSelect }: InteractiveGlobeProps) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-fiesta-gold/15 bg-linear-to-b from-card/90 via-background/80 to-card/60 shadow-inner shadow-fiesta-crimson/10 sm:aspect-[2/1]">
      {/* Globe grid */}
      <svg
        className="absolute inset-0 h-full w-full text-muted-foreground/25"
        viewBox="0 0 400 220"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <linearGradient id="globe-shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--fiesta-gold)" stopOpacity="0.08" />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor="var(--fiesta-crimson)" stopOpacity="0.06" />
          </linearGradient>
        </defs>
        <ellipse
          cx="200"
          cy="110"
          rx="168"
          ry="88"
          fill="url(#globe-shine)"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse
            key={i}
            cx="200"
            cy="110"
            rx={40 + i * 32}
            ry={22 + i * 14}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4 6"
          />
        ))}
        {[-120, -60, 0, 60, 120].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 200 + Math.sin(rad) * 30;
          const x2 = 200 + Math.sin(rad) * 165;
          return (
            <line
              key={i}
              x1={x1}
              y1="25"
              x2={x2}
              y2="195"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeOpacity="0.4"
            />
          );
        })}
      </svg>

      {/* Soft continent suggestion (very abstract) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[12%] rounded-full bg-linear-to-tr from-fiesta-crimson/5 via-transparent to-fiesta-orange/10 blur-2xl"
      />

      {REGIONS.map((region) => {
        const isSel = selected === region.id;
        return (
          <motion.button
            key={region.id}
            type="button"
            style={{ left: region.x, top: region.y }}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fiesta-gold/80"
            onClick={() => onSelect(region.id)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            aria-pressed={isSel}
            aria-label={`${region.label} — explore accent`}
          >
            <span
              className={`flex size-11 items-center justify-center rounded-full border-2 text-lg shadow-lg backdrop-blur-sm transition-colors sm:size-12 ${
                isSel
                  ? "border-fiesta-gold bg-fiesta-crimson/40 shadow-fiesta-gold/30"
                  : "border-white/15 bg-card/70 hover:border-fiesta-orange/50"
              }`}
            >
              {region.flag}
            </span>
            <span className="hidden text-[10px] font-medium text-muted-foreground sm:block">
              {region.label}
            </span>
          </motion.button>
        );
      })}

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-background/50 px-2.5 py-1 text-[10px] text-muted-foreground backdrop-blur-md sm:text-xs">
        <MapPin className="size-3 text-fiesta-orange" />
        <span>Interactive regions</span>
      </div>
    </div>
  );
}

export { REGIONS };
