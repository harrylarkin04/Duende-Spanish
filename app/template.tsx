"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

import { duendeEaseOutExpo } from "@/lib/design-system";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const reduce = reduceMotion === true;

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.36,
        ease: duendeEaseOutExpo,
      }}
    >
      {children}
    </motion.div>
  );
}
