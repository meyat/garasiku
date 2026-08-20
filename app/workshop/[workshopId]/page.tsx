import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopById } from "@/lib/services/workshop-service";

export default async function WorkshopDashboardPage({ params }: { params: { workshopId: string } }) {
  const workshop = await getWorkshopById(params.workshopId);
  if (!workshop) notFound();

  const supabase = createClient();
  const [{ count: staffCount }, { count: itemCount }, { count: invoiceCount }, { data: lowStock }] =
    await Promise.all([
      supabase.from("workshop_members").select("*", { count: "exact", head: true }).eq("workshop_id", workshop.id),
      supabase.from("inventory_items").select("*", { count: "exact", head: true }).eq("workshop_id", workshop.id),
      supabase.from("invoices").select("*", { count: "exact", head: true }).eq("workshop_id", workshop.id),
      supabase
        .from("inventory_items")
        .select("id, name, quantity_on_hand, reorder_threshold")
        .eq("workshop_id", workshop.id)
        .order("quantity_on_hand", { ascending: true })
        .limit(5),
    ]);

  const lowStockItems = (lowStock ?? []).filter((i: any) => i.quantity_on_hand <= i.reorder_threshold);

  return (
    <main className="min-h-screen pb-28 px-5 pt-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-900">{workshop.name}</h1>
      <p className="text-slate-400 text-sm mb-6">{workshop.address ?? "Alamat belum diisi"}</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href={`/workshop/${workshop.id}/staff`} className="bg-white rounded-3xl border border-slate-100 shadow-card p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{staffCount ?? 0}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Staf</p>
        </Link>
        <Link href={`/workshop/${workshop.id}/inventory`} className="bg-white rounded-3xl border border-slate-100 shadow-card p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{itemCount ?? 0}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Barang</p>
        </Link>
        <Link href={`/workshop/${workshop.id}/invoices`} className="bg-white rounded-3xl border border-slate-100 shadow-card p-4 text-center">
          <p className="text-xl font-bold text-slate-900">{invoiceCount ?? 0}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Invoice</p>
        </Link>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-800 mb-2">⚠️ Stok Menipis</h2>
          <div className="space-y-2">
            {lowStockItems.map((i: any) => (
              <div key={i.id} className="flex justify-between bg-alert-50 border border-alert-100 rounded-2xl px-4 py-3">
                <span className="text-sm text-orange-900">{i.name}</span>
                <span className="text-sm font-bold text-orange-700">{i.quantity_on_hand} tersisa</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Link href={`/workshop/${workshop.id}/invoices/new`}
          className="block text-center text-sm font-bold rounded-2xl bg-brand-600 text-white py-2.5">
          + Buat Invoice
        </Link>
        <Link href={`/workshop/${workshop.id}/inventory`}
          className="block text-center text-sm font-bold rounded-2xl bg-white border border-slate-200 text-slate-700 py-2.5">
          Kelola Inventory
        </Link>
        <Link href={`/workshop/${workshop.id}/staff`}
          className="block text-center text-sm font-bold rounded-2xl bg-white border border-slate-200 text-slate-700 py-2.5">
          Kelola Staf
        </Link>
      </div>
    </main>
  );
}
