import assert from "node:assert/strict";
import {
  APPLICANT_TEXT_LIMITS,
  HEIGHT_MAX_CM,
  MAX_UPLOAD_BYTES,
  PHONE_MAX_DIGITS,
  isAcceptedImage,
  isValidBirthDate,
  isValidNim,
  isValidPhone,
  isValidTraits,
  parseTraits,
} from "../src/lib/applicant-rules.ts";

assert.equal(isValidBirthDate("2024-02-29", "2026-07-30"), true);
assert.equal(isValidBirthDate("2026-02-31", "2026-07-30"), false);
assert.equal(isValidBirthDate("2026-07-31", "2026-07-30"), false);
assert.equal(isValidBirthDate("1899-12-31", "2026-07-30"), false);

assert.equal(isValidNim("23/521764/TK/57572"), true);
assert.equal(isValidNim("<script>"), false);

assert.equal(isValidPhone("08123456"), true);
assert.equal(isValidPhone("+62 812-3456-7890"), true);
assert.equal(isValidPhone("1".repeat(PHONE_MAX_DIGITS)), true);
assert.equal(isValidPhone("1".repeat(PHONE_MAX_DIGITS + 1)), false);

assert.deepEqual(parseTraits("Disiplin, kreatif; mudah beradaptasi"), [
  "Disiplin",
  "kreatif",
  "mudah beradaptasi",
]);
assert.equal(isValidTraits("Disiplin, kreatif, mudah beradaptasi"), true);
assert.equal(isValidTraits("Disiplin, kreatif"), false);
assert.equal(isValidTraits(`Baik, rajin, ${"a".repeat(41)}`), false);

assert.equal(APPLICANT_TEXT_LIMITS.namaLengkap, 120);
assert.equal(HEIGHT_MAX_CM, 500);
assert.equal(MAX_UPLOAD_BYTES, 7 * 1024 * 1024);
assert.equal(
  isAcceptedImage({ size: MAX_UPLOAD_BYTES, type: "image/jpeg" }),
  true,
);
assert.equal(
  isAcceptedImage({ size: MAX_UPLOAD_BYTES + 1, type: "image/jpeg" }),
  false,
);
assert.equal(
  isAcceptedImage({ size: 100, type: "image/svg+xml" }),
  false,
);

console.log("Applicant rule assertions passed.");
