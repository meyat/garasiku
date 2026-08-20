import { createWorkshop } from "@/lib/actions/workshop-actions";
import { FormField, FormError } from "@/components/ui/form-field";

export default function NewWorkshopPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen px-5 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Buat Bengkel</h1>
      <p className="text-slate-400 text-sm mb-6">Kamu akan jadi pemilik (owner) bengkel ini.</p>

      <FormError message={searchParams?.error} />

      <form action={createWorkshop} className="space-y-4">
        <FormField label="Nama Bengkel" name="name" required />
        <FormField label="Alamat (opsional)" name="address" />
        <FormField label="Telepon (opsional)" name="phone" />
        <button type="submit" className="w-full rounded-2xl bg-brand-600 text-white py-2.5 font-bold">
          Buat Bengkel
        </button>
      </form>
    </main>
  );
}
