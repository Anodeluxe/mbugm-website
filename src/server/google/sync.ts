// server/google/sync.ts
//
// The "side effects after a save" step: generate the PDF, upload it to Drive,
// and append the row to the Sheet. Each step checks a sync flag first, so this
// is safe to re-run — a resync only does the parts that haven't succeeded yet.

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants, type Applicant } from "@/server/db/schema";
import { renderApplicantPdf } from "@/server/pdf/render";
import { uploadPdfToDrive } from "@/server/google/drive";
import { appendApplicantRow } from "@/server/google/sheets";

export async function syncApplicantToGoogle(applicant: Applicant): Promise<void> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // 1. PDF -> Drive (skip if already done).
  if (folderId && !applicant.driveSynced) {
    const pdf = await renderApplicantPdf(applicant);
    const fileId = await uploadPdfToDrive(
      pdf,
      `${applicant.referenceNumber}.pdf`,
      folderId,
    );
    await db
      .update(applicants)
      .set({ pdfDriveId: fileId, pdfGenerated: true, driveSynced: true })
      .where(eq(applicants.id, applicant.id));
  }

  // 2. Row -> Sheet (skip if already done). Done second so a Sheet failure
  //    doesn't block the Drive upload — each succeeds independently.
  if (!applicant.sheetSynced) {
    await appendApplicantRow(applicant);
    await db
      .update(applicants)
      .set({ sheetSynced: true })
      .where(eq(applicants.id, applicant.id));
  }
}