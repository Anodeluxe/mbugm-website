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
import {
  APPLICANT_TEXT_LIMITS as L,
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  PHONE_MAX_DIGITS,
  PHONE_MIN_DIGITS,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
  isValidBirthDate,
  isValidNim,
  isValidPhone,
  isValidTraits,
} from "@/lib/applicant-rules";

// Empty form strings ("") mean "not provided" for optional fields.
const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const requiredText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(
      min,
      min === 1
        ? `${label} wajib diisi.`
        : `${label} minimal ${min} karakter.`,
    )
    .max(max, `${label} maksimal ${max} karakter.`);

const optionalText = (label: string, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(max, `${label} maksimal ${max} karakter.`)
      .optional(),
  );

const optionalInt = (label: string, min: number, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int(`${label} harus berupa bilangan bulat.`)
      .min(min, `${label} minimal ${min}.`)
      .max(max, `${label} maksimal ${max}.`)
      .optional(),
  );

const optionalPhone = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .max(L.noOrtu, `Nomor telepon orang tua maksimal ${L.noOrtu} karakter.`)
    .refine(
      isValidPhone,
      `Nomor telepon orang tua harus mengandung ${PHONE_MIN_DIGITS}-${PHONE_MAX_DIGITS} digit.`,
    )
    .optional(),
);

export const applicantSchema = z.object({
  // --- hidden: CAPTCHA + idempotency + anti-bot ---
  turnstileToken: z
    .string()
    .min(1, "Verifikasi CAPTCHA diperlukan.")
    .max(4096, "Token CAPTCHA tidak valid."),
  submissionToken: z.string().uuid(),
  formLoadedAt: z.coerce.number().finite(),
  website: z.string().max(L.website).optional(), // honeypot

  // --- Data diri ---
  nim: requiredText("NIM", 5, L.nim).refine(
    isValidNim,
    "NIM hanya boleh berisi huruf, angka, spasi, garis miring, titik, atau tanda hubung.",
  ),
  namaLengkap: requiredText("Nama lengkap", 2, L.namaLengkap),
  namaPanggilan: optionalText("Nama panggilan", L.namaPanggilan),
  tempatLahir: requiredText("Tempat lahir", 2, L.tempatLahir),
  tanggalLahir: z
    .string()
    .refine(
      isValidBirthDate,
      "Tanggal lahir harus berupa tanggal nyata antara 1 Januari 1900 dan hari ini.",
    ),
  jenisKelamin: z.enum(JENIS_KELAMIN_OPTIONS),
  agama: z.enum(AGAMA_OPTIONS),
  golonganDarah: z.preprocess(
    emptyToUndefined,
    z.enum(GOLONGAN_DARAH_OPTIONS).optional(),
  ),
  tinggiBadanCm: optionalInt(
    "Tinggi badan",
    HEIGHT_MIN_CM,
    HEIGHT_MAX_CM,
  ),
  beratBadanKg: optionalInt(
    "Berat badan",
    WEIGHT_MIN_KG,
    WEIGHT_MAX_KG,
  ),

  // --- Kesehatan ---
  riwayatPenyakit: optionalText("Riwayat penyakit", L.riwayatPenyakit),
  alergi: optionalText("Alergi", L.alergi),
  hobi: optionalText("Hobi", L.hobi),
  tigaKata: requiredText("Tiga sifat", 1, L.tigaKata).refine(
    isValidTraits,
    "Tuliskan tepat 3 sifat, pisahkan dengan koma, dan batasi setiap sifat maksimal 40 karakter.",
  ),

  // --- Akademik ---
  jenjangStudi: z.preprocess(
    emptyToUndefined,
    z.enum(JENJANG_STUDI_OPTIONS).optional(),
  ),
  fakultas: requiredText("Fakultas", 2, L.fakultas),
  prodi: requiredText("Program studi", 2, L.prodi),
  asalSma: optionalText("Asal SMA", L.asalSma),

  // --- Kontak & alamat ---
  noTelp: requiredText("Nomor telepon", 1, L.noTelp).refine(
    isValidPhone,
    `Nomor telepon harus mengandung ${PHONE_MIN_DIGITS}-${PHONE_MAX_DIGITS} digit.`,
  ),
  email: requiredText("Email", 3, L.email).email("Email tidak valid."),
  alamatAsal: optionalText("Alamat asal", L.alamatAsal),
  jenisTempat: z.preprocess(
    emptyToUndefined,
    z.enum(JENIS_TEMPAT_OPTIONS).optional(),
  ),
  alamatJogja: optionalText("Alamat di Yogyakarta", L.alamatJogja),

  // --- Orang tua / wali ---
  namaOrtu: optionalText("Nama orang tua atau wali", L.namaOrtu),
  noOrtu: optionalPhone,
  alamatOrtu: optionalText("Alamat orang tua atau wali", L.alamatOrtu),

  // --- Media sosial (semua opsional) ---
  idLine: optionalText("ID Line", L.idLine),
  idInstagram: optionalText("ID Instagram", L.idInstagram),
  idFacebook: optionalText("ID Facebook", L.idFacebook),
  idTwitter: optionalText("ID Twitter", L.idTwitter),

  // --- Pengalaman marching band ---
  bidangTari: optionalText("Bidang tari", L.bidangTari),
  bidangMusik: optionalText("Bidang musik", L.bidangMusik),
  organisasi: optionalText("Organisasi", L.organisasi),
  pernahMb: z.preprocess(
    (value) =>
      value === "true" ? true : value === "false" ? false : value,
    z.boolean(),
  ),
  unitSebelumnya: optionalText("Unit sebelumnya", L.unitSebelumnya),
  section: optionalText("Section", L.section),
  kemampuanAlat: optionalText("Kemampuan alat", L.kemampuanAlat),

  // --- Penempatan ---
  sessionId: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int()
      .positive("Sesi penempatan wajib dipilih.")
      .max(Number.MAX_SAFE_INTEGER, "Sesi penempatan tidak valid."),
  ),
});

export type ApplicantInput = z.infer<typeof applicantSchema>;
