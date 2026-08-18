/**
 * Pure constants/types shared between server pages and client components.
 * IMPORTANT: this file must never import anything server-only (no lib/supabase/server,
 * no next/headers) — that's exactly what caused the "next/headers in client bundle" bug.
 * Keep this file dependency-free.
 */

export const REMINDER_TYPES = ["service", "tax", "insurance", "inspection", "other"] as const;

export const REMINDER_TYPE_LABEL: Record<string, string> = {
  service: "Servis", tax: "Pajak", insurance: "Asuransi", inspection: "Inspeksi", other: "Lainnya",
};

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
