import assert from "node:assert/strict";
import { buildRegistrationFormData } from "../src/lib/registration-submission.ts";

const image = new File(["image"], "original.png", { type: "image/png" });
const formData = buildRegistrationFormData(
  { nim: "23/521764/TK/57572", namaLengkap: "Budi Santoso" },
  {
    submissionToken: "85fb18b6-167c-49b1-ad54-a647e0474a2e",
    formLoadedAt: 123456,
    turnstileToken: "captcha",
  },
  { pasFoto: image, ktm: image, paymentProof: image },
);

assert.equal(formData.get("nim"), "23/521764/TK/57572");
assert.equal(formData.get("formLoadedAt"), "123456");
assert.equal(formData.get("turnstileToken"), "captcha");
assert.equal(formData.get("pasFoto")?.name, "pasfoto.jpg");
assert.equal(formData.get("ktm")?.name, "ktm.jpg");
assert.equal(formData.get("paymentProof")?.name, "bukti-pembayaran.jpg");

console.log("Registration submission checks passed.");
