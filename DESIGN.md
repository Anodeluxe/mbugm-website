# Design System — Marching Band UGM (MBUGM / PAB)

> Dokumen referensi desain untuk pengembangan website rekrutmen Marching Band UGM.
> Prinsip utama: **"landing bold, form calm"** — identitas/landing memakai warna brand secara tegas, sedangkan form pendaftaran tenang dan high-contrast untuk fokus input data di mobile.

---

## 1. Identitas Singkat

- **Marching Band UGM** — berdiri 11 Maret 1979, awalnya bernama *drum corps*.
- Visi: representasi terbaik UGM, kebanggaan masyarakat Yogyakarta, *kiblat* organisasi marching band di Indonesia.
- Nilai inti: **kekeluargaan**, **gotong royong**, disiplin, tanggung jawab.
- Rekam jejak: juara GPMB berulang kali (2010–2017), tampil di Istana Negara, Gedung Agung, Festival Kesenian Yogyakarta, dan acara internasional.
- Implikasi desain: kombinasi **prestige/ceremonial** (heritage, disiplin, 46+ tahun) dengan **kehangatan keluarga** (bukan korporat/dingin).

---

## 2. Palet Warna

| Token | Hex | Peran |
|---|---|---|
| `crimson` | `#AD2829` | Warna utama/brand — CTA, hero, heading penting, focus ring. **Satu-satunya nilai yang berubah per tahun** (`accentColor` di `lib/config.ts`) |
| `crimson-press` | `#8F1F20` | Hover/active state dari crimson |
| `parchment` | `#E8E6BF` | Surface heritage — background hero/section, badge, mat foto. **Bukan** untuk teks atau background form |
| `paper` | `#FBFAF4` | Background area form & dashboard — tenang, kontras tinggi untuk input data |
| `ink` | `#221E1B` | Warna teks utama (near-black hangat, bukan `#000`) |
| `warm-gray` | `#6B6459` | Teks sekunder, label meta, placeholder |
| `border` | `#D8D3BE` | Border default, divider |

**Aturan pembagian peran (penting):**
- Crimson dipakai **sedikit tapi tegas** — jangan jadi background area luas. Dia untuk elemen ceremonial: hero band, CTA utama, top banner, heading kunci, focus state.
- Parchment untuk **surface**, bukan teks di atasnya, bukan background form panjang (rawan terlihat kusam).
- Form & dashboard selalu pakai `paper`, bukan `parchment`.

**Kontras yang sudah dicek (lolos AA):**
- Putih di atas crimson ≈ 6.7:1
- Crimson di atas parchment ≈ 5.3:1
- Parchment di atas crimson (banner) ≈ 5.3:1

---

## 3. Tipografi

| Peran | Font | Catatan |
|---|---|---|
| Display / heading hero | `Fraunces` | Hanya dipakai di hero & heading besar — tidak menyentuh form, jadi aman untuk handoff |
| Body / UI / form | `Plus Jakarta Sans` | Workhorse utama — semua label, body text, komponen form |

- Fallback simpel: jika ingin satu keluarga font saja, gunakan `Plus Jakarta Sans` weight 700–800 untuk heading.
- Body text: `font-size` nyaman dibaca di mobile, `line-height` lega (≈1.6–1.7).

---

## 4. Motif & Elemen Visual Khas

Elemen ini yang membedakan dari template default — diturunkan langsung dari identitas marching band:

- **Drill dots** — grid titik halus (radial dot grid) bertema formasi lapangan. Dipakai sebagai tekstur background hero atau pembatas section.
- **Banner stripes** — garis selang-seling crimson/parchment di bawah header, meniru pita seremonial.
- **Tag small-caps "EST. 1979"** — label berspasi lebar untuk menonjolkan usia/legacy unit.
- **Crest/seal lockup** — opsional untuk logo, treatment seal-tengah untuk kesan prestise ("kiblat marching band Indonesia").

---

## 5. Komponen UI — Aturan Dasar

### Tombol
- **Primary CTA**: background `crimson`, teks putih/`paper`, radius medium, hover ke `crimson-press`.
- **Secondary**: outline `ink`, transparan, untuk aksi non-utama ("Pelajari Dulu").

### Form input
- Background `paper`, border default `border` (tipis).
- State focus: border `crimson` + ring halus crimson (≈12% opacity) — **bukan** border tebal warna lain.
- Label: `ink`, weight medium, ukuran cukup besar untuk dibaca cepat di mobile.

### Badge / Tag
- Background `parchment`, teks `crimson-press` (gelap, bukan crimson terang) supaya kontras cukup.

---

## 6. Prinsip "Landing Bold, Form Calm"

| Area | Karakter | Warna dominan |
|---|---|---|
| Hero / landing | Bold, foto besar, drill-dot texture, headline besar | Crimson + parchment |
| Form pendaftaran | Tenang, spacing lega, fokus ke input | Paper + ink, crimson hanya di accent/focus |

Alasan: calon anggota merasakan kebanggaan/prestise saat masuk halaman, lalu masuk ke ruang yang tenang dan tidak intimidatif saat mengisi 35-field form di HP mereka.

