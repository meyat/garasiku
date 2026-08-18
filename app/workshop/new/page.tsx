import { createWorkshop } from "@/lib/actions/workshop-actions";

export default function NewWorkshopPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Buat Bengkel</h1>
      <p className="text-neutral-500 text-sm mb-6">Kamu akan jadi pemilik (owner) bengkel ini.</p>

      {searchParams?.error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <form action={createWorkshop} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Nama Bengkel</label>
          <input name="name" required className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Alamat (opsional)</label>
          <input name="address" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Telepon (opsional)</label>
          <input name="phone" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <button type="submit" className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
          Buat Bengkel
        </button>
      </form>
    </main>
  );
}
