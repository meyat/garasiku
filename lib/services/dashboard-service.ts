import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface DashboardReminder {
  id: string;
  title: string;
  vehicleName: string;
  dueDate: string | null;
  dueOdometer: number | null;
}

export async function getActiveRemindersForUser(): Promise<DashboardReminder[]> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("reminders")
    .select("id, title, due_date, due_odometer, snoozed_until, vehicles(nickname)")
    .eq("is_dismissed", false)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) return [];

  return (data ?? [])
    .filter((r: any) => !r.snoozed_until || r.snoozed_until <= today)
    .map((r: any) => ({
      id: r.id,
      title: r.title,
      vehicleName: r.vehicles?.nickname ?? "Kendaraan",
      dueDate: r.due_date,
      dueOdometer: r.due_odometer,
    }));
}

export interface DashboardActivity {
  icon: "fuel" | "service";
  label: string;
  detail: string;
  vehicleName: string;
  date: string;
}

export async function getRecentActivityForUser(limit = 5): Promise<DashboardActivity[]> {
  const supabase = createClient();

  const [{ data: fuelLogs }, { data: serviceRecords }] = await Promise.all([
    supabase
      .from("fuel_logs")
      .select("id, filled_at, total_cost, liters, fuel_type, vehicles(nickname)")
      .order("filled_at", { ascending: false })
      .limit(limit),
    supabase
      .from("service_records")
      .select("id, service_date, total_cost, workshop_name, odometer, vehicles(nickname)")
      .order("service_date", { ascending: false })
      .limit(limit),
  ]);

  const combined: DashboardActivity[] = [
    ...(fuelLogs ?? []).map((f: any) => ({
      icon: "fuel" as const,
      label: `Isi ${f.fuel_type ?? "bensin"}`,
      detail: `Rp${Math.round(f.total_cost ?? 0).toLocaleString("id-ID")} · ${f.liters}L`,
      vehicleName: f.vehicles?.nickname ?? "Kendaraan",
      date: f.filled_at,
    })),
    ...(serviceRecords ?? []).map((s: any) => ({
      icon: "service" as const,
      label: s.workshop_name ? `Servis di ${s.workshop_name}` : "Servis kendaraan",
      detail: `${s.odometer.toLocaleString("id-ID")} km · Rp${Math.round(s.total_cost).toLocaleString("id-ID")}`,
      vehicleName: s.vehicles?.nickname ?? "Kendaraan",
      date: s.service_date,
    })),
  ];

  return combined
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}
