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

  const rateLimit = checkRateLimit(`${user.id}:suggest-components`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs ?? 1000) / 1000)) } }
    );
  }

  const body = await request.json().catch(() => null);
  const vehicleId = String(body?.vehicleId ?? "").trim();
  if (!vehicleId) {
    return NextResponse.json({ error: "vehicleId wajib diisi" }, { status: 400 });
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("brand_name, model_name, variant_name, engine_cc")
    .eq("id", vehicleId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!vehicle) {
    return NextResponse.json({ error: "Kendaraan tidak ditemukan" }, { status: 404 });
  }

  const description = [
    vehicle.brand_name,
    vehicle.model_name,
    vehicle.variant_name,
    vehicle.engine_cc ? `${vehicle.engine_cc}cc` : null,
  ].filter(Boolean).join(" ");

  try {
    const provider = getAIProvider();
    const result = await provider.suggestComponents(description);

    await supabase.from("ai_analysis_records").insert({
      vehicle_id: vehicleId,
      owner_id: user.id,
      analysis_type: "component_suggestion",
      result: result,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Layanan AI sedang tidak tersedia. Coba lagi nanti." },
      { status: 503 }
    );
  }
}
