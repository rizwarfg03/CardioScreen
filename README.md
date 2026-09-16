# CardioScreen

Implementasi kode dari desain Stitch `stitch_ecg_monitor_pro` — sudah tersambung
frontend ↔ backend ↔ database, bukan HTML statis lagi.

- **Backend:** Node.js + Express + SQLite, JWT, bcrypt
- **Frontend:** React 18 + Vite + Tailwind (token warna & tipografi diambil dari `DESIGN.md`)
- **Alur inti:** pilih pasien → unggah berkas dari alat → sistem baca nilainya → perawat cek & konfirmasi → tersimpan di riwayat pasien

## Layar desain → halaman aplikasi

| Desain Stitch | Route | Isi |
|---|---|---|
| `halaman_login_desktop` | `/login` | Login NIK + password, tab peran Perawat/Dokter/Admin |
| `dashboard_perawat_desktop` | `/dashboard` | Statistik hari ini, kartu peringatan, tabel pemeriksaan terakhir |
| `upload_ecg_desktop` | `/upload` | Tiga langkah: pilih pasien → unggah berkas → baca hasil |
| `preview_hasil_ecg_desktop` | `/ecg/:id` | BPM, klasifikasi, gelombang, berkas asli, catatan, tombol konfirmasi |
| `riwayat_ecg_pasien_desktop` | `/patients/:id` | Linimasa pemeriksaan satu pasien + filter normal/abnormal |
| `maintenance_admin_dashboard_desktop` | `/admin` | Kesehatan sistem, kelola akun petugas, jejak aktivitas |
| — (tambahan) | `/patients` | Daftar & pendaftaran pasien; langkah "Select Patient" butuh ini |

## Cara menjalankan (localhost)

Butuh Node.js. **Disarankan Node 24 LTS** — versi itu punya SQLite bawaan, jadi
tidak ada modul native yang perlu dikompilasi sama sekali.

**Terminal 1 — backend**

```bash
cd backend
cp .env.example .env        # lalu ganti JWT_SECRET-nya
npm install
npm run seed                # buat database + akun & data contoh
npm run dev                 # http://localhost:4000
```

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Vite meneruskan semua `/api` ke `localhost:4000`, jadi tidak ada masalah CORS saat development.

### Akun contoh (dari `npm run seed`)

| Peran | NIK | Password |
|---|---|---|
| Perawat | `3578010101900001` | `perawat123` |
| Dokter | `3578010101850002` | `dokter123` |
| Admin | `3578010101800003` | `admin123` |

Ganti semua password ini sebelum dipakai di luar laptop sendiri.

Tidak ada halaman pendaftaran mandiri — sesuai desain login-nya. Akun petugas
dibuat admin lewat menu **Sistem & Admin → Tambah akun**, dan pasien didaftarkan
perawat lewat menu **Data Pasien → Tambah pasien**.

Kalau belum punya akun sama sekali atau password admin lupa, buat dari terminal:

```bash
cd backend
npm run create-user -- 3578010101910007 "Ns. Rina" nurse rahasia123
npm run create-user -- 3578010101800003 "Admin Posyandu" admin passwordbaru --reset
```

### Uji jalur otomatis

Dengan backend menyala, jalankan di terminal lain:

```bash
cd backend && npm run smoke
```

Skrip ini menembak API dari luar persis seperti pemakaian sebenarnya: login,
daftar pasien, unggah berkas, konfirmasi hasil, cek riwayat, buat PDF, lalu
memastikan token palsu dan akses lintas peran benar-benar ditolak. Hasilnya
berupa daftar OK/GAGAL per langkah.

### Mencoba alur unggah

`contoh/sinyal-uji-250hz.csv` adalah **sinyal sintetis untuk uji coba, bukan rekaman pasien**.
Login sebagai perawat → Rekam Baru → pilih pasien → unggah berkas itu. Sistem akan
menghitung ±78 BPM dari sinyal dan menggambar grafiknya di halaman preview.

## Kalau bermasalah saat dijalankan

**Crash `Assertion failed: (env) != nullptr`** dengan `Statement::'scalar deleting
destructor'` di jejaknya — itu `better-sqlite3` (modul C++) yang tidak cocok dengan
versi Node kamu. Pasang Node 24 LTS lalu ulangi; aplikasi otomatis memakai SQLite
bawaan Node dan modul native tadi tidak akan disentuh lagi.

`src/db/index.js` memilih driver sendiri:

