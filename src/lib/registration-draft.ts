export const DRAFT_ATTACHMENT_NAMES = [
  "pasFoto",
  "ktm",
  "paymentProof",
] as const;

export type DraftAttachmentName = (typeof DRAFT_ATTACHMENT_NAMES)[number];

export type DraftMetadata<TValues> = {
  submissionToken?: string;
  values: TValues;
  currentStep: number;
  furthestStep?: number;
};

export type DraftAttachments = Record<DraftAttachmentName, File | null>;

export type RegistrationDraft<TValues> = DraftMetadata<TValues> &
  DraftAttachments;

export function splitRegistrationDraft<TValues>(
  draft: RegistrationDraft<TValues>,
) {
  const { pasFoto, ktm, paymentProof, ...metadata } = draft;
  return {
    metadata,
    attachments: { pasFoto, ktm, paymentProof },
  };
}

export function restoreRegistrationDraft<TValues>(
  metadata: DraftMetadata<TValues> | null,
  attachments: Partial<DraftAttachments>,
  legacy: RegistrationDraft<TValues> | null,
): RegistrationDraft<TValues> | null {
  const source = metadata ?? legacy;
  if (!source) return null;

  return {
    submissionToken: source.submissionToken,
    values: source.values,
    currentStep: source.currentStep,
    furthestStep: source.furthestStep,
    pasFoto: attachments.pasFoto ?? legacy?.pasFoto ?? null,
    ktm: attachments.ktm ?? legacy?.ktm ?? null,
    paymentProof:
      attachments.paymentProof ?? legacy?.paymentProof ?? null,
  };
}
