// app/api/applicants/[id]/pdf/route.ts
//
// Test/preview endpoint: GET /api/applicants/<id>/pdf returns that applicant's
// PDF with their photos embedded (pulled from Drive). Open for now; locked
// behind admin auth in Phase 5.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApplicantPdfService } from "@/server/pdf/applicant-pdf-service";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Admin only — applicant PDFs contain personal data.
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const result = await new ApplicantPdfService(id).execute();
  if (!result) {
    return new NextResponse("Pendaftar tidak ditemukan", { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${result.referenceNumber}.pdf"`,
    },
  });
}