| Driver | Kapan dipakai | Perlu kompilasi |
|---|---|---|
| `node:sqlite` | Node 24+, atau Node 22.5–23.3 dengan flag `--experimental-sqlite` | tidak |
| `better-sqlite3` | Node lawas yang belum punya SQLite bawaan | ya |

Paksa salah satunya lewat `DB_DRIVER=node` atau `DB_DRIVER=better-sqlite3` di `.env`.
`better-sqlite3` ada di `optionalDependencies`, jadi `npm install` tetap berhasil
meski modul itu gagal dibangun di komputermu.

**Database terlanjur rusak atau isinya kacau** — `npm run reset-db` menghapus
`data/cardiosync.db` lalu mengisi ulang data contoh.

## Cara berkas ECG dibaca

`backend/src/services/ecgParser.js` menangani dua format:

- **PDF laporan alat** — teksnya diekstrak, lalu BPM, klasifikasi, tanggal, dan durasi
  dicari dengan pola regex. Nama alat ikut dideteksi (Omron, AliveCor, Wellue).
- **CSV/TXT berisi sampel** — satu nilai mV per baris, atau `waktu,mV`. BPM dihitung
  dari jarak antar puncak R, dan sampelnya dipakai menggambar grafik.

Setiap hasil bacaan diberi label asal nilainya, dan label itu tampil di halaman preview:

| Label | Artinya |
|---|---|
| `device` | Tertulis langsung di laporan alat |
| `derived` | Dihitung sistem dari BPM atau dari sinyal — perlu dikonfirmasi petugas |
| `manual` | Diketik ulang oleh petugas |
| `unknown` | Tidak terbaca; petugas harus mengisi sendiri |

**Yang sengaja tidak dilakukan:** kalau berkas tidak memuat data sinyal numerik (mis. PDF
hasil pindai yang isinya gambar), halaman preview menampilkan berkas aslinya dan pesan
kosong — bukan gelombang tiruan. Grafik karangan di layar klinis berbahaya karena bisa
dikira hasil pengukuran betulan. Pembacaan otomatis juga tidak menggantikan penilaian
petugas: hasil baru masuk riwayat setelah ditekan "Konfirmasi & simpan".

### Ringkasan PDF

Tombol "Unduh PDF" di halaman preview dan ikon PDF di setiap baris riwayat
menghasilkan lembar A4 berisi identitas pasien, BPM, klasifikasi, gelombang
(kalau datanya ada), catatan petugas, dan ruang tanda tangan. Asal setiap nilai
ikut tercetak, dan ada catatan kaki bahwa lembar itu bukan diagnosis. Nama
fasilitas di kop diatur lewat `FACILITY_NAME` di `.env`.

Regex-nya perlu dicocokkan dengan format PDF alat yang kamu pakai. Cara paling cepat:
unggah satu PDF asli, lihat peringatan yang muncul di halaman preview, lalu sesuaikan
`BPM_PATTERNS` / `CLASSIFICATION_HINTS` di parser.

## Endpoint API

Semua endpoint (kecuali login) butuh header `Authorization: Bearer <token>`.

| Method | Endpoint | Peran | Fungsi |
|---|---|---|---|
| POST | `/api/auth/login` | publik | Login, balikan token + profil |
| GET | `/api/auth/me` | semua | Validasi sesi |
| POST | `/api/auth/logout` | semua | Catat logout |
| POST | `/api/auth/change-password` | semua | Ganti password sendiri |
| GET | `/api/dashboard/summary` | semua | Angka statistik, peringatan, pemeriksaan terakhir |
| GET | `/api/dashboard/trend?days=7` | semua | Jumlah pemeriksaan & abnormal per hari |
| GET | `/api/patients?q=` | semua | Cari pasien |
| POST | `/api/patients` | perawat, admin | Daftarkan pasien |
| GET | `/api/patients/:id` | semua | Detail + ringkasan pemeriksaan |
| PUT | `/api/patients/:id` | perawat, admin | Perbarui identitas |
| GET | `/api/patients/:id/records` | semua | Riwayat ECG pasien |
| POST | `/api/ecg/upload` | perawat, admin | Unggah berkas, dibaca, disimpan sebagai draft |
| GET | `/api/ecg?status=&abnormal=` | semua | Daftar pemeriksaan |
| GET | `/api/ecg/:id` | semua | Detail lengkap + sampel sinyal |
| GET | `/api/ecg/:id/file` | semua | Berkas asli (inline atau `?download=1`) |
| GET | `/api/ecg/:id/report` | semua | Ringkasan PDF siap cetak |
| PATCH | `/api/ecg/:id` | perawat, dokter, admin | Koreksi BPM/klasifikasi/catatan |
| POST | `/api/ecg/:id/confirm` | perawat, admin | Draft → tersimpan |
| POST | `/api/ecg/:id/review` | dokter, admin | Tandai sudah ditinjau |
| DELETE | `/api/ecg/:id` | admin | Hapus rekaman + berkasnya |
| GET | `/api/admin/health` | admin | Uptime, status DB, latensi, ukuran penyimpanan |
| GET | `/api/admin/logs` | admin | Jejak aktivitas |
| GET/POST | `/api/admin/users` | admin | Lihat & buat akun petugas |
| PATCH | `/api/admin/users/:id` | admin | Aktif/nonaktif, reset password |

