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

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  map: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await map(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
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
