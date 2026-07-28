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
