import "server-only";
import { createClient } from "@/lib/supabase/server";
import { calculateComponentStatus, type ServiceStatus } from "@/lib/calculations/service-status";
import { calculateVehicleHealth, type HealthScoreResult } from "@/lib/calculations/vehicle-health";
import { calculateFuelEfficiency } from "@/lib/calculations/fuel-efficiency";
import { getFuelLogs, toEfficiencyInput } from "./fuel-service";

export interface VehicleOverview {
  health: HealthScoreResult;
  nextServiceLabel: string; // e.g. "800 km" or "Belum ada data"
  fuelEfficiencyLabel: string; // e.g. "43.2 km/L" or "—"
}

export async function getVehicleOverview(vehicleId: string, variantId: string | null): Promise<VehicleOverview> {
  const supabase = createClient();

  let checklist: { componentName: string; status: ServiceStatus; kmRemaining: number | null }[] = [];

  if (variantId) {
    const { data: intervals } = await supabase
      .from("service_intervals")
      .select("component_id, interval_km, interval_months, inspect_only, components(name)")
      .eq("variant_id", variantId);

    const { data: lastServiceItems } = await supabase
      .from("service_items")
      .select("component_id, action, service_records!inner(vehicle_id, odometer, service_date)")
      .eq("service_records.vehicle_id", vehicleId)
      .order("service_records(service_date)", { ascending: false });

    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("current_odometer")
      .eq("id", vehicleId)
      .single();

    checklist = (intervals ?? []).map((rule: any) => {
      const lastItem = (lastServiceItems ?? []).find((i: any) => i.component_id === rule.component_id) as any;
      const result = calculateComponentStatus({
        rule: {
          componentId: rule.component_id,
          intervalKm: rule.interval_km,
          intervalMonths: rule.interval_months,
          inspectOnly: rule.inspect_only,
        },
        lastEvent: lastItem
          ? {
              componentId: rule.component_id,
              odometerAtService: lastItem.service_records.odometer,
              dateAtService: lastItem.service_records.service_date,
              action: lastItem.action,
            }
          : null,
        currentOdometer: vehicle?.current_odometer ?? 0,
      });
      return { componentName: rule.components?.name ?? "Komponen", status: result.status, kmRemaining: result.kmRemaining };
    });
  }

  const health = calculateVehicleHealth(
    checklist.map((c) => ({ componentName: c.componentName, status: c.status }))
  );

  const soonest = checklist
    .filter((c) => c.kmRemaining != null)
    .sort((a, b) => (a.kmRemaining! - b.kmRemaining!))[0];
  const nextServiceLabel = soonest
    ? soonest.kmRemaining! >= 0
      ? `${soonest.kmRemaining!.toLocaleString("id-ID")} km`
      : "Terlambat"
    : "Belum ada data";

  const fuelLogs = await getFuelLogs(vehicleId);
  const efficiency = calculateFuelEfficiency(toEfficiencyInput(fuelLogs));
  const fuelEfficiencyLabel = efficiency.average ? `${efficiency.average.toFixed(1)} km/L` : "—";

  return { health, nextServiceLabel, fuelEfficiencyLabel };
}
