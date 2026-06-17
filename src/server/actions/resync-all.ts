// server/actions/resync-all.ts
//
// Bulk resync of all unsynced applicants, processed in small batches so a single
// request stays short (avoids serverless timeouts on the free tier). The client
// button calls this repeatedly until `remaining` hits 0.

"use server";

import { or, eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { syncApplicantToGoogle } from "@/server/google/sync";

const BATCH = 20;

export async function resyncUnsyncedBatch(): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
  remaining: number;
}> {
  const session = await auth();
  if (!session) return { attempted: 0, succeeded: 0, failed: 0, remaining: 0 };

  const unsynced = or(
    eq(applicants.driveSynced, false),
    eq(applicants.sheetSynced, false),
  );

  const batch = await db
    .select()
    .from(applicants)
    .where(unsynced)
    .limit(BATCH);

  let succeeded = 0;
  let failed = 0;
  for (const a of batch) {
    try {
      await syncApplicantToGoogle(a);
      succeeded++;
    } catch (e) {
      console.error("bulk resync failed for", a.referenceNumber, e);
      failed++;
    }
  }

  const [{ value: remaining }] = await db
    .select({ value: count() })
    .from(applicants)
    .where(unsynced);

  revalidatePath("/admin");
  return { attempted: batch.length, succeeded, failed, remaining };
}