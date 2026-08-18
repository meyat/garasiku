import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { checkRateLimit } from "@/lib/ai/rate-limit";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`${user.id}:suggest-maintenance`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs ?? 1000) / 1000)) } }
    );
  }

  const body = await request.json().catch(() => null);
  const symptomDescription = String(body?.symptomDescription ?? "").trim();
  const vehicleId = String(body?.vehicleId ?? "").trim();

  if (!symptomDescription || symptomDescription.length < 5) {
    return NextResponse.json({ error: "Jelaskan gejalanya lebih detail" }, { status: 400 });
  }
  if (symptomDescription.length > 1000) {
    return NextResponse.json({ error: "Deskripsi terlalu panjang (maks 1000 karakter)" }, { status: 400 });
  }

  let vehicleContext;
  if (vehicleId) {
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, brand_name, model_name, variant_name, current_odometer")
      .eq("id", vehicleId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (vehicle) {
      const { data: recentItems } = await supabase
        .from("service_items")
        .select("component_id, components(name), service_records!inner(vehicle_id, service_date)")
        .eq("service_records.vehicle_id", vehicleId)
        .order("service_records(service_date)", { ascending: false })
        .limit(5);

      vehicleContext = {
        brand: vehicle.brand_name,
        model: vehicle.model_name,
        variant: vehicle.variant_name,
        currentOdometer: vehicle.current_odometer,
        recentServiceComponents: (recentItems ?? [])
          .map((i: any) => i.components?.name)
          .filter(Boolean),
      };
    }
  }

  try {
    const provider = getAIProvider();
    const result = await provider.suggestMaintenance({ symptomDescription, vehicleContext });

    if (vehicleId && vehicleContext) {
      await supabase.from("ai_analysis_records").insert({
        vehicle_id: vehicleId,
        owner_id: user.id,
        analysis_type: "maintenance_suggestion",
        result: { symptomDescription, ...result },
      });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Layanan AI sedang tidak tersedia. Coba lagi nanti." },
      { status: 503 }
    );
  }
}
