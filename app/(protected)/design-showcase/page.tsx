import type { Metadata } from "next";

import { DesignShowcaseView } from "@/components/design-showcase/design-showcase-view";

export const metadata: Metadata = {
  title: "Design showcase — Duende",
  description:
    "Preview Duende brand colors, semantic tokens, shadcn components, and motion presets.",
};

export default function DesignShowcasePage() {
  return <DesignShowcaseView />;
}
