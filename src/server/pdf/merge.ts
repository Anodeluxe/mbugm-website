// server/pdf/merge.ts
//
// Merges several PDFs into one multi-page document for batch printing.

import { PDFDocument } from "pdf-lib";

export async function mergePdfs(pdfs: (Uint8Array | Buffer)[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const bytes of pdfs) {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return merged.save();
}