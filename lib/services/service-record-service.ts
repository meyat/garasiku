import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ServiceRecordRow {
  id: string;
  vehicle_id: string;
  service_date: string;
  odometer: number;
  workshop_name: string | null;
  mechanic_name: string | null;
  notes: string | null;
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
}

export interface ServiceItemRow {
  id: string;
  service_record_id: string;
  component_id: string | null;
  action: string;
  condition_note: string | null;
  cost: number;
}

export async function getServiceRecords(vehicleId: string): Promise<ServiceRecordRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_records")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("service_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ServiceRecordRow[]) ?? [];
}

export async function getCompatibleComponents(variantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicle_component_compatibility")
    .select("component_id, components(id, name, component_categories(name))")
    .eq("variant_id", variantId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.components.id as string,
    name: row.components.name as string,
    category: row.components.component_categories?.name as string,
  }));
}
