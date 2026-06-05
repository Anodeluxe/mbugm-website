// server/validation/applicant.ts
//
// The validation schema. This runs on the SERVER on every submission,
// because anyone can send a raw HTTP request that skips the browser entirely.
// (Later you can reuse this same schema on the client for instant feedback.)
//
// This is the minimal slice — add the remaining fields by following the
// same pattern, matching the columns in server/db/schema.ts.

import { z } from "zod";
import { AGAMA_OPTIONS, JENIS_KELAMIN_OPTIONS } from "@/lib/constants";

export const applicantSchema = z.object({
  // --- hidden fields: CAPTCHA + idempotency + anti-bot (user never sees these) ---
  turnstileToken: z.string().min(1, "Verifikasi CAPTCHA diperlukan"), // from Cloudflare Turnstile
  submissionToken: z.string().uuid(), // unique per form load; makes retries safe
  formLoadedAt: z.coerce.number(), // ms timestamp of when the form loaded
  website: z.string().optional(), // honeypot: real users leave this empty

  // --- real fields ---
  nim: z.string().trim().min(1, "NIM wajib diisi"),
  namaLengkap: z.string().trim().min(1, "Nama lengkap wajib diisi"),
  email: z.string().trim().email("Email tidak valid"),
  noTelp: z.string().trim().min(1, "Nomor telepon wajib diisi"),
  jenisKelamin: z.enum(JENIS_KELAMIN_OPTIONS),
  agama: z.enum(AGAMA_OPTIONS),
});

export type ApplicantInput = z.infer<typeof applicantSchema>;