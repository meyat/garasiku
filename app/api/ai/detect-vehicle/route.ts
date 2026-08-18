import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { findMatchingVariants } from "@/lib/services/vehicle-matching-service";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const LOW_CONFIDENCE_THRESHOLD = 0.4;

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(user.id);
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

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  let detection;
  try {
    const provider = getAIProvider();
    detection = await provider.detectVehicle(base64);
  } catch {
    return NextResponse.json(
      { error: "Deteksi AI sedang tidak tersedia. Silakan pilih motor secara manual." },
      { status: 503 }
    );
  }

  if (!detection || detection.confidence < LOW_CONFIDENCE_THRESHOLD) {
    return NextResponse.json({
      detection: null,
      matches: [],
      message: "Kami tidak dapat mengidentifikasi motor ini dengan yakin. Silakan pilih motor kamu secara manual.",
    });
  }

  const matches = await findMatchingVariants(detection);

  return NextResponse.json({ detection, matches });
}
