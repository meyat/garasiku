import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopById } from "@/lib/services/workshop-service";
import { markInvoicePaid } from "@/lib/actions/workshop-actions";
import clsx from "clsx";

const STATUS_LABEL: Record<string, string> = { draft: "Draft", sent: "Terkirim", paid: "Lunas", void: "Batal" };
const STATUS_COLOR: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600", sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700", void: "bg-red-100 text-red-700",
};

export default async function InvoiceListPage({ params }: { params: { workshopId: string } }) {
  const workshop = await getWorkshopById(params.workshopId);
  if (!workshop) notFound();

  const supabase = createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("workshop_id", workshop.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Invoice — {workshop.name}</h1>
      </div>

      <Link href={`/workshop/${workshop.id}/invoices/new`}
        className="mt-4 block text-center text-sm font-medium rounded-xl bg-brand-600 text-white py-2.5">
        + Buat Invoice
      </Link>

      <div className="mt-4 space-y-2">
        {(invoices ?? []).map((inv: any) => (
          <div key={inv.id} className="bg-white border border-neutral-200 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">#{inv.invoice_number}</p>
                <p className="text-xs text-neutral-500">{inv.customer_name ?? "Tanpa nama"} · {new Date(inv.issued_date).toLocaleDateString("id-ID")}</p>
              </div>
              <span className={clsx("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_COLOR[inv.status])}>
                {STATUS_LABEL[inv.status]}
              </span>
            </div>
            <p className="text-lg font-bold mt-2">Rp{Math.round(inv.total).toLocaleString("id-ID")}</p>
            {inv.status !== "paid" && (
              <form action={markInvoicePaid.bind(null, inv.id, workshop.id)} className="mt-2">
                <button className="text-xs text-green-700 font-medium">Tandai Lunas</button>
              </form>
            )}
          </div>
        ))}
        {(!invoices || invoices.length === 0) && (
          <p className="text-sm text-neutral-400">Belum ada invoice.</p>
        )}
      </div>
    </main>
  );
}
