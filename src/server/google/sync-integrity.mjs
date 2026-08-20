const REQUIRED_UPLOADS = [
  ["pasFotoDriveId", "pas foto"],
  ["fotoKtmDriveId", "foto KTM"],
  ["paymentProofDriveId", "bukti pembayaran"],
];

/**
 * @param {{
 *   pasFotoDriveId?: string | null;
 *   fotoKtmDriveId?: string | null;
 *   paymentProofDriveId?: string | null;
 * }} state
 */
export function getMissingRequiredUploadLabels(state) {
  return REQUIRED_UPLOADS.flatMap(([key, label]) => state[key] ? [] : [label]);
}

/**
 * @param {unknown[][] | null | undefined} rows
 * @param {string} referenceNumber
 */
export function hasApplicantReference(rows, referenceNumber) {
  return rows?.some((row) => row[0] === referenceNumber) ?? false;
}

/**
 * @param {{
 *   pasFotoDriveId?: string | null;
 *   fotoKtmDriveId?: string | null;
 *   paymentProofDriveId?: string | null;
 *   pdfDriveId?: string | null;
 *   driveSynced?: boolean;
 * }} state
 */
export function isApplicantDriveComplete(state) {
  return Boolean(
    state.driveSynced &&
    state.pdfDriveId &&
    getMissingRequiredUploadLabels(state).length === 0,
  );
}
