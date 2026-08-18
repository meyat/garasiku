"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createInvoice } from "@/lib/actions/workshop-actions";

interface Row {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function InvoiceForm({ workshopId }: { workshopId: string }) {
  const [rows, setRows] = useState<Row[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const action = createInvoice.bind(null, workshopId);

  const total = rows.reduce((sum, r) => sum + r.quantity * r.unitPrice, 0);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nomor Invoice</label>
        <input name="invoiceNumber" required placeholder="INV-001"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input name="customerName" placeholder="Nama pelanggan" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
        <input name="customerPhone" placeholder="No. HP" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Item</p>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input name="itemDescription" defaultValue={row.description} placeholder="Deskripsi" required
                className="flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm" />
              <input name="itemQuantity" type="number" defaultValue={row.quantity} min={1}
                className="w-16 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                onChange={(e) => {
                  const next = [...rows]; next[i]!.quantity = Number(e.target.value); setRows(next);
                }} />
              <input name="itemPrice" type="number" defaultValue={row.unitPrice} placeholder="Harga"
                className="w-24 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                onChange={(e) => {
                  const next = [...rows]; next[i]!.unitPrice = Number(e.target.value); setRows(next);
                }} />
              {rows.length > 1 && (
                <button type="button" onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="text-red-500">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setRows([...rows, { description: "", quantity: 1, unitPrice: 0 }])}
          className="mt-2 text-xs text-brand-600 font-medium flex items-center gap-1">
          <Plus size={12} /> Tambah Item
        </button>
      </div>

      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex justify-between">
        <span className="text-sm font-medium">Total</span>
        <span className="text-lg font-bold">Rp{Math.round(total).toLocaleString("id-ID")}</span>
      </div>

      <div>
        <label className="text-sm font-medium">Catatan (opsional)</label>
        <textarea name="notes" rows={2} className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
      </div>

      <button type="submit" className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
        Simpan Invoice
      </button>
    </form>
  );
}
