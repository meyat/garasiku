import Link from "next/link";
import { getUserWorkshops } from "@/lib/services/workshop-service";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { Plus } from "lucide-react";

export default async function WorkshopListPage() {
  const workshops = await getUserWorkshops();

  return (
    <main className="min-h-screen pb-28 px-5 pt-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Mode Bengkel</h1>
      <p className="text-slate-400 text-sm mb-6">
        Kelola bengkel, staf mekanik, inventory spare part, dan invoice pelanggan.
      </p>

      {workshops.length === 0 ? (
        <div className="text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <p className="text-slate-500">Kamu belum tergabung di bengkel manapun.</p>
          <Link href="/workshop/new"
            className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-brand-600 text-white font-bold">
            <Plus size={16} /> Buat Bengkel
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workshops.map((w) => (
            <Link key={w.id} href={`/workshop/${w.id}`}
              className="block bg-white rounded-3xl border border-slate-100 shadow-card p-4">
              <p className="font-bold text-slate-900">{w.name}</p>
              <p className="text-sm text-slate-400">{w.address ?? "Alamat belum diisi"}</p>
              <span className="text-xs text-brand-600 font-bold capitalize">{w.role}</span>
            </Link>
          ))}
          <Link href="/workshop/new"
            className="flex items-center justify-center gap-1.5 text-center text-sm text-brand-600 font-bold border border-dashed border-slate-300 rounded-3xl py-3">
            <Plus size={16} /> Bengkel Baru
          </Link>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
