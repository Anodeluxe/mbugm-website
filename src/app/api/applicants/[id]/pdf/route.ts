// app/api/applicants/[id]/pdf/route.ts
//
// Test/preview endpoint: GET /api/applicants/<id>/pdf returns that applicant's
// PDF. Open for now; locked behind admin auth in Phase 5.

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { renderApplicantPdf } from "@/server/pdf/render";

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

  const pdf = await renderApplicantPdf(applicant);

  // Wrap in a fresh Uint8Array: NextResponse's BodyInit doesn't accept Node's
  // Buffer<ArrayBufferLike> generic, but a plain Uint8Array satisfies it.
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${applicant.referenceNumber}.pdf"`,
    },
  });
}