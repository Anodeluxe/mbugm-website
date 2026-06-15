// server/pdf/render.tsx
//
// Turns an applicant record into a PDF Buffer. Reusable: the test route calls
// it now, and Phase 4's submit flow will call it to upload to Google Drive.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import type { Applicant } from "@/server/db/schema";
import { ApplicantDocument } from "./applicant-document";

// Load /public/logo.png once and reuse it as a data URI. Returns undefined if
// the file isn't there (the template then shows a "Logo" placeholder).
let cachedLogo: string | null | undefined;
async function getLogo(): Promise<string | undefined> {
  if (cachedLogo !== undefined) return cachedLogo ?? undefined;
  try {
    const buf = await readFile(join(process.cwd(), "public", "logo.png"));
    cachedLogo = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    cachedLogo = null; // remember "not found" so we don't retry every time
  }
  return cachedLogo ?? undefined;
}

export async function renderApplicantPdf(
  applicant: Applicant,
  opts?: { pasFoto?: string; ktm?: string },
): Promise<Buffer> {
  const logo = await getLogo();
  return renderToBuffer(
    <ApplicantDocument
      applicant={applicant}
      logo={logo}
      pasFoto={opts?.pasFoto}
      ktm={opts?.ktm}
    />,
  );
}