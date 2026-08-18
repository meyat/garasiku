import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchWorkshopsByName } from "@/lib/services/vehicle-access-service";

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.trim().length < 2) {
    return NextResponse.json({ workshops: [] });
  }

  const workshops = await searchWorkshopsByName(q);
  return NextResponse.json({ workshops });
}
