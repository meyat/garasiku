import "server-only";
import { createClient } from "@/lib/supabase/server";
import { type ReminderRow } from "@/lib/constants/reminder";

// Re-exported so existing server-side imports of these from reminder-service still work.
export { REMINDER_TYPES, REMINDER_TYPE_LABEL, type ReminderRow } from "@/lib/constants/reminder";

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
