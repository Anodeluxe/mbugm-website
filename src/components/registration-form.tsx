// components/registration-form.tsx
//
// 10-step paginated registration form. All form state, file uploads, image
// compression, CAPTCHA, and submission logic are preserved from the original.
// Pagination is purely presentational — the <form> tag wraps all steps so
// native validation and FormData construction remain unchanged.

"use client";

import Image from "next/image";
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import imageCompression from "browser-image-compression";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { submitApplication } from "@/server/actions/submit-application";
import { config, formatRupiah } from "@/lib/config";
import {
  getPlacementSessionTime,
  groupPlacementSessions,
} from "@/lib/placement-sessions";
import {
  AGAMA_OPTIONS,
  JENIS_KELAMIN_OPTIONS,
  GOLONGAN_DARAH_OPTIONS,
  JENJANG_STUDI_OPTIONS,
  JENIS_TEMPAT_OPTIONS,
} from "@/lib/constants";
import {
  ACCEPTED_IMAGE_TYPES,
  APPLICANT_TEXT_LIMITS,
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  MAX_UPLOAD_BYTES,
  PHONE_MAX_DIGITS,
  PHONE_MIN_DIGITS,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
  isValidBirthDate,
  isValidNim,
  isValidPhone,
  isValidTraits,
} from "@/lib/applicant-rules";

type SessionOption = {
  id: number;
  dayLabel: string;
  sessionNo: number;
  quota: number;
  bookedCount: number;
};

const REGISTRATION_FEE_LABEL = formatRupiah(config.registrationFee);

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

type FormValues = typeof INITIAL;

const COMPRESS_OPTS = { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true };
const DRAFT_DB_NAME = "mbugm-registration-draft";
const DRAFT_STORE_NAME = "drafts";
const DRAFT_KEY = "daftar-v1";
const SAVE_DEBOUNCE_MS = 400;

// Required fields per step — used for manual per-step validation before advancing.
const REQUIRED_PER_STEP: Partial<Record<number, (keyof FormValues)[]>> = {
  0: ["nim", "namaLengkap", "tempatLahir", "tanggalLahir", "jenisKelamin", "agama"],
  1: ["tigaKata"],
  2: ["fakultas", "prodi"],
  3: ["noTelp", "email"],
  9: ["sessionId"],
};

const FIELD_LABELS: Partial<Record<keyof FormValues, string>> = {
  nim: "NIM",
  namaLengkap: "Nama Lengkap",
  tempatLahir: "Tempat Lahir",
  tanggalLahir: "Tanggal Lahir",
  jenisKelamin: "Jenis Kelamin",
  agama: "Agama",
  tigaKata: "Sebutkan 3 sifat yang menggambarkan dirimu",
  fakultas: "Fakultas",
  prodi: "Program Studi",
  noTelp: "Nomor Telepon",
  email: "Email",
  sessionId: "Sesi Penempatan",
};

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

function todayInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function isValidEmail(value: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function isOptionalIntegerInRange(value: string, min: number, max: number) {
  if (!value.trim()) return true;
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max;
}

function validateImage(file: File | null, label: string) {
  if (!file) return `${label} wajib diunggah.`;
  if (file.size > MAX_UPLOAD_BYTES) return `${label} maksimal 7 MB.`;
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `${label} harus menggunakan format JPG atau PNG.`;
  }
  return null;
}

type DraftPayload = {
  submissionToken?: string;
  values: FormValues;
  currentStep: number;
  furthestStep?: number;
  pasFoto: File | null;
  ktm: File | null;
  paymentProof: File | null;
};

function hasDraftContent(
  values: FormValues,
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

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DRAFT_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        db.createObjectStore(DRAFT_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readDraft(): Promise<DraftPayload | null> {
  const db = await openDraftDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE_NAME, "readonly");
    const req = tx.objectStore(DRAFT_STORE_NAME).get(DRAFT_KEY);
    req.onsuccess = () => resolve((req.result as DraftPayload | undefined) ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => db.close();
    tx.onabort = () => db.close();
  });
}

