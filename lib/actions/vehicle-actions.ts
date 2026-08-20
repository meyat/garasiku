"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function addVehicle(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nickname = String(formData.get("nickname") || "").trim();
  const brand = String(formData.get("brand") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const variant = String(formData.get("variant") || "").trim() || null;
  const licensePlate = String(formData.get("licensePlate") || "").trim().toUpperCase() || null;
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const odometer = Number(formData.get("odometer") || 0);

  if (!nickname || !brand || !model || Number.isNaN(odometer) || odometer < 0) {
    redirect("/garage/add?error=Lengkapi data kendaraan dengan benar");
  }

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert({
      owner_id: user!.id,
      nickname,
      brand_name: brand,
      model_name: model,
      variant_name: variant,
      license_plate: licensePlate,
      production_year: year,
      current_odometer: odometer,
    })
    .select("id")
    .single();

  if (error || !vehicle) {
    redirect(`/garage/add?error=${encodeURIComponent(error?.message ?? "Gagal menyimpan")}`);
  }

  await supabase.from("odometer_logs").insert({
    vehicle_id: vehicle!.id,
    odometer,
    source: "manual",
    created_by: user!.id,
  });

  redirect(`/garage/${vehicle!.id}`);
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nickname = String(formData.get("nickname") || "").trim();
  const brand = String(formData.get("brand") || "").trim();
  const model = String(formData.get("model") || "").trim();
  const variant = String(formData.get("variant") || "").trim() || null;
  const licensePlate = String(formData.get("licensePlate") || "").trim().toUpperCase() || null;
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const engineCc = formData.get("engineCc") ? Number(formData.get("engineCc")) : null;
  const purchaseDate = String(formData.get("purchaseDate") || "").trim() || null;
  const purchasePrice = formData.get("purchasePrice") ? Number(formData.get("purchasePrice")) : null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!nickname || !brand || !model) {
    redirect(`/garage/${vehicleId}/edit?error=Lengkapi data kendaraan dengan benar`);
  }

  const { error } = await supabase
    .from("vehicles")
    .update({
      nickname,
      brand_name: brand,
      model_name: model,
      variant_name: variant,
      license_plate: licensePlate,
      production_year: year,
      engine_cc: engineCc,
      purchase_date: purchaseDate,
      purchase_price: purchasePrice,
      notes,
    })
    .eq("id", vehicleId)
    .eq("owner_id", user!.id); // RLS also enforces this — extra guard for a clean check

  if (error) {
    redirect(`/garage/${vehicleId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/garage/${vehicleId}`);
}

export async function archiveVehicle(vehicleId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("vehicles")
    .update({ is_archived: true })
    .eq("id", vehicleId)
    .eq("owner_id", user!.id);

  redirect("/garage");
}

export async function saveDetectedVehicle(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nickname = String(formData.get("nickname") || "").trim();
  const variantId = String(formData.get("variantId") || "").trim() || null;
  const brandName = String(formData.get("brandName") || "").trim();
  const modelName = String(formData.get("modelName") || "").trim();
  const variantName = String(formData.get("variantName") || "").trim() || null;
  const licensePlate = String(formData.get("licensePlate") || "").trim().toUpperCase() || null;
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
      license_plate: licensePlate,
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