---

## 7. Struktur Halaman Utama (Homepage)

Urutan section, dari atas ke bawah:

1. **Navbar** — logo, link (tentang/kegiatan/prestasi), CTA daftar (selalu terlihat)
2. **Hero** — foto formasi/parade, headline ajakan, periode pendaftaran, CTA utama
3. **Strip statistik** — angka cepat: tahun berdiri, hasil GPMB, highlight acara (Istana Negara)
4. **Tentang** — ringkasan sejarah + filosofi kekeluargaan, link "selengkapnya" ke halaman detail
5. **Kegiatan** — kartu ringkas: latihan reguler, karantina, penerimaan anggota, parade/non-kompetisi
6. **Sorotan prestasi** — 3 pencapaian terpilih (bukan daftar lengkap — daftar penuh di halaman /prestasi)
7. **Jadwal & lokasi** — hari/jam latihan + peta Stadion Pancasila UGM
8. **CTA kedua** — pengulangan ajakan daftar sebelum footer
9. **Footer** — navigasi sekunder, kontak

**Catatan implementasi:** detail panjang (semua hasil prestasi 2010–2017, paragraf sejarah penuh) dipindah ke halaman terpisah agar homepage tetap ringkas dan scannable di mobile.

---

## 8. Referensi Visual (Pinterest / Dribbble)

Kata kunci pencarian, dikelompokkan per kebutuhan:

**Palet & mood**
- `crimson and cream branding`
- `maroon parchment color scheme`
- `burgundy beige palette`
- `vintage red cream poster`

**Identitas heritage/kolegial**
- `collegiate brand identity`
- `varsity branding`
- `university crest design`
- `heritage sports identity`
- `athletic logo vintage`

**Spesifik marching band**
- `marching band poster design`
- `drum corps branding`
- `vintage concert poster`
- `drill chart design`
- `letterpress band poster`
- `risograph poster`

**Eksekusi web (terutama Dribbble)**
- `event registration landing page`
- `bold typographic landing page`
- `editorial hero section`
- `minimal form ui`
- `onboarding form ui`
- `warm minimal website`

**Tekstur cetak/era**
- `1970s typography`
- `retro print design`
- `halftone poster`
- `brand guidelines style guide`

---

## 9. Catatan untuk Handoff (Penerus Non-Teknis)

- Semua nilai yang berubah tiap tahun (warna accent, tahun, hero image, tanggal buka/tutup pendaftaran) **harus** ada di satu file: `lib/config.ts`. Jangan hardcode di komponen.
- Jika ingin mengganti warna brand tahun depan, cukup ubah token `accentColor` — bukan menyentuh kode komponen.
- Dokumen ini sebaiknya disertakan dalam runbook handoff sebagai rujukan "kenapa warna ini dipilih" agar keputusan desain tidak hilang antar generasi pengurus.

---

*Dokumen ini adalah hasil design pass sebelum implementasi coding di IDE. Lihat `lib/config.ts` untuk nilai aktual yang dipakai tahun berjalan.*

---

## 10. Status Implementasi

*Last updated: 2026-06-28*

Aesthetic direction yang dieksekusi: **collegiate heritage × warm editorial** — crimson + parchment untuk seremonial, paper + ink untuk konten, tekstur drill-dot dari identitas formasi lapangan.

Sudah terbangun:
- **Token & font** — `src/app/globals.css` (`@theme inline`, Tailwind v4) + Fraunces/Plus Jakarta Sans via Google Fonts di `layout.tsx`. Reduced-motion sudah dihormati.
- **Homepage** (`src/app/page.tsx`) — Navbar sticky, Hero `min-h-[100dvh]` 2-kolom (foto + headline), strip statistik crimson, About (pull-quote + body), Kegiatan (grid 2-kolom, bukan 3 kartu sama), Prestasi (`divide-y`), Jadwal & Lokasi, CTA kedua, Footer. Mengikuti urutan section §7.
- **Form pendaftaran** (`src/components/registration-form.tsx`) — **9 langkah berpaginasi** (Data Diri → Kesehatan → Akademik → Kontak → Ortu → Medsos → Pengalaman MB → Berkas → Penempatan+Verifikasi). Progress bar + step dots, validasi per-langkah, field kondisional (`pernahMb`), ringkasan data, Turnstile hanya di langkah terakhir, layar sukses dengan nomor referensi. Semua logika submit/kompresi/CAPTCHA asli dipertahankan.
- **Halaman `/daftar`** (`src/app/daftar/page.tsx`) — server component, query sesi, guard window pendaftaran (closed-state designed).

Catatan tindak lanjut:
- `config.accentColor` (`lib/config.ts`) saat ini `#0f2e1f` tapi token `--color-crimson` di `globals.css` di-hardcode `#AD2829`. Untuk handoff sesuai §9 (ganti warna tahunan via satu file), idealnya token crimson di-drive dari `accentColor`. Belum diwire — visualnya tetap crimson seperti rancangan.
