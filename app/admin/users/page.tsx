import { getAllUsers } from "@/lib/services/admin-user-service";
import { createUserByAdmin, setUserRole, deleteUserByAdmin } from "@/lib/actions/admin-user-actions";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminUsersPage({
  searchParams,
}: { searchParams: { error?: string; created?: string; tempPassword?: string } }) {
  const { user: currentUser } = await requireAdmin();
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-1">Kelola User</h1>
        <p className="text-sm text-slate-400">
          Pendaftaran publik ditutup — hanya kamu yang bisa membuat akun baru dari sini.
        </p>
      </div>

      {searchParams?.error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2">
          {searchParams.error}
        </p>
      )}

      {searchParams?.created && searchParams?.tempPassword && (
        <div className="bg-success-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-sm font-bold text-emerald-800">
            Akun untuk <strong>{searchParams.created}</strong> berhasil dibuat.
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            Password sementara (catat sekarang, tidak akan ditampilkan lagi):
          </p>
          <div className="mt-2 flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-3 py-2 font-mono text-sm">
            {searchParams.tempPassword}
          </div>
          <p className="text-xs text-emerald-700 mt-2">
            Kirim email + password ini ke user secara manual. Minta mereka ganti password
            setelah login pertama kali.
          </p>
        </div>
      )}

      <form action={createUserByAdmin} className="bg-white border border-slate-100 shadow-card rounded-3xl p-4 space-y-3 max-w-md">
        <p className="font-bold text-sm text-slate-800">Buat User Baru</p>
        <input name="fullName" placeholder="Nama lengkap" required
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Email" required
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm" />
        <select name="role" className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
          <option value="user">User biasa</option>
          <option value="admin">Admin</option>
        </select>
        <button className="w-full rounded-2xl bg-brand-600 text-white py-2 text-sm font-bold">
          Buat Akun
        </button>
      </form>

      <div>
        <h2 className="font-bold text-sm text-slate-800 mb-2">Semua User ({users.length})</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-800">{u.full_name ?? "(tanpa nama)"}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <form action={setUserRole.bind(null, u.id, u.role === "admin" ? "user" : "admin")}>
                  <button
                    disabled={u.id === currentUser.id}
                    className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 disabled:opacity-40"
                    title={u.id === currentUser.id ? "Tidak bisa ubah role sendiri" : undefined}
                  >
                    {u.role === "admin" ? "Admin ✓" : "Jadikan Admin"}
                  </button>
                </form>
                {u.id !== currentUser.id && (
                  <form action={deleteUserByAdmin.bind(null, u.id)}>
                    <button className="text-xs text-rose-500 font-bold px-2 py-1">Hapus</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
