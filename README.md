# MBUGM Website

Website Penerimaan Anggota Baru Marching Band Universitas Gadjah Mada 2026.
Proyek ini mencakup homepage, formulir pendaftaran, login admin, pengelolaan
pendaftar, PDF rangkuman, Google Drive, dan Google Sheets.

## Arsitektur

| Bagian | Layanan |
|---|---|
| Aplikasi dan API | Next.js di Vercel |
| Database | PostgreSQL di Neon |
| Login admin | Auth.js dengan Google OAuth |
| Dokumen | Google Drive |
| Rekap | Google Sheets |
| CAPTCHA | Cloudflare Turnstile |
| Email konfirmasi | Resend |

Aturan bisnis utama dicatat di [PRODUCT.md](./PRODUCT.md).

## Persyaratan

- Node.js 24
- npm
- Database PostgreSQL Neon
- Google Cloud service account
- Google OAuth client
- Cloudflare Turnstile
- Akun Resend dengan domain `mbugm.org` terverifikasi

## Menjalankan secara lokal

1. Pasang dependency.

   ```bash
   npm ci
   ```

2. Salin `.env.example` menjadi `.env.local`, lalu isi nilainya.

3. Jalankan migration untuk database lokal atau development.

   ```bash
   npm run db:migrate
   ```

4. Jalankan aplikasi.

   ```bash
   npm run dev
   ```

5. Buka `http://localhost:3000`.

Jangan commit `.env`, `.env.local`, private key, atau kredensial lain.

## Environment variable

| Nama | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | URL koneksi PostgreSQL Neon |
| `AUTH_SECRET` | Ya | Secret acak untuk menandatangani sesi Auth.js |
| `AUTH_GOOGLE_ID` | Ya | Client ID Google OAuth |
| `AUTH_GOOGLE_SECRET` | Ya | Client secret Google OAuth |
| `ADMIN_ALLOWED_EMAILS` | Ya | Email admin, dipisahkan koma |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Ya | Email service account |
| `GOOGLE_PRIVATE_KEY` | Ya | Private key dengan baris baru ditulis sebagai `\n` |
| `GOOGLE_DRIVE_FOLDER_ID` | Ya | Folder tujuan PDF |
| `GOOGLE_DRIVE_IMAGES_FOLDER_ID` | Tidak | Folder gambar; menggunakan folder PDF jika kosong |
| `GOOGLE_SHEET_ID` | Ya | ID spreadsheet rekap |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Ya | Site key yang boleh dikirim ke browser |
| `TURNSTILE_SECRET_KEY` | Ya | Secret key yang hanya tersedia di server |
| `RESEND_API_KEY` | Ya | API key Resend untuk mengirim email konfirmasi |
| `REGISTRATION_EMAIL_REPLY_TO` | Tidak | Alamat tujuan ketika penerima membalas email |
| `LOCAL_FORM_MOCK` | Tidak | Isi `1` hanya untuk mock form saat development |

Untuk Vercel, masukkan nilai production melalui Project Settings, bukan melalui
file di repository. Perubahan environment variable baru berlaku pada deployment
berikutnya.

## Email konfirmasi

Email dikirim dari `PAB MB UGM <noreply@mbugm.org>` setelah database, Drive,
PDF, dan Sheets selesai. Mailbox `noreply@mbugm.org` tidak diperlukan.

1. Tambahkan `mbugm.org` ke Resend.
2. Salin record SPF dan DKIM dari Resend ke pengelola DNS aktif domain.
3. Setelah domain terverifikasi, buat API key dengan akses pengiriman.
4. Isi `RESEND_API_KEY` di environment Vercel.
5. Jika balasan perlu masuk ke panitia, isi `REGISTRATION_EMAIL_REPLY_TO`.

Sapaan email mengambil kata pertama dari `Nama Lengkap`. Pengiriman ulang aman:
Resend memakai idempotency key dan database menyimpan waktu email berhasil
dikirim.

## Google OAuth

Tambahkan callback berikut pada Google OAuth client:

