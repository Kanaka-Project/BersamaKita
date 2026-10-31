# Architecture & Technology Decisions — Bersama Kita

Dokumen ringkas yang menjelaskan **mengapa** setiap pilihan teknologi dan arsitektur dibuat. Ditulis singkat, padat, dan bisa dibaca oleh siapa pun — teknis maupun non-teknis.

---

## 1. Apa Itu Bersama Kita?

Platform donasi bencana alam Indonesia yang menghubungkan tiga pihak:

| Peran | Tugas |
|---|---|
| **Donatur** | Melihat bencana yang sudah terverifikasi, berdonasi via QRIS, dan melacak penyaluran |
| **Admin** | Memverifikasi data bencana, menunjuk mitra lapangan, mengelola pencairan dana |
| **Mitra Lapangan** | Menerima dana, menyalurkan bantuan, dan melaporkan dengan bukti foto |

**Prinsip utama:** Tidak ada data bencana yang tampil ke publik sebelum Admin secara eksplisit menekan **APPROVE** dan menunjuk Mitra Lapangan.

---

## 2. Keputusan Teknologi

### Frontend — React + Vite + TypeScript
- **Mengapa:** Vite membuat waktu muat halaman sangat cepat. React memudahkan pembagian tampilan per fitur (donasi, bencana, admin, mitra). TypeScript mencegah kesalahan kode di awal.
- **Hasilnya:** Halaman ringan dan responsif di HP maupun desktop.

### Styling — TailwindCSS v4
- **Mengapa:** Tampilan konsisten tanpa perlu menulis file CSS terpisah yang rumit.
- **Hasilnya:** Desain bersih, modern, dan mudah disesuaikan.

### Backend — Express (Node.js)
- **Mengapa:** Frontend tidak boleh langsung menghubungi layanan luar (BMKG, Duitku). Backend menjadi satu-satunya pintu keluar yang aman.
- **Hasilnya:** Kunci API dan data sensitif tidak pernah terekspos ke browser pengguna.

### Database — Firebase Firestore
- **Mengapa:** Database cloud yang real-time, tanpa perlu kelola server database sendiri. Aturan keamanan bisa ditulis langsung per koleksi.
- **Hasilnya:** Data langsung tersimpan aman dan mudah diperbesar kapasitasnya.

### Autentikasi — Firebase Auth + Sesi Khusus Staff
- **Mengapa:** Pengguna umum cukup login dengan Google (praktis). Admin & Mitra memiliki sesi khusus sesuai perannya.
- **Hasilnya:** Setiap peran hanya bisa melihat dan melakukan sesuai haknya — donatur tidak bisa mengelola bencana, mitra tidak bisa mengelola keuangan.

### Pembayaran — Duitku (QRIS Saja)
- **Mengapa:** QRIS adalah metode pembayaran digital paling universal di Indonesia. Fokus satu metode agar alur stabil dan mudah dipelihara.
- **Hasilnya:** Donatur cukup scan QR dari aplikasi bank/e-wallet apa pun. Status pembayaran dicek otomatis dari server.

### Penyimpanan Foto — Cloudinary
- **Mengapa:** Foto bukti penyaluran butuh hosting yang aman dan terverifikasi. Upload menggunakan tanda tangan dari server.
- **Hasilnya:** Foto tidak bisa diunggah atau dipalsukan langsung dari browser.

### Deployment — Vercel
- **Mengapa:** Frontend dan backend bisa berjalan dalam satu layanan (Serverless Functions). Deploy otomatis setiap ada perubahan kode.
- **Hasilnya:** Biaya operasional rendah dan perawatan minimal.

---

## 3. Keputusan Arsitektur

### 3.1 Backend Sebagai Proxy, Bukan Akses Langsung
- Frontend **tidak pernah** bicara langsung ke BMKG atau Duitku — semua lewat endpoint `/api/*` di backend.
- **Alasan:** Melindungi kunci API dan menghindari blokir browser (CORS).

### 3.2 Data Bencana: BMKG + Verifikasi Manual Admin
- Data gempa diambil dari BMKG **hanya sebagai sumber data mentah**.
- Admin wajib meninjau, menunjuk Mitra Lapangan, lalu menekan APPROVE sebelum bencana tampil di publik.
- **Tidak ada auto-publish / auto-approve / timer 24 jam.**
- **Alasan:** Mencegah data mentah atau tidak valid tampil ke donatur.

### 3.3 Pemisahan Peran yang Tegas
- **Donatur:** hanya lihat bencana disetujui + donasi miliknya sendiri.
- **Admin:** verifikasi bencana, kelola mitra, pantau seluruh dana, buat pencairan.
- **Mitra:** terima alokasi dana, konfirmasi penerimaan, lapor penyaluran + bukti foto.
- Aturan ini ditegakkan **di dua lapis:** logika aplikasi (frontend/backend) DAN aturan database (Firestore Security Rules).

