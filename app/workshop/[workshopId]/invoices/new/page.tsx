import { notFound } from "next/navigation";
import { getWorkshopById } from "@/lib/services/workshop-service";
import { InvoiceForm } from "./invoice-form";

export default async function NewInvoicePage({
  params, searchParams,
}: { params: { workshopId: string }; searchParams: { error?: string } }) {
  const workshop = await getWorkshopById(params.workshopId);
  if (!workshop) notFound();

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Buat Invoice</h1>
      <p className="text-neutral-500 text-sm mb-6">{workshop.name}</p>

      {searchParams?.error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <InvoiceForm workshopId={workshop.id} />
    </main>
  );
}
