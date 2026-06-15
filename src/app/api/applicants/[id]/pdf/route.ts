// app/api/applicants/[id]/pdf/route.ts
//
// Test/preview endpoint: GET /api/applicants/<id>/pdf returns that applicant's
// PDF. For now it's open so you can test; in Phase 5 we'll lock it behind admin
// auth (only logged-in club emails should be able to pull applicant PDFs).

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants, sessions } from "@/server/db/schema";
import { renderApplicantPdf } from "@/server/pdf/render";

// @react-pdf/renderer needs the Node.js runtime (not the Edge runtime).
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

  // Look up a friendly label for the placement session, if any.
  let sessionLabel: string | null = null;
  if (applicant.sessionId) {
    const s = await db.query.sessions.findFirst({
      where: eq(sessions.id, applicant.sessionId),
    });
    if (s) sessionLabel = `${s.dayLabel} — Sesi ${s.sessionNo}`;
  }

  const pdf = await renderApplicantPdf(applicant, sessionLabel);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${applicant.referenceNumber}.pdf"`,
    },
  });
}