## Struktur folder

```
cardiosync-pro/
├── backend/
│   ├── src/
│   │   ├── config/           konfigurasi terpusat (.env)
│   │   ├── db/               schema.sql, koneksi, seeder
│   │   ├── middleware/       auth JWT, upload multer, error handler
│   │   ├── routes/           auth, patients, ecg, dashboard, admin
│   │   ├── services/         pembaca berkas ECG, pencatat aktivitas
│   │   ├── app.js            perakitan Express
│   │   └── server.js         titik start
│   ├── data/                 file SQLite (dibuat otomatis)
│   └── uploads/              berkas asli dari alat
├── frontend/
│   ├── src/
│   │   ├── api/client.js     satu pintu ke backend, token otomatis
│   │   ├── context/          AuthContext (sesi login)
│   │   ├── components/       Sidebar, Topbar, StatCard, EcgWaveform, dll
│   │   ├── pages/            satu file per layar desain
│   │   └── utils/format.js   format tanggal & teks
│   └── tailwind.config.js    token warna/tipografi dari DESIGN.md
└── contoh/                   berkas uji coba
```

## Deploy dengan Docker (produksi)

`docker-compose.yml` butuh file `.env.production` di root — file ini **tidak**
ikut di-commit (sudah masuk `.gitignore`) karena isinya secret asli. Buat dari
template-nya lalu isi nilai sendiri:

```bash
cp .env.production.example .env.production
# generate dua string acak berbeda untuk JWT_SECRET dan PASSWORD_SALT:
openssl rand -hex 32
```

Isi `.env.production`: `FRONTEND_URL`/`CORS_ORIGIN` dengan domain asli,
`JWT_SECRET` dan `PASSWORD_SALT` dengan hasil `openssl rand -hex 32` (dua
nilai yang berbeda). Baru setelah itu jalankan `docker compose up -d --build`.

## Keamanan yang sudah terpasang

- Password disimpan sebagai hash bcrypt, tidak pernah dikirim balik ke klien
- JWT kedaluwarsa (default 8 jam); token basi otomatis melempar ke halaman login
- Percobaan login dibatasi 10 kali per 10 menit per IP
- Akses per peran dijaga di backend, bukan cuma disembunyikan di UI
- Unggahan dibatasi jenis (.pdf/.csv/.txt) dan ukuran (50MB), nama berkas di disk diacak
- Login gagal, unggahan, dan perubahan data tercatat di jejak aktivitas
- Helmet + whitelist CORS

Sebelum keluar dari localhost: isi `JWT_SECRET` dan `PASSWORD_SALT` sendiri di
`.env.production` (lihat bagian "Deploy dengan Docker" di atas), pasang HTTPS,
dan pindahkan folder `data/` + `uploads/` ke penyimpanan yang rutin dicadangkan.

## Kelanjutan yang mungkin

- **Aplikasi Flutter** — backend ini sudah siap dipakai; hilangkan proxy Vite, ganti
  `fetch('/api...')` dengan URL penuh, dan simpan token di secure storage.
- **Pindah ke MySQL/PostgreSQL** — semua query SQL terkumpul di folder `routes/`;
  yang perlu diganti hanya `db/index.js` dan sintaks `datetime('now')`.
- **Portal pasien** — tambah `'patient'` di CHECK constraint tabel `users`, satu tab
  di halaman login, dan rute yang hanya membaca data miliknya sendiri.
- **Grafik tren** — endpoint `/api/dashboard/trend` sudah ada tapi belum dipakai
  halaman mana pun; tinggal dipasang di dashboard sebagai grafik mingguan.
