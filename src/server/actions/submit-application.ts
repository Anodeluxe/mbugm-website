// server/actions/submit-application.ts

"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { applicants, sessions, type Applicant } from "@/server/db/schema";
import { applicantSchema } from "@/server/validation/applicant";
import { verifyTurnstileToken } from "@/server/turnstile";
import { syncApplicantToGoogle } from "@/server/google/sync";
import { processImage } from "@/server/images";
import { config, isRegistrationOpen } from "@/lib/config";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/applicant-rules";

const MIN_FILL_SECONDS = 3;

type SubmitResult =
  | { ok: true; referenceNumber: string; duplicate?: boolean }
  | { ok: false; error: string };

function generateReferenceNumber(): string {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${config.referencePrefix}-${config.year}-${suffix}`;
}

function isUploadedFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "arrayBuffer" in v && (v as File).size > 0;
}

async function processUploadedImage(file: File, label: string) {
  try {
    return await processImage(Buffer.from(await file.arrayBuffer()));
  } catch {
    throw new Error(`${label} tidak dapat dibaca. Pilih file JPG atau PNG lain.`);
  }
}

async function finishGoogleSync(
  applicant: Applicant,
  images: { pasFoto: Buffer; ktm: Buffer; paymentProof: Buffer },
  duplicate = false,
): Promise<SubmitResult> {
  try {
    await syncApplicantToGoogle(applicant, images);
    return {
      ok: true,
      referenceNumber: applicant.referenceNumber,
      ...(duplicate ? { duplicate: true } : {}),
    };
  } catch (error) {
    console.error("Google sync failed for", applicant.referenceNumber, error);
    return {
      ok: false,
      error:
        "Data utama sudah tersimpan, tetapi sinkronisasi belum selesai. Jangan tutup halaman. Selesaikan verifikasi CAPTCHA lalu kirim lagi.",
    };
  }
}

export async function submitApplication(formData: FormData): Promise<SubmitResult> {
  // Registration window — enforced server-side so a stale open tab can't submit
  // after closing.
  if (!isRegistrationOpen()) {
    return { ok: false, error: "Pendaftaran sedang ditutup." };
  }

  // 0. Split the text fields from the file fields.
  const raw: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of formData.entries()) {
    if (k === "pasFoto" || k === "ktm" || k === "paymentProof") continue;
    raw[k] = v;
  }

  // 1. VALIDATE the text fields on the server.
  const parsed = applicantSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Data tidak valid. Periksa kembali isian Anda.",
    };
  }
  const data = parsed.data;

  // 2. CHEAP ANTI-BOT checks.
  if (data.website && data.website.trim().length > 0) {
    return { ok: false, error: "Pengiriman ditolak." };
  }
  const secondsToFill = (Date.now() - data.formLoadedAt) / 1000;
  if (secondsToFill < MIN_FILL_SECONDS) {
    return { ok: false, error: "Pengiriman ditolak." };
  }

  // 3. CAPTCHA + IP.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  const captchaOk = await verifyTurnstileToken(data.turnstileToken, ip);
  if (!captchaOk) {
    return { ok: false, error: "Verifikasi CAPTCHA gagal. Silakan coba lagi." };
  }

  // 4. FILES: required, must be images, must be within the size ceiling.
  const uploads = [
    { file: formData.get("pasFoto"), label: "Pas foto" },
    { file: formData.get("ktm"), label: "Foto KTM" },
    { file: formData.get("paymentProof"), label: "Bukti pembayaran" },
  ];

  for (const upload of uploads) {
    if (!isUploadedFile(upload.file)) {
      return { ok: false, error: `${upload.label} wajib diunggah.` };
    }
    if (upload.file.size > MAX_UPLOAD_BYTES) {
      return { ok: false, error: `${upload.label} maksimal 7 MB.` };
    }
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(upload.file.type)) {
      return {
        ok: false,
        error: `${upload.label} harus menggunakan format JPG atau PNG.`,
      };
    }
  }

  // Re-encode/sanitize. If a "file" isn't a real image, sharp throws here.
  let imageBuffers: {
    pasFoto: Buffer;
    ktm: Buffer;
    paymentProof: Buffer;
  };
  try {
    const [pasFoto, ktm, paymentProof] = await Promise.all([
      processUploadedImage(uploads[0].file as File, uploads[0].label),
      processUploadedImage(uploads[1].file as File, uploads[1].label),
      processUploadedImage(uploads[2].file as File, uploads[2].label),
    ]);
    imageBuffers = { pasFoto, ktm, paymentProof };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Gambar tidak dapat diproses. Pilih file lain.",
    };
  }

  // 5. IDEMPOTENCY.
  const existingByToken = await db.query.applicants.findFirst({
    where: eq(applicants.submissionToken, data.submissionToken),
  });
  if (existingByToken) {
    return finishGoogleSync(existingByToken, imageBuffers, true);
  }

  // 6. FRIENDLY DUPLICATE CHECK on NIM.
  const existingByNim = await db.query.applicants.findFirst({
    where: eq(applicants.nim, data.nim),
  });
  if (existingByNim) {
    return { ok: false, error: "NIM ini sudah terdaftar." };
  }

  const selectedSession = await db.query.sessions.findFirst({
    where: eq(sessions.id, data.sessionId),
  });
  if (!selectedSession) {
    return { ok: false, error: "Sesi penempatan tidak ditemukan. Silakan pilih sesi lain." };
  }

  // 7. INSERT (full row returned for the sync).
  let inserted;
  try {
    const [row] = await db
      .insert(applicants)
      .values({
        submissionToken: data.submissionToken,
        referenceNumber: generateReferenceNumber(),
        ip: ip ?? null,
        nim: data.nim,
        namaLengkap: data.namaLengkap,
        namaPanggilan: data.namaPanggilan ?? null,
        tempatLahir: data.tempatLahir ?? null,
        tanggalLahir: data.tanggalLahir ?? null,
        jenisKelamin: data.jenisKelamin,
        agama: data.agama,
        golonganDarah: data.golonganDarah ?? null,
        tinggiBadanCm: data.tinggiBadanCm ?? null,
        beratBadanKg: data.beratBadanKg ?? null,
        riwayatPenyakit: data.riwayatPenyakit ?? null,
        alergi: data.alergi ?? null,
        hobi: data.hobi ?? null,
        tigaKata: data.tigaKata,
        jenjangStudi: data.jenjangStudi ?? null,
        fakultas: data.fakultas ?? null,
        prodi: data.prodi ?? null,
        asalSma: data.asalSma ?? null,
        noTelp: data.noTelp,
        email: data.email,
        alamatAsal: data.alamatAsal ?? null,
        jenisTempat: data.jenisTempat ?? null,
        alamatJogja: data.alamatJogja ?? null,
        namaOrtu: data.namaOrtu ?? null,
        noOrtu: data.noOrtu ?? null,
        alamatOrtu: data.alamatOrtu ?? null,
        idLine: data.idLine ?? null,
        idInstagram: data.idInstagram ?? null,
        idFacebook: data.idFacebook ?? null,
        idTwitter: data.idTwitter ?? null,
        bidangTari: data.bidangTari ?? null,
        bidangMusik: data.bidangMusik ?? null,
        organisasi: data.organisasi ?? null,
        pernahMb: data.pernahMb,
        unitSebelumnya: data.unitSebelumnya ?? null,
        section: data.section ?? null,
        kemampuanAlat: data.kemampuanAlat ?? null,
        sessionId: data.sessionId,
      })
      .returning();
    inserted = row;
  } catch (err) {
    const wrapped = err as {
      code?: string;
      detail?: string;
      constraint?: string;
      cause?: { code?: string; detail?: string; constraint?: string };
    };
    const e = wrapped.cause ?? wrapped;
    if (e.code === "23514" && e.constraint === "session_quota_not_exceeded") {
      return { ok: false, error: "Sesi penempatan sudah penuh. Silakan pilih sesi lain." };
    }
    if (e.code === "23505") {
      const detail = e.detail ?? "";
      if (detail.includes("nim")) return { ok: false, error: "NIM ini sudah terdaftar." };
      if (detail.includes("submission_token")) {
        const saved = await db.query.applicants.findFirst({
          where: eq(applicants.submissionToken, data.submissionToken),
        });
        if (saved) return finishGoogleSync(saved, imageBuffers, true);
      }
      return { ok: false, error: "Terjadi kesalahan, silakan coba lagi." };
    }
    console.error("submitApplication insert failed:", err);
    return { ok: false, error: "Terjadi kesalahan di server. Silakan coba lagi." };
  }

  // 8. Only report success after every required document is durable in Drive.
  //    Retrying with the same submission token resumes any missing sync steps.
  return finishGoogleSync(inserted, imageBuffers);
}
