import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVehicleById } from "@/lib/services/vehicle-service";
import { EXPENSE_CATEGORIES, CATEGORY_LABEL } from "@/lib/services/expense-service";
import { FormField, FormError } from "@/components/ui/form-field";

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
    <main className="min-h-screen px-5 pt-6 pb-28 max-w-md mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Catat Pengeluaran</h1>
      <p className="text-slate-400 text-sm mb-6">{vehicle.nickname}</p>

      <FormError message={searchParams?.error} />

      <form action={action} className="space-y-4">
        <div>
          <label className="text-sm font-bold text-slate-700">Kategori</label>
          <select name="category" required className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2.5">
            {EXPENSE_CATEGORIES.filter((c) => c !== "fuel" && c !== "service").map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">
            Bensin & servis otomatis tercatat lewat halaman "Catat Bensin" / "Catat Servis".
          </p>
        </div>
        <FormField label="Jumlah (Rp)" name="amount" type="number" required />
        <FormField label="Tanggal" name="expenseDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        <FormField label="Catatan (opsional)" name="description" />
        <button type="submit" className="w-full rounded-2xl bg-brand-600 text-white py-2.5 font-bold">
          Simpan
        </button>
      </form>
    </main>
  );
}
