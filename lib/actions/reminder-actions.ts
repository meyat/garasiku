"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { REMINDER_TYPES } from "@/lib/services/reminder-service";

export async function createReminder(vehicleId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const type = String(formData.get("type") || "");
  const title = String(formData.get("title") || "").trim();
  const dueDate = String(formData.get("dueDate") || "").trim() || null;
  const dueOdometerRaw = formData.get("dueOdometer");
  const dueOdometer = dueOdometerRaw ? Number(dueOdometerRaw) : null;

  if (!REMINDER_TYPES.includes(type as any) || !title || (!dueDate && !dueOdometer)) {
    redirect(`/garage/${vehicleId}/reminders/add?error=Isi judul dan minimal satu target (tanggal atau km)`);
  }

  const { error } = await supabase.from("reminders").insert({
    vehicle_id: vehicleId,
    owner_id: user!.id,
    type,
    title,
    due_date: dueDate,
    due_odometer: dueOdometer,
  });

  if (error) {
    redirect(`/garage/${vehicleId}/reminders/add?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/garage/${vehicleId}?tab=overview`);
}

export async function dismissReminder(reminderId: string, vehicleId: string) {
  const supabase = createClient();
  await supabase.from("reminders").update({ is_dismissed: true }).eq("id", reminderId);
  revalidatePath(`/garage/${vehicleId}`);
}

export async function snoozeReminder(reminderId: string, vehicleId: string, days: number) {
  const supabase = createClient();
  const snoozedUntil = new Date();
  snoozedUntil.setDate(snoozedUntil.getDate() + days);
  await supabase
    .from("reminders")
    .update({ snoozed_until: snoozedUntil.toISOString().slice(0, 10) })
    .eq("id", reminderId);
  revalidatePath(`/garage/${vehicleId}`);
}
