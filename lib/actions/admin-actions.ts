"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function addBrand(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await supabase.from("vehicle_brands").insert({ name });
  revalidatePath("/admin/brands");
}

export async function addModel(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const brandId = String(formData.get("brandId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!brandId || !name) return;
  await supabase.from("vehicle_models").insert({ brand_id: brandId, name, vehicle_type: "motorcycle" });
  revalidatePath("/admin/brands");
}

export async function addVariant(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const modelId = String(formData.get("modelId") || "");
  const name = String(formData.get("name") || "").trim();
  const engineCc = formData.get("engineCc") ? Number(formData.get("engineCc")) : null;
  const transmission = String(formData.get("transmission") || "") || null;
  const fuelType = String(formData.get("fuelType") || "") || null;
  const year = formData.get("year") ? Number(formData.get("year")) : null;

  if (!modelId || !name) return;

  const { data: variant } = await supabase
    .from("vehicle_variants")
    .insert({ model_id: modelId, name, engine_cc: engineCc, transmission, fuel_type: fuelType })
    .select("id")
    .single();

  if (variant && year) {
    await supabase.from("vehicle_variant_years").insert({ variant_id: variant.id, year });
  }

  revalidatePath("/admin/brands");
}

export async function addComponent(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const categoryId = String(formData.get("categoryId") || "");
  const name = String(formData.get("name") || "").trim();
  if (!categoryId || !name) return;
  await supabase.from("components").insert({ category_id: categoryId, name });
  revalidatePath("/admin/components");
}

export async function toggleCompatibility(variantId: string, componentId: string, currentlyLinked: boolean) {
  await requireAdmin();
  const supabase = createClient();
  if (currentlyLinked) {
    await supabase
      .from("vehicle_component_compatibility")
      .delete()
      .eq("variant_id", variantId)
      .eq("component_id", componentId);
  } else {
    await supabase
      .from("vehicle_component_compatibility")
      .insert({ variant_id: variantId, component_id: componentId });
  }
  revalidatePath("/admin/intervals");
}

export async function upsertInterval(formData: FormData) {
  await requireAdmin();
  const supabase = createClient();
  const variantId = String(formData.get("variantId") || "");
  const componentId = String(formData.get("componentId") || "");
  const intervalKm = formData.get("intervalKm") ? Number(formData.get("intervalKm")) : null;
  const intervalMonths = formData.get("intervalMonths") ? Number(formData.get("intervalMonths")) : null;
  const inspectOnly = formData.get("inspectOnly") === "on";
  const notes = String(formData.get("notes") || "") || null;

  if (!variantId || !componentId) return;
  if (!inspectOnly && intervalKm == null && intervalMonths == null) return;

  await supabase.from("service_intervals").upsert(
    {
      variant_id: variantId,
      component_id: componentId,
      interval_km: intervalKm,
      interval_months: intervalMonths,
      inspect_only: inspectOnly,
      notes,
    },
    { onConflict: "variant_id,component_id" }
  );

  revalidatePath("/admin/intervals");
}
