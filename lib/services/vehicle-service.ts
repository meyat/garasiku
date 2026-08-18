import { createClient } from "@/lib/supabase/server";
import type { Vehicle } from "@/types/database";

export async function getUserVehicles(): Promise<Vehicle[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Vehicle[]) ?? [];
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Vehicle;
}
