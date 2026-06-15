// server/google/drive.ts

import { Readable } from "node:stream";
import { getDrive } from "./client";

// Uploads a PDF buffer into the configured Drive folder and returns its file ID.
// supportsAllDrives:true is REQUIRED — without it, Shared Drive uploads fail.
export async function uploadPdfToDrive(
  pdf: Buffer,
  filename: string,
  folderId: string,
): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
      mimeType: "application/pdf",
    },
    media: { mimeType: "application/pdf", body: Readable.from(pdf) },
    fields: "id",
    supportsAllDrives: true,
  });

  if (!res.data.id) throw new Error("Drive upload returned no file id");
  return res.data.id;
}