### 3.4 Pengelolaan Dana Kolektif (Server-Side)
- Seluruh progres donasi per bencana (dana terkumpul, jumlah donatur, target) dihitung **di server** — bukan di browser masing-masing.
- **Alasan:** Semua orang melihat angka yang sama, tidak peduli akun siapa yang login. Tidak ada risiko double-count atau inkonsistensi antar perangkat.

### 3.5 Biaya Admin Transparan (0,17%)
- Biaya admin sebesar 0,17% dibebankan **di atas** nominal donasi (bukan dipotong dari donasi).
- Dihitung di satu tempat (`src/lib/fees.ts`) dan dipakai oleh frontend maupun backend — satu sumber kebenaran.
- Ditampilkan jelas di halaman donasi, checkout, dan riwayat dana masuk.
- **Alasan:** Transparansi penuh — donatur tahu ke mana uangnya pergi.

### 3.6 Keamanan Berlapis
- **Aturan database ketat:** setiap koleksi diatur siapa boleh baca/tulis berdasarkan peran.
- **Kunci rahasia hanya di backend:** variabel sensitif tidak pernah masuk ke kode frontend.
- **Callback pembayaran divalidasi:** tanda tangan digital (HMAC-SHA256) + pengecekan duplikat (idempoten).
- **Akun mitra hanya bisa dibuat oleh admin** — tidak ada pendaftaran mandiri untuk mitra.

### 3.7 Transparansi Tanpa Mengorbankan Privasi
- Ringkasan dana publik disajikan lewat endpoint backend khusus (`/api/transparency/summary`, `/api/fundraising/summary`), **bukan** dengan melonggarkan aturan database.
- Donatur bisa lacak donasinya sendiri tanpa bisa mengintip data orang lain.
- Timeline penyaluran per bencana bersifat publik (tanpa data pribadi donatur) — semua donatur bencana yang sama melihat timeline yang sama.

### 3.8 Pencairan Dana Tervalidasi Server
- Admin membuat pencairan dana lewat backend. Saldo dihitung ulang dari data transaksi nyata di server — bukan dari angka yang ditampilkan di browser.
- Pencairan, alokasi mitra, catatan audit, dan event timeline ditulis dalam **satu transaksi atomik** (semua berhasil atau semua gagal).
- **Alasan:** Mencegah pencairan melebihi saldo dan memastikan integritas data keuangan.

### 3.9 Pembersihan Otomatis Transaksi Kedaluwarsa
- Vercel menjalankan cron job harian yang memeriksa transaksi pembayaran yang sudah melewati batas waktu dan menandainya sebagai kedaluwarsa.
- **Alasan:** Menjaga data tetap bersih tanpa intervensi manual.

### 3.10 Struktur Kode per Fitur (Feature-Driven)
- Kode frontend dibagi per domain bisnis: `auth`, `disaster`, `donation`, `partner`, `admin`, `distribution`, `finance`, `operations`.
- Backend dibagi per kelompok API: `bmkg`, `payments`, `transparency`, `admin`, `images`, `fundraising`.
- **Alasan:** Tim bisa mengerjakan fitur berbeda secara paralel tanpa saling mengganggu.

---

## 4. Yang Sengaja Tidak Dipilih

| Keputusan | Alasan |
|---|---|
| Tidak ada auto-publish bencana | Semua harus manual approve demi akurasi dan keamanan |
| Tidak ada banyak metode bayar | Fokus QRIS dulu agar alur sederhana dan andal |
| Tidak ada server database sendiri | Firebase agar tim fokus ke fitur, bukan maintenance infrastruktur |
| Tidak ada pendaftaran mitra mandiri | Mitra hanya bisa dibuat oleh admin untuk menjaga kepercayaan |
| Tidak ada data donatur di timeline publik | Timeline penyaluran tanpa PII — privasi donatur terjaga |

---

## 5. Alur Sistem Ringkas

```
BMKG (data gempa) → Backend proxy → Simpan ke database (pending)
                                        ↓
                              Admin verifikasi + tunjuk mitra
                                        ↓
                              Bencana tampil ke publik (approved)
                                        ↓
                    Donatur berdonasi → QRIS (Duitku) → Callback ke backend
                                        ↓
                    Admin buat pencairan → Mitra terima dana → Lapor penyaluran + foto
                                        ↓
                    Semua terlacak transparan di halaman publik
```

---

*Terakhir diperbarui: Oktober 2026.*
*Detail teknis lengkap ada di `docs/ARCHITECTURE.md`.*
