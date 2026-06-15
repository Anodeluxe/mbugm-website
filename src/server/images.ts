// server/images.ts
//
// Validates and sanitizes uploaded images. Re-encoding through sharp is a
// security step: it strips metadata (EXIF/GPS) and guarantees the bytes are a
// real image — a file disguised as a .jpg won't survive being decoded.

import sharp from "sharp";

export async function processImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate() // apply EXIF orientation, then drop the metadata
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
}

export function toDataUri(buf: Buffer): string {
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}