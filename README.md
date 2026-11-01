# Bersama Kita

**Platform crowdfunding bencana alam untuk Indonesia** yang mengintegrasikan data gempa dari **BMKG** → verifikasi manual oleh Admin + penugasan **Mitra Lapangan** → penggalangan dana publik dengan pembayaran **QRIS** (Duitku Direct API) → penyaluran dana yang **transparan** ke publik.

> **Prinsip Inti**
>
> Data bencana dari BMKG tidak pernah dipublikasikan secara otomatis. Setiap bencana hanya muncul setelah Admin **menekan tombol APPROVE secara eksplisit** dan menetapkan Mitra Lapangan. Tidak ada auto‑approve, auto‑publish, maupun placeholder. (Lihat `docs/DISASTER.md`.)

---

## 1. Fitur Utama

| Fitur | Deskripsi |
|---|---|
| Manajemen Bencana | Integrasi data gempa BMKG dengan verifikasi manual Admin. |
| Persetujuan Manual | Bencana hanya dapat dipublikasikan setelah Admin melakukan **APPROVE** dan menetapkan Mitra Lapangan. |
| Donasi QRIS | Pembayaran donasi menggunakan Duitku Direct API. |
| Transaksi Transparan | Riwayat dana masuk dan agregasi donasi berdasarkan bencana. |
| Manajemen Mitra | Pengelolaan akun dan penugasan Mitra Lapangan oleh Admin. |
| Penyaluran Dana | Pencatatan distribusi, pencairan, dan laporan penyaluran dana. |
| Dokumentasi Bukti | Dokumentasi penyaluran berupa foto melalui Cloudinary. |
| Peta Indonesia | Peta SVG interaktif untuk visualisasi katalog bencana dan posko. |
| Audit Log | Pencatatan aktivitas operasional untuk mendukung akuntabilitas. |

## 2. Alur Sistem

### Verifikasi Bencana

1. Sistem mengambil data gempa dari BMKG.
2. Data masuk sebagai kandidat bencana.
3. Admin melakukan pemeriksaan dan verifikasi.
4. Admin menetapkan Mitra Lapangan.
5. Admin memberikan persetujuan eksplisit.
6. Bencana berubah menjadi `admin_approved` dan dapat dipublikasikan.

**Status utama:** `pending_verification` → `admin_approved`

Tidak diperbolehkan:
- Auto‑approve.
- Auto‑publish.
- Publikasi tanpa persetujuan Admin.
- Publikasi tanpa penetapan Mitra Lapangan.
- Menampilkan placeholder bencana yang belum diverifikasi.

Detail: `docs/DISASTER.md`

### Alur Donasi

1. Pengguna memilih bencana aktif.
2. Pengguna memasukkan nominal donasi.
3. Sistem menghitung biaya administrasi.
4. Backend membuat transaksi melalui Duitku Direct API.
5. Pengguna membayar melalui QRIS.
6. Duitku mengirimkan callback ke backend.
7. Backend memvalidasi signature **HMAC‑SHA256**.
8. Status pembayaran diperbarui secara idempoten.
9. Transaksi masuk ke sistem transparansi.

**Biaya administrasi platform:** 0,17 % (perhitungan terpusat di `src/lib/fees.ts`).

### Penyaluran Dana

1. Admin mengelola proses penyaluran.
2. Mitra Lapangan melaksanakan distribusi bantuan.
3. Bukti penyaluran diunggah melalui Cloudinary.
4. Laporan penyaluran dicatat dalam Firestore.
5. Informasi penyaluran dapat diakses publik sesuai aturan transparansi.

---

## 3. Teknologi yang Digunakan

| Layer | Teknologi |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, TailwindCSS v4, React Router 7 |
| Backend | Node.js 22, Express (modular: `server/app.ts` + `server/routes/`) |
| Autentikasi & DB | Firebase Auth (klien), Firestore, Firebase Admin SDK (server) |
| Pembayaran | Duitku Direct API – QRIS (`SP`) |
| Data Bencana | BMKG Open Data |
| Penyimpanan Gambar | Cloudinary |
| Deployment | Vercel (fungsi serverless `api/index.ts` + static `dist/`) |
| Version Control | Git & GitHub |

---

## 4. Arsitektur Proyek (Feature‑Driven)

### Struktur Frontend

```text
src/
├── components/            # Komponen UI bersama (layout, feedback, landing)
├── config/                # Konfigurasi Firebase client & admin
├── features/              # Modul fitur per domain
│   ├── auth/              # Login pengguna, konteks auth & role
│   ├── admin/             # Portal & otentikasi Admin
│   ├── partner/           # Auth & dashboard Mitra Lapangan
│   ├── disaster/          # Katalog BMKG, peta, verifikasi, analisis situasi
│   ├── donation/          # Donasi, checkout QRIS, status, riwayat
│   ├── distribution/      # Laporan penyaluran & transparansi
│   ├── finance/           # Admin transaksi, pencairan, setelan Duitku
│   ├── operations/        # Audit logs
│   └── public/            # Halaman statis (FAQ, kontak, kebijakan)
├── lib/                   # Utilitas bersama (fees, firestore-errors, utils)
├── services/              # Integrasi eksternal
│   ├── firebase/          # auth, firestore, seed
│   ├── bmkg.ts            # Proxy BMKG
│   ├── duitku.ts          # Layanan pembayaran Duitku
│   └── cloudinary.ts      # Upload signature + validasi gambar
├── types/                 # TypeScript types (sinkron dengan Firestore)
├── App.tsx                # Routing utama
└── main.tsx
```

