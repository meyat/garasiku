import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const [{ count: brandCount }, { count: modelCount }, { count: variantCount }, { count: userCount }] =
    await Promise.all([
      supabase.from("vehicle_brands").select("*", { count: "exact", head: true }),
      supabase.from("vehicle_models").select("*", { count: "exact", head: true }),
      supabase.from("vehicle_variants").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Ringkasan Master Data</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Brand" value={brandCount ?? 0} />
        <Stat label="Model" value={modelCount ?? 0} />
        <Stat label="Varian" value={variantCount ?? 0} />
        <Stat label="Pengguna" value={userCount ?? 0} />
      </div>
      <p className="text-sm text-neutral-500 mt-6">
        Gunakan menu di atas untuk menambah brand/model/varian, komponen, dan mengatur compatibility
        serta interval servis. Semua data ini adalah source of truth untuk checklist perawatan —
        AI tidak pernah menimpa data di sini.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
