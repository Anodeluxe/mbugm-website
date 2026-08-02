# Product

## Register

brand

## Users

Mahasiswa UGM yang mendaftar sebagai calon anggota MBUGM, serta panitia yang memeriksa berkas, jadwal penempatan, dan status sinkronisasi pendaftar.

## Product Purpose

Menyampaikan identitas MBUGM, memandu pendaftaran dengan jelas di perangkat mobile, dan memberi panitia data operasional yang lengkap serta mudah dipindai.

## Brand Personality

Berwibawa, hangat, dan disiplin. Pengalaman harus terasa seperti organisasi kampus bersejarah yang tetap dekat dengan anggotanya.

## Anti-references

Hindari tampilan SaaS generik, dekorasi yang terasa dibuat AI, bahasa korporat yang dingin, kartu berulang tanpa fungsi, serta interaksi yang menghambat tugas utama.

## Design Principles

- Utamakan kejelasan tugas daripada dekorasi.
- Landing membangun kebanggaan, form dan dashboard menjaga ketenangan.
- Informasi penting harus terbaca cepat di desktop dan mobile.
- Gunakan pola antarmuka yang familier dan konsisten.
- Setiap status harus jujur terhadap keadaan data sebenarnya.

## Accessibility & Inclusion

Targetkan WCAG AA, navigasi keyboard, fokus yang terlihat, kontras teks yang aman, reduced motion, dan penggunaan nyaman di layar ponsel.

## Operational Rules

Bagian ini mencatat perilaku yang harus tetap konsisten ketika aplikasi
diubah. Kode dan database tetap menjadi sumber nilai teknis yang dijalankan.

### Sumber kebenaran

| Aturan | Sumber |
|---|---|
| Tahun, biaya, dan periode pendaftaran | `src/lib/config.ts` |
| Jadwal dan kapasitas sesi | Tabel `sessions` dan migration `drizzle/` |
| Batas serta format input | `src/lib/applicant-rules.ts` |
| Validasi server | `src/server/validation/applicant.ts` |
| Email admin | `ADMIN_ALLOWED_EMAILS` |

### Pendaftaran

- Biaya pendaftaran saat ini Rp10.000.
- Pendaftaran hanya diterima di dalam periode yang ditentukan pada server.
- Satu NIM hanya boleh memiliki satu pendaftaran.
- Submission token membuat pengiriman ulang aman dan tidak membuat pendaftar
  ganda.
- Setiap sesi memiliki kapasitas maksimal 40 peserta.
- Kapasitas dijaga secara atomik oleh database agar tidak terlewati ketika
  banyak pengguna mengirim formulir bersamaan.
- Dokumen wajib terdiri dari pas foto, foto KTM, dan bukti pembayaran.
- Unggahan wajib JPG atau PNG dengan ukuran sumber maksimal 7 MB per file.
- Gambar diproses ulang oleh server sebelum disimpan.
- Draf tersimpan di perangkat pengguna sampai dihapus atau pendaftaran berhasil.
  Draf tidak memiliki kedaluwarsa otomatis.

### Keberhasilan pengiriman

Pengguna hanya menerima status berhasil setelah:

1. data utama tersimpan di database;
2. tiga dokumen wajib tersimpan di Google Drive;
3. PDF rangkuman tersimpan di Google Drive;
4. data masuk ke Google Sheets.

Jika sinkronisasi belum lengkap, pengguna diminta mengirim ulang dengan
submission token yang sama. Proses ulang hanya melanjutkan bagian yang belum
selesai.

### Placement test

- Jadwal sesi berasal dari database, bukan gambar jadwal di folder `public`.
- Hari kerja dan akhir pekan dapat memiliki jam sesi pertama yang berbeda.
- Format ringkasan sesi harus memuat hari, nomor sesi, dan jam.
- Admin, PDF, serta Google Sheets harus menampilkan pilihan sesi yang sama.
- Halaman admin menampilkan jumlah terisi dibanding kapasitas sesi.

### Admin

- Login menggunakan Google OAuth.
- Email harus berada di `ADMIN_ALLOWED_EMAILS`.
- `/admin` dan endpoint PDF wajib menolak pengguna tanpa sesi.
- Admin yang sudah login dan membuka `/login` diarahkan kembali ke `/admin`.

### Data dan privasi

- File pendaftar tidak boleh ditempatkan di folder `public`.
- Folder Drive dan Google Sheet hanya dibagikan kepada pihak yang membutuhkan.
- Secret, private key, database URL, dan kredensial OAuth tidak boleh masuk Git.
- File desain, screenshot pemeriksaan, dan data pendaftar asli bukan bagian dari
  source deployment.

### Perubahan tahunan

Sebelum periode baru:

1. perbarui tahun, biaya, tanggal buka, dan tanggal tutup di
   `src/lib/config.ts`;
2. buat migration baru untuk jadwal sesi;
3. jalankan migration pada database yang benar;
4. perbarui QRIS dan aset yang memang dipakai;
5. periksa OAuth, Turnstile, Drive, dan Sheet;
6. jalankan `npm run check` dan smoke test production.
