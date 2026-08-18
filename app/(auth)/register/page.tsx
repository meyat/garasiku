import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function register(formData: FormData) {
  "use server";
  const fullName = String(formData.get("fullName") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!fullName || !email || password.length < 8) {
    redirect("/register?error=Isi semua field, password minimal 8 karakter");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/login?error=Cek email kamu untuk konfirmasi akun");
}

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-brand-700 mb-1">GarasiKu</h1>
        <p className="text-neutral-500 mb-6">Buat akun baru</p>

        {searchParams?.error && (
          <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {searchParams.error}
          </p>
        )}

        <form action={register} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nama Lengkap</label>
            <input name="fullName" type="text" required
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input name="email" type="email" required
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input name="password" type="password" required minLength={8}
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
          </div>
          <button type="submit"
            className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
            Daftar
          </button>
        </form>

        <p className="mt-6 text-sm text-neutral-500 text-center">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-brand-600 font-medium">Masuk</Link>
        </p>
      </div>
    </main>
  );
}
