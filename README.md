# GarasiKu

**Rawat. Catat. Berkendara.**

Digital garage untuk mencatat perawatan, servis, dan konsumsi bahan bakar motor kamu.

## Status

**Phase 1 (Core MVP)** ✅
- Auth (register/login via Supabase Auth, email+password)
- Skema database lengkap + RLS policies
- Tambah kendaraan + riwayat odometer otomatis
- Dashboard + empty state
- Checklist servis otomatis dari `service_intervals` (deterministic)
- Seed data contoh: Honda Vario 160 ABS 2024

**Phase 2 (Expense, Reminders, Analytics, Health Score)** ✅
- Form catat isi bensin (auto-hitung harga/liter, validasi odometer)
- Form catat servis (pilih komponen dari compatibility DB, multi-item)
- Expense tracking (kategori, ringkasan bulanan, riwayat)
- Reminders (tambah, snooze, dismiss)
- Vehicle health score (deterministic, bukan random/AI)
- Grafik efisiensi BBM (recharts)
- Halaman detail kendaraan dengan tabs: Overview / Servis / Bensin / Biaya / Riwayat

**Phase 3 (AI)** ✅ (fondasi + UI dasar)
- `lib/ai/provider.ts`: interface `AIProvider` (provider-agnostic)
- `lib/ai/anthropic-provider.ts`: implementasi pakai Claude API (ganti file ini untuk provider lain)
- `/api/ai/detect-vehicle`: deteksi motor dari foto → cocokkan ke `vehicle_variants` → user wajib konfirmasi. Halaman: `/garage/add-with-photo`
- `/api/ai/inspect-damage`: cek kerusakan eksterior dari foto, dengan disclaimer eksplisit soal batas AI (gak bisa nilai kondisi internal). Halaman: `/garage/[id]/inspect`
- `/api/ai/suggest-maintenance`: saran area pemeriksaan dari deskripsi gejala, dikombinasi dengan konteks kendaraan (odometer, riwayat servis). Halaman: `/garage/[id]/ask-ai`
- Semua AI call: rate-limited per user, tervalidasi tipe/ukuran file, hasil disimpan di `ai_analysis_records` sebagai log (bukan source of truth)

**Admin Panel** ✅ (dasar)
- `/admin` — ringkasan jumlah brand/model/varian/user, dengan guard role-based (`requireAdmin()`)
- `/admin/brands` — tambah brand, model, varian (termasuk tahun & spesifikasi dasar) tanpa ubah kode
- `/admin/components` — tambah komponen per kategori
- `/admin/intervals` — atur compatibility (checkbox) dan interval servis (km/bulan/inspect-only) per varian — ini source of truth utama checklist

**Phase 4 (Workshop Mode)** ✅ (fondasi + UI dasar)
- Skema multi-tenant baru: `workshops`, `workshop_members` (role: owner/mechanic/staff), `vehicle_workshop_access` (grant eksplisit dari pemilik motor ke bengkel — tanpa ini, staf bengkel nol akses ke data motor orang lain), `inventory_items` + `inventory_movements` (stok auto-update via trigger), `invoices` + `invoice_items`.
- RLS multi-tenant: helper `is_workshop_member()` dan `has_vehicle_access()`. **Perhatian khusus**: kebijakan `workshop_members` sengaja tidak memanggil `is_workshop_member()` untuk menghindari infinite recursion (dijelaskan di komentar migration `0006`).
- `/workshop` — daftar bengkel milik/tempat kerja user
- `/workshop/new` — buat bengkel baru (otomatis jadi owner)
- `/workshop/[id]` — dashboard: jumlah staf/barang/invoice, alert stok menipis
- `/workshop/[id]/staff` — kelola staf (tambah by User ID — invite by email belum ada)
- `/workshop/[id]/inventory` — tambah barang, update stok manual (in/out dengan alasan)
- `/workshop/[id]/invoices`, `/workshop/[id]/invoices/new` — buat & lihat invoice dengan multi-item, tandai lunas

