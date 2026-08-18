import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut, updateProfile } from "@/lib/actions/account-actions";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { LogOut, ShieldCheck, Trash2 } from "lucide-react";

export default async function ProfilePage({
  searchParams,
}: { searchParams: { error?: string; success?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  return (
    <main className="min-h-screen pb-24 px-4 pt-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Profil</h1>

      {searchParams?.error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}
      {searchParams?.success && (
        <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {searchParams.success}
        </p>
      )}

      <form action={updateProfile} className="mt-4 space-y-4 bg-white border border-neutral-200 rounded-2xl p-4">
        <div>
          <label className="text-sm font-medium">Nama Lengkap</label>
          <input name="fullName" defaultValue={profile?.full_name ?? ""} required
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input value={user?.email ?? ""} disabled
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-500" />
        </div>
        <button type="submit" className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
          Simpan Perubahan
        </button>
      </form>

      {profile?.role === "admin" && (
        <Link href="/admin"
          className="mt-4 flex items-center gap-2 bg-white border border-neutral-200 rounded-2xl p-4 text-sm font-medium">
          <ShieldCheck size={18} className="text-brand-600" />
          Buka Admin Panel
        </Link>
      )}

      <Link href="/workshop"
        className="mt-3 block text-center text-sm font-medium rounded-xl bg-white border border-neutral-200 py-2.5">
        🔧 Mode Bengkel
      </Link>

      <form action={signOut} className="mt-6">
        <button type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-700">
          <LogOut size={16} />
          Keluar
        </button>
      </form>

      <Link href="/profile/delete-account"
        className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-red-600 py-2.5">
        <Trash2 size={16} />
        Hapus Akun
      </Link>

      <BottomNav />
    </main>
  );
}
