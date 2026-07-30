export const PDF_BATCH_SIZE = 50;

export function parsePdfBatchPage(value: string | null): number | null {
  const page = Number(value ?? "1");
  return Number.isSafeInteger(page) &&
    page >= 1 &&
    page <= Math.floor(Number.MAX_SAFE_INTEGER / PDF_BATCH_SIZE)
    ? page
    : null;
}

export function getPdfBatchRange(page: number, total: number) {
  const start = (page - 1) * PDF_BATCH_SIZE + 1;
  return { start, end: Math.min(page * PDF_BATCH_SIZE, total) };
}

export function streamPdf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      const end = Math.min(offset + 64 * 1024, bytes.length);
      controller.enqueue(bytes.subarray(offset, end));
      offset = end;
    },
  });
}