**Belum ada di Phase 4:** akun mekanik terpisah dari akun customer (saat ini staf = user GarasiKu biasa yang di-assign ke workshop_members), dukungan mobil (`vehicle_type` di `vehicle_models` sudah menyiapkan ini, belum ada UI/logic tambahan).

**Update terbaru — jembatan customer ↔ bengkel sudah lengkap:**
- `/garage/[id]/access` — pemilik motor bisa cari bengkel (direktori publik nama/alamat), beri akses, dan cabut akses kapan saja. Tanpa grant ini, bengkel nol akses ke data motor (RLS-enforced).
- Tambahan RLS: `workshops_public_read` (migration `0007`) — bengkel jadi seperti direktori bisnis publik (nama/alamat/telepon saja) supaya bisa dicari, tapi data internal (staf, inventory, invoice) tetap privat ke `workshop_members`.
- Invite staf sekarang pakai **email**, bukan User ID manual — dicari lewat Supabase Admin API (`lib/supabase/server.ts` → `createAdminClient()`), staf harus sudah punya akun GarasiKu terlebih dulu.

**PWA (Progressive Web App)** ✅
- `public/manifest.json` — nama, ikon, theme color, shortcuts ("Tambah Motor", "Lihat Garasi")
- `public/sw.js` — service worker: network-first untuk halaman (data selalu fresh dari Supabase), cache-first untuk aset statis (ikon), fallback ke `/offline` kalau tidak ada internet. API routes (`/api/*`) sengaja tidak di-cache.
- `public/icons/` — logo custom (motor di bawah atap garasi, digambar manual pakai SVG, bukan generated image) di semua ukuran yang dibutuhkan (192, 512, maskable, apple-touch-icon, favicon)
- `components/install-prompt.tsx` — banner "Pasang GarasiKu" muncul otomatis di Chrome/Android saat PWA installable
- Lihat `DEPLOY-TUTORIAL.md` di root project untuk cara install ke homescreen (Android/iPhone/Desktop)

## Ganti Provider AI ke Sumopod

