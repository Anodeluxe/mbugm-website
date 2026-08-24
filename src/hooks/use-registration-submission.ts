"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { submitApplication } from "@/server/actions/submit-application";
import { buildRegistrationFormData } from "@/lib/registration-submission";
import { validateRegistrationImage } from "@/lib/registration-step-validator";

const COMPRESS_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
};

type SubmissionStatus =
  | { state: "idle" }
  | { state: "submitting" }
  | { state: "success"; referenceNumber: string; draftCleared: boolean }
  | { state: "error"; message: string };

type SubmissionOptions<TValues extends Record<string, string>> = {
  values: TValues;
  submissionToken: string;
  pasFoto: File | null;
  ktm: File | null;
  paymentProof: File | null;
  clearDraft: () => Promise<void>;
  onSuccess: (draftCleared: boolean) => void;
  scrollToTop: () => void;
};

export function useRegistrationSubmission<
  TValues extends Record<string, string>,
>({
  values,
  submissionToken,
  pasFoto,
  ktm,
  paymentProof,
  clearDraft,
  onSuccess,
  scrollToTop,
}: SubmissionOptions<TValues>) {
  const [formLoadedAt] = useState(() => Date.now());
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<SubmissionStatus>({ state: "idle" });
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  function resetSubmission() {
    setStatus({ state: "idle" });
    setTurnstileToken("");
    turnstileRef.current?.reset();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const imageError =
      validateRegistrationImage(pasFoto, "Pas foto") ??
      validateRegistrationImage(ktm, "Foto KTM") ??
      validateRegistrationImage(paymentProof, "Bukti pembayaran");
    if (imageError) {
      setStatus({ state: "error", message: imageError });
      return;
    }
    if (!turnstileToken) {
      setStatus({
        state: "error",
        message: "Mohon selesaikan verifikasi CAPTCHA.",
      });
      return;
    }

    setStatus({ state: "submitting" });
    let compressedImages: File[];
    try {
      compressedImages = await Promise.all([
        imageCompression(pasFoto as File, COMPRESS_OPTIONS),
        imageCompression(ktm as File, COMPRESS_OPTIONS),
        imageCompression(paymentProof as File, COMPRESS_OPTIONS),
      ]);
    } catch {
      setStatus({
        state: "error",
        message: "Gambar gagal dikompres. Pilih file JPG atau PNG lain.",
      });
      return;
    }

    try {
      const [compressedPasFoto, compressedKtm, compressedPaymentProof] =
        compressedImages;
      const formData = buildRegistrationFormData(
        values,
        { submissionToken, formLoadedAt, turnstileToken },
        {
          pasFoto: compressedPasFoto,
          ktm: compressedKtm,
          paymentProof: compressedPaymentProof,
        },
      );
      const result = await submitApplication(formData);

      if (result.ok) {
        let draftCleared = true;
        try {
          await clearDraft();
        } catch {
          draftCleared = false;
        }
        onSuccess(draftCleared);
        setStatus({
          state: "success",
          referenceNumber: result.referenceNumber,
          draftCleared,
        });
        scrollToTop();
        return;
      }

      setStatus({ state: "error", message: result.error });
      setTurnstileToken("");
      turnstileRef.current?.reset();
    } catch {
      setStatus({
        state: "error",
        message:
          "Koneksi ke server terputus. Isianmu masih tersimpan, silakan coba lagi.",
      });
      setTurnstileToken("");
      turnstileRef.current?.reset();
    }
  }

  return {
    handleSubmit,
    resetSubmission,
    setTurnstileToken,
    status,
    turnstileRef,
    turnstileToken,
  };
}
