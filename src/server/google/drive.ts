// server/google/drive.ts

import { Readable } from "node:stream";
import { getDrive } from "./client";

// Uploads any file into the Drive folder and returns its file ID.
// supportsAllDrives:true is REQUIRED for Shared Drives.
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folderId: string,
): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.create({
    requestBody: { name: filename, parents: [folderId], mimeType },
    media: { mimeType, body: Readable.from(buffer) },
    fields: "id",
    supportsAllDrives: true,
  });
  if (!res.data.id) throw new Error("Drive upload returned no file id");
  return res.data.id;
}

// Downloads a Drive file's bytes. Used on resync to re-embed photos into the PDF
// when we no longer have the originally uploaded buffers in memory.
export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = getDrive();
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" },
  );
  return Buffer.from(res.data as ArrayBuffer);
}