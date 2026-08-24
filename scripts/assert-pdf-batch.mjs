import assert from "node:assert/strict";
import {
  PDF_BATCH_SIZE,
  getPdfBatchRange,
  mapWithConcurrency,
  parsePdfBatchPage,
  streamPdf,
} from "../src/lib/pdf-batch.ts";

assert.equal(PDF_BATCH_SIZE, 50);
assert.equal(parsePdfBatchPage(null), 1);
assert.equal(parsePdfBatchPage("3"), 3);
assert.equal(parsePdfBatchPage("0"), null);
assert.equal(parsePdfBatchPage("1.5"), null);
assert.equal(parsePdfBatchPage(String(Number.MAX_SAFE_INTEGER)), null);
assert.deepEqual(getPdfBatchRange(2, 83), { start: 51, end: 83 });
assert.deepEqual(
  await mapWithConcurrency([1, 2, 3], 2, async (value) => value * 2),
  [2, 4, 6],
);

const source = Uint8Array.from({ length: 150_000 }, (_, index) => index % 251);
const chunks = [];
for await (const chunk of streamPdf(source)) chunks.push(chunk);
assert.ok(chunks.length > 1);
assert.deepEqual(Buffer.concat(chunks), Buffer.from(source));

console.log("PDF batch checks passed.");
