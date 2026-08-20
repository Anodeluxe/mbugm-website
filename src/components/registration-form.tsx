// components/registration-form.tsx
//
// 10-step paginated registration form. All form state, file uploads, image
// compression, CAPTCHA, and submission logic are preserved from the original.
// Pagination is purely presentational — the <form> tag wraps all steps so
// native validation and FormData construction remain unchanged.

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { APPLICANT_TEXT_LIMITS } from "@/lib/applicant-rules";
import type { DraftAttachmentName } from "@/lib/registration-draft";
import { RegistrationDraftStore } from "@/lib/registration-draft-store";
import {
  type PlacementSessionOption,
  RegistrationStepValidator,
  validateRegistrationImage,
} from "@/lib/registration-step-validator";
import { useRegistrationSubmission } from "@/hooks/use-registration-submission";
import { RegistrationFormSteps } from "@/components/registration-form-steps";

const INITIAL = {
  nim: "", namaLengkap: "", namaPanggilan: "", tempatLahir: "", tanggalLahir: "",
  jenisKelamin: "", agama: "", golonganDarah: "", tinggiBadanCm: "", beratBadanKg: "",
  riwayatPenyakit: "", alergi: "", hobi: "", tigaKata: "", jenjangStudi: "", fakultas: "",
  prodi: "", asalSma: "", noTelp: "", email: "", alamatAsal: "", jenisTempat: "",
  alamatJogja: "", namaOrtu: "", noOrtu: "", alamatOrtu: "", idLine: "", idInstagram: "",
  idFacebook: "", idTwitter: "", bidangTari: "", bidangMusik: "", organisasi: "",
  pernahMb: "false", unitSebelumnya: "", section: "", kemampuanAlat: "", sessionId: "",
  website: "",
};

export type RegistrationFormValues = typeof INITIAL;

const draftStore = new RegistrationDraftStore<RegistrationFormValues>();
const SAVE_DEBOUNCE_MS = 400;

const STEPS = [
  { label: "Data Diri" },
  { label: "Kesehatan dan Hobi" },
  { label: "Data Akademik" },
  { label: "Kontak dan Alamat" },
  { label: "Orang Tua atau Wali" },
  { label: "Media Sosial" },
  { label: "Pengalaman MB" },
  { label: "Berkas" },
  { label: "Pembayaran" },
  { label: "Penempatan" },
];

const TOTAL_STEPS = STEPS.length;

function hasDraftContent(
  values: RegistrationFormValues,
  currentStep: number,
  pasFoto: File | null,
  ktm: File | null,
  paymentProof: File | null,
) {
  return (
    currentStep > 0 ||
    Boolean(pasFoto || ktm || paymentProof) ||
    Object.entries(values).some(
      ([name, value]) =>
        name !== "pernahMb" && name !== "website" && value.trim() !== "",
    )
  );
}

