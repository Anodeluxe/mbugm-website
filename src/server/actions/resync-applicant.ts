// server/actions/resync-applicant.ts
//
// Retries the Google sync for one applicant. The admin dashboard (Phase 5) will
// call this from a "resync" button. NOTE: must be protected by admin auth once
// that exists — until then, don't expose it in the UI.

"use server";

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { syncApplicantToGoogle } from "@/server/google/sync";

export async function resyncApplicant(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const applicant = await db.query.applicants.findFirst({
    where: eq(applicants.id, id),
  });
  if (!applicant) return { ok: false, error: "Pendaftar tidak ditemukan" };

  try {
    await syncApplicantToGoogle(applicant);
    return { ok: true };
  } catch (e) {
    console.error("resyncApplicant failed:", e);
    return { ok: false, error: "Sinkronisasi gagal" };
  }
}