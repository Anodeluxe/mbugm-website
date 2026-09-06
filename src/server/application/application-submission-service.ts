import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants, sessions, type Applicant } from "@/server/db/schema";
import { applicantSchema } from "@/server/validation/applicant";
import { verifyTurnstileToken } from "@/server/turnstile";
import { syncApplicantToGoogle } from "@/server/google/sync";
import { sendRegistrationConfirmationEmail } from "@/server/email/registration-confirmation";
import { processImage } from "@/server/images";
import { config, isRegistrationOpen } from "@/lib/config";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/applicant-rules";
import { getPlacementSessionUnavailableReason } from "@/lib/placement-sessions";

const MIN_FILL_SECONDS = 3;

export type SubmitResult =
  | { ok: true; referenceNumber: string; duplicate?: boolean }
  | { ok: false; error: string };

type ImageBuffers = {
  pasFoto: Buffer;
  ktm: Buffer;
  paymentProof: Buffer;
};

export class ApplicationSubmissionService {
  async execute(formData: FormData, ip?: string): Promise<SubmitResult> {
    if (!isRegistrationOpen()) {
      return { ok: false, error: "Pendaftaran sedang ditutup." };
    }

    const raw: Record<string, FormDataEntryValue> = {};
    for (const [key, value] of formData.entries()) {
      if (key === "pasFoto" || key === "ktm" || key === "paymentProof") {
        continue;
      }
      raw[key] = value;
    }

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

    if (data.website && data.website.trim().length > 0) {
      return { ok: false, error: "Pengiriman ditolak." };
    }
    const secondsToFill = (Date.now() - data.formLoadedAt) / 1000;
    if (secondsToFill < MIN_FILL_SECONDS) {
      return { ok: false, error: "Pengiriman ditolak." };
    }

    const captchaOk = await verifyTurnstileToken(data.turnstileToken, ip);
    if (!captchaOk) {
      return {
        ok: false,
        error: "Verifikasi CAPTCHA gagal. Silakan coba lagi.",
      };
    }

    const uploads = [
      { file: formData.get("pasFoto"), label: "Pas foto" },
      { file: formData.get("ktm"), label: "Foto KTM" },
      { file: formData.get("paymentProof"), label: "Bukti pembayaran" },
    ];

    for (const upload of uploads) {
      if (!this.isUploadedFile(upload.file)) {
        return { ok: false, error: `${upload.label} wajib diunggah.` };
      }
      if (upload.file.size > MAX_UPLOAD_BYTES) {
        return { ok: false, error: `${upload.label} maksimal 7 MB.` };
      }
      if (
        !(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(upload.file.type)
      ) {
        return {
          ok: false,
          error: `${upload.label} harus menggunakan format JPG atau PNG.`,
        };
      }
    }

    let imageBuffers: ImageBuffers;
    try {
      const [pasFoto, ktm, paymentProof] = await Promise.all([
        this.processUploadedImage(uploads[0].file as File, uploads[0].label),
        this.processUploadedImage(uploads[1].file as File, uploads[1].label),
        this.processUploadedImage(uploads[2].file as File, uploads[2].label),
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

    const existingByToken = await db.query.applicants.findFirst({
      where: eq(applicants.submissionToken, data.submissionToken),
    });
    if (existingByToken) {
      return this.finishGoogleSync(existingByToken, imageBuffers, true);
    }

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
      return {
        ok: false,
        error: "Sesi penempatan tidak ditemukan. Silakan pilih sesi lain.",
      };
    }
    const unavailableReason = getPlacementSessionUnavailableReason(
      selectedSession.dayLabel,
      selectedSession.sessionNo,
    );
    if (unavailableReason) {
      return { ok: false, error: unavailableReason };
    }

    let inserted;
    try {
      const [row] = await db
        .insert(applicants)
        .values({
          submissionToken: data.submissionToken,
          referenceNumber: this.generateReferenceNumber(),
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
    } catch (error) {
      const wrapped = error as {
        code?: string;
        detail?: string;
        constraint?: string;
        cause?: { code?: string; detail?: string; constraint?: string };
      };
      const databaseError = wrapped.cause ?? wrapped;
      if (
        databaseError.code === "23514" &&
        databaseError.constraint === "session_quota_not_exceeded"
      ) {
        return {
          ok: false,
          error: "Sesi penempatan sudah penuh. Silakan pilih sesi lain.",
        };
      }
      if (databaseError.code === "23505") {
        const detail = databaseError.detail ?? "";
        if (detail.includes("nim")) {
          return { ok: false, error: "NIM ini sudah terdaftar." };
        }
        if (detail.includes("submission_token")) {
          const saved = await db.query.applicants.findFirst({
            where: eq(applicants.submissionToken, data.submissionToken),
          });
          if (saved) {
            return this.finishGoogleSync(saved, imageBuffers, true);
          }
        }
        return { ok: false, error: "Terjadi kesalahan, silakan coba lagi." };
      }
      console.error("submitApplication insert failed:", error);
      return {
        ok: false,
        error: "Terjadi kesalahan di server. Silakan coba lagi.",
      };
    }

    return this.finishGoogleSync(inserted, imageBuffers);
  }

  private generateReferenceNumber() {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `${config.referencePrefix}-${config.year}-${suffix}`;
  }

  private isUploadedFile(value: FormDataEntryValue | null): value is File {
    return (
      typeof value === "object" &&
      value !== null &&
      "arrayBuffer" in value &&
      (value as File).size > 0
    );
  }

  private async processUploadedImage(file: File, label: string) {
    try {
      return await processImage(Buffer.from(await file.arrayBuffer()));
    } catch {
      throw new Error(
        `${label} tidak dapat dibaca. Pilih file JPG atau PNG lain.`,
      );
    }
  }

  private async finishGoogleSync(
    applicant: Applicant,
    images: ImageBuffers,
    duplicate = false,
  ): Promise<SubmitResult> {
    try {
      await syncApplicantToGoogle(applicant, images);
    } catch (error) {
      console.error("Google sync failed for", applicant.referenceNumber, error);
      return {
        ok: false,
        error:
          "Data utama sudah tersimpan, tetapi sinkronisasi belum selesai. Jangan tutup halaman. Selesaikan verifikasi CAPTCHA lalu kirim lagi.",
      };
    }

    try {
      if (!applicant.confirmationEmailSentAt) {
        await sendRegistrationConfirmationEmail(applicant);
        await db
          .update(applicants)
          .set({ confirmationEmailSentAt: new Date() })
          .where(eq(applicants.id, applicant.id));
      }
    } catch (error) {
      console.error(
        "Confirmation email failed for",
        applicant.referenceNumber,
        error,
      );
      return {
        ok: false,
        error:
          "Data dan sinkronisasi sudah selesai, tetapi email konfirmasi belum terkirim. Jangan tutup halaman. Selesaikan verifikasi CAPTCHA lalu kirim lagi.",
      };
    }

    return {
      ok: true,
      referenceNumber: applicant.referenceNumber,
      ...(duplicate ? { duplicate: true } : {}),
    };
  }
}