async function writeDraft(draft: DraftPayload) {
  const db = await openDraftDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE_NAME, "readwrite");
    tx.objectStore(DRAFT_STORE_NAME).put(draft, DRAFT_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function clearDraft() {
  const db = await openDraftDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE_NAME, "readwrite");
    tx.objectStore(DRAFT_STORE_NAME).delete(DRAFT_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export function RegistrationForm({ sessions }: { sessions: SessionOption[] }) {
  const [submissionToken, setSubmissionToken] = useState(() => crypto.randomUUID());
  const [formLoadedAt] = useState(() => Date.now());
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const formTopRef = useRef<HTMLDivElement | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [pasFoto, setPasFoto] = useState<File | null>(null);
  const [ktm, setKtm] = useState<File | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState<
    "idle" | "saving" | "saved" | "clearing" | "deleted" | "error"
  >("idle");
  const sessionDays = groupPlacementSessions(sessions);
  const selectedSession = sessions.find((session) => String(session.id) === values.sessionId);
  const hasDraft = hasDraftContent(
    values,
    currentStep,
    pasFoto,
    ktm,
    paymentProof,
  );

  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "submitting" }
    | { state: "success"; referenceNumber: string; draftCleared: boolean }
    | { state: "error"; message: string }
  >({ state: "idle" });

  function update(name: keyof FormValues, value: string) {
    const nextValue = name === "noTelp" || name === "noOrtu"
      ? value.replace(/\D/g, "")
      : value;

    setValues((v) => ({ ...v, [name]: nextValue }));
  }

  function field(name: keyof FormValues) {
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
    setFile: (file: File | null) => void,
  ) {
    const file = event.target.files?.[0] ?? null;
    const error = validateImage(file, label);
    if (error) {
      event.target.value = "";
      setFile(null);
      setStepError(error);
      return;
    }

    setStepError(null);
    setFile(file);
  }

  const scrollToTop = useCallback(() => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const draft = await readDraft();
        if (!active) return;
        if (draft) {
          if (draft.submissionToken) setSubmissionToken(draft.submissionToken);
          setValues(draft.values);
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
    if (!draftReady || !hasDraft || status.state === "success") return;

    const timeout = window.setTimeout(() => {
      setDraftStatus("saving");
      void writeDraft({
        submissionToken,
        values,
        currentStep,
        furthestStep,
        pasFoto,
        ktm,
        paymentProof,
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
    pasFoto,
    ktm,
    paymentProof,
    hasDraft,
    status.state,
  ]);

  function validateStep(step: number): string | null {
    const missingField = REQUIRED_PER_STEP[step]?.find((key) => !values[key]?.trim());
    if (missingField) {
      return `Kolom "${FIELD_LABELS[missingField] ?? missingField}" wajib diisi.`;
    }

    const stepValidators: Partial<Record<number, () => string | null>> = {
      0: () => {
        if (!isValidNim(values.nim)) {
          return "NIM harus terdiri dari 5-32 karakter dan hanya boleh memakai huruf, angka, spasi, garis miring, titik, atau tanda hubung.";
        }
        if (values.namaLengkap.trim().length < 2) {
          return "Nama lengkap minimal 2 karakter.";
        }
        if (values.tempatLahir.trim().length < 2) {
          return "Tempat lahir minimal 2 karakter.";
        }
        if (!isValidBirthDate(values.tanggalLahir)) {
          return "Tanggal lahir harus berupa tanggal nyata antara 1 Januari 1900 dan hari ini.";
        }
        if (
          !isOptionalIntegerInRange(
            values.tinggiBadanCm,
            HEIGHT_MIN_CM,
            HEIGHT_MAX_CM,
          )
        ) {
          return `Tinggi badan harus berupa bilangan bulat ${HEIGHT_MIN_CM}-${HEIGHT_MAX_CM} cm.`;
        }
        if (
          !isOptionalIntegerInRange(
            values.beratBadanKg,
            WEIGHT_MIN_KG,
            WEIGHT_MAX_KG,
          )
        ) {
          return `Berat badan harus berupa bilangan bulat ${WEIGHT_MIN_KG}-${WEIGHT_MAX_KG} kg.`;
        }
        return null;
      },
      1: () =>
        isValidTraits(values.tigaKata)
          ? null
          : "Tuliskan tepat 3 sifat, pisahkan dengan koma, dan batasi setiap sifat maksimal 40 karakter.",
      2: () => {
        if (values.fakultas.trim().length < 2) {
          return "Fakultas minimal 2 karakter.";
        }
        if (values.prodi.trim().length < 2) {
          return "Program studi minimal 2 karakter.";
        }
        return null;
      },
      3: () => {
        if (!isValidPhone(values.noTelp)) {
          return `Nomor telepon harus mengandung ${PHONE_MIN_DIGITS}-${PHONE_MAX_DIGITS} digit.`;
        }
        if (!isValidEmail(values.email)) return "Format email belum valid.";
        return null;
      },
      4: () =>
        values.noOrtu.trim() && !isValidPhone(values.noOrtu)
          ? `Nomor telepon orang tua harus mengandung ${PHONE_MIN_DIGITS}-${PHONE_MAX_DIGITS} digit.`
          : null,
      7: () => {
        return (
          validateImage(pasFoto, "Pas foto") ??
          validateImage(ktm, "Foto KTM")
        );
      },
      8: () => validateImage(paymentProof, "Bukti pembayaran"),
      9: () => {
        if (sessions.length === 0) {
          return "Sesi penempatan belum tersedia. Hubungi panitia — pendaftaran belum bisa dikirim.";
        }
        if (!selectedSession) return "Pilih sesi penempatan yang tersedia.";
        if (selectedSession.bookedCount >= selectedSession.quota) {
          return "Sesi yang dipilih sudah penuh. Silakan pilih sesi lain.";
        }
        return null;
      },
    };

    return stepValidators[step]?.() ?? null;
  }

  function handleNext() {
    const err = validateStep(currentStep);
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
      await clearDraft();
      setSubmissionToken(crypto.randomUUID());
      setValues(INITIAL);
      setCurrentStep(0);
      setFurthestStep(0);
      setPasFoto(null);
      setKtm(null);
      setPaymentProof(null);
      setStepError(null);
      setStatus({ state: "idle" });
      setTurnstileToken("");
      turnstileRef.current?.reset();
      setDraftStatus("deleted");
      scrollToTop();
    } catch {
      setDraftStatus("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const imageError =
      validateImage(pasFoto, "Pas foto") ??
      validateImage(ktm, "Foto KTM") ??
      validateImage(paymentProof, "Bukti pembayaran");
    if (imageError) {
      return setStatus({ state: "error", message: imageError });
    }
    if (!turnstileToken) return setStatus({ state: "error", message: "Mohon selesaikan verifikasi CAPTCHA." });

    setStatus({ state: "submitting" });
    let compressedImages: File[];
    try {
      compressedImages = await Promise.all([
        imageCompression(pasFoto as File, COMPRESS_OPTS),
        imageCompression(ktm as File, COMPRESS_OPTS),
        imageCompression(paymentProof as File, COMPRESS_OPTS),
      ]);
    } catch {
      setStatus({
        state: "error",
        message: "Gambar gagal dikompres. Pilih file JPG atau PNG lain.",
      });
      return;
    }

    try {
      const [pasFotoC, ktmC, paymentProofC] = compressedImages;
      const fd = new FormData();
      for (const [k, v] of Object.entries(values)) fd.append(k, v);
      fd.append("submissionToken", submissionToken);
      fd.append("formLoadedAt", String(formLoadedAt));
      fd.append("turnstileToken", turnstileToken);
      fd.append("pasFoto", pasFotoC, "pasfoto.jpg");
      fd.append("ktm", ktmC, "ktm.jpg");
      fd.append("paymentProof", paymentProofC, "bukti-pembayaran.jpg");

      const result = await submitApplication(fd);
      if (result.ok) {
        let draftCleared = true;
        try {
          await clearDraft();
        } catch {
          draftCleared = false;
        }

        setValues(INITIAL);
        setPasFoto(null);
        setKtm(null);
        setPaymentProof(null);
        setDraftStatus(draftCleared ? "idle" : "error");
        setStatus({
          state: "success",
          referenceNumber: result.referenceNumber,
          draftCleared,
        });
        scrollToTop();
      } else {
        setStatus({ state: "error", message: result.error });
        turnstileRef.current?.reset();
        setTurnstileToken("");
      }
    } catch {
      setStatus({
        state: "error",
        message:
          "Koneksi ke server terputus. Isianmu masih tersimpan, silakan coba lagi.",
      });
      turnstileRef.current?.reset();
      setTurnstileToken("");
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
  const summarySections = [
    {
      title: "Data Diri",
      rows: [
        { label: "NIM", value: values.nim },
        { label: "Nama Lengkap", value: values.namaLengkap },
        { label: "Nama Panggilan", value: values.namaPanggilan },
        { label: "Tempat Lahir", value: values.tempatLahir },
        { label: "Tanggal Lahir", value: values.tanggalLahir },
        { label: "Jenis Kelamin", value: values.jenisKelamin },
        { label: "Agama", value: values.agama },
        { label: "Golongan Darah", value: values.golonganDarah },
        { label: "Tinggi Badan", value: values.tinggiBadanCm && `${values.tinggiBadanCm} cm` },
        { label: "Berat Badan", value: values.beratBadanKg && `${values.beratBadanKg} kg` },
      ],
    },
    {
      title: "Kesehatan dan Hobi",
      rows: [
        { label: "Riwayat Penyakit", value: values.riwayatPenyakit },
        { label: "Alergi", value: values.alergi },
        { label: "Hobi", value: values.hobi },
        { label: "3 Sifat", value: values.tigaKata },
      ],
    },
    {
      title: "Akademik",
      rows: [
        { label: "Jenjang Studi", value: values.jenjangStudi },
        { label: "Fakultas", value: values.fakultas },
        { label: "Program Studi", value: values.prodi },
        { label: "Asal SMA", value: values.asalSma },
      ],
    },
    {
      title: "Kontak dan Alamat",
      rows: [
        { label: "Nomor Telepon", value: values.noTelp },
        { label: "Email", value: values.email },
        { label: "Alamat Asal", value: values.alamatAsal },
        { label: "Tempat Tinggal di Jogja", value: values.jenisTempat },
        { label: "Alamat di Yogyakarta", value: values.alamatJogja },
      ],
    },
    {
      title: "Orang Tua atau Wali",
      rows: [
        { label: "Nama", value: values.namaOrtu },
        { label: "Nomor Telepon", value: values.noOrtu },
        { label: "Alamat", value: values.alamatOrtu },
      ],
    },
    {
      title: "Media Sosial",
      rows: [
        { label: "ID Line", value: values.idLine },
        { label: "Instagram", value: values.idInstagram },
        { label: "Facebook", value: values.idFacebook },
        { label: "X (Twitter)", value: values.idTwitter },
      ],
    },
    {
      title: "Pengalaman dan Minat",
      rows: [
        { label: "Pernah Ikut Marching Band", value: values.pernahMb === "true" ? "Ya" : "Tidak" },
        { label: "Unit Sebelumnya", value: values.unitSebelumnya },
        { label: "Section", value: values.section },
        { label: "Kemampuan Alat", value: values.kemampuanAlat },
        { label: "Bidang Tari", value: values.bidangTari },
        { label: "Bidang Musik", value: values.bidangMusik },
        { label: "Organisasi Lain", value: values.organisasi },
      ],
    },
    {
      title: "Berkas dan Penempatan",
      rows: [
        { label: "Pas Foto", value: pasFoto?.name ?? "Belum diunggah" },
        { label: "KTM", value: ktm?.name ?? "Belum diunggah" },
        { label: "Biaya", value: REGISTRATION_FEE_LABEL },
        { label: "Bukti Bayar", value: paymentProof?.name ?? "Belum diunggah" },
        {
          label: "Sesi",
          value: selectedSession
            ? `${selectedSession.dayLabel}, Sesi ${selectedSession.sessionNo}, ${getPlacementSessionTime(selectedSession.dayLabel, selectedSession.sessionNo)}`
            : "Belum dipilih",
        },
      ],
    },
  ];

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

        {/* —— Step 0: Data Diri —— */}
        {currentStep === 0 && (
          <fieldset>
            <legend>Data Diri</legend>
            <div className="space-y-4">
              <Field label="NIM" required>
                <input {...textField("nim")} placeholder="mis. 23/123456/PA/12345" autoComplete="off" />
              </Field>
              <Field label="Nama Lengkap" required>
                <input {...textField("namaLengkap")} placeholder="Sesuai KTP atau KTM" autoComplete="name" />
              </Field>
              <Field label="Nama Panggilan">
                <input {...textField("namaPanggilan")} placeholder="mis. Budi" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Tempat Lahir" required>
                  <input {...textField("tempatLahir")} placeholder="mis. Yogyakarta" />
                </Field>
                <Field label="Tanggal Lahir" required>
                  <input type="date" min="1900-01-01" max={todayInputValue()} {...field("tanggalLahir")} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Jenis Kelamin" required>
                  <select {...field("jenisKelamin")}>
                    <option value="" disabled>Pilih opsi</option>
                    {JENIS_KELAMIN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Agama" required>
                  <select {...field("agama")}>
                    <option value="" disabled>Pilih opsi</option>
                    {AGAMA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Golongan Darah">
                  <select {...field("golonganDarah")}>
                    <option value="">Pilih opsi</option>
                    {GOLONGAN_DARAH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Tinggi Badan (cm)">
                  <input type="number" min={HEIGHT_MIN_CM} max={HEIGHT_MAX_CM} step="1" {...field("tinggiBadanCm")} placeholder="170" />
                </Field>
                <Field label="Berat Badan (kg)">
                  <input type="number" min={WEIGHT_MIN_KG} max={WEIGHT_MAX_KG} step="1" {...field("beratBadanKg")} placeholder="60" />
                </Field>
              </div>
            </div>
          </fieldset>
        )}

        {/* —— Step 1: Kesehatan & Hobi —— */}
        {currentStep === 1 && (
          <fieldset>
            <legend>Kesehatan dan Hobi</legend>
            <div className="space-y-4">
              <Field label="Riwayat Penyakit">
                <textarea {...textField("riwayatPenyakit")} placeholder="Tulis jika ada, atau kosongkan jika tidak ada" />
              </Field>
              <Field label="Alergi">
                <textarea {...textField("alergi")} placeholder="mis. debu atau obat tertentu. Kosongkan jika tidak ada" />
              </Field>
              <Field label="Hobi">
                <input {...textField("hobi")} placeholder="mis. membaca, bermain musik, olahraga" />
              </Field>
              <Field label="Sebutkan 3 sifat yang menggambarkan dirimu" required>
                <input
                  {...textField("tigaKata")}
                  placeholder="mis. tekun, ramah, kreatif"
                />
                <p className="text-xs text-warm-gray mt-1 font-body">Pisahkan dengan koma.</p>
              </Field>
            </div>
          </fieldset>
        )}

        {/* —— Step 2: Data Akademik —— */}
        {currentStep === 2 && (
          <fieldset>
            <legend>Data Akademik</legend>
            <div className="space-y-4">
              <Field label="Jenjang Studi">
                <select {...field("jenjangStudi")}>
                  <option value="">Pilih opsi</option>
                  {JENJANG_STUDI_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Fakultas" required>
                <input {...textField("fakultas")} placeholder="mis. Teknik, MIPA, Ekonomika dan Bisnis" />
              </Field>
              <Field label="Program Studi" required>
                <input {...textField("prodi")} placeholder="mis. Teknik Informatika, Matematika" />
              </Field>
              <Field label="Asal SMA atau Sederajat">
                <input {...textField("asalSma")} placeholder="mis. SMAN 1 Yogyakarta" />
              </Field>
            </div>
          </fieldset>
        )}

        {/* —— Step 3: Kontak & Alamat —— */}
        {currentStep === 3 && (
          <fieldset>
            <legend>Kontak dan Alamat</legend>
            <div className="space-y-4">
              <Field label="Nomor Telepon atau WhatsApp" required>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={PHONE_MAX_DIGITS}
                  {...field("noTelp")}
                  placeholder="mis. 081234567890"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Alamat Email" required>
                <input
                  type="email"
                  {...textField("email")}
                  placeholder="mis. nama@mail.ugm.ac.id"
                  autoComplete="email"
                />
              </Field>
              <Field label="Alamat Asal">
                <textarea {...textField("alamatAsal")} placeholder="Alamat sesuai KTP atau domisili asal" />
              </Field>
              <Field label="Jenis Tempat Tinggal di Jogja">
                <select {...field("jenisTempat")}>
                  <option value="">Pilih opsi</option>
                  {JENIS_TEMPAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Alamat di Yogyakarta">
                <textarea {...textField("alamatJogja")} placeholder="Alamat kos, asrama, atau rumah saat ini di Yogyakarta" />
              </Field>
            </div>
          </fieldset>
        )}

        {/* —— Step 4: Orang Tua / Wali —— */}
        {currentStep === 4 && (
          <fieldset>
            <legend>Data Orang Tua atau Wali</legend>
            <div className="space-y-4">
              <Field label="Nama Orang Tua atau Wali">
                <input {...textField("namaOrtu")} placeholder="mis. Bapak/Ibu Santoso" />
              </Field>
              <Field label="Nomor Telepon Orang Tua atau Wali">
                <input type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={PHONE_MAX_DIGITS} {...field("noOrtu")} placeholder="mis. 082198765432" />
              </Field>
              <Field label="Alamat Orang Tua atau Wali">
                <textarea {...textField("alamatOrtu")} placeholder="Alamat lengkap orang tua atau wali" />
              </Field>
            </div>
          </fieldset>
        )}

        {/* —— Step 5: Media Sosial —— */}
        {currentStep === 5 && (
          <fieldset>
            <legend>Media Sosial</legend>
            <p className="font-body text-warm-gray text-sm mb-5 leading-relaxed">
              Semua kolom bersifat opsional. Isi nama pengguna akun aktifmu tanpa awalan @.
            </p>
            <div className="space-y-4">
              <Field label="ID Line">
                <input {...textField("idLine")} placeholder="idlinekamu" />
              </Field>
              <Field label="Instagram">
                <input {...textField("idInstagram")} placeholder="@usernamekamu" />
              </Field>
              <Field label="Facebook">
                <input {...textField("idFacebook")} placeholder="username Facebook" />
              </Field>
              <Field label="X (Twitter)">
                <input {...textField("idTwitter")} placeholder="@usernamekamu" />
              </Field>
            </div>
          </fieldset>
        )}

        {/* —— Step 6: Pengalaman Marching Band —— */}
        {currentStep === 6 && (
          <fieldset>
            <legend>Pengalaman Marching Band</legend>
            <div className="space-y-4">
              <Field label="Pernah Ikut Marching Band Sebelumnya?">
                <select {...field("pernahMb")}>
                  <option value="false">Tidak</option>
                  <option value="true">Ya</option>
                </select>
              </Field>
              {values.pernahMb === "true" && (
                <>
                  <Field label="Nama Unit Sebelumnya">
                    <input {...textField("unitSebelumnya")} placeholder="mis. Gita Bahana Taruna, SMA Taruna Nusantara" />
                  </Field>
                  <Field label="Section">
                    <input {...textField("section")} placeholder="mis. Trumpet, Snare, Color Guard" />
                  </Field>
                  <Field label="Kemampuan Alat">
                    <textarea {...textField("kemampuanAlat")} placeholder="Jelaskan kemampuan bermain alat musik atau menari yang kamu miliki" />
                  </Field>
                </>
              )}
              <Field label="Bidang Tari yang Diminati">
                <input {...textField("bidangTari")} placeholder="mis. Color Guard, Majorette, atau Flag. Kosongkan jika tidak ada" />
              </Field>
              <Field label="Bidang Musik yang Diminati">
                <input {...textField("bidangMusik")} placeholder="mis. Brass, Battery Percussion, atau Pit. Kosongkan jika tidak ada" />
              </Field>
              <Field label="Organisasi Lain yang Diikuti">
                <input {...textField("organisasi")} placeholder="mis. BEM Fakultas, UKM Paduan Suara" />
              </Field>
            </div>
          </fieldset>
        )}

        {/* —— Step 7: Berkas —— */}
        {currentStep === 7 && (
          <fieldset>
            <legend>Berkas</legend>
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-parchment/50 border border-border text-sm font-body text-warm-gray leading-relaxed mb-2">
                <strong className="text-ink">Ketentuan foto:</strong> Format JPG atau PNG, ukuran maksimal 7 MB per file.
                Foto akan dikompres otomatis sebelum dikirim.
              </div>
              <Field label="Pas Foto (latar polos, wajah terlihat jelas)" required>
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={(event) =>
                    handleImageChange(event, "Pas foto", setPasFoto)
                  }
                />
                {pasFoto && (
                  <p className="text-xs text-crimson mt-1 font-body font-medium">
                    Terpilih: {pasFoto.name}
                  </p>
                )}
              </Field>
              <Field label="Foto Kartu Tanda Mahasiswa (KTM)" required>
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={(event) =>
                    handleImageChange(event, "Foto KTM", setKtm)
                  }
                />
                {ktm && (
                  <p className="text-xs text-crimson mt-1 font-body font-medium">
                    Terpilih: {ktm.name}
                  </p>
                )}
              </Field>
            </div>
          </fieldset>
        )}

        {/* —— Step 8: Pembayaran —— */}
        {currentStep === 8 && (
          <fieldset>
            <legend>Pembayaran</legend>
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-ink text-balance">
                  Pembayaran Biaya Pendaftaran
                </h2>
                <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-warm-gray text-pretty">
                  Lakukan pembayaran sebesar{" "}
                  <strong className="font-semibold text-ink">{REGISTRATION_FEE_LABEL}</strong>{" "}
                  melalui QRIS berikut, lalu unggah screenshot bukti pembayaranmu.
                </p>
              </div>

              <div className="grid items-start gap-5 sm:grid-cols-[minmax(0,280px)_1fr]">
                <div className="rounded-2xl bg-paper p-3 shadow-[0_0_0_1px_rgba(34,30,27,0.10),0_2px_8px_rgba(34,30,27,0.06)]">
                  <Image
                    src="/figma/qris_mbugm.jpeg"
                    alt="QRIS pembayaran PAB Marching Band UGM 2026"
                    width={912}
                    height={1280}
                    className="h-auto w-full rounded-lg outline outline-1 -outline-offset-1 outline-black/10"
                    sizes="(max-width: 640px) calc(100vw - 56px), 280px"
                  />
                </div>

                <div className="rounded-xl bg-parchment/35 p-4 font-body text-sm text-warm-gray">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-warm-gray">
                    Total Pembayaran
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-crimson">
                    {REGISTRATION_FEE_LABEL}
                  </p>
                  <div className="my-4 h-px bg-border" />
                  <p className="font-semibold text-ink">Cara pembayaran</p>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 leading-relaxed">
                    <li>Scan QRIS menggunakan aplikasi pembayaran.</li>
                    <li>
                      Masukkan nominal {REGISTRATION_FEE_LABEL} dan periksa tujuan pembayaran.
                    </li>
                    <li>Simpan screenshot transaksi yang berhasil.</li>
                  </ol>
                  <a
                    href="/figma/qris_mbugm.jpeg"
                    download="QRIS-PAB-MBUGM-2026.jpeg"
                    className="mt-4 inline-flex min-h-10 items-center rounded-md bg-ink px-4 py-2 text-xs font-bold text-paper transition-[background-color,transform] duration-150 ease-out hover:bg-crimson active:scale-[0.96]"
                  >
                    Simpan Gambar QRIS
                  </a>
                </div>
              </div>

              <Field label="Screenshot Bukti Pembayaran" required>
                <input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={(event) =>
                    handleImageChange(
                      event,
                      "Bukti pembayaran",
                      setPaymentProof,
                    )
                  }
                />
                <p className="mt-1 text-xs leading-relaxed text-warm-gray font-body">
                  Format JPG atau PNG, ukuran maksimal 7 MB. Pastikan status transaksi dan tujuan pembayaran terlihat jelas.
                </p>
                {paymentProof && (
                  <p className="mt-1 text-xs font-medium text-crimson font-body">
                    Terpilih: {paymentProof.name}
                  </p>
                )}
              </Field>
            </div>
          </fieldset>
        )}

        {/* —— Step 9: Penempatan & Verifikasi —— */}
        {currentStep === 9 && (
          <fieldset>
            <legend>Penempatan dan Verifikasi</legend>
            <div className="space-y-6">
              <div>
                <p id="session-picker-label" className="font-body text-sm font-semibold text-ink">
                  Sesi Penempatan
                  <span className="text-crimson ml-1" aria-label="wajib diisi">*</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-warm-gray text-pretty">
                  Pilih satu hari dan sesi yang paling sesuai. Kapasitas maksimal 40 peserta per sesi.
                </p>

                {sessionDays.length > 0 ? (
                  <div
                    className="mt-5 space-y-5"
                    role="radiogroup"
                    aria-labelledby="session-picker-label"
                  >
                    {sessionDays.map((day) => (
                      <section key={day.dayLabel} aria-label={day.dayLabel}>
                        <h3 className="font-body text-sm font-bold text-ink mb-2">
                          {day.dayLabel}
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {day.sessions.map((session) => {
                            const selected = values.sessionId === String(session.id);
                            const full = session.bookedCount >= session.quota;

                            return (
                              <button
                                key={session.id}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                disabled={full}
                                onClick={() => update("sessionId", String(session.id))}
                                className={`min-h-24 rounded-lg px-4 py-3.5 text-left font-body transition-[background-color,box-shadow,transform] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100 ${
                                  selected
                                    ? "bg-crimson/5 ring-2 ring-crimson"
                                    : "bg-paper ring-1 ring-ink/15 hover:bg-parchment/25 hover:ring-crimson/50 active:scale-[0.96]"
                                }`}
                              >
                                <span className="flex items-start justify-between gap-4">
                                  <span>
                                    <span className="block text-sm font-bold text-ink">
                                      Sesi {session.sessionNo}
                                    </span>
                                    <span className="mt-1 block text-sm text-warm-gray tabular-nums">
                                      {getPlacementSessionTime(day.dayLabel, session.sessionNo)}
                                    </span>
                                  </span>
                                  <span
                                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-200 ${
                                      selected
                                        ? "bg-crimson text-paper ring-1 ring-crimson"
                                        : "bg-paper text-transparent ring-1 ring-ink/30"
                                    }`}
                                    aria-hidden="true"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </span>
                                </span>
                                <span className={`mt-3 block text-xs font-semibold tabular-nums ${full ? "text-crimson" : "text-warm-gray"}`}>
                                  {session.bookedCount}/{session.quota} peserta{full ? ", penuh" : ""}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg border border-crimson/20 bg-crimson/5 px-4 py-3 text-sm text-crimson"
                  >
                    Belum ada sesi penempatan yang tersedia. Pendaftaran belum bisa
                    dikirim — silakan hubungi panitia.
                  </p>
                )}
              </div>

              {/* Summary review */}
              <div className="rounded-xl border border-border bg-parchment/30 p-5 sm:p-6">
                <p className="font-body text-xs font-bold tracking-[0.12em] text-warm-gray uppercase">
                  Ringkasan Data
                </p>
                <div className="mt-4 divide-y divide-border/80">
                  {summarySections.map(({ title, rows }) => {
                    const visibleRows = rows.filter(({ value }) => value.trim());
                    if (visibleRows.length === 0) return null;

                    return (
                      <section key={title} className="py-4 first:pt-0 last:pb-0">
                        <h3 className="font-body text-xs font-bold text-ink">
                          {title}
                        </h3>
                        <dl className="mt-2.5 space-y-2">
                          {visibleRows.map(({ label, value }) => (
                            <div
                              key={label}
                              className="grid gap-0.5 font-body text-sm sm:grid-cols-[10.5rem_minmax(0,1fr)] sm:gap-4"
                            >
                              <dt className="text-warm-gray">{label}</dt>
                              <dd className="min-w-0 whitespace-pre-wrap break-words font-medium text-ink">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    );
                  })}
                </div>
              </div>

              {/* Turnstile CAPTCHA ─ only mounts on last step */}
              <div>
                <p className="font-body text-xs font-bold tracking-[0.12em] text-warm-gray uppercase mb-2">
                  Verifikasi
                </p>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken("")}
                  onExpire={() => setTurnstileToken("")}
                />
              </div>

              {status.state === "error" && (
                <p role="alert" className="font-body text-sm text-crimson bg-crimson/5 border border-crimson/20 rounded-lg px-4 py-3">
                  {status.message}
                </p>
              )}
            </div>
          </fieldset>
        )}

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

/* ── Field wrapper ── */
function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const controlId = useId();
  const childArray = Children.toArray(children);
  const controlIndex = childArray.findIndex((child) => isValidElement(child));
  const labelledChildren = childArray.map((child, index) =>
    index === controlIndex && isValidElement(child)
      ? cloneElement(
          child as React.ReactElement<{ id?: string }>,
          { id: controlId },
        )
      : child,
  );

  return (
    <div className="relative">
      <label
        htmlFor={controlId}
        className="block font-body text-sm font-semibold text-ink mb-1.5"
      >
        {label}
        {required && (
          <span className="text-crimson ml-1" aria-label="wajib diisi">*</span>
        )}
      </label>
      {labelledChildren}
    </div>
  );
}

