import { and, desc, ilike, or, type SQL } from "drizzle-orm";
import {
  PDF_BATCH_SIZE,
  getPdfBatchRange,
  mapWithConcurrency,
} from "@/lib/pdf-batch";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { downloadFile } from "@/server/google/drive";
import { applicantNeedsGoogleSync } from "@/server/google/sync";
import { mergePdfs } from "@/server/pdf/merge";
import { renderApplicantPdf } from "@/server/pdf/render";

type ApplicantBatchPdfOptions = {
  q?: string;
  filter?: string | null;
  page: number;
};

export class ApplicantBatchPdfService {
  constructor(private readonly options: ApplicantBatchPdfOptions) {}

  async execute() {
    // ponytail: offset pages keep exports stateless; use snapshot IDs if live inserts cause overlap.
    const rows = await db
      .select()
      .from(applicants)
      .where(this.buildWhere())
      .orderBy(desc(applicants.createdAt), desc(applicants.id))
      .limit(PDF_BATCH_SIZE)
      .offset((this.options.page - 1) * PDF_BATCH_SIZE);

    if (rows.length === 0) return null;

    const pdfs = await mapWithConcurrency(rows, 8, async (applicant) => {
      if (applicant.pdfDriveId) {
        try {
          return await downloadFile(applicant.pdfDriveId);
        } catch (error) {
          console.error(
            "batch: Drive download failed, rendering fresh for",
            applicant.referenceNumber,
            error,
          );
        }
      }
      return renderApplicantPdf(applicant);
    });
    const bytes = await mergePdfs(pdfs);
    const processedTotal =
      (this.options.page - 1) * PDF_BATCH_SIZE + rows.length;

    return {
      bytes,
      ...getPdfBatchRange(this.options.page, processedTotal),
    };
  }

  private buildWhere() {
    const conditions: SQL[] = [];
    const query = this.options.q?.trim();

    if (query) {
      const like = `%${query}%`;
      const search = or(
        ilike(applicants.namaLengkap, like),
        ilike(applicants.nim, like),
        ilike(applicants.referenceNumber, like),
        ilike(applicants.email, like),
      );
      if (search) conditions.push(search);
    }
    if (this.options.filter === "unsynced") {
      const unsynced = applicantNeedsGoogleSync();
      if (unsynced) conditions.push(unsynced);
    }

    return conditions.length ? and(...conditions) : undefined;
  }
}
