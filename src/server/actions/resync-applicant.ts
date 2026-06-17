// server/actions/resync-applicant.ts
//
// Retries the Google sync for one applicant. Called from the dashboard's resync
// button. Protected indirectly: it's only reachable from the admin UI, but for
// defense in depth we also check the session here.

"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { syncApplicantToGoogle } from "@/server/google/sync";

export async function resyncApplicant(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Tidak diizinkan" };

  const applicant = await db.query.applicants.findFirst({
    where: eq(applicants.id, id),
  });
  if (!applicant) return { ok: false, error: "Pendaftar tidak ditemukan" };

  try {
    await syncApplicantToGoogle(applicant);
    revalidatePath("/admin"); // refresh the dashboard's cached data
    return { ok: true };
  } catch (e) {
    console.error("resyncApplicant failed:", e);
    return { ok: false, error: "Sinkronisasi gagal" };
  }
}