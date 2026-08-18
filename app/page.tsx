import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold text-brand-700">GarasiKu</h1>
      <p className="mt-2 text-neutral-500">Rawat. Catat. Berkendara.</p>
      <div className="mt-8">
        <Link href="/login" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium">
          Masuk
        </Link>
      </div>
    </main>
  );
}
