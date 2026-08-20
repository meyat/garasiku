import { notFound } from "next/navigation";
import { getWorkshopById } from "@/lib/services/workshop-service";
import { InvoiceForm } from "./invoice-form";
import { FormError } from "@/components/ui/form-field";

export default async function NewInvoicePage({
  params, searchParams,
}: { params: { workshopId: string }; searchParams: { error?: string } }) {
  const workshop = await getWorkshopById(params.workshopId);
  if (!workshop) notFound();

  return (
    <main className="min-h-screen px-5 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Buat Invoice</h1>
      <p className="text-slate-500 text-sm mb-6">{workshop.name}</p>

      <FormError message={searchParams?.error} />

      <InvoiceForm workshopId={workshop.id} />
    </main>
  );
}
