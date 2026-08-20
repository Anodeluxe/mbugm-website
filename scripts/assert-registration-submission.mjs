import assert from "node:assert/strict";
import { buildRegistrationFormData } from "../src/lib/registration-submission.ts";
import {
  buildRegistrationConfirmationEmail,
  sendRegistrationConfirmationEmail,
} from "../src/server/email/registration-confirmation.ts";

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

const confirmation = buildRegistrationConfirmationEmail("  Dimas Pratama  ");
assert.equal(confirmation.subject, "Bukti Registrasi PAB MB UGM 2026");
assert.match(confirmation.text, /^Halo, Dimas!/);
assert.match(confirmation.html, /Halo, Dimas!/);
assert.match(confirmation.html, /posterpabmbugm-2026/);

const escapedConfirmation = buildRegistrationConfirmationEmail(
  "<Dimas> Pratama",
);
assert.match(escapedConfirmation.html, /Halo, &lt;Dimas&gt;!/);
assert.doesNotMatch(escapedConfirmation.html, /Halo, <Dimas>!/);

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.RESEND_API_KEY;
let emailRequest;
globalThis.fetch = async (input, init) => {
  emailRequest = { input, init };
  return new Response('{"id":"email_test"}', { status: 200 });
};
process.env.RESEND_API_KEY = "re_test";

try {
  await sendRegistrationConfirmationEmail({
    email: "dimas@example.com",
    namaLengkap: "Dimas Pratama",
    referenceNumber: "MBUGM-2026-ABCDE",
  });
} finally {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalApiKey;
}

assert.equal(emailRequest.input, "https://api.resend.com/emails");
assert.equal(emailRequest.init.method, "POST");
assert.equal(emailRequest.init.headers.Authorization, "Bearer re_test");
assert.equal(
  emailRequest.init.headers["Idempotency-Key"],
  "registration-confirmation/MBUGM-2026-ABCDE",
);
const emailPayload = JSON.parse(emailRequest.init.body);
assert.deepEqual(emailPayload.to, ["dimas@example.com"]);
assert.equal(emailPayload.from, "PAB MB UGM <noreply@mbugm.org>");
assert.match(emailPayload.html, /Halo, Dimas!/);

console.log("Registration submission checks passed.");
