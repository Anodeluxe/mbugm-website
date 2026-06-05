// This is a Server Action: it runs ONLY on the server, never in the browser.
// The "use server" line is what makes that happen. The client calls it like a
// normal async function, and Next.js handles sending the data to the server.

"use server";

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { applicantSchema } from "@/server/validation/applicant";

// A real human needs at least this many seconds to fill the form.
// Anything faster is almost certainly a bot.
const MIN_FILL_SECONDS = 3;

type SubmitResult =
  | { ok: true; referenceNumber: string; duplicate?: boolean }
  | { ok: false; error: string };

function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  // Short random suffix. The UNIQUE constraint on the column guards the
  // (very rare) case where two random codes collide.
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `MBUGM-${year}-${suffix}`;
}

export async function submitApplication(raw: unknown): Promise<SubmitResult> {
  // 1. VALIDATE on the server — never trust what the browser sent.
  const parsed = applicantSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Data tidak valid. Periksa kembali isian Anda." };
  }
  const data = parsed.data;

  // 2. ANTI-BOT checks.
  //    a) Honeypot: a hidden field real users can't see. If it's filled, it's a bot.
  if (data.website && data.website.trim().length > 0) {
    return { ok: false, error: "Pengiriman ditolak." };
  }
  //    b) Time-trap: submitted impossibly fast = automated.
  const secondsToFill = (Date.now() - data.formLoadedAt) / 1000;
  if (secondsToFill < MIN_FILL_SECONDS) {
    return { ok: false, error: "Pengiriman ditolak." };
  }

  // 3. IDEMPOTENCY: if this exact submission was already saved (e.g. the user
  //    double-clicked or the network retried), return the existing record
  //    instead of creating a second row.
  const existingByToken = await db.query.applicants.findFirst({
    where: eq(applicants.submissionToken, data.submissionToken),
  });
  if (existingByToken) {
    return {
      ok: true,
      referenceNumber: existingByToken.referenceNumber,
      duplicate: true,
    };
  }

  // 4. FRIENDLY DUPLICATE CHECK on NIM (the common case — gives a nice message).
  const existingByNim = await db.query.applicants.findFirst({
    where: eq(applicants.nim, data.nim),
  });
  if (existingByNim) {
    return { ok: false, error: "NIM ini sudah terdaftar." };
  }

  // 5. INSERT. The checks above are for nice messages; the UNIQUE constraints
  //    in the database are the real guarantee, and they catch the rare race
  //    where two requests pass the checks at the same instant.
  try {
    const [row] = await db
      .insert(applicants)
      .values({
        submissionToken: data.submissionToken,
        referenceNumber: generateReferenceNumber(),
        nim: data.nim,
        namaLengkap: data.namaLengkap,
        email: data.email,
        noTelp: data.noTelp,
        jenisKelamin: data.jenisKelamin,
        agama: data.agama,
      })
      .returning({ referenceNumber: applicants.referenceNumber });

    return { ok: true, referenceNumber: row.referenceNumber };
  } catch (err) {
    // Postgres reports a unique-constraint violation with error code "23505".
    const e = err as { code?: string; detail?: string };
    if (e.code === "23505") {
      const detail = e.detail ?? "";
      if (detail.includes("nim")) {
        return { ok: false, error: "NIM ini sudah terdaftar." };
      }
      if (detail.includes("submission_token")) {
        const saved = await db.query.applicants.findFirst({
          where: eq(applicants.submissionToken, data.submissionToken),
        });
        if (saved) {
          return { ok: true, referenceNumber: saved.referenceNumber, duplicate: true };
        }
      }
      // reference_number collision (extremely rare) — caller can just retry.
      return { ok: false, error: "Terjadi kesalahan, silakan coba lagi." };
    }

    console.error("submitApplication failed:", err);
    return { ok: false, error: "Terjadi kesalahan di server. Silakan coba lagi." };
  }
}