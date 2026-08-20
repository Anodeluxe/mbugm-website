// server/google/sync.ts
//
// Side effects after a save: upload photos + PDF to Drive and append to the
// Sheet. Every step is guarded by a flag/ID check, so it's safe to re-run
// (resync only does the parts that haven't succeeded).

import { eq, isNull, or } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants, type Applicant } from "@/server/db/schema";
import { renderApplicantPdf } from "@/server/pdf/render";
import { uploadFile, replaceFile, downloadFile } from "./drive";
import { ensureApplicantRow } from "./sheets";
import { toDataUri } from "@/server/images";
import { getMissingRequiredUploadLabels } from "./sync-integrity.mjs";

type ImageBuffers = {
  pasFoto?: Buffer;
  ktm?: Buffer;
  paymentProof?: Buffer;
};

export function applicantNeedsGoogleSync() {
  return or(
    eq(applicants.driveSynced, false),
    eq(applicants.pdfGenerated, false),
    eq(applicants.sheetSynced, false),
    isNull(applicants.pasFotoDriveId),
    isNull(applicants.fotoKtmDriveId),
    isNull(applicants.paymentProofDriveId),
    isNull(applicants.pdfDriveId),
  );
}

class ApplicantGoogleSyncService {
  private pasFotoId: string | null;
  private ktmId: string | null;
  private paymentProofId: string | null;
  private uploadedRequiredFile = false;

  constructor(
    private readonly applicant: Applicant,
    private readonly images?: ImageBuffers,
    private readonly forcePdf = false,
  ) {
    this.pasFotoId = applicant.pasFotoDriveId;
    this.ktmId = applicant.fotoKtmDriveId;
    this.paymentProofId = applicant.paymentProofDriveId;
  }

  async execute(): Promise<void> {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set");
    const imagesFolderId =
      process.env.GOOGLE_DRIVE_IMAGES_FOLDER_ID || folderId;

    await this.syncRequiredImages(imagesFolderId);
    this.assertRequiredImagesComplete();
    await this.syncPdf(folderId);
    await this.syncSheet();
  }

  private async syncRequiredImages(folderId: string) {
    const ref = this.applicant.referenceNumber;

    if (this.images?.pasFoto && !this.pasFotoId) {
      this.pasFotoId = await uploadFile(
        this.images.pasFoto,
        `${ref} - pasfoto.jpg`,
        "image/jpeg",
        folderId,
      );
      await db
        .update(applicants)
        .set({ pasFotoDriveId: this.pasFotoId })
        .where(eq(applicants.id, this.applicant.id));
      this.uploadedRequiredFile = true;
    }

    if (this.images?.ktm && !this.ktmId) {
      this.ktmId = await uploadFile(
        this.images.ktm,
        `${ref} - ktm.jpg`,
        "image/jpeg",
        folderId,
      );
      await db
        .update(applicants)
        .set({ fotoKtmDriveId: this.ktmId })
        .where(eq(applicants.id, this.applicant.id));
      this.uploadedRequiredFile = true;
    }

    if (this.images?.paymentProof && !this.paymentProofId) {
      this.paymentProofId = await uploadFile(
        this.images.paymentProof,
        `${ref} - bukti-pembayaran.jpg`,
        "image/jpeg",
        folderId,
      );
      await db
        .update(applicants)
        .set({
          paymentProofDriveId: this.paymentProofId,
          paidAt: new Date(),
        })
        .where(eq(applicants.id, this.applicant.id));
      this.uploadedRequiredFile = true;
    }
  }

  private assertRequiredImagesComplete() {
    const missingUploads = getMissingRequiredUploadLabels({
      pasFotoDriveId: this.pasFotoId,
      fotoKtmDriveId: this.ktmId,
      paymentProofDriveId: this.paymentProofId,
    });
    if (missingUploads.length > 0) {
      throw new Error(
        `Dokumen wajib belum lengkap: ${missingUploads.join(", ")}.`,
      );
    }
  }

  private async syncPdf(folderId: string) {
    if (!this.shouldSyncPdf()) return;

    const pasFoto =
      this.images?.pasFoto ??
      (this.pasFotoId ? await downloadFile(this.pasFotoId) : undefined);
    const ktm =
      this.images?.ktm ??
      (this.ktmId ? await downloadFile(this.ktmId) : undefined);
    const paymentProof =
      this.images?.paymentProof ??
      (this.paymentProofId
        ? await downloadFile(this.paymentProofId)
        : undefined);

    const pdf = await renderApplicantPdf(this.applicant, {
      pasFoto: pasFoto ? toDataUri(pasFoto) : undefined,
      ktm: ktm ? toDataUri(ktm) : undefined,
      paymentProof: paymentProof ? toDataUri(paymentProof) : undefined,
    });
    let pdfId = this.applicant.pdfDriveId;
    if (pdfId) {
      await replaceFile(pdfId, pdf, "application/pdf");
    } else {
      pdfId = await uploadFile(
        pdf,
        `${this.applicant.referenceNumber}.pdf`,
        "application/pdf",
        folderId,
      );
    }

    await db
      .update(applicants)
      .set({ pdfDriveId: pdfId, pdfGenerated: true, driveSynced: true })
      .where(eq(applicants.id, this.applicant.id));
  }

  private shouldSyncPdf() {
    return (
      !this.applicant.driveSynced ||
      !this.applicant.pdfGenerated ||
      !this.applicant.pdfDriveId ||
      this.uploadedRequiredFile ||
      this.forcePdf
    );
  }

  private async syncSheet() {
    if (this.applicant.sheetSynced) return;

    await ensureApplicantRow(this.applicant);
    await db
      .update(applicants)
      .set({ sheetSynced: true })
      .where(eq(applicants.id, this.applicant.id));
  }
}

export function syncApplicantToGoogle(
  applicant: Applicant,
  images?: ImageBuffers,
  forcePdf = false,
): Promise<void> {
  return new ApplicantGoogleSyncService(applicant, images, forcePdf).execute();
}
