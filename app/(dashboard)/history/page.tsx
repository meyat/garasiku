import { getRecentActivityForUser } from "@/lib/services/dashboard-service";
import { HistoryItem } from "@/components/dashboard/history-item";
import { BottomNav } from "@/components/dashboard/bottom-nav";

export default async function HistoryPage() {
  const activity = await getRecentActivityForUser(50);

  return (
    <main className="min-h-screen pb-28 px-5 pt-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Riwayat</h1>
      <p className="text-slate-400 text-sm mb-6">Semua aktivitas dari seluruh kendaraan kamu.</p>

      {activity.length === 0 ? (
        <div className="text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <p className="text-slate-500">Belum ada aktivitas tercatat.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activity.map((a, i) => (
            <HistoryItem
              key={i}
              icon={a.icon}
              title={a.label}
              subtitle={`${a.vehicleName} · ${new Date(a.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`}
              amountLabel={a.detail}
            />
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
