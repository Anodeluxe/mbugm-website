// components/registration-form.tsx
//
// 9-step paginated registration form. All form state, file uploads, image
// compression, CAPTCHA, and submission logic are preserved from the original.
// Pagination is purely presentational — the <form> tag wraps all steps so
// native validation and FormData construction remain unchanged.

"use client";

import { useRef, useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { submitApplication } from "@/server/actions/submit-application";
import {
  AGAMA_OPTIONS,
  JENIS_KELAMIN_OPTIONS,
  GOLONGAN_DARAH_OPTIONS,
  JENJANG_STUDI_OPTIONS,
  JENIS_TEMPAT_OPTIONS,
} from "@/lib/constants";

type SessionOption = { id: number; dayLabel: string; sessionNo: number };

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

// Required fields per step — used for manual per-step validation before advancing.
const REQUIRED_PER_STEP: Partial<Record<number, (keyof FormValues)[]>> = {
  0: ["nim", "namaLengkap", "tempatLahir", "tanggalLahir", "jenisKelamin", "agama"],
  1: ["tigaKata"],
  2: ["fakultas", "prodi"],
  3: ["noTelp", "email"],
};

const STEPS = [
  { label: "Data Diri" },
  { label: "Kesehatan & Hobi" },
  { label: "Data Akademik" },
  { label: "Kontak & Alamat" },
  { label: "Orang Tua / Wali" },
  { label: "Media Sosial" },
  { label: "Pengalaman MB" },
  { label: "Berkas" },
  { label: "Penempatan" },
];

const TOTAL_STEPS = STEPS.length;

export function RegistrationForm({ sessions }: { sessions: SessionOption[] }) {
  const [submissionToken] = useState(() => crypto.randomUUID());
  const [formLoadedAt] = useState(() => Date.now());
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const formTopRef = useRef<HTMLDivElement | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [pasFoto, setPasFoto] = useState<File | null>(null);
  const [ktm, setKtm] = useState<File | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "submitting" }
    | { state: "success"; referenceNumber: string }
    | { state: "error"; message: string }
  >({ state: "idle" });

  function update(name: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function field(name: keyof FormValues) {
    return {
      value: values[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        update(name, e.target.value),
    };
  }

  const scrollToTop = useCallback(() => {
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  function validateStep(step: number): string | null {
    const required = REQUIRED_PER_STEP[step];
    if (!required) return null;
    for (const key of required) {
      if (!values[key]?.trim()) {
        const labels: Record<string, string> = {
          nim: "NIM",
          namaLengkap: "Nama Lengkap",
          tempatLahir: "Tempat Lahir",
          tanggalLahir: "Tanggal Lahir",
          jenisKelamin: "Jenis Kelamin",
          agama: "Agama",
          tigaKata: "3 Kata tentang Dirimu",
          fakultas: "Fakultas",
          prodi: "Program Studi",
          noTelp: "Nomor Telepon",
          email: "Email",
        };
        return `Kolom "${labels[key] ?? key}" wajib diisi.`;
      }
    }
    return null;
  }

  function handleNext() {
    const err = validateStep(currentStep);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setCurrentStep((s) => s + 1);
    scrollToTop();
  }

  function handleBack() {
    setStepError(null);
    setCurrentStep((s) => s - 1);
    scrollToTop();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasFoto) return setStatus({ state: "error", message: "Mohon unggah pas foto." });
    if (!ktm) return setStatus({ state: "error", message: "Mohon unggah foto KTM." });
    if (!turnstileToken) return setStatus({ state: "error", message: "Mohon selesaikan verifikasi CAPTCHA." });

    setStatus({ state: "submitting" });
    try {
      const [pasFotoC, ktmC] = await Promise.all([
        imageCompression(pasFoto, COMPRESS_OPTS),
        imageCompression(ktm, COMPRESS_OPTS),
      ]);

      const fd = new FormData();
      for (const [k, v] of Object.entries(values)) fd.append(k, v);
      fd.append("submissionToken", submissionToken);
      fd.append("formLoadedAt", String(formLoadedAt));
      fd.append("turnstileToken", turnstileToken);
      fd.append("pasFoto", pasFotoC, "pasfoto.jpg");
      fd.append("ktm", ktmC, "ktm.jpg");

      const result = await submitApplication(fd);
      if (result.ok) {
        setStatus({ state: "success", referenceNumber: result.referenceNumber });
        scrollToTop();
      } else {
        setStatus({ state: "error", message: result.error });
        turnstileRef.current?.reset();
        setTurnstileToken("");
      }
    } catch {
      setStatus({ state: "error", message: "Gagal memproses gambar. Silakan coba lagi." });
      turnstileRef.current?.reset();
      setTurnstileToken("");
    }
  }

  /* ── Success screen ── */
  if (status.state === "success") {
    return (
      <div ref={formTopRef} className="rounded-2xl border border-border bg-parchment/30 p-8 sm:p-10 text-center">
        <div className="w-14 h-14 rounded-full bg-crimson flex items-center justify-center mx-auto mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FBFAF4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-2">
          Pendaftaran Berhasil!
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
      </div>
    );
  }

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <div ref={formTopRef}>
      {/* ── Progress header ── */}
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
        {/* Step dots */}
        <div className="flex gap-1 mt-3 justify-center" aria-hidden="true">
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
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Honeypot */}
        <input
          type="text" name="website" {...field("website")}
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: "1px", opacity: 0 }}
        />

        {/* ── Step 0: Data Diri ── */}
        {currentStep === 0 && (
          <fieldset>
            <legend>Data Diri</legend>
            <div className="space-y-4">
              <Field label="NIM" required>
                <input {...field("nim")} placeholder="mis. 23/123456/PA/12345" autoComplete="off" />
              </Field>
              <Field label="Nama Lengkap" required>
                <input {...field("namaLengkap")} placeholder="Sesuai KTP / KTM" autoComplete="name" />
              </Field>
              <Field label="Nama Panggilan">
                <input {...field("namaPanggilan")} placeholder="mis. Budi" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Tempat Lahir" required>
                  <input {...field("tempatLahir")} placeholder="mis. Yogyakarta" />
                </Field>
                <Field label="Tanggal Lahir" required>
                  <input type="date" {...field("tanggalLahir")} />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Jenis Kelamin" required>
                  <select {...field("jenisKelamin")}>
                    <option value="" disabled>-- Pilih --</option>
                    {JENIS_KELAMIN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Agama" required>
                  <select {...field("agama")}>
                    <option value="" disabled>-- Pilih --</option>
                    {AGAMA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Golongan Darah">
                  <select {...field("golonganDarah")}>
                    <option value="">-- Pilih --</option>
                    {GOLONGAN_DARAH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Tinggi Badan (cm)">
                  <input type="number" min="100" max="250" {...field("tinggiBadanCm")} placeholder="170" />
                </Field>
                <Field label="Berat Badan (kg)">
                  <input type="number" min="30" max="200" {...field("beratBadanKg")} placeholder="60" />
                </Field>
              </div>
            </div>
          </fieldset>
        )}

        {/* ── Step 1: Kesehatan & Hobi ── */}
        {currentStep === 1 && (
          <fieldset>
            <legend>Kesehatan & Hobi</legend>
            <div className="space-y-4">
              <Field label="Riwayat Penyakit">
                <textarea {...field("riwayatPenyakit")} placeholder="Tulis jika ada, atau kosongkan jika tidak ada" />
              </Field>
              <Field label="Alergi">
                <textarea {...field("alergi")} placeholder="mis. debu, obat tertentu — kosongkan jika tidak ada" />
              </Field>
              <Field label="Hobi">
                <input {...field("hobi")} placeholder="mis. membaca, bermain musik, olahraga" />
              </Field>
              <Field label="3 Kata yang Menggambarkan Dirimu" required>
                <input
                  {...field("tigaKata")}
                  placeholder="mis. tekun, ramah, kreatif"
                />
                <p className="text-xs text-warm-gray mt-1 font-body">Pisahkan dengan koma.</p>
              </Field>
            </div>
          </fieldset>
        )}

        {/* ── Step 2: Data Akademik ── */}
        {currentStep === 2 && (
          <fieldset>
            <legend>Data Akademik</legend>
            <div className="space-y-4">
              <Field label="Jenjang Studi">
                <select {...field("jenjangStudi")}>
                  <option value="">-- Pilih --</option>
                  {JENJANG_STUDI_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Fakultas" required>
                <input {...field("fakultas")} placeholder="mis. Teknik, MIPA, Ekonomika dan Bisnis" />
              </Field>
              <Field label="Program Studi" required>
                <input {...field("prodi")} placeholder="mis. Teknik Informatika, Matematika" />
              </Field>
              <Field label="Asal SMA / Sederajat">
                <input {...field("asalSma")} placeholder="mis. SMAN 1 Yogyakarta" />
              </Field>
            </div>
          </fieldset>
        )}

        {/* ── Step 3: Kontak & Alamat ── */}
        {currentStep === 3 && (
          <fieldset>
            <legend>Kontak & Alamat</legend>
            <div className="space-y-4">
              <Field label="Nomor Telepon / WhatsApp" required>
                <input
                  type="tel"
                  {...field("noTelp")}
                  placeholder="mis. 0812-3456-7890"
                  autoComplete="tel"
                />
              </Field>
              <Field label="Alamat Email" required>
                <input
                  type="email"
                  {...field("email")}
                  placeholder="mis. nama@mail.ugm.ac.id"
                  autoComplete="email"
                />
              </Field>
              <Field label="Alamat Asal">
                <textarea {...field("alamatAsal")} placeholder="Alamat sesuai KTP / domisili asli" />
              </Field>
              <Field label="Jenis Tempat Tinggal di Jogja">
                <select {...field("jenisTempat")}>
                  <option value="">-- Pilih --</option>
                  {JENIS_TEMPAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Alamat di Yogyakarta">
                <textarea {...field("alamatJogja")} placeholder="Alamat kos / asrama / rumah saat ini di Jogja" />
              </Field>
            </div>
          </fieldset>
        )}

        {/* ── Step 4: Orang Tua / Wali ── */}
        {currentStep === 4 && (
          <fieldset>
            <legend>Data Orang Tua / Wali</legend>
            <div className="space-y-4">
              <Field label="Nama Orang Tua / Wali">
                <input {...field("namaOrtu")} placeholder="mis. Bapak/Ibu Santoso" />
              </Field>
              <Field label="Nomor Telepon Orang Tua / Wali">
                <input type="tel" {...field("noOrtu")} placeholder="mis. 0821-9876-5432" />
              </Field>
              <Field label="Alamat Orang Tua / Wali">
                <textarea {...field("alamatOrtu")} placeholder="Alamat lengkap orang tua / wali" />
              </Field>
            </div>
          </fieldset>
        )}

        {/* ── Step 5: Media Sosial ── */}
        {currentStep === 5 && (
          <fieldset>
            <legend>Media Sosial</legend>
            <p className="font-body text-warm-gray text-sm mb-5 leading-relaxed">
              Semua kolom opsional. Isi sesuai akun aktifmu — cukup username tanpa awalan @.
            </p>
            <div className="space-y-4">
              <Field label="ID Line">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-sm font-body select-none">line:</span>
                  <input {...field("idLine")} className="pl-11" placeholder="usernamelinekamu" />
                </div>
              </Field>
              <Field label="Instagram">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-sm font-body select-none">@</span>
                  <input {...field("idInstagram")} className="pl-7" placeholder="usernamekamu" />
                </div>
              </Field>
              <Field label="Facebook">
                <input {...field("idFacebook")} placeholder="Nama profil atau username Facebook" />
              </Field>
              <Field label="Twitter / X">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray text-sm font-body select-none">@</span>
                  <input {...field("idTwitter")} className="pl-7" placeholder="usernamekamu" />
                </div>
              </Field>
            </div>
          </fieldset>
        )}

        {/* ── Step 6: Pengalaman Marching Band ── */}
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
                    <input {...field("unitSebelumnya")} placeholder="mis. Gita Bahana Taruna, SMA Taruna Nusantara" />
                  </Field>
                  <Field label="Section">
                    <input {...field("section")} placeholder="mis. Trumpet, Snare, Color Guard" />
                  </Field>
                  <Field label="Kemampuan Alat">
                    <textarea {...field("kemampuanAlat")} placeholder="Jelaskan kemampuan bermain alat musik atau menari yang kamu miliki" />
                  </Field>
                </>
              )}
              <Field label="Bidang Tari yang Diminati">
                <input {...field("bidangTari")} placeholder="mis. Color Guard, Majorette, Flag — kosongkan jika tidak ada" />
              </Field>
              <Field label="Bidang Musik yang Diminati">
                <input {...field("bidangMusik")} placeholder="mis. Brass, Battery Percussion, Pit — kosongkan jika tidak ada" />
              </Field>
              <Field label="Organisasi Lain yang Diikuti">
                <input {...field("organisasi")} placeholder="mis. BEM Fakultas, UKM Paduan Suara" />
              </Field>
            </div>
          </fieldset>
        )}

        {/* ── Step 7: Berkas ── */}
        {currentStep === 7 && (
          <fieldset>
            <legend>Berkas</legend>
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-parchment/50 border border-border text-sm font-body text-warm-gray leading-relaxed mb-2">
                <strong className="text-ink">Ketentuan foto:</strong> Format JPG/PNG, ukuran maks 5 MB per file.
                Foto akan dikompres otomatis sebelum dikirim.
              </div>
              <Field label="Pas Foto (latar polos, wajah terlihat jelas)" required>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPasFoto(e.target.files?.[0] ?? null)}
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
                  accept="image/*"
                  onChange={(e) => setKtm(e.target.files?.[0] ?? null)}
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

        {/* ── Step 8: Penempatan & Verifikasi ── */}
        {currentStep === 8 && (
          <fieldset>
            <legend>Penempatan & Verifikasi</legend>
            <div className="space-y-6">
              <Field label="Sesi Penempatan" required>
                <select {...field("sessionId")}>
                  <option value="">-- Pilih Sesi --</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.dayLabel} — Sesi {s.sessionNo}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-warm-gray mt-1 font-body">
                  Pilih sesi penempatan yang sesuai dengan jadwalmu.
                </p>
              </Field>

              {/* Summary review */}
              <div className="rounded-xl border border-border bg-parchment/30 p-5 space-y-2">
                <p className="font-body text-xs font-bold tracking-[0.12em] text-warm-gray uppercase mb-3">
                  Ringkasan Data
                </p>
                {[
                  { label: "Nama", value: values.namaLengkap },
                  { label: "NIM", value: values.nim },
                  { label: "Prodi", value: [values.jenjangStudi, values.prodi, values.fakultas].filter(Boolean).join(" — ") },
                  { label: "Email", value: values.email },
                  { label: "Pas Foto", value: pasFoto?.name ?? "—" },
                  { label: "KTM", value: ktm?.name ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3 text-sm font-body">
                    <span className="text-warm-gray w-24 shrink-0">{label}</span>
                    <span className="text-ink font-medium truncate">{value || "—"}</span>
                  </div>
                ))}
              </div>

              {/* Turnstile CAPTCHA — only mounts on last step */}
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
                <p className="font-body text-sm text-crimson bg-crimson/5 border border-crimson/20 rounded-lg px-4 py-3">
                  {status.message}
                </p>
              )}
            </div>
          </fieldset>
        )}

        {/* ── Step-level validation error ── */}
        {stepError && (
          <p className="mt-4 font-body text-sm text-crimson bg-crimson/5 border border-crimson/20 rounded-lg px-4 py-3">
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
              disabled={status.state === "submitting" || !turnstileToken}
              className="px-6 py-2.5 bg-crimson hover:bg-crimson-press text-paper font-body font-semibold rounded-md text-sm transition-colors disabled:opacity-45 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {status.state === "submitting" ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Mengirim...
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
  return (
    <div className="relative">
      <label className="block font-body text-sm font-semibold text-ink mb-1.5">
        {label}
        {required && (
          <span className="text-crimson ml-1" aria-label="wajib diisi">*</span>
        )}
      </label>
      {children}
    </div>
  );
}
