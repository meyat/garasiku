import Link from "next/link";
import { getUserWorkshops } from "@/lib/services/workshop-service";
import { BottomNav } from "@/components/dashboard/bottom-nav";

export default async function WorkshopListPage() {
  const workshops = await getUserWorkshops();

  return (
    <main className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Mode Bengkel</h1>
      <p className="text-neutral-500 text-sm mb-6">
        Kelola bengkel, staf mekanik, inventory spare part, dan invoice pelanggan.
      </p>

      {workshops.length === 0 ? (
        <div className="text-center bg-white rounded-2xl border border-dashed border-neutral-300 p-8">
          <p className="text-neutral-500">Kamu belum tergabung di bengkel manapun.</p>
          <Link href="/workshop/new"
            className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium">
            Buat Bengkel
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workshops.map((w) => (
            <Link key={w.id} href={`/workshop/${w.id}`}
              className="block bg-white rounded-2xl border border-neutral-200 p-4">
              <p className="font-semibold">{w.name}</p>
              <p className="text-sm text-neutral-500">{w.address ?? "Alamat belum diisi"}</p>
              <span className="text-xs text-brand-600 font-medium capitalize">{w.role}</span>
            </Link>
          ))}
          <Link href="/workshop/new"
            className="block text-center text-sm text-brand-600 font-medium border border-dashed border-neutral-300 rounded-xl py-3">
            + Bengkel Baru
          </Link>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
