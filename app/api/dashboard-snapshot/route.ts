import { NextResponse } from "next/server";

import { getDashboardSnapshot } from "@/lib/data/dashboard-snapshot";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(null, { status: 503 });
  }
  const snap = await getDashboardSnapshot();
  return NextResponse.json(snap);
}