export function RegistrationForm({
  sessions,
}: {
  sessions: PlacementSessionOption[];
}) {
  const [submissionToken, setSubmissionToken] = useState(() => crypto.randomUUID());
  const formTopRef = useRef<HTMLDivElement | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [values, setValues] = useState<RegistrationFormValues>(INITIAL);
  const [pasFoto, setPasFoto] = useState<File | null>(null);
  const [ktm, setKtm] = useState<File | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState<
    "idle" | "saving" | "saved" | "clearing" | "deleted" | "error"
  >("idle");
  const hasDraft = hasDraftContent(
    values,
    currentStep,
    pasFoto,
    ktm,
    paymentProof,
  );

  function update(name: keyof RegistrationFormValues, value: string) {
    const nextValue = name === "noTelp" || name === "noOrtu"
      ? value.replace(/\D/g, "")
      : value;

    setValues((v) => ({ ...v, [name]: nextValue }));
  }

  function field(name: keyof RegistrationFormValues) {
    return {
      value: values[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        update(name, e.target.value),
    };
  }

  function textField(name: keyof typeof APPLICANT_TEXT_LIMITS) {
    return {
      ...field(name),
      maxLength: APPLICANT_TEXT_LIMITS[name],
    };
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
    label: string,
    name: DraftAttachmentName,
    setFile: (file: File | null) => void,
  ) {
    const file = event.target.files?.[0] ?? null;
    const error = validateRegistrationImage(file, label);
    if (error) {
      event.target.value = "";
      setFile(null);
      setStepError(error);
      setDraftStatus("saving");
      void draftStore.saveAttachment(name, null)
        .then(() => setDraftStatus("saved"))
        .catch(() => setDraftStatus("error"));
      return;
    }

    setStepError(null);
    setFile(file);
    setDraftStatus("saving");
    void draftStore.saveAttachment(name, file)
      .then(() => setDraftStatus("saved"))
      .catch(() => setDraftStatus("error"));
  }

  const scrollToTop = useCallback(() => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const {
    handleSubmit,
    resetSubmission,
    setTurnstileToken,
    status,
    turnstileRef,
    turnstileToken,
  } = useRegistrationSubmission({
    values,
    submissionToken,
    pasFoto,
    ktm,
    paymentProof,
    clearDraft: () => draftStore.clear(),
    onSuccess: (draftCleared) => {
      setValues(INITIAL);
      setPasFoto(null);
      setKtm(null);
      setPaymentProof(null);
      setDraftStatus(draftCleared ? "idle" : "error");
    },
    scrollToTop,
  });

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const draft = await draftStore.load();
        if (!active) return;
        if (draft) {
          if (draft.submissionToken) setSubmissionToken(draft.submissionToken);
          setValues({ ...INITIAL, ...draft.values });
          const restoredStep = Math.max(0, Math.min(draft.currentStep, TOTAL_STEPS - 1));
          setCurrentStep(restoredStep);
          setFurthestStep(
            Math.max(
              restoredStep,
              Math.min(draft.furthestStep ?? restoredStep, TOTAL_STEPS - 1),
            ),
          );
          setPasFoto(draft.pasFoto);
          setKtm(draft.ktm);
          setPaymentProof(draft.paymentProof ?? null);
          setDraftStatus("saved");
        }
      } catch {
        if (active) setDraftStatus("error");
      } finally {
        if (active) setDraftReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!draftReady || status.state === "success") return;

    const timeout = window.setTimeout(() => {
      if (!hasDraft) {
        void draftStore.clear().catch(() => setDraftStatus("error"));
        return;
      }

      setDraftStatus("saving");
      void draftStore.saveMetadata({
        submissionToken,
        values,
        currentStep,
        furthestStep,
      })
        .then(() => setDraftStatus("saved"))
        .catch(() => setDraftStatus("error"));
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [
    draftReady,
    submissionToken,
    values,
    currentStep,
    furthestStep,
    hasDraft,
    status.state,
  ]);

  function handleNext() {
    const err = new RegistrationStepValidator({
      values,
      sessions,
      pasFoto,
      ktm,
      paymentProof,
    }).validate(currentStep);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setFurthestStep((step) => Math.max(step, nextStep));
    scrollToTop();
  }

  function goToStep(step: number) {
    if (step < 0 || step > furthestStep || step >= TOTAL_STEPS) return;
    setStepError(null);
    setCurrentStep(step);
    scrollToTop();
  }

  function handleBack() {
    goToStep(currentStep - 1);
  }

  async function handleClearDraft() {
    const confirmed = window.confirm(
      "Hapus seluruh isian dan berkas draf dari perangkat ini?",
    );
    if (!confirmed) return;

    setDraftStatus("clearing");
    try {
      await draftStore.clear();
      setSubmissionToken(crypto.randomUUID());
      setValues(INITIAL);
      setCurrentStep(0);
      setFurthestStep(0);
      setPasFoto(null);
      setKtm(null);
      setPaymentProof(null);
      setStepError(null);
      resetSubmission();
      setDraftStatus("deleted");
      scrollToTop();
    } catch {
      setDraftStatus("error");
    }
  }

  /* —— Success screen —— */
  if (status.state === "success") {
    return (
      <div ref={formTopRef} className="rounded-2xl border border-border bg-parchment/30 p-8 sm:p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-crimson flex items-center justify-center mx-auto mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FBFAF4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-2">
          Pendaftaran berhasil
        </h2>
        <p className="font-body text-warm-gray text-sm mb-8 max-w-[40ch] mx-auto leading-relaxed">
          Formulirmu telah kami terima. Simpan nomor referensi berikut sebagai bukti pendaftaran.
        </p>
        <div className="inline-block bg-paper border-2 border-crimson rounded-xl px-8 py-5 mb-8">
          <p className="font-body text-xs font-bold tracking-[0.14em] text-warm-gray uppercase mb-1">
            Nomor Referensi
          </p>
          <p className="font-display text-2xl font-bold text-crimson tracking-wider">
            {status.referenceNumber}
          </p>
        </div>
        <p className="font-body text-warm-gray text-xs max-w-[42ch] mx-auto leading-relaxed">
          Pantau informasi lanjutan melalui email atau media sosial resmi{" "}
          <strong className="text-ink">@mbugm.official</strong>.
        </p>
        {!status.draftCleared && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-crimson/20 bg-crimson/5 px-4 py-3 font-body text-xs leading-relaxed text-crimson"
          >
            Pendaftaran tetap berhasil, tetapi draf di perangkat ini belum
            terhapus. Hapus data situs melalui pengaturan browser jika perangkat
            digunakan bersama.
          </p>
        )}
      </div>
    );
  }

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <div ref={formTopRef}>
      {/* —— Progress header —— */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-xs font-bold text-warm-gray tracking-wide">
            Langkah {currentStep + 1} dari {TOTAL_STEPS}
          </span>
          <span className="font-body text-xs font-semibold text-crimson">
            {STEPS[currentStep].label}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-border rounded-full overflow-hidden" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
          <div
            className="h-full bg-crimson rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Mobile step dots */}
        <div className="flex gap-1 mt-3 justify-center sm:hidden" aria-hidden="true">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ${
                i === currentStep
                  ? "w-5 h-1.5 bg-crimson"
                  : i < currentStep
                  ? "w-1.5 h-1.5 bg-crimson/40"
                  : "w-1.5 h-1.5 bg-border"
              }`}
            />
          ))}
        </div>
        <nav
          className="mt-4 hidden items-center justify-center gap-1 sm:flex"
          aria-label="Navigasi langkah formulir"
        >
          <button
            type="button"
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="flex size-9 items-center justify-center rounded-md border border-border bg-paper text-ink transition-colors hover:border-ink/40 hover:bg-parchment/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Langkah sebelumnya"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          {STEPS.map((step, index) => {
            const isCurrent = index === currentStep;
            const isUnlocked = index <= furthestStep;

            return (
              <button
                key={step.label}
                type="button"
                onClick={() => goToStep(index)}
                disabled={!isUnlocked}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Langkah ${index + 1}: ${step.label}`}
                title={step.label}
                className={`size-9 rounded-md border font-body text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson ${
                  isCurrent
                    ? "border-crimson bg-crimson text-paper"
                    : isUnlocked
                      ? "border-border bg-paper text-ink hover:border-ink/40 hover:bg-parchment/40"
                      : "cursor-not-allowed border-border/70 bg-border/20 text-warm-gray/55"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => goToStep(currentStep + 1)}
            disabled={currentStep >= furthestStep}
            className="flex size-9 items-center justify-center rounded-md border border-border bg-paper text-ink transition-colors hover:border-ink/40 hover:bg-parchment/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Langkah berikutnya yang sudah dibuka"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </nav>
        <div
          className="mt-3 flex min-h-5 items-center justify-center gap-3 text-center font-body text-xs text-warm-gray"
          aria-live="polite"
        >
          <span>
            {draftStatus === "saving" && "Menyimpan draf"}
            {draftStatus === "saved" && "Draf tersimpan di perangkat ini."}
            {draftStatus === "clearing" && "Menghapus draf"}
            {draftStatus === "deleted" && "Draf telah dihapus dari perangkat ini."}
            {draftStatus === "error" && "Draf gagal diproses."}
            {draftStatus === "idle" && "\u00A0"}
          </span>
          {hasDraft && draftStatus !== "deleted" && (
            <button
              type="button"
              onClick={handleClearDraft}
              disabled={
                draftStatus === "clearing" || status.state === "submitting"
              }
              className="shrink-0 font-semibold text-crimson underline decoration-crimson/40 underline-offset-2 transition-colors hover:text-crimson-press disabled:cursor-not-allowed disabled:opacity-45"
            >
              Hapus draf
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Honeypot */}
        <input
          type="text" name="website" {...textField("website")}
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: "1px", opacity: 0 }}
        />

        <RegistrationFormSteps
          currentStep={currentStep}
          values={values}
          field={field}
          textField={textField}
          update={update}
          sessions={sessions}
          pasFoto={pasFoto}
          ktm={ktm}
          paymentProof={paymentProof}
          onPasFotoChange={(event) =>
            handleImageChange(event, "Pas foto", "pasFoto", setPasFoto)
          }
          onKtmChange={(event) =>
            handleImageChange(event, "Foto KTM", "ktm", setKtm)
          }
          onPaymentProofChange={(event) =>
            handleImageChange(
              event,
              "Bukti pembayaran",
              "paymentProof",
              setPaymentProof,
            )
          }
          turnstileRef={turnstileRef}
          onTurnstileTokenChange={setTurnstileToken}
          submissionError={status.state === "error" ? status.message : null}
        />

        {/* ── Step-level validation error ── */}
        {stepError && (
          <p role="alert" className="mt-4 font-body text-sm text-crimson bg-crimson/5 border border-crimson/20 rounded-lg px-4 py-3">
            {stepError}
          </p>
        )}

        {/* ── Navigation buttons ── */}
        <div className={`mt-8 flex ${currentStep > 0 ? "justify-between" : "justify-end"}`}>
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2.5 border-2 border-ink text-ink hover:bg-ink hover:text-paper font-body font-semibold rounded-md text-sm transition-colors"
            >
              Kembali
            </button>
          )}

          {!isLastStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-crimson hover:bg-crimson-press text-paper font-body font-semibold rounded-md text-sm transition-colors flex items-center gap-2"
            >
              Lanjut
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={status.state === "submitting" || !turnstileToken || sessions.length === 0}
              className="px-6 py-2.5 bg-crimson hover:bg-crimson-press text-paper font-body font-semibold rounded-md text-sm transition-colors disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {status.state === "submitting" ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Mengirim pendaftaran
                </>
              ) : (
                <>
                  Kirim Pendaftaran
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

