"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const supabase = createClient();
        if (supabase) await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      <LogOut className="size-3.5" data-icon="inline-start" />
      Salir
    </Button>
  );
}
