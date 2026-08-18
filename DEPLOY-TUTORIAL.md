# Tutorial Deploy GarasiKu (Tanpa Terminal)

Semua langkah di bawah bisa dikerjakan lewat browser — Supabase dashboard, GitHub web upload, dan Vercel dashboard. Gak perlu install apapun atau ketik perintah di terminal.

---

## Daftar Isi

1. [Setup Database (Supabase)](#bagian-1-setup-database-supabase)
2. [Upload Kode ke GitHub](#bagian-2-upload-kode-ke-github-tanpa-git)
3. [Deploy ke Vercel](#bagian-3-deploy-ke-vercel)
4. [Test & Jadi Admin](#bagian-4-test--jadi-admin)
5. [Pakai Sumopod sebagai Provider AI](#bagian-5-pakai-sumopod-sebagai-provider-ai)
6. [Troubleshooting](#troubleshooting-umum)

---

## Bagian 1: Setup Database (Supabase)

### 1.1 Buat akun & project Supabase

1. Buka [supabase.com](https://supabase.com) → **Sign Up** (bisa pakai akun GitHub)
2. Klik **New Project**
3. Isi:
   - Nama project: `garasiku`
   - Password database: buat yang kuat, **simpan baik-baik** (dipakai kalau nanti perlu akses langsung ke Postgres)
   - Region: pilih yang terdekat (misal Singapore)
4. Klik **Create new project**, tunggu ±2 menit sampai selesai provisioning

### 1.2 Jalankan migration SQL

Semua migration ada di folder `supabase/migrations/` dalam project. Jalankan **satu per satu, berurutan sesuai nomor** lewat SQL Editor bawaan Supabase:

1. Di sidebar kiri Supabase, klik **SQL Editor**
2. Klik **New Query**
3. Buka file migration di komputer kamu pakai text editor (Notepad, VS Code, dll), **copy semua isinya**
4. Paste ke SQL Editor, klik **Run** (atau `Ctrl+Enter`)
5. Ulangi untuk file berikutnya

Urutan wajib:

| # | File | Isi |
|---|---|---|
| 1 | `0001_phase1_schema.sql` | Skema utama: vehicles, master data, service records, fuel logs, dll |
| 2 | `0002_rls_policies.sql` | Row Level Security semua tabel Phase 1 |
| 3 | `0003_seed_example.sql` | Data contoh: Honda Vario 160 ABS 2024 |
| 4 | `0004_ai_analysis_records.sql` | Tabel log hasil AI |
| 5 | `0005_workshop_mode_schema.sql` | Skema workshop, staf, inventory, invoice |
| 6 | `0006_workshop_mode_rls.sql` | RLS untuk semua tabel workshop |
| 7 | `0007_workshops_public_read.sql` | Direktori bengkel bisa dicari publik |

> ⚠️ **Jangan diacak urutannya.** Migration nomor besar sering bergantung pada tabel yang dibuat di migration nomor kecil.

### 1.3 Ambil API keys

1. Sidebar kiri → **Project Settings** (ikon gear) → **API**
2. Catat 3 nilai ini (nanti dipakai di Vercel):

| Nama di Supabase | Dipakai sebagai env variable |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role key | `SUPABASE_SERVICE_ROLE_KEY` |

> 🔒 **service_role key itu rahasia.** Jangan pernah taruh di kode frontend atau share ke publik — key ini bisa bypass semua RLS.

---

## Bagian 2: Upload Kode ke GitHub (Tanpa Git)

### 2.1 Extract project

Klik kanan file zip project → **Extract All** / **Ekstrak**. Kamu akan dapat folder berisi `app/`, `lib/`, `package.json`, dll.

### 2.2 Buat repository

1. Buka [github.com](https://github.com) → Sign Up kalau belum punya akun
2. Klik **+** (pojok kanan atas) → **New repository**
3. Nama: `garasiku`, visibility: **Private**
4. Klik **Create repository**

### 2.3 Upload lewat browser

1. Di halaman repo kosong, klik link **uploading an existing file**
2. **Drag & drop seluruh folder** hasil extract ke area upload (browser modern support drag folder langsung)
   - Kalau drag folder gagal, buka foldernya, select semua file & subfolder (`Ctrl+A`), drag itu semua
3. Scroll ke bawah, klik **Commit changes**

> 💡 `node_modules` memang tidak ada di zip — Vercel akan install semua dependency otomatis saat build, kamu tidak perlu upload itu.

---

## Bagian 3: Deploy ke Vercel

### 3.1 Hubungkan ke GitHub

1. Buka [vercel.com](https://vercel.com) → Sign Up pakai akun GitHub yang sama
2. Klik **Add New** → **Project**
3. Cari repo `garasiku`, klik **Import**

### 3.2 Isi Environment Variables

**Sebelum klik Deploy**, di halaman konfigurasi ada bagian **Environment Variables**. Tambahkan semua ini:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key dari Supabase |
| `AI_PROVIDER` | `anthropic` (atau `sumopod`, lihat Bagian 5) |
| `AI_API_KEY` | API key provider AI kamu (opsional kalau belum mau pakai AI) |

### 3.3 Deploy

Klik **Deploy**. Vercel otomatis:
- `npm install` (install semua dependency)
- `npm run build` (build project Next.js)

Tunggu 2–4 menit sampai muncul halaman **Congratulations** dengan link live, contoh: `garasiku.vercel.app`.

---

## Bagian 4: Test & Jadi Admin

### 4.1 Coba alur dasar

1. Buka link Vercel kamu
2. **Daftar** akun baru, login
3. Coba **Tambah Motor**, **Catat Servis**, **Catat Bensin** — pastikan semua jalan tanpa error

### 4.2 Jadikan akun kamu admin

Ini satu-satunya langkah yang butuh SQL manual (masih lewat browser, di Supabase SQL Editor, bukan terminal):

1. Balik ke Supabase → **SQL Editor** → **New Query**
2. Cari User ID kamu:
   ```sql
   select id, email from auth.users;
   ```
3. Copy `id` akun kamu, lalu jalankan (ganti `<user-id>`):
   ```sql
   update profiles set role = 'admin' where id = '<user-id>';
   ```
4. Buka `namamu.vercel.app/admin` — sekarang bisa akses admin panel (kelola brand/model, komponen, interval servis)

---

## Bagian 5: Pakai Sumopod sebagai Provider AI

[Sumopod AI](https://ai.sumopod.com) adalah gateway Indonesia yang OpenAI-compatible, dengan banyak pilihan model (Claude, GPT, Gemini, dll) — bisa jadi alternatif lebih murah dibanding manggil Anthropic API langsung. GarasiKu sudah dibuat provider-agnostic, jadi ganti provider **tidak perlu ubah kode apapun**, cukup ganti environment variable.

### 5.1 Ambil API Key Sumopod

1. Buka [ai.sumopod.com](https://ai.sumopod.com), daftar/login
2. Ke tab **AI** → **API Keys** → **Create key**
3. Copy key-nya (format `sk-xxxx...`)

### 5.2 Update kode (kalau project sudah pernah di-deploy sebelumnya)

Kalau kamu deploy versi GarasiKu yang belum ada dukungan Sumopod, upload ulang 3 hal ini ke GitHub (replace file lama):
- Folder `lib/ai/` (berisi `provider.ts`, `anthropic-provider.ts`, `sumopod-provider.ts`, `index.ts`, `rate-limit.ts`)
- Folder `app/api/ai/` (3 route: `detect-vehicle`, `inspect-damage`, `suggest-maintenance`)

Cara upload replace di GitHub (tanpa git):
1. Di repo GitHub, masuk ke folder `lib/ai`
2. Hapus file-file lama satu-satu (klik file → ikon tempat sampah → Commit)
3. Klik **Add file** → **Upload files** di folder `lib/ai`, upload semua file baru dari zip
4. Ulangi untuk folder `app/api/ai`

### 5.3 Ganti Environment Variables di Vercel

1. Buka project di [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**
2. Ubah/tambah:

| Name | Value |
|---|---|
| `AI_PROVIDER` | `sumopod` |
| `AI_API_KEY` | key dari Sumopod (`sk-xxxx...`) |
| `AI_MODEL` | `claude-sonnet-4-6` (atau model lain dari katalog Sumopod, misal `gpt-4o`, `gemini-2.5-flash`) |

### 5.4 Redeploy

1. Tab **Deployments** → klik titik tiga (`⋯`) di deployment paling atas → **Redeploy**
2. Tunggu selesai — semua fitur AI (deteksi motor dari foto, cek kondisi eksterior, tanya keluhan) sekarang lewat Sumopod

---

---

## Bonus: Install GarasiKu sebagai App (PWA)

GarasiKu adalah PWA (Progressive Web App) — bisa dipasang ke HP/laptop seperti app biasa, tanpa lewat Play Store/App Store, dan bisa buka halaman dasar meski offline.

**Di Android (Chrome):**
1. Buka `namamu.vercel.app` di Chrome
2. Akan muncul banner "Pasang GarasiKu" di bawah layar — tap **Pasang**
3. Atau manual: titik tiga (⋮) di Chrome → **Add to Home screen** / **Install app**

**Di iPhone (Safari):**
1. Buka `namamu.vercel.app` di Safari
2. Tap ikon **Share** (kotak dengan panah ke atas)
3. Scroll, tap **Add to Home Screen**

**Di Desktop (Chrome/Edge):**
1. Buka `namamu.vercel.app`
2. Ikon install (biasanya di address bar sebelah kanan) → klik → **Install**

Setelah dipasang, GarasiKu muncul sebagai icon terpisah di homescreen/desktop, buka tanpa address bar browser (mode standalone), dan punya logo custom hijau bertema motor-di-garasi.

---

## Troubleshooting Umum

| Masalah | Solusi |
|---|---|
| Build gagal di Vercel | Klik ke log build untuk detail error. Paling sering karena env variable belum lengkap — cek Bagian 3.2 |
| Halaman blank / error 500 | Cek **Settings → Environment Variables** di Vercel, pastikan tidak ada typo atau spasi nyangkut di value |
| Migration error saat di-run | Biasanya urutan kebalik. Kalau mau reset total: jalankan `drop schema public cascade; create schema public;` di SQL Editor (⚠️ ini hapus SEMUA tabel), lalu jalankan ulang dari `0001` |
| Fitur AI error / tidak merespons | Cek `AI_API_KEY` sudah benar dan `AI_PROVIDER` sesuai (anthropic/sumopod). Kalau pakai Sumopod, cek juga `AI_MODEL` valid ada di katalog mereka |
| Tidak bisa akses `/admin` | Pastikan sudah jalankan update `profiles.role = 'admin'` di Bagian 4.2, dan sudah logout-login ulang |
| RLS error "permission denied" | Biasanya karena ada migration yang terlewat atau salah urutan. Cek lagi Bagian 1.2 |

---

*Kalau ada langkah yang macet atau muncul error, screenshot aja pesan errornya dan tanyakan — biasanya penyebabnya kecil (typo env variable, migration kelewat, dll).*
