export type RegistrationSubmissionFiles = {
  pasFoto: File;
  ktm: File;
  paymentProof: File;
};

type SubmissionMetadata = {
  submissionToken: string;
  formLoadedAt: number;
  turnstileToken: string;
};

export function buildRegistrationFormData<
  TValues extends Record<string, string>,
>(
  values: TValues,
  metadata: SubmissionMetadata,
  files: RegistrationSubmissionFiles,
) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    formData.append(key, value);
  }
  formData.append("submissionToken", metadata.submissionToken);
  formData.append("formLoadedAt", String(metadata.formLoadedAt));
  formData.append("turnstileToken", metadata.turnstileToken);
  formData.append("pasFoto", files.pasFoto, "pasfoto.jpg");
  formData.append("ktm", files.ktm, "ktm.jpg");
  formData.append(
    "paymentProof",
    files.paymentProof,
    "bukti-pembayaran.jpg",
  );
  return formData;
}
