// server/google/sync.ts
//
// Side effects after a save: upload photos + PDF to Drive and append to the
// Sheet. Every step is guarded by a flag/ID check, so it's safe to re-run
// (resync only does the parts that haven't succeeded).

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants, type Applicant } from "@/server/db/schema";
import { renderApplicantPdf } from "@/server/pdf/render";
import { uploadFile, downloadFile } from "./drive";
import { appendApplicantRow } from "./sheets";
import { toDataUri } from "@/server/images";

type ImageBuffers = { pasFoto?: Buffer; ktm?: Buffer };

export async function syncApplicantToGoogle(
  applicant: Applicant,
  images?: ImageBuffers,
): Promise<void> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set");
  // Photos (pas foto + KTM) go in their own folder; falls back to the form
  // folder when unset so existing deployments keep working.
  const imagesFolderId = process.env.GOOGLE_DRIVE_IMAGES_FOLDER_ID || folderId;

  const ref = applicant.referenceNumber;
  let pasFotoId = applicant.pasFotoDriveId;
  let ktmId = applicant.fotoKtmDriveId;

  // 1. Upload photos (only if we have fresh buffers and they're not uploaded).
  if (images?.pasFoto && !pasFotoId) {
    pasFotoId = await uploadFile(images.pasFoto, `${ref} - pasfoto.jpg`, "image/jpeg", imagesFolderId);
    await db.update(applicants).set({ pasFotoDriveId: pasFotoId }).where(eq(applicants.id, applicant.id));
  }
  if (images?.ktm && !ktmId) {
    ktmId = await uploadFile(images.ktm, `${ref} - ktm.jpg`, "image/jpeg", imagesFolderId);
    await db.update(applicants).set({ fotoKtmDriveId: ktmId }).where(eq(applicants.id, applicant.id));
  }

  // 2. PDF -> Drive, with photos embedded. Use the fresh buffers if we have
  //    them, otherwise pull the bytes back from Drive (the resync case).
  if (!applicant.driveSynced) {
    const pasFotoBuf = images?.pasFoto ?? (pasFotoId ? await downloadFile(pasFotoId) : undefined);
    const ktmBuf = images?.ktm ?? (ktmId ? await downloadFile(ktmId) : undefined);

    const pdf = await renderApplicantPdf(applicant, {
      pasFoto: pasFotoBuf ? toDataUri(pasFotoBuf) : undefined,
      ktm: ktmBuf ? toDataUri(ktmBuf) : undefined,
    });
    const pdfId = await uploadFile(pdf, `${ref}.pdf`, "application/pdf", folderId);
    await db
      .update(applicants)
      .set({ pdfDriveId: pdfId, pdfGenerated: true, driveSynced: true })
      .where(eq(applicants.id, applicant.id));
  }

  // 3. Sheet append.
  if (!applicant.sheetSynced) {
    await appendApplicantRow(applicant);
    await db.update(applicants).set({ sheetSynced: true }).where(eq(applicants.id, applicant.id));
  }
}