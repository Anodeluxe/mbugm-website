// app/api/applicants/[id]/pdf/route.ts
//
// Test/preview endpoint: GET /api/applicants/<id>/pdf returns that applicant's
// PDF with their photos embedded (pulled from Drive). Open for now; locked
// behind admin auth in Phase 5.

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { renderApplicantPdf } from "@/server/pdf/render";
import { downloadFile } from "@/server/google/drive";
import { toDataUri } from "@/server/images";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const applicant = await db.query.applicants.findFirst({
    where: eq(applicants.id, id),
  });
  if (!applicant) {
    return new NextResponse("Pendaftar tidak ditemukan", { status: 404 });
  }

  // Pull photos from Drive if they've been uploaded.
  let pasFoto: string | undefined;
  let ktm: string | undefined;
  try {
    if (applicant.pasFotoDriveId) pasFoto = toDataUri(await downloadFile(applicant.pasFotoDriveId));
    if (applicant.fotoKtmDriveId) ktm = toDataUri(await downloadFile(applicant.fotoKtmDriveId));
  } catch (e) {
    console.error("Could not load photos for preview:", e);
  }

  const pdf = await renderApplicantPdf(applicant, { pasFoto, ktm });

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${applicant.referenceNumber}.pdf"`,
    },
  });
}