import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserVehicles } from "@/lib/services/vehicle-service";
import { getVehicleOverview } from "@/lib/services/vehicle-overview-service";
import { getActiveRemindersForUser, getRecentActivityForUser } from "@/lib/services/dashboard-service";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { VehicleCard } from "@/components/dashboard/vehicle-card";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { QuickActionCard } from "@/components/dashboard/quick-action-card";
import { HistoryItem } from "@/components/dashboard/history-item";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { Fuel, Wrench, Camera, MessageCircle, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const vehicles = await getUserVehicles();
  const reminders = await getActiveRemindersForUser();
  const activity = await getRecentActivityForUser(4);

  const fullName = user?.user_metadata?.full_name ?? "Sobat Motor";
  const primaryVehicle = vehicles[0] ?? null;
  const otherVehicles = vehicles.slice(1);

  const overview = primaryVehicle
    ? await getVehicleOverview(primaryVehicle.id, primaryVehicle.variant_id)
    : null;

  return (
    <main className="min-h-screen pb-28 px-5 max-w-md mx-auto">
      <DashboardHeader
        name={fullName}
        avatarSeed={user?.id ?? "garasiku"}
        hasNotifications={reminders.length > 0}
      />

      {vehicles.length === 0 ? (
        <div className="mt-4 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <p className="text-slate-500">Belum ada kendaraan di GarasiKu.</p>
          <Link href="/garage/add"
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-brand-600 text-white font-medium">
            <Plus size={16} /> Tambah Motor
          </Link>
        </div>
      ) : (
        <>
          {primaryVehicle && overview && (
            <div className="mt-2">
              <VehicleCard
                vehicleId={primaryVehicle.id}
                nickname={primaryVehicle.nickname}
                brandModel={`${primaryVehicle.model_name}${primaryVehicle.variant_name ? " " + primaryVehicle.variant_name : ""} • ${primaryVehicle.production_year ?? "-"}`}
                odometer={primaryVehicle.current_odometer}
                fuelEfficiencyLabel={overview.fuelEfficiencyLabel}
                nextServiceLabel={overview.nextServiceLabel}
                health={overview.health}
              />
            </div>
          )}

          {reminders.length > 0 && (
            <div className="mt-4 space-y-2">
              {reminders.slice(0, 2).map((r) => (
                <AlertBanner
                  key={r.id}
                  title={r.title}
                  description={`${r.vehicleName}${r.dueDate ? ` · ${new Date(r.dueDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}` : ""}${r.dueOdometer ? ` · ${r.dueOdometer.toLocaleString("id-ID")} km` : ""}`}
                  href="/history"
                />
              ))}
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Aksi Cepat</h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
              {primaryVehicle && (
                <>
                  <QuickActionCard href={`/garage/${primaryVehicle.id}/fuel/add`} icon={Fuel} label="Isi Bensin" />
                  <QuickActionCard href={`/garage/${primaryVehicle.id}/service/add`} icon={Wrench} label="Catat Servis" />
                  <QuickActionCard href={`/garage/${primaryVehicle.id}/inspect`} icon={Camera} label="Cek Kondisi" />
                  <QuickActionCard href={`/garage/${primaryVehicle.id}/ask-ai`} icon={MessageCircle} label="Tanya AI" />
                </>
              )}
              <QuickActionCard href="/garage/add" icon={Plus} label="Motor Baru" />
            </div>
          </div>

          {otherVehicles.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold text-slate-800 mb-3">Motor Lainnya</h2>
              <div className="space-y-3">
                {otherVehicles.map((v) => (
                  <Link key={v.id} href={`/garage/${v.id}`}
                    className="flex items-center justify-between bg-white rounded-3xl border border-slate-100 p-4">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{v.nickname}</p>
                      <p className="text-xs text-slate-400">
                        {v.brand_name} {v.model_name} · {v.current_odometer.toLocaleString("id-ID")} km
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800">Aktivitas Terbaru</h2>
              <Link href="/history" className="text-xs font-bold text-brand-600">Lihat Semua</Link>
            </div>
            {activity.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada aktivitas.</p>
            ) : (
              <div className="space-y-2">
                {activity.map((a, i) => (
                  <HistoryItem
                    key={i}
                    icon={a.icon}
                    title={a.label}
                    subtitle={`${a.vehicleName} · ${new Date(a.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}`}
                    amountLabel={a.detail}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Link href="/workshop" className="mt-8 block text-center text-sm text-slate-400 border-t border-slate-100 pt-4">
        🔧 Punya bengkel? Buka Mode Bengkel
      </Link>

      <BottomNav />
    </main>
  );
}
