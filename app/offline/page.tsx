export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
        <span className="text-3xl">📡</span>
      </div>
      <h1 className="text-xl font-bold text-brand-700">Kamu sedang offline</h1>
      <p className="mt-2 text-neutral-500 max-w-xs">
        GarasiKu butuh koneksi internet untuk memuat data kendaraan kamu. Coba lagi setelah
        tersambung ke internet.
      </p>
      <a href="/dashboard"
        className="mt-6 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium">
        Coba Lagi
      </a>
    </main>
  );
}
