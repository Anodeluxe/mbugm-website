// app/api/applicants/batch-pdf/route.ts
//
// GET /api/applicants/batch-pdf?q=&filter=  -> one merged PDF of the matching
// applicants. Respects the same search/filter params as the dashboard list.
// Admin only.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  parsePdfBatchPage,
  streamPdf,
} from "@/lib/pdf-batch";
import { ApplicantBatchPdfService } from "@/server/pdf/applicant-batch-pdf-service";

export const runtime = "nodejs";
export const maxDuration = 60; // give the merge room (Vercel free-tier ceiling)

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const filter = searchParams.get("filter");
  const page = parsePdfBatchPage(searchParams.get("page"));
  if (page === null) {
    return new NextResponse("Halaman batch PDF tidak valid.", { status: 400 });
  }

  const batch = await new ApplicantBatchPdfService({ q, filter, page }).execute();
  if (!batch) {
    return new NextResponse("Tidak ada pendaftar untuk diunduh.", { status: 404 });
  }

  return new Response(streamPdf(batch.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pendaftar-mbugm-${batch.start}-${batch.end}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
