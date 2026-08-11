import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { PDF_BATCH_SIZE, getPdfBatchRange } from "@/lib/pdf-batch";
import { db } from "@/server/db";
import { applicants, sessions } from "@/server/db/schema";
import { applicantNeedsGoogleSync } from "@/server/google/sync";

type ApplicantAdminFilters = {
  q?: string;
  filter?: string;
};

export class ApplicantAdminQuery {
  constructor(private readonly filters: ApplicantAdminFilters) {}

  async execute() {
    const unsynced = applicantNeedsGoogleSync();
    const where = this.buildWhere(unsynced);

    const [unsyncedResult, totalResult] = await Promise.all([
      db.select({ value: count() }).from(applicants).where(unsynced),
      db.select({ value: count() }).from(applicants),
    ]);
    const total = totalResult[0].value;

    const matchingTotalQuery = where
      ? db.select({ value: count() }).from(applicants).where(where)
      : Promise.resolve([{ value: total }]);
    const rowsQuery = db
      .select({
        applicant: applicants,
        placementSession: {
          dayLabel: sessions.dayLabel,
          sessionNo: sessions.sessionNo,
        },
      })
      .from(applicants)
      .leftJoin(sessions, eq(applicants.sessionId, sessions.id))
      .where(where)
      .orderBy(desc(applicants.createdAt))
      .limit(1000);

    const [matchingTotalResult, rows] = await Promise.all([
      matchingTotalQuery,
      rowsQuery,
    ]);
    const matchingTotal = matchingTotalResult[0].value;
    const pdfBatches = Array.from(
      { length: Math.ceil(matchingTotal / PDF_BATCH_SIZE) },
      (_, index) => {
        const page = index + 1;
        return { page, ...getPdfBatchRange(page, matchingTotal) };
      },
    );

    return {
      total,
      unsyncedCount: unsyncedResult[0].value,
      rows,
      pdfBatches,
    };
  }

  private buildWhere(unsynced: SQL | undefined) {
    const conditions: SQL[] = [];
    const query = this.filters.q?.trim();

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
    if (this.filters.filter === "unsynced" && unsynced) {
      conditions.push(unsynced);
    }

    return conditions.length ? and(...conditions) : undefined;
  }
}
