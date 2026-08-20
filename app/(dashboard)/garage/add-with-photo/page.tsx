import Link from "next/link";
import { AiVehicleUploadForm } from "./upload-form";

export default function AddVehicleWithPhotoPage() {
  return (
    <main className="min-h-screen px-4 pt-6 pb-24 max-w-md mx-auto">
      <h1 className="text-xl font-bold">Tambah Motor dengan Foto</h1>
      <p className="text-slate-500 text-sm mb-6">
        Unggah foto motor kamu, AI akan mencoba menebak modelnya. Kamu tetap perlu konfirmasi sebelum disimpan.
      </p>

      <AiVehicleUploadForm />

      <p className="mt-6 text-sm text-slate-500 text-center">
        Lebih suka isi manual?{" "}
        <Link href="/garage/add" className="text-brand-600 font-medium">Tambah tanpa foto</Link>
      </p>
    </main>
  );
}
