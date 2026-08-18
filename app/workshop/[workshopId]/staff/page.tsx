import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkshopById } from "@/lib/services/workshop-service";
import { addWorkshopStaff } from "@/lib/actions/workshop-actions";

export default async function WorkshopStaffPage({
  params, searchParams,
}: { params: { workshopId: string }; searchParams: { error?: string } }) {
  const workshop = await getWorkshopById(params.workshopId);
  if (!workshop) notFound();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === workshop.owner_id;

  const { data: members } = await supabase
    .from("workshop_members")
    .select("id, role, user_id, profiles(full_name)")
    .eq("workshop_id", workshop.id);

  const action = addWorkshopStaff.bind(null, workshop.id);

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Staf — {workshop.name}</h1>

      {searchParams?.error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {(members ?? []).map((m: any) => (
          <div key={m.id} className="flex justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3">
            <span className="text-sm">{m.profiles?.full_name ?? m.user_id}</span>
            <span className="text-xs font-medium text-brand-600 capitalize">{m.role}</span>
          </div>
        ))}
        {(!members || members.length === 0) && (
          <p className="text-sm text-neutral-400">Hanya kamu sebagai owner. Belum ada staf lain.</p>
        )}
      </div>

      {isOwner && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Tambah Staf</h2>
          <p className="text-xs text-neutral-400 mb-2">
            Staf harus sudah punya akun GarasiKu (daftar dulu pakai email yang sama).
          </p>
          <form action={action} className="space-y-3">
            <input name="email" type="email" placeholder="Email staf" required
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <select name="role" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm">
              <option value="mechanic">Mekanik</option>
              <option value="staff">Staf</option>
            </select>
            <button className="w-full rounded-xl bg-brand-600 text-white py-2.5 text-sm font-medium">
              Tambah
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
