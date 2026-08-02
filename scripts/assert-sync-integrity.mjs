import assert from "node:assert/strict";
import {
  getMissingRequiredUploadLabels,
  isApplicantDriveComplete,
} from "../src/server/google/sync-integrity.mjs";

const complete = {
  pasFotoDriveId: "pasfoto",
  fotoKtmDriveId: "ktm",
  paymentProofDriveId: "payment",
  pdfDriveId: "pdf",
  driveSynced: true,
};

assert.deepEqual(getMissingRequiredUploadLabels({}), [
  "pas foto",
  "foto KTM",
  "bukti pembayaran",
]);
assert.equal(isApplicantDriveComplete(complete), true);
assert.equal(
  isApplicantDriveComplete({ ...complete, paymentProofDriveId: null }),
  false,
);
assert.equal(isApplicantDriveComplete({ ...complete, pdfDriveId: null }), false);
assert.equal(isApplicantDriveComplete({ ...complete, driveSynced: false }), false);

console.log("Sync integrity assertions passed.");
