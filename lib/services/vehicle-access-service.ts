import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AccessGrantRow {
  id: string;
  workshop_id: string;
  workshop_name: string;
  created_at: string;
  revoked_at: string | null;
}

export async function getVehicleAccessGrants(vehicleId: string): Promise<AccessGrantRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicle_workshop_access")
    .select("id, workshop_id, created_at, revoked_at, workshops(name)")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    workshop_id: row.workshop_id,
    workshop_name: row.workshops?.name ?? "Bengkel",
    created_at: row.created_at,
    revoked_at: row.revoked_at,
  }));
}

export async function searchWorkshopsByName(query: string) {
  if (!query.trim()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workshops")
    .select("id, name, address")
    .ilike("name", `%${query}%`)
    .limit(5);

  if (error) return [];
  return data ?? [];
}
