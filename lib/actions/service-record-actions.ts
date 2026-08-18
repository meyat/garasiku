"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVehicleById } from "@/lib/services/vehicle-service";

export interface ServiceItemInput {
  componentId: string | null;
  componentLabel: string;
  action: "inspect" | "clean" | "repair" | "replace" | "adjust" | "other";
  conditionNote: string;
  cost: number;
}

export async function createServiceRecord(
  vehicleId: string,
  formValues: {
    serviceDate: string;
    odometer: number;
    workshopName: string;
    mechanicName: string;
    notes: string;
    laborCost: number;
    items: ServiceItemInput[];
  }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) throw new Error("Kendaraan tidak ditemukan");

  if (Number.isNaN(formValues.odometer) || formValues.odometer < vehicle.current_odometer) {
    throw new Error(
      `Odometer (${formValues.odometer}) tidak boleh lebih kecil dari odometer terakhir (${vehicle.current_odometer})`
    );
  }
  if (formValues.items.length === 0) {
    throw new Error("Tambahkan minimal satu item servis");
  }

  const partsCost = formValues.items.reduce((sum, it) => sum + (it.cost || 0), 0);

  const { data: record, error } = await supabase
    .from("service_records")
    .insert({
      vehicle_id: vehicleId,
      owner_id: user!.id,
      service_date: formValues.serviceDate,
      odometer: formValues.odometer,
      workshop_name: formValues.workshopName || null,
      mechanic_name: formValues.mechanicName || null,
      notes: formValues.notes || null,
      labor_cost: formValues.laborCost || 0,
      parts_cost: partsCost,
    })
    .select("id")
    .single();

  if (error || !record) throw new Error(error?.message ?? "Gagal menyimpan servis");

  const itemsPayload = formValues.items.map((it) => ({
    service_record_id: record.id,
    component_id: it.componentId,
    action: it.action,
    condition_note: it.conditionNote || null,
    cost: it.cost || 0,
  }));

  const { error: itemsError } = await supabase.from("service_items").insert(itemsPayload);
  if (itemsError) throw new Error(itemsError.message);

  // Log as expense too
  const totalCost = (formValues.laborCost || 0) + partsCost;
  if (totalCost > 0) {
    await supabase.from("expenses").insert({
      vehicle_id: vehicleId,
      owner_id: user!.id,
      category: "service",
      amount: totalCost,
      description: formValues.workshopName ? `Servis di ${formValues.workshopName}` : "Servis kendaraan",
      related_service_id: record.id,
    });
  }

  redirect(`/garage/${vehicleId}?tab=maintenance`);
}
