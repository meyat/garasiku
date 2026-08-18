import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVehicleById } from "@/lib/services/vehicle-service";
import { getFuelLogs, toEfficiencyInput } from "@/lib/services/fuel-service";
import { getServiceRecords } from "@/lib/services/service-record-service";
import { getExpenses, summarizeByCategory, summarizeThisMonth, CATEGORY_LABEL } from "@/lib/services/expense-service";
import { getActiveReminders } from "@/lib/services/reminder-service";
import { calculateComponentStatus, type ServiceStatus } from "@/lib/calculations/service-status";
import { calculateFuelEfficiency } from "@/lib/calculations/fuel-efficiency";
import { calculateVehicleHealth } from "@/lib/calculations/vehicle-health";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { FuelEfficiencyChart } from "@/components/dashboard/fuel-efficiency-chart";
import { HealthScoreCard } from "@/components/dashboard/health-score-card";
import { ReminderItem } from "@/components/dashboard/reminder-item";
import { Fuel, Wrench, Gauge } from "lucide-react";
import clsx from "clsx";

const STATUS_LABEL: Record<ServiceStatus, string> = {
  ok: "OK", due_soon: "Segera", due: "Waktunya", overdue: "Terlambat",
  inspect: "Perlu Dicek", replaced: "Diganti", repaired: "Diperbaiki", damaged: "Rusak",
};
const STATUS_COLOR: Record<ServiceStatus, string> = {
  ok: "bg-green-100 text-green-700", due_soon: "bg-amber-100 text-amber-700",
  due: "bg-orange-100 text-orange-700", overdue: "bg-red-100 text-red-700",
  inspect: "bg-blue-100 text-blue-700", replaced: "bg-neutral-100 text-neutral-600",
  repaired: "bg-neutral-100 text-neutral-600", damaged: "bg-red-100 text-red-700",
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "maintenance", label: "Servis" },
  { key: "fuel", label: "Bensin" },
  { key: "expenses", label: "Biaya" },
  { key: "history", label: "Riwayat" },
] as const;

