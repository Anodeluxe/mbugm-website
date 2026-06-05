// server/validation/applicant.ts
//
// Full validation schema, matching the columns in server/db/schema.ts.
// Runs on the SERVER on every submission. The form sends every value as a
// string; the preprocess helpers below coerce/clean them.
//
// REQUIRED vs OPTIONAL here is a starting guess — tighten or loosen to match
// the fields your real form actually requires.

import { z } from "zod";
import {
  AGAMA_OPTIONS,
  JENIS_KELAMIN_OPTIONS,
  GOLONGAN_DARAH_OPTIONS,
  JENJANG_STUDI_OPTIONS,
  JENIS_TEMPAT_OPTIONS,
} from "@/lib/constants";

// Empty form strings ("") mean "not provided" for optional fields.
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const optionalText = z.preprocess(
  emptyToUndefined,
  z.string().trim().optional(),
);
const optionalInt = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().positive().optional(),
);

export const applicantSchema = z.object({
  // --- hidden: CAPTCHA + idempotency + anti-bot ---
  turnstileToken: z.string().min(1, "Verifikasi CAPTCHA diperlukan"),
  submissionToken: z.string().uuid(),
  formLoadedAt: z.coerce.number(),
  website: z.string().optional(), // honeypot

  // --- Data diri ---
  nim: z.string().trim().min(1, "NIM wajib diisi"),
  namaLengkap: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  namaPanggilan: optionalText,
  tempatLahir: z.string().trim().min(1, "Tempat lahir wajib diisi"),
  tanggalLahir: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir wajib diisi"),
  jenisKelamin: z.enum(JENIS_KELAMIN_OPTIONS),
  agama: z.enum(AGAMA_OPTIONS),
  golonganDarah: z.preprocess(
    emptyToUndefined,
    z.enum(GOLONGAN_DARAH_OPTIONS).optional(),
  ),
  tinggiBadanCm: optionalInt,
  beratBadanKg: optionalInt,

  // --- Kesehatan ---
  riwayatPenyakit: optionalText,
  alergi: optionalText,
  hobi: optionalText,

  // --- Akademik ---
  jenjangStudi: z.preprocess(
    emptyToUndefined,
    z.enum(JENJANG_STUDI_OPTIONS).optional(),
  ),
  fakultas: z.string().trim().min(1, "Fakultas wajib diisi"),
  prodi: z.string().trim().min(1, "Program studi wajib diisi"),
  asalSma: optionalText,

  // --- Kontak & alamat ---
  noTelp: z.string().trim().min(1, "Nomor telepon wajib diisi"),
  email: z.string().trim().email("Email tidak valid"),
  alamatAsal: optionalText,
  jenisTempat: z.preprocess(
    emptyToUndefined,
    z.enum(JENIS_TEMPAT_OPTIONS).optional(),
  ),
  alamatJogja: optionalText,

  // --- Orang tua / wali ---
  namaOrtu: optionalText,
  noOrtu: optionalText,
  alamatOrtu: optionalText,

  // --- Media sosial (semua opsional) ---
  idLine: optionalText,
  idInstagram: optionalText,
  idFacebook: optionalText,
  idTwitter: optionalText,

  // --- Pengalaman marching band ---
  bidangTari: optionalText,
  bidangMusik: optionalText,
  organisasi: optionalText,
  pernahMb: z.preprocess((v) => v === "true" || v === true, z.boolean()),
  unitSebelumnya: optionalText,
  section: optionalText,
  kemampuanAlat: optionalText,

  // --- Penempatan ---
  sessionId: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().optional(),
  ),
});

export type ApplicantInput = z.infer<typeof applicantSchema>;