### Struktur Backend

```text
server/
├── app.ts                 # Entry point Express + mount routes
├── routes/
│   ├── bmkg.ts            # Proxy BMKG (autogempa, gempaterkini)
│   ├── payments.ts        # create, callback, check‑status, simulate‑paid, expire‑sweep
│   ├── transparency.ts    # GET /summary
│   ├── admin.ts           # create‑partner, reset‑transactions
│   └── images.ts          # POST /sign (Cloudinary signed upload)
└── api/index.ts           # Vercel serverless entry (export `app`)
```

---

## 5. Instalasi & Pengembangan Lokal

### Prasyarat

- Node.js 22.x
- npm
- Proyek Firebase
- Akun Duitku
- Akun Cloudinary

### Instalasi

```bash
git clone <REPOSITORY_URL>
cd bersama-kita

cp .env.example .env   # isi semua nilai (lihat tabel di bawah)
npm install
npm run dev            # Express + Vite middleware → http://localhost:3005
```

### Skrip Lain

- `npm run build` – membangun front‑end ke folder `dist/`.
- `npm run start` – menjalankan server produksi lokal (`NODE_ENV=production tsx server/app.ts`).
- `npm run lint` – melakukan pemeriksaan tipe (`tsc --noEmit`).

---

## 6. Variabel Lingkungan (.env)

| Variabel | Prefix | Kegunaan |
|---|---|---|
| `VITE_FIREBASE_*` | Frontend | Konfigurasi Firebase JS SDK |
| `VITE_APP_URL` | Frontend | Base URL (dev: `http://localhost:3005`) |
| `PORT`, `APP_URL` | Backend | Port & base URL untuk callback/return Duitku |
| `DUITKU_MERCHANT_CODE`, `DUITKU_API_KEY` | Backend | Kredensial Duitku – **jangan pernah diekspos ke frontend** |
| `DUITKU_ENVIRONMENT` | Backend | `sandbox` (default) atau `production` |
| `ADMIN_SECRET_KEY` | Backend | Guard `POST /api/admin/reset-transactions` |
| `CRON_SECRET` | Backend | Guard `GET /api/payments/duitku/expire-sweep` (Vercel Cron) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Backend | Service account Firestore (Admin SDK), JSON satu baris |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Backend | Tanda tangan upload Cloudinary |

**Aturan Keamanan:** variabel backend **tanpa** prefix `VITE_` agar tidak bocor ke bundle React.

---

## 7. Deploy ke Vercel

- File `vercel.json` mengatur framework `vite`, output `dist/`, rewrite `/api/:path*` → fungsi serverless, serta cron **`GET /api/payments/duitku/expire-sweep`** setiap hari pukul 17:00 UTC.
- Deploy dengan perintah:

```bash
npm run build
npx vercel deploy --prod
```

Pastikan semua variabel lingkungan telah dikonfigurasi di proyek Vercel, termasuk `CRON_SECRET`.

---

## 8. Keamanan & Aturan Bisnis

| Aspek | Aturan Wajib |
|---|---|
| Autentikasi & Otorisasi | Firebase Authentication menangani login. Semua operasi sensitif memvalidasi ID token Firebase. Admin‑only endpoint harus memeriksa peran Admin. Mitra hanya dapat dibuat oleh Admin. |
| Keamanan Pembayaran | Kredensial Duitku tetap di sisi server. Callback harus memvalidasi signature HMAC‑SHA256. Proses pembayaran harus idempoten. Status pembayaran di client tidak dianggap final. |
| Keamanan Database | Aturan keamanan Firestore harus tetap ketat. Transparansi publik hanya melalui endpoint backend yang sudah diotorisasi. Jangan melemahkan aturan hanya untuk mengatasi error front‑end. |
| Verifikasi Bencana | Data BMKG hanya sebagai referensi, bukan publikasi otomatis. Persetujuan Admin wajib. Penetapan Mitra Lapangan wajib. Tidak ada auto‑publish. |

---

## 9. Dokumentasi Detail

Dokumentasi lengkap berada di folder `docs/`:

| Dokumen | Isi |
|---|---|
| `ARCHITECTURE.md` | Arsitektur sistem & diagram alur |
| `API.md` | Spesifikasi endpoint backend |
| `AUTH.md` | Autentikasi & otorisasi per peran |
| `DISASTER.md` | Alur verifikasi BMKG → ACTIVE (aturan bisnis) |
| `DATABASE.md` | Skema Firestore & aturan akses |
| `PAYMENT.md` | Integrasi Duitku QRIS + perhitungan fee |
| `PARTNER.md` | Manajemen Mitra Lapangan |
| `CONTRACT.md` | Kontrak teknis yang tidak boleh dilanggar |
| `TROUBLESHOOTING.md` | Log error & pembelajaran |
| `TASKS.md` | Status isu & rekomendasi |
| `NOW.md` | Snapshot status proyek terkini |
| `CHANGELOG.md` | Riwayat perubahan proyek |

