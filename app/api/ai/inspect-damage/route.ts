import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { checkRateLimit } from "@/lib/ai/rate-limit";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`${user.id}:inspect-damage`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.retryAfterMs ?? 1000) / 1000)) } }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Request tidak valid" }, { status: 400 });
  }

  const vehicleId = String(formData.get("vehicleId") || "");
  const file = formData.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File foto wajib diisi" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Format file harus JPEG, PNG, atau WebP" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 8MB" }, { status: 400 });
  }

  // Ownership check: only allow inspection uploads tied to the user's own vehicle
  if (vehicleId) {
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id")
      .eq("id", vehicleId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!vehicle) {
      return NextResponse.json({ error: "Kendaraan tidak ditemukan" }, { status: 404 });
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  try {
    const provider = getAIProvider();
    const result = await provider.inspectDamage(base64);

    // Persist as an AI analysis record for history (not a source of truth for anything else)
    if (vehicleId) {
      await supabase.from("ai_analysis_records").insert({
        vehicle_id: vehicleId,
        owner_id: user.id,
        analysis_type: "damage_inspection",
        result: result,
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
