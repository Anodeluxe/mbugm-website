// server/pdf/render.tsx
//
// Turns an applicant record into a PDF Buffer. This is the reusable function:
// the test route below calls it now, and in Phase 4 the submit flow will call
// the same function to upload the PDF to Google Drive.

import { renderToBuffer } from "@react-pdf/renderer";
import type { Applicant } from "@/server/db/schema";
import { ApplicantDocument } from "./applicant-document";

export async function renderApplicantPdf(
  applicant: Applicant,
  sessionLabel?: string | null,
): Promise<Buffer> {
  return renderToBuffer(
    <ApplicantDocument applicant={applicant} sessionLabel={sessionLabel} />,
  );
}