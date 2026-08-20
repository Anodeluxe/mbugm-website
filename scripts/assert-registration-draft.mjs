import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  restoreRegistrationDraft,
  splitRegistrationDraft,
} from "../src/lib/registration-draft.ts";

const legacyPasFoto = { name: "legacy-pas-foto.jpg" };
const currentPasFoto = { name: "current-pas-foto.jpg" };
const draft = {
  submissionToken: "token",
  values: { namaLengkap: "Budi" },
  currentStep: 7,
  furthestStep: 8,
  pasFoto: legacyPasFoto,
  ktm: { name: "ktm.jpg" },
  paymentProof: { name: "payment.jpg" },
};

const { metadata, attachments } = splitRegistrationDraft(draft);
assert.equal("pasFoto" in metadata, false);
assert.equal(attachments.pasFoto, legacyPasFoto);

const restored = restoreRegistrationDraft(
  metadata,
  { pasFoto: currentPasFoto },
  draft,
);
assert.equal(restored?.pasFoto, currentPasFoto);
assert.equal(restored?.ktm, draft.ktm);
assert.deepEqual(restored?.values, draft.values);

const registrationForm = await readFile(
  new URL("../src/components/registration-form.tsx", import.meta.url),
  "utf8",
);
assert.match(registrationForm, /if \(!hasDraft\) \{/);
assert.match(registrationForm, /draftStore\.clear\(\)/);
assert.match(registrationForm, /setValues\(\{ \.\.\.INITIAL, \.\.\.draft\.values \}\)/);

console.log("Registration draft checks passed.");