GarasiKu sudah support [Sumopod AI](https://ai.sumopod.com) (gateway Indonesia, OpenAI-compatible, banyak model termasuk Claude/GPT/Gemini) sebagai alternatif provider AI selain Anthropic langsung. Tinggal ganti env variable, tidak perlu ubah kode:
```
AI_PROVIDER=sumopod
AI_API_KEY=sk-xxxx          # dari ai.sumopod.com → AI tab → API Keys → Create key
AI_MODEL=claude-sonnet-4-6  # opsional, model apapun dari katalog Sumopod
```
Implementasinya di `lib/ai/sumopod-provider.ts`, dipilih otomatis lewat factory `lib/ai/index.ts` berdasarkan `AI_PROVIDER`. Semua endpoint AI (`/api/ai/detect-vehicle`, `/api/ai/inspect-damage`, `/api/ai/suggest-maintenance`) otomatis pakai provider yang aktif — tidak ada kode lain yang perlu disentuh.

## Setup

1. Buat project baru di [supabase.com](https://supabase.com).
2. Copy `.env.example` ke `.env.local`, isi dengan URL & anon key project kamu (Settings → API).
   **Jangan pernah** commit `SUPABASE_SERVICE_ROLE_KEY` ke client-side code.
3. Jalankan migration secara berurutan lewat Supabase SQL editor atau Supabase CLI:
   ```bash
   supabase db push
   # atau jalankan manual satu-satu:
   # 0001_phase1_schema.sql
   # 0002_rls_policies.sql
   # 0003_seed_example.sql (opsional, data contoh)
   ```
4. Install dependencies & jalankan:
   ```bash
   npm install
   npm run dev
   ```
5. Buka `http://localhost:3000`, daftar akun, lalu tambah motor lewat "Tambah Motor". Untuk checklist otomatis muncul, kendaraan perlu dihubungkan ke `variant_id` yang cocok dengan seed data (Honda Vario 160 ABS) — fitur pencocokan otomatis (search-to-variant) adalah task lanjutan.
6. Untuk akses **Admin Panel** (`/admin`), jadikan akun kamu admin lewat SQL editor Supabase:
   ```sql
   update profiles set role = 'admin' where id = '<user-id-kamu>';
   ```
   (Sengaja tidak ada tombol "jadi admin" di UI — promosi admin harus lewat akses langsung ke database untuk keamanan.)
7. Untuk fitur AI (`/garage/add-with-photo`, cek kondisi, tanya keluhan), isi `AI_API_KEY` di `.env.local`.

## Arsitektur Singkat

- **AI tidak pernah jadi source of truth.** Compatibility komponen & interval servis 100% dari tabel `vehicle_component_compatibility` dan `service_intervals`. AI (Phase 3) hanya membantu identifikasi kendaraan/analisis foto sebagai *suggestion*, wajib dikonfirmasi user.
- **Odometer** disimpan sebagai riwayat (`odometer_logs`), bukan hanya overwrite. Trigger DB otomatis update `vehicles.current_odometer` saat entri baru ≥ nilai lama, atau saat ditandai sebagai koreksi eksplisit.
- **Efisiensi BBM** hanya dihitung dari full-tank ke full-tank berikutnya (`lib/calculations/fuel-efficiency.ts`). Isi bensin parsial tetap tercatat sebagai expense.
- **Status servis** (`lib/calculations/service-status.ts`) murni deterministic dari data DB — tidak ada angka acak atau AI-generated percentage.
- **RLS**: semua tabel milik user (`vehicles`, `fuel_logs`, `service_records`, dst.) hanya bisa diakses oleh `owner_id = auth.uid()`. Master data (brand/model/component/interval) readable oleh semua authenticated user, writable hanya oleh admin (`profiles.role = 'admin'`).

## Catatan Arsitektur Penting: Client/Server Boundary

GarasiKu pakai Next.js App Router — file `lib/supabase/server.ts`, semua `lib/services/*.ts`, dan `lib/auth/*.ts` **hanya boleh dipakai di Server Component/Server Action**, gak boleh diimport langsung dari file `"use client"`. Semua file itu sekarang dikasih `import "server-only"` di baris pertama biar kalau ada yang salah import, build langsung gagal dengan pesan error yang jelas (nunjuk file mana), bukan error umum yang membingungkan.

**Kalau nemu error build kayak:**
```
You're importing a component that needs next/headers...
```
atau
```
You're importing a 'server-only' file into a Client Component...
```
Itu tandanya ada file `"use client"` yang (langsung atau gak langsung) import dari `lib/supabase/`, `lib/services/`, atau `lib/auth/`. Solusinya: pisahkan konstanta/tipe yang dibutuhkan client ke file terpisah tanpa dependency server (lihat pola di `lib/constants/reminder.ts`), lalu import dari situ.

## Roadmap

**Phase 1 (ini)** — Auth, vehicle mgmt, odometer, component DB, compatibility, service interval, checklist, basic dashboard.

**Phase 2** — Form input service record & fuel log, expense tracking, reminders, vehicle health score, fuel analytics charts.

**Phase 3** — AI motorcycle detection dari foto, AI damage inspection (exterior only, dengan disclaimer jelas), AI maintenance assistant berbasis gejala.

**Phase 4** — Workshop mode, akun mekanik, inventory spare part, invoice, dukungan mobil.

## Keamanan

- Service role key & AI API key hanya dipakai di server (`lib/supabase/server.ts` → `createAdminClient()`), tidak pernah di-bundle ke client.
- Semua form pakai Next.js Server Actions (`"use server"`), validasi input dilakukan di server sebelum insert ke DB.
- RLS aktif di semua tabel sejak migration pertama — tidak ada tabel yang "dibuka" nanti.
