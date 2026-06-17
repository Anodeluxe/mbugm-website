// app/api/applicants/batch-pdf/route.ts
//
// GET /api/applicants/batch-pdf?q=&filter=  -> one merged PDF of the matching
// applicants. Respects the same search/filter params as the dashboard list.
// Admin only.

import { NextResponse } from "next/server";
import { and, or, ilike, eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { renderApplicantPdf } from "@/server/pdf/render";
import { downloadFile } from "@/server/google/drive";
import { mergePdfs } from "@/server/pdf/merge";

export const runtime = "nodejs";
export const maxDuration = 60; // give the merge room (Vercel free-tier ceiling)

// Run an async mapper over items with a fixed concurrency, preserving order.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const filter = searchParams.get("filter");

  const conditions = [];
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(applicants.namaLengkap, like),
        ilike(applicants.nim, like),
        ilike(applicants.referenceNumber, like),
        ilike(applicants.email, like),
      ),
    );
  }
  if (filter === "unsynced") {
    conditions.push(
      or(eq(applicants.driveSynced, false), eq(applicants.sheetSynced, false)),
    );
  }
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(applicants)
    .where(where)
    .orderBy(desc(applicants.createdAt))
    .limit(1000);

  if (rows.length === 0) {
    return new NextResponse("Tidak ada pendaftar untuk diunduh.", { status: 404 });
  }

  // Prefer the stored Drive PDF; render fresh only if it's missing.
  const pdfs = await mapWithConcurrency(rows, 8, async (a) => {
    if (a.pdfDriveId) {
      try {
        return await downloadFile(a.pdfDriveId);
      } catch (e) {
        console.error("batch: Drive download failed, rendering fresh for", a.referenceNumber, e);
      }
    }
    return renderApplicantPdf(a);
  });

  const merged = await mergePdfs(pdfs);

  return new NextResponse(Buffer.from(merged), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pendaftar-mbugm.pdf"`,
    },
  });
}