import Link from "next/link";

export default function RegisterClosedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-brand-700 mb-1">GarasiKu</h1>
        <p className="mt-4 text-neutral-600">
          Pendaftaran akun baru ditutup untuk publik. Hubungi pemilik GarasiKu untuk dibuatkan akun.
        </p>
        <Link href="/login"
          className="mt-6 inline-block px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium">
          Kembali ke Halaman Masuk
        </Link>
      </div>
    </main>
  );
}
