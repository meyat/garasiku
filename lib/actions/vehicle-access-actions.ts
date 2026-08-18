"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function grantWorkshopAccess(vehicleId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workshopId = String(formData.get("workshopId") || "").trim();
  if (!workshopId) {
    redirect(`/garage/${vehicleId}/access?error=Pilih bengkel dari hasil pencarian`);
  }

  // RLS also enforces this (vehicle_access_owner_manage requires the caller to own the vehicle
  // and requires granted_by = auth.uid()), this check just gives a friendlier error message.
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("owner_id", user!.id)
    .maybeSingle();

  if (!vehicle) {
    redirect(`/garage/${vehicleId}/access?error=Kamu bukan pemilik kendaraan ini`);
  }

  const { error } = await supabase.from("vehicle_workshop_access").upsert(
    {
      vehicle_id: vehicleId,
      workshop_id: workshopId,
      granted_by: user!.id,
      revoked_at: null,
    },
    { onConflict: "vehicle_id,workshop_id" }
  );

  if (error) {
    redirect(`/garage/${vehicleId}/access?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/garage/${vehicleId}/access`);
}

export async function revokeWorkshopAccess(grantId: string, vehicleId: string) {
  const supabase = createClient();
  await supabase
    .from("vehicle_workshop_access")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", grantId);
  revalidatePath(`/garage/${vehicleId}/access`);
}
