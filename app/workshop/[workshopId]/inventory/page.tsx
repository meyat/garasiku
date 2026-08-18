import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopById } from "@/lib/services/workshop-service";
import { addInventoryItem, adjustStock } from "@/lib/actions/workshop-actions";
import clsx from "clsx";

export default async function WorkshopInventoryPage({
  params, searchParams,
}: { params: { workshopId: string }; searchParams: { error?: string } }) {
  const workshop = await getWorkshopById(params.workshopId);
  if (!workshop) notFound();

  const supabase = createClient();
  const { data: items } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("workshop_id", workshop.id)
    .order("name");

  const addAction = addInventoryItem.bind(null, workshop.id);
  const adjustAction = adjustStock.bind(null, workshop.id);

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Inventory — {workshop.name}</h1>

      {searchParams?.error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {(items ?? []).map((i: any) => {
          const low = Number(i.quantity_on_hand) <= Number(i.reorder_threshold);
          return (
            <div key={i.id} className="bg-white border border-neutral-200 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{i.name}</p>
                  <p className="text-xs text-neutral-500">{i.sku ?? "-"} · Rp{Math.round(i.unit_price).toLocaleString("id-ID")}/{i.unit}</p>
                </div>
                <span className={clsx("text-sm font-bold", low ? "text-red-600" : "text-neutral-700")}>
                  {i.quantity_on_hand} {i.unit}
                </span>
              </div>
              <form action={adjustAction} className="mt-3 flex gap-2">
                <input type="hidden" name="itemId" value={i.id} />
                <input type="number" name="changeQty" placeholder="+/- jumlah" required
                  className="flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-xs" />
                <select name="reason" className="rounded-lg border border-neutral-300 px-2 py-1.5 text-xs">
                  <option value="purchase">Beli</option>
                  <option value="sale">Jual</option>
                  <option value="adjustment">Koreksi</option>
                  <option value="service_use">Dipakai Servis</option>
                </select>
                <button className="text-xs bg-neutral-800 text-white px-3 py-1.5 rounded-lg">Update</button>
              </form>
            </div>
          );
        })}
        {(!items || items.length === 0) && (
          <p className="text-sm text-neutral-400">Belum ada barang di inventory.</p>
        )}
      </div>

      <h2 className="font-semibold mt-6 mb-2">Tambah Barang</h2>
      <form action={addAction} className="space-y-3 bg-white border border-neutral-200 rounded-xl p-4">
        <input name="name" placeholder="Nama barang" required
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input name="sku" placeholder="SKU (opsional)" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <input name="unit" placeholder="Satuan (pcs/liter)" defaultValue="pcs" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="quantity" type="number" placeholder="Stok awal" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <input name="reorderThreshold" type="number" placeholder="Batas restock" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="unitCost" type="number" placeholder="Harga modal" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
          <input name="unitPrice" type="number" placeholder="Harga jual" className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
        </div>
        <button className="w-full rounded-lg bg-brand-600 text-white py-2 text-sm font-medium">Tambah Barang</button>
      </form>
    </main>
  );
}
