// app/api/applicants/[id]/pdf/route.ts
//
// Test/preview endpoint: GET /api/applicants/<id>/pdf returns that applicant's
// PDF with their photos embedded (pulled from Drive). Open for now; locked
// behind admin auth in Phase 5.

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { renderApplicantPdf } from "@/server/pdf/render";
import { downloadFile } from "@/server/google/drive";
import { toDataUri } from "@/server/images";

export const runtime = "nodejs";

async function downloadImage(fileId: string | null, label: string) {
  if (!fileId) return undefined;
  try {
    return toDataUri(await downloadFile(fileId));
  } catch (error) {
    console.error(`Could not load ${label} for PDF preview:`, error);
    return undefined;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Admin only — applicant PDFs contain personal data.
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;

  const applicant = await db.query.applicants.findFirst({
    where: eq(applicants.id, id),
  });
  if (!applicant) {
    return new NextResponse("Pendaftar tidak ditemukan", { status: 404 });
  }

  // One broken Drive file must not prevent the other valid images from loading.
  const [pasFoto, ktm, paymentProof] = await Promise.all([
    downloadImage(applicant.pasFotoDriveId, "pas foto"),
    downloadImage(applicant.fotoKtmDriveId, "KTM"),
    downloadImage(applicant.paymentProofDriveId, "bukti pembayaran"),
  ]);

  const pdf = await renderApplicantPdf(applicant, { pasFoto, ktm, paymentProof });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${applicant.referenceNumber}.pdf"`,
    },
  });
}