export default async function VehicleDetailPage({
  params, searchParams,
}: { params: { vehicleId: string }; searchParams: { tab?: string } }) {
  const vehicle = await getVehicleById(params.vehicleId);
  if (!vehicle) notFound();

  const activeTab = (searchParams.tab ?? "overview") as (typeof TABS)[number]["key"];

  const supabase = createClient();
  const [fuelLogs, serviceRecords, expenses, reminders] = await Promise.all([
    getFuelLogs(vehicle.id),
    getServiceRecords(vehicle.id),
    getExpenses(vehicle.id),
    getActiveReminders(vehicle.id),
  ]);
  const efficiency = calculateFuelEfficiency(toEfficiencyInput(fuelLogs));

  let checklist: { componentName: string; status: ServiceStatus; kmRemaining: number | null }[] = [];
  if (vehicle.variant_id) {
    const { data: intervals } = await supabase
      .from("service_intervals")
      .select("component_id, interval_km, interval_months, inspect_only, components(name)")
      .eq("variant_id", vehicle.variant_id);

    const { data: lastServiceItems } = await supabase
      .from("service_items")
      .select("component_id, action, service_records!inner(vehicle_id, odometer, service_date)")
      .eq("service_records.vehicle_id", vehicle.id)
      .order("service_records(service_date)", { ascending: false });

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
        currentOdometer: vehicle.current_odometer,
      });
      return { componentName: rule.components?.name ?? "Komponen", status: result.status, kmRemaining: result.kmRemaining };
    });
  }

  const healthResult = calculateVehicleHealth(
    checklist.map((c) => ({ componentName: c.componentName, status: c.status }))
  );
  const expenseByCategory = summarizeByCategory(expenses);
  const thisMonthTotal = summarizeThisMonth(expenses);
  const totalOwnershipCost = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const timeline = [
    ...fuelLogs.map((f) => ({
      date: f.filled_at,
      icon: "⛽",
      label: `Isi ${f.fuel_type ?? "bensin"}`,
      detail: `Rp${Math.round(f.total_cost ?? 0).toLocaleString("id-ID")} · ${f.liters}L`,
    })),
    ...serviceRecords.map((s) => ({
      date: s.service_date,
      icon: "🔧",
      label: s.workshop_name ? `Servis di ${s.workshop_name}` : "Servis kendaraan",
      detail: `${s.odometer.toLocaleString("id-ID")} km · Rp${Math.round(s.total_cost).toLocaleString("id-ID")}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold">{vehicle.nickname}</h1>
      <p className="text-neutral-500 text-sm">
        {vehicle.brand_name} {vehicle.model_name} {vehicle.variant_name ?? ""} · {vehicle.production_year ?? "-"}
      </p>

      <div className="mt-3 flex gap-2">
        <Link href={`/garage/${vehicle.id}/fuel/add`}
          className="flex-1 text-center text-sm font-medium rounded-xl bg-white border border-neutral-200 py-2.5">
          ⛽ Catat Bensin
        </Link>
        <Link href={`/garage/${vehicle.id}/service/add`}
          className="flex-1 text-center text-sm font-medium rounded-xl bg-white border border-neutral-200 py-2.5">
          🔧 Catat Servis
        </Link>
      </div>
      <div className="mt-2 flex gap-2">
        <Link href={`/garage/${vehicle.id}/inspect`}
          className="flex-1 text-center text-xs font-medium rounded-xl bg-blue-50 border border-blue-100 text-blue-700 py-2">
          📷 Cek Kondisi (AI)
        </Link>
        <Link href={`/garage/${vehicle.id}/ask-ai`}
          className="flex-1 text-center text-xs font-medium rounded-xl bg-blue-50 border border-blue-100 text-blue-700 py-2">
          💬 Tanya Keluhan (AI)
        </Link>
      </div>
      <Link href={`/garage/${vehicle.id}/access`}
        className="mt-2 block text-center text-xs font-medium text-neutral-500">
        🔑 Kelola Akses Bengkel
      </Link>

      <div className="mt-4 flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <Link key={t.key} href={`/garage/${vehicle.id}?tab=${t.key}`}
            className={clsx(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px",
              activeTab === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-neutral-500"
            )}>
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="mt-4 space-y-4">
          <HealthScoreCard result={healthResult} />

          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Gauge size={16} />} label="Odometer" value={`${vehicle.current_odometer.toLocaleString("id-ID")} km`} />
            <StatCard icon={<Fuel size={16} />} label="Efisiensi Rata-rata" value={efficiency.average ? `${efficiency.average.toFixed(1)} km/L` : "—"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Wrench size={16} />} label="Total Servis" value={`${serviceRecords.length}x`} />
            <StatCard icon={<Fuel size={16} />} label="Bulan Ini" value={`Rp${Math.round(thisMonthTotal).toLocaleString("id-ID")}`} />
          </div>

          {reminders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Pengingat</h2>
                <Link href={`/garage/${vehicle.id}/reminders/add`} className="text-xs text-brand-600 font-medium">
                  + Tambah
                </Link>
              </div>
              <div className="space-y-2">
                {reminders.map((r) => (
                  <ReminderItem key={r.id} reminder={r} vehicleId={vehicle.id} />
                ))}
              </div>
            </div>
          )}
          {reminders.length === 0 && (
            <Link href={`/garage/${vehicle.id}/reminders/add`}
              className="block text-center text-sm text-brand-600 font-medium border border-dashed border-neutral-300 rounded-xl py-3">
              + Tambah Pengingat
            </Link>
          )}

          <div>
            <h2 className="font-semibold mb-2">Aktivitas Terbaru</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-neutral-400">Belum ada aktivitas.</p>
            ) : (
              <div className="space-y-2">
                {timeline.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white border border-neutral-200 rounded-xl px-4 py-3">
                    <span>{t.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs text-neutral-500">{t.detail}</p>
                    </div>
                    <span className="text-xs text-neutral-400">{new Date(t.date).toLocaleDateString("id-ID")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "maintenance" && (
        <div className="mt-4 space-y-2">
          {!vehicle.variant_id ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              Kendaraan belum tercocokkan ke database, checklist otomatis belum tersedia.
            </div>
          ) : checklist.length === 0 ? (
            <p className="text-sm text-neutral-500">Belum ada data interval servis untuk varian ini.</p>
          ) : (
            checklist.map((c) => (
              <div key={c.componentName} className="flex items-center justify-between bg-white rounded-xl border border-neutral-200 px-4 py-3">
                <div>
                  <p className="font-medium text-sm">{c.componentName}</p>
                  {c.kmRemaining != null && (
                    <p className="text-xs text-neutral-500">
                      {c.kmRemaining >= 0 ? `${c.kmRemaining.toLocaleString("id-ID")} km lagi` : `Lewat ${Math.abs(c.kmRemaining).toLocaleString("id-ID")} km`}
                    </p>
                  )}
                </div>
                <span className={clsx("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLOR[c.status])}>
                  {STATUS_LABEL[c.status]}
                </span>
              </div>
            ))
          )}

          <h2 className="font-semibold pt-4">Riwayat Servis</h2>
          {serviceRecords.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum ada riwayat servis.</p>
          ) : (
            serviceRecords.map((s) => (
              <div key={s.id} className="bg-white border border-neutral-200 rounded-xl px-4 py-3">
                <div className="flex justify-between">
                  <p className="text-sm font-medium">{s.workshop_name ?? "Servis"}</p>
                  <p className="text-xs text-neutral-400">{new Date(s.service_date).toLocaleDateString("id-ID")}</p>
                </div>
                <p className="text-xs text-neutral-500">{s.odometer.toLocaleString("id-ID")} km · Rp{Math.round(s.total_cost).toLocaleString("id-ID")}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "fuel" && (
        <div className="mt-4 space-y-4">
          <FuelEfficiencyChart points={efficiency.points} />

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Rata-rata" value={efficiency.average ? `${efficiency.average.toFixed(1)} km/L` : "—"} />
            <StatCard label="Terbaru" value={efficiency.latest ? `${efficiency.latest.toFixed(1)} km/L` : "—"} />
            <StatCard label="Terbaik" value={efficiency.best ? `${efficiency.best.toFixed(1)} km/L` : "—"} />
            <StatCard label="Terburuk" value={efficiency.worst ? `${efficiency.worst.toFixed(1)} km/L` : "—"} />
          </div>
          <StatCard label="Biaya per km" value={efficiency.costPerKm ? `Rp${Math.round(efficiency.costPerKm).toLocaleString("id-ID")}` : "—"} full />

          <h2 className="font-semibold pt-2">Riwayat Isi Bensin</h2>
          {fuelLogs.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum ada catatan bensin.</p>
          ) : (
            fuelLogs.map((f) => (
              <div key={f.id} className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex justify-between">
                <div>
                  <p className="text-sm font-medium">{f.liters}L {f.is_full_tank ? "(Full)" : "(Sebagian)"}</p>
                  <p className="text-xs text-neutral-500">{f.odometer.toLocaleString("id-ID")} km · {f.gas_station ?? "-"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Rp{Math.round(f.total_cost ?? 0).toLocaleString("id-ID")}</p>
                  <p className="text-xs text-neutral-400">{new Date(f.filled_at).toLocaleDateString("id-ID")}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Bulan Ini" value={`Rp${Math.round(thisMonthTotal).toLocaleString("id-ID")}`} />
            <StatCard label="Total Kepemilikan" value={`Rp${Math.round(totalOwnershipCost).toLocaleString("id-ID")}`} />
          </div>

          <Link href={`/garage/${vehicle.id}/expenses/add`}
            className="block text-center text-sm text-brand-600 font-medium border border-dashed border-neutral-300 rounded-xl py-3">
            + Catat Pengeluaran Lain
          </Link>

          <div>
            <h2 className="font-semibold mb-2">Per Kategori</h2>
            {expenseByCategory.length === 0 ? (
              <p className="text-sm text-neutral-400">Belum ada data pengeluaran.</p>
            ) : (
              <div className="space-y-2">
                {expenseByCategory.map((e) => (
                  <div key={e.category} className="flex justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3">
                    <span className="text-sm">{CATEGORY_LABEL[e.category] ?? e.category}</span>
                    <span className="text-sm font-medium">Rp{Math.round(e.total).toLocaleString("id-ID")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-semibold mb-2">Riwayat</h2>
            {expenses.length === 0 ? (
              <p className="text-sm text-neutral-400">Belum ada pengeluaran.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((e) => (
                  <div key={e.id} className="flex justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{CATEGORY_LABEL[e.category] ?? e.category}</p>
                      {e.description && <p className="text-xs text-neutral-500">{e.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Rp{Math.round(Number(e.amount)).toLocaleString("id-ID")}</p>
                      <p className="text-xs text-neutral-400">{new Date(e.expense_date).toLocaleDateString("id-ID")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="mt-4 space-y-2">
          {timeline.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum ada riwayat.</p>
          ) : (
            timeline.map((t, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-neutral-200 rounded-xl px-4 py-3">
                <span>{t.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs text-neutral-500">{t.detail}</p>
                </div>
                <span className="text-xs text-neutral-400">{new Date(t.date).toLocaleDateString("id-ID")}</span>
              </div>
            ))
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function StatCard({ icon, label, value, full }: { icon?: React.ReactNode; label: string; value: string; full?: boolean }) {
  return (
    <div className={clsx("bg-white rounded-2xl border border-neutral-200 p-4", full && "col-span-2")}>
      <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
        {icon}
        {label}
      </div>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}
