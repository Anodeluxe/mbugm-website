// server/actions/submit-application.ts

"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { applicantSchema } from "@/server/validation/applicant";
import { verifyTurnstileToken } from "@/server/turnstile";
import { syncApplicantToGoogle } from "@/server/google/sync";

const MIN_FILL_SECONDS = 3;

type SubmitResult =
  | { ok: true; referenceNumber: string; duplicate?: boolean }
  | { ok: false; error: string };

function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MBUGM-${year}-${suffix}`;
}

export async function submitApplication(raw: unknown): Promise<SubmitResult> {
  // 1. VALIDATE on the server.
  const parsed = applicantSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Data tidak valid. Periksa kembali isian Anda." };
  }
  const data = parsed.data;

  // 2. CHEAP ANTI-BOT checks (no network calls).
  if (data.website && data.website.trim().length > 0) {
    return { ok: false, error: "Pengiriman ditolak." };
  }
  const secondsToFill = (Date.now() - data.formLoadedAt) / 1000;
  if (secondsToFill < MIN_FILL_SECONDS) {
    return { ok: false, error: "Pengiriman ditolak." };
  }

  // 3. CAPTCHA verification + capture IP.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
  const captchaOk = await verifyTurnstileToken(data.turnstileToken, ip);
  if (!captchaOk) {
    return { ok: false, error: "Verifikasi CAPTCHA gagal. Silakan coba lagi." };
  }

  // 4. IDEMPOTENCY.
  const existingByToken = await db.query.applicants.findFirst({
    where: eq(applicants.submissionToken, data.submissionToken),
  });
  if (existingByToken) {
    return {
      ok: true,
      referenceNumber: existingByToken.referenceNumber,
      duplicate: true,
    };
  }

  // 5. FRIENDLY DUPLICATE CHECK on NIM.
  const existingByNim = await db.query.applicants.findFirst({
    where: eq(applicants.nim, data.nim),
  });
  if (existingByNim) {
    return { ok: false, error: "NIM ini sudah terdaftar." };
  }

  // 6. INSERT. We return the FULL row so we can hand it to the Google sync.
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
      if (detail.includes("nim")) {
        return { ok: false, error: "NIM ini sudah terdaftar." };
      }
      if (detail.includes("submission_token")) {
        const saved = await db.query.applicants.findFirst({
          where: eq(applicants.submissionToken, data.submissionToken),
        });
        if (saved) {
          return { ok: true, referenceNumber: saved.referenceNumber, duplicate: true };
        }
      }
      return { ok: false, error: "Terjadi kesalahan, silakan coba lagi." };
    }
    console.error("submitApplication insert failed:", err);
    return { ok: false, error: "Terjadi kesalahan di server. Silakan coba lagi." };
  }

  // 7. SIDE EFFECTS (best-effort). The registration is already saved, so a
  //    Google outage must NOT fail it — if this throws, the sync flags stay
  //    false and the admin "resync" button fixes it later.
  try {
    await syncApplicantToGoogle(inserted);
  } catch (e) {
    console.error("Google sync failed (will need resync):", e);
  }

  return { ok: true, referenceNumber: inserted.referenceNumber };
}