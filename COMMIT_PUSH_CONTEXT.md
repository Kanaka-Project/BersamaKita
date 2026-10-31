# Commit & Push Context — Bersama Kita

Dokumen ini merupakan konteks resmi untuk proses commit dan push ke repository GitHub
`Kanaka-Project/BersamaKita`. Baca dokumen ini sebelum melakukan perubahan, commit,
atau push.

## 1. Repository & Remote

- **Repository:** `BersamaKita`
- **Owner/Organization:** `Kanaka-Project`
- **Remote URL (origin):** `https://github.com/Kanaka-Project/BersamaKita`
- **Fetch:** `https://github.com/Kanaka-Project/BersamaKita`
- **Push:** `https://github.com/Kanaka-Project/BersamaKita`
- **Authentication:** melalui kredensial GitHub (HTTPS + credential manager / token).
  Jangan menyimpan token di repository atau file konfigurasi yang di-commit.

## 2. Identitas Git (wajib)

Semua commit HARUS menggunakan identitas berikut:

- **user.name:** `rezaaamaulana01`
- **user.email:** `wesrsmobile22@gmail.com`

Verifikasi sebelum commit:

```bash
git config user.name   # -> rezaaamaulana01
git config user.email  # -> wesrsmobile22@gmail.com
```

## 3. Branch Strategy

- **Branch utama (target push):** `main`
- **Branch yang DIABAIKAN:** `starter` (jangan commit/push/merge ke starter)
- Semua pekerjaan baru dilakukan di `main` (atau feature branch yang di-merge ke `main`).
- `origin/HEAD` mengarah ke `starter`; abaikan. Target default branch untuk push adalah `main`.
- Jangan hapus atau menulis ulang branch `starter`.

## 4. Status Dokumen Perencanaan (plan docs)

- Folder `plan docs/` berisi dokumen perencanaan yang sudah ada.
- **Jangan hapus** dokumen perencanaan yang sudah ada.
- Dalam proses pembuatan (implementasi) nanti, dokumen perencanaan akan **direcreate**
  (diperbarui/dibuat ulang) sesuai kebutuhan, tetapi versi awal tetap dipertahankan
  sebagai referensi historis.
- Semua dokumen yang ada (README, AGENTS, plan docs, dll.) harus **disesuaikan**
  dengan koneksi autentikasi dan konteks commit/push ini.

## 5. Folder Referensi (TIDAK boleh di-commit / di-push)

- **Path referensi (copy source):** `C:\Users\Rezaaaa\Pictures\hackaton-staging`
- Folder ini berisi implementasi acuan (React + Vite + Express, dll.) yang digunakan
  sebagai rujukan untuk menyalin file ke repository ini.
- **Folder ini TIDAK boleh di-commit atau di-push** ke repository BersamaKita.
- Jangan menambahkan folder `hackaton-staging` ke dalam tree repository.
- Gunakan folder tersebut hanya sebagai sumber copy; salin file yang diperlukan secara
  selektif ke struktur repository ini.
- Pastikan `.gitignore` mengecualikan `hackaton-staging/` (jika pernah disalin masuk),
  `node_modules/`, `dist/`, `.env`, `*.log`, dll.

## 6. Aturan Commit & Push

1. Selalu verifikasi identitas git sebelum commit (lihat bagian 2).
2. Commit hanya di branch `main` (atau feature branch -> main). Jangan menyentuh `starter`.
3. Pesan commit deskriptif (contoh: `feat: ...`, `docs: ...`, `chore: ...`).
4. Jangan commit secret, token, `.env`, `node_modules`, `dist`, log, atau folder referensi.
5. Jangan force-push tanpa otorisasi.
6. Jangan menulis ulang history tanpa persetujuan.
7. Push hanya ke `origin/main`.

Perintah standar:

```bash
git checkout main
git add -A
git commit -m "<pesan deskriptif>"
git push origin main
```

## 7. Checklist Sebelum Push

- [ ] Identitas git sesuai (`rezaaamaulana01` / `wesrsmobile22@gmail.com`).
- [ ] Berada di branch `main`.
- [ ] Tidak ada file dari `hackaton-staging/` yang ikut ter-commit.
- [ ] Tidak ada secret/token/`.env` yang ter-commit.
- [ ] Dokumen perencanaan tidak dihapus (hanya diperbarui jika perlu).
- [ ] Build/TypeScript (jika ada kode) lolos.
- [ ] Push ke `origin/main` berhasil.

## 8. Catatan

Dokumen ini adalah konteks operasional; bukan spesifikasi produk. Spesifikasi produk
tetap mengacu pada `AGENTS.md`, `README.md`, dan folder `plan docs/`.
