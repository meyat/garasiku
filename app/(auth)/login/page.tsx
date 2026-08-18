import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/login?error=Email dan password wajib diisi");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-brand-700 mb-1">GarasiKu</h1>
        <p className="text-neutral-500 mb-6">Masuk ke akun kamu</p>

        {searchParams?.error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {searchParams.error}
          </p>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input name="email" type="email" required
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <input name="password" type="password" required
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2" />
          </div>
          <button type="submit"
            className="w-full rounded-xl bg-brand-600 text-white py-2.5 font-medium">
            Masuk
          </button>
        </form>

        <p className="mt-6 text-sm text-neutral-500 text-center">
          Belum punya akun?{" "}
          <Link href="/register" className="text-brand-600 font-medium">Daftar</Link>
        </p>
      </div>
    </main>
  );
}
