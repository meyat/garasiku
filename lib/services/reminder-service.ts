import { createClient } from "@/lib/supabase/server";

export interface ReminderRow {
  id: string;
  vehicle_id: string;
  type: string;
  title: string;
  due_date: string | null;
  due_odometer: number | null;
  is_dismissed: boolean;
  snoozed_until: string | null;
}

export const REMINDER_TYPES = ["service", "tax", "insurance", "inspection", "other"] as const;
export const REMINDER_TYPE_LABEL: Record<string, string> = {
  service: "Servis", tax: "Pajak", insurance: "Asuransi", inspection: "Inspeksi", other: "Lainnya",
};

export async function getActiveReminders(vehicleId: string): Promise<ReminderRow[]> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .eq("is_dismissed", false)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);

  // Hide reminders still snoozed past today
  return ((data as ReminderRow[]) ?? []).filter(
    (r) => !r.snoozed_until || r.snoozed_until <= today
  );
}