---

## 10. Deklarasi Penggunaan AI

Selama pengembangan **Bersama Kita**, alat bantu AI digunakan untuk:
- Perencanaan arsitektur sistem
- Penulisan dan revisi kode front‑end & back‑end
- Penyusunan dokumentasi teknis termasuk README ini
- Debugging dan analisis error

AI berperan sebagai asisten pengembang; keputusan akhir, verifikasi keamanan, dan pengujian tetap dilakukan oleh tim manusia.

### Alat & Model AI yang Digunakan

| Alat | Model AI | Tanggung Jawab Utama |
|---|---|---|
| OpenCode | GPT‑6 Astra | Perencanaan arsitektur, analisis teknik, panduan engineering |
| OpenCode | GPT‑5.6 Luna | Eksplorasi arsitektur, review teknis, dukungan implementasi |
| Zed | Claude Sonnet 5.5 | Pengembangan UI/UX, implementasi komponen front‑end |

### Lingkup Bantuan AI
1. **Arsitektur Sistem** – perencanaan struktur, pemecahan modul, diagram alur.
2. **Frontend & UI/UX** – layout, komponen, desain responsif.
3. **Backend** – implementasi API, integrasi Firebase & layanan eksternal, workflow pembayaran.
4. **Dokumentasi** – penulisan README, API docs, panduan penggunaan.

### Tanggung Jawab Manusia
- Meninjau dan memvalidasi semua kode serta keputusan bisnis.
- Melakukan pengujian fungsional, keamanan, dan performa.
- Menjamin tidak ada kerentanan yang tertinggal.
- Menyelesaikan keputusan akhir terkait arsitektur, integrasi, dan rilis produk.

AI tidak secara otomatis memproses atau menyetujui bencana, mengotorisasi pembayaran, atau menentukan distribusi dana.

---

## 11. Deklarasi Layanan Pihak Ketiga

| Layanan | Tujuan | Integrasi |
|---|---|---|
| BMKG Open Data | Informasi gempa bumi | Proxy backend (`/api/bmkg`) |
| Firebase | Autentikasi & database | SDK klien & Admin SDK di server |
| Duitku | Pemrosesan pembayaran QRIS | Direct API + callback webhook |
| Cloudinary | Penyimpanan gambar bukti | Signed upload endpoint |
| Vercel | Hosting aplikasi & fungsi serverless | Deploy front‑end & backend |
| npm Packages | Dependensi pihak ketiga | Runtime & development |

### Tanggung Jawab Layanan Eksternal
- **BMKG**: menyediakan data gempa yang bersifat referensi; data harus diverifikasi Admin sebelum dipublikasikan.
- **Firebase**: mengelola autentikasi & penyimpanan; akses dikontrol oleh aturan keamanan Firestore.
- **Duitku**: memproses pembayaran QRIS; sistem memvalidasi signature callback sebelum mengubah status.
- **Cloudinary**: menyimpan bukti foto penyaluran; upload dilakukan lewat tanda tangan yang di‑generate server.
- **Vercel**: menyediakan infrastruktur hosting; fungsi serverless mengeksekusi API.

### Disclaimer Pihak Ketiga
- Integrasi dengan layanan ini tidak berarti endorsement resmi dari masing‑masing penyedia.
- BMKG, Firebase, Duitku, Cloudinary, dan Vercel tetap menjadi pemilik hak merek, API, dan layanan masing‑masing.
- Ketersediaan layanan, batasan API, harga, dan ketentuan penggunaan tergantung pada masing‑masing provider.

---

## 12. Batasan & Pengembangan Masa Depan

Beberapa peningkatan yang direncanakan:
- Dukungan data bencana selain gempa (banjir, tsunami, dsb.).
- Workflow verifikasi bencana yang lebih terotomatisasi namun tetap memerlukan persetujuan Admin.
- Monitoring aktivitas Mitra Lapangan yang lebih detail.
- Laporan keuangan publik yang lebih komprehensif.
- Optimasi performa & skalabilitas untuk beban tinggi.
- Pengujian integrasi otomatis.

---

## 13. Status Proyek

Bersama Kita terus dalam tahap pengembangan aktif. Status implementasi tiap fitur, keterbatasan yang diketahui, dan tugas yang belum selesai tercatat dalam:
- `docs/NOW.md`
- `docs/TASKS.md`
- `docs/CHANGELOG.md`

Lihat dokumen‑dokumen tersebut untuk pembaruan terbaru.

---

## 14. Lisensi & Penghargaan

Bersama Kita mengakui infrastruktur, penyedia data terbuka, alat pengembangan, dan dependensi perangkat lunak yang mendukung proyek.

Semua merek dagang dan hak kekayaan intelektual tetap menjadi milik pemiliknya masing‑masing.

**Lisensi:** Belum ditentukan.

---

**Bersama Kita**

*Bersama membantu, bersama menjaga transparansi.*