"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveDetectedVehicle(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nickname = String(formData.get("nickname") || "").trim();
  const variantId = String(formData.get("variantId") || "").trim() || null;
  const brandName = String(formData.get("brandName") || "").trim();
  const modelName = String(formData.get("modelName") || "").trim();
  const variantName = String(formData.get("variantName") || "").trim() || null;
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const odometer = Number(formData.get("odometer") || 0);

  if (!nickname || !brandName || !modelName || Number.isNaN(odometer) || odometer < 0) {
    redirect("/garage/add-with-photo?error=Data kendaraan tidak lengkap");
  }

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert({
      owner_id: user!.id,
      variant_id: variantId, // null if user didn't pick a confirmed DB match
      nickname,
      brand_name: brandName,
      model_name: modelName,
      variant_name: variantName,
      production_year: year,
      current_odometer: odometer,
    })
    .select("id")
    .single();

  if (error || !vehicle) {
    redirect(`/garage/add-with-photo?error=${encodeURIComponent(error?.message ?? "Gagal menyimpan")}`);
  }

  await supabase.from("odometer_logs").insert({
    vehicle_id: vehicle!.id,
    odometer,
    source: "manual",
    created_by: user!.id,
  });

  redirect(`/garage/${vehicle!.id}`);
}
