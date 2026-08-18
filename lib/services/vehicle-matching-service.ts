import { createClient } from "@/lib/supabase/server";
import type { VehicleDetectionResult } from "@/lib/ai/provider";

export interface VariantMatch {
  variantId: string;
  brandName: string;
  modelName: string;
  variantName: string;
  years: number[];
}

/**
 * Search the master vehicle database for candidates matching an AI detection result.
 * The database is the source of truth — this only narrows down options for the user
 * to confirm; it never auto-assigns a variant_id.
 */
export async function findMatchingVariants(detection: VehicleDetectionResult): Promise<VariantMatch[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("vehicle_variants")
    .select(`
      id, name,
      vehicle_models!inner(name, vehicle_brands!inner(name)),
      vehicle_variant_years(year)
    `)
    .ilike("vehicle_models.name", `%${detection.modelGuess}%`)
    .ilike("vehicle_models.vehicle_brands.name", `%${detection.brandGuess}%`);

  if (error || !data) return [];

  return data.map((row: any) => ({
    variantId: row.id,
    brandName: row.vehicle_models.vehicle_brands.name,
    modelName: row.vehicle_models.name,
    variantName: row.name,
    years: (row.vehicle_variant_years ?? []).map((y: any) => y.year),
  }));
}
