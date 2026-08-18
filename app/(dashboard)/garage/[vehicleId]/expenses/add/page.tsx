import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVehicleById } from "@/lib/services/vehicle-service";
import { EXPENSE_CATEGORIES, CATEGORY_LABEL } from "@/lib/services/expense-service";

async function addExpense(vehicleId: string, formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const category = String(formData.get("category") || "");
  const amount = Number(formData.get("amount") || 0);
  const expenseDate = String(formData.get("expenseDate") || new Date().toISOString().slice(0, 10));
  const description = String(formData.get("description") || "").trim() || null;

  if (!EXPENSE_CATEGORIES.includes(category as any) || Number.isNaN(amount) || amount <= 0) {
    redirect(`/garage/${vehicleId}/expenses/add?error=Lengkapi kategori dan jumlah dengan benar`);
  }

  const { error } = await supabase.from("expenses").insert({
    vehicle_id: vehicleId,
    owner_id: user!.id,
    category,
    amount,
    expense_date: expenseDate,
    description,
  });

  if (error) {
    redirect(`/garage/${vehicleId}/expenses/add?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/garage/${vehicleId}?tab=expenses`);
}

export default async function AddExpensePage({
  params, searchParams,
}: { params: { vehicleId: string }; searchParams: { error?: string } }) {
  const vehicle = await getVehicleById(params.vehicleId);
  if (!vehicle) notFound();

  const action = addExpense.bind(null, params.vehicleId);

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Catat Pengeluaran</h1>
      <p className="text-neutral-500 text-sm mb-6">{vehicle.nickname}</p>

      {searchParams?.error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Kategori</label>
          <select name="category" required className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2">
            {EXPENSE_CATEGORIES.filter((c) => c !== "fuel" && c !== "service").map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
          <p className="text-xs text-neutral-400 mt-1">
            Bensin & servis otomatis tercatat lewat halaman "Catat Bensin" / "Catat Servis".
          </p>
        </div>
        <div>
          <label className="text-sm font-medium">Jumlah (Rp)</label>
          <input name="amount" type="number" required className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Tanggal</label>
          <input name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Catatan (opsional)</label>
          <input name="description" className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <button type="submit" className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
          Simpan
        </button>
      </form>
    </main>
  );
}
