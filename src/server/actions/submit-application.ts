// server/actions/submit-application.ts

"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { applicantSchema } from "@/server/validation/applicant";
import { verifyTurnstileToken } from "@/server/turnstile";
import { syncApplicantToGoogle } from "@/server/google/sync";
import { processImage } from "@/server/images";
const MIN_FILL_SECONDS = 3;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB ceiling (client compresses to ~1MB)

type SubmitResult =
  | { ok: true; referenceNumber: string; duplicate?: boolean }
  | { ok: false; error: string };

function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MBUGM-${year}-${suffix}`;
}

function isUploadedFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "arrayBuffer" in v && (v as File).size > 0;
}

export async function submitApplication(formData: FormData): Promise<SubmitResult> {
  // 0. Split the text fields from the file fields.
  const raw: Record<string, FormDataEntryValue> = {};
  for (const [k, v] of formData.entries()) {
    if (k === "pasFoto" || k === "ktm") continue;
    raw[k] = v;
  }

  // 1. VALIDATE the text fields on the server.
  const parsed = applicantSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Data tidak valid. Periksa kembali isian Anda." };
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
  const pasFotoFile = formData.get("pasFoto");
  const ktmFile = formData.get("ktm");
  if (!isUploadedFile(pasFotoFile)) return { ok: false, error: "Pas foto wajib diunggah." };
  if (!isUploadedFile(ktmFile)) return { ok: false, error: "Foto KTM wajib diunggah." };
  for (const f of [pasFotoFile, ktmFile]) {
    if (f.size > MAX_IMAGE_BYTES) return { ok: false, error: "Ukuran gambar terlalu besar." };
    if (!f.type.startsWith("image/")) return { ok: false, error: "File harus berupa gambar." };
  }

  // Re-encode/sanitize. If a "file" isn't a real image, sharp throws here.
  let pasFotoBuf: Buffer;
  let ktmBuf: Buffer;
  try {
    pasFotoBuf = await processImage(Buffer.from(await pasFotoFile.arrayBuffer()));
    ktmBuf = await processImage(Buffer.from(await ktmFile.arrayBuffer()));
  } catch {
    return { ok: false, error: "Gambar tidak dapat diproses. Pastikan file berupa foto." };
  }

  // 5. IDEMPOTENCY.
  const existingByToken = await db.query.applicants.findFirst({
    where: eq(applicants.submissionToken, data.submissionToken),
  });
  if (existingByToken) {
    return { ok: true, referenceNumber: existingByToken.referenceNumber, duplicate: true };
  }

  // 6. FRIENDLY DUPLICATE CHECK on NIM.
  const existingByNim = await db.query.applicants.findFirst({
    where: eq(applicants.nim, data.nim),
  });
  if (existingByNim) {
    return { ok: false, error: "NIM ini sudah terdaftar." };
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
        sessionId: data.sessionId ?? null,
      })
      .returning();
    inserted = row;
  } catch (err) {
    const e = err as { code?: string; detail?: string };
    if (e.code === "23505") {
      const detail = e.detail ?? "";
      if (detail.includes("nim")) return { ok: false, error: "NIM ini sudah terdaftar." };
      if (detail.includes("submission_token")) {
        const saved = await db.query.applicants.findFirst({
          where: eq(applicants.submissionToken, data.submissionToken),
        });
        if (saved) return { ok: true, referenceNumber: saved.referenceNumber, duplicate: true };
      }
      return { ok: false, error: "Terjadi kesalahan, silakan coba lagi." };
    }
    console.error("submitApplication insert failed:", err);
    return { ok: false, error: "Terjadi kesalahan di server. Silakan coba lagi." };
  }

  // 8. SIDE EFFECTS (best-effort). Pass the processed photo buffers so they
  //    upload to Drive and embed into the PDF. A failure here doesn't fail the
  //    registration — the resync button mops it up.
  try {
    await syncApplicantToGoogle(inserted, { pasFoto: pasFotoBuf, ktm: ktmBuf });
  } catch (e) {
    console.error("Google sync failed (will need resync):", e);
  }

  return { ok: true, referenceNumber: inserted.referenceNumber };
}