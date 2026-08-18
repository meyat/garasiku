import { createClient } from "@/lib/supabase/server";
import type { FuelLogEntry } from "@/lib/calculations/fuel-efficiency";

export interface FuelLogRow {
  id: string;
  vehicle_id: string;
  filled_at: string;
  odometer: number;
  fuel_type: string | null;
  liters: number;
  price_per_liter: number | null;
  total_cost: number | null;
  gas_station: string | null;
  is_full_tank: boolean;
  notes: string | null;
}

export async function getFuelLogs(vehicleId: string): Promise<FuelLogRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("fuel_logs")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("filled_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as FuelLogRow[]) ?? [];
}

export function toEfficiencyInput(rows: FuelLogRow[]): FuelLogEntry[] {
  return rows.map((r) => ({
    id: r.id,
    filledAt: r.filled_at,
    odometer: r.odometer,
    liters: r.liters,
    totalCost: r.total_cost,
    isFullTank: r.is_full_tank,
  }));
}