- Lokal: `http://localhost:3000/api/auth/callback/google`
- Production: `https://DOMAIN-PRODUCTION/api/auth/callback/google`

Hanya akun yang tercantum dalam `ADMIN_ALLOWED_EMAILS` yang dapat masuk ke
`/admin`.

## Google Drive dan Sheets

1. Buat service account di Google Cloud.
2. Bagikan folder Drive tujuan kepada `GOOGLE_SERVICE_ACCOUNT_EMAIL` sebagai
   Editor.
3. Bagikan spreadsheet tujuan kepada email yang sama sebagai Editor.
4. Masukkan folder ID, spreadsheet ID, email, dan private key ke environment
   variable.
5. Kirim satu pendaftaran uji dan pastikan hasil berikut tersedia:
   - pas foto;
   - foto KTM;
   - bukti pembayaran;
   - PDF rangkuman;
   - satu baris Google Sheets.

Folder dan spreadsheet tidak perlu dibuat publik.

## Database dan migration

Migration tersimpan di folder `drizzle/` dan dijalankan berurutan oleh:

```bash
npm run db:migrate
```

Migration penting:

- `0003_seed_placement_sessions.sql` mengisi 14 sesi placement test.
- `0004_enforce_session_quota.sql` memasang pengaman atomik kapasitas sesi.
- `0005_brown_nemesis.sql` menambah status pengiriman email konfirmasi.

Sebelum migration production:

1. Pastikan `DATABASE_URL` menunjuk database production yang benar.
2. Buat backup atau branch Neon.
3. Jalankan `npm run db:migrate` satu kali.
4. Pastikan sesi tersedia di `/daftar`.
5. Jangan menjalankan migration production dari CI atau pull request.

Jika migration perlu diperbaiki, pulihkan backup Neon atau buat migration
lanjutan. Jangan mengubah migration yang sudah pernah diterapkan ke production.

## Pemeriksaan

Jalankan seluruh pemeriksaan lokal dengan:

```bash
npm run check
```

Perintah tersebut menjalankan lint, assertion, dan production build. Assertion
mencakup jadwal sesi, batas kapasitas, integritas sinkronisasi, batch PDF, serta
validasi pendaftar.

Audit dependency production:

```bash
npm audit --omit=dev --audit-level=high
```

GitHub Actions menjalankan pemeriksaan yang sama pada pull request dan push ke
`main`. Workflow hanya menggunakan nilai environment dummy dan tidak terhubung
ke database, Drive, atau Sheet production.

## Deployment production

Checklist sebelum deployment:

- CI lulus.
- Environment variable Vercel lengkap.
- Tanggal pendaftaran di `src/lib/config.ts` sudah benar.
- Migration sudah diterapkan ke database yang benar.
- Jadwal dan kapasitas sesi sudah diperiksa.
- Folder Drive dan Sheet telah dibagikan kepada service account.
- Callback Google OAuth sesuai domain production.

Smoke test setelah deployment:

1. Homepage dan `/daftar` dapat dibuka di desktop serta mobile.
2. Status buka atau tutup pendaftaran sesuai tanggal.
3. Login allowlist berhasil dan email lain ditolak.
4. `/admin` tanpa sesi diarahkan ke `/login`.
5. Endpoint PDF tanpa sesi mengembalikan `401`.
6. Pendaftaran uji menghasilkan row database, tiga gambar, PDF, dan row Sheet.
7. Email konfirmasi diterima dan sapaan memakai kata pertama nama lengkap.
8. Hapus data uji setelah seluruh alur terverifikasi.

## Rollback

Untuk masalah aplikasi, kembalikan deployment stabil sebelumnya melalui
Vercel. Rollback aplikasi tidak membatalkan migration database.

Jika masalah berasal dari database:

1. hentikan pendaftaran melalui tanggal di `src/lib/config.ts` jika diperlukan;
2. pulihkan backup atau branch Neon;
3. kembalikan deployment yang kompatibel dengan schema tersebut;
4. lakukan smoke test ulang.

Jangan menghapus data pendaftar atau menjalankan SQL rollback tanpa backup.
