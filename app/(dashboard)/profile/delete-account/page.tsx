import { createClient } from "@/lib/supabase/server";
import { getUserVehicles } from "@/lib/services/vehicle-service";
import { deleteAccount } from "@/lib/actions/account-actions";
import { AlertTriangle } from "lucide-react";

export default async function DeleteAccountPage({
  searchParams,
}: { searchParams: { error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const vehicles = await getUserVehicles();

  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-2 text-red-600 mb-1">
        <AlertTriangle size={20} />
        <h1 className="text-xl font-bold">Hapus Akun</h1>
      </div>
      <p className="text-neutral-500 text-sm mb-6">{user?.email}</p>

      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-medium text-red-800">Tindakan ini tidak bisa dibatalkan.</p>
        <p className="text-sm text-red-700">Menghapus akun akan menghapus permanen:</p>
        <ul className="text-sm text-red-700 list-disc list-inside space-y-0.5">
          <li>{vehicles.length} kendaraan yang terdaftar</li>
          <li>Semua riwayat servis dan spare part</li>
          <li>Semua catatan bensin dan efisiensi</li>
          <li>Semua catatan pengeluaran dan pengingat</li>
          <li>Akses ke bengkel manapun yang pernah diberi izin</li>
        </ul>
      </div>

      {searchParams?.error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {searchParams.error}
        </p>
      )}

      <form action={deleteAccount} className="mt-6 space-y-3">
        <div>
          <label className="text-sm font-medium">
            Ketik <span className="font-bold">HAPUS</span> untuk konfirmasi
          </label>
          <input name="confirmation" required placeholder="HAPUS"
            className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
        </div>
        <button type="submit"
          className="w-full rounded-xl bg-red-600 text-white py-2.5 font-medium">
          Hapus Akun Saya Permanen
        </button>
        <a href="/profile" className="block text-center text-sm text-neutral-500 py-2">
          Batal
        </a>
      </form>
    </main>
  );
}
