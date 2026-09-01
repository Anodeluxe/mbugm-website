"use client";

import Image from "next/image";
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ChangeEventHandler,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import {
  AGAMA_OPTIONS,
  GOLONGAN_DARAH_OPTIONS,
  JENIS_KELAMIN_OPTIONS,
  JENIS_TEMPAT_OPTIONS,
  JENJANG_STUDI_OPTIONS,
} from "@/lib/constants";
import {
  ACCEPTED_IMAGE_TYPES,
  APPLICANT_TEXT_LIMITS,
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  PHONE_MAX_DIGITS,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
} from "@/lib/applicant-rules";
import { config, formatRupiah } from "@/lib/config";
import {
  getPlacementSessionTime,
  getPlacementSessionUnavailableReason,
  groupPlacementSessions,
} from "@/lib/placement-sessions";
import type { PlacementSessionOption } from "@/lib/registration-step-validator";
import type { RegistrationFormValues } from "@/components/registration-form";

const REGISTRATION_FEE_LABEL = formatRupiah(config.registrationFee);

type FieldBinding = {
  value: string;
  onChange: ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >;
};

type StepFields = {
  values: RegistrationFormValues;
  field: (name: keyof RegistrationFormValues) => FieldBinding;
  textField: (
    name: keyof typeof APPLICANT_TEXT_LIMITS,
  ) => FieldBinding & { maxLength: number };
};

type RegistrationFormStepsProps = StepFields & {
  currentStep: number;
  update: (name: keyof RegistrationFormValues, value: string) => void;
  sessions: PlacementSessionOption[];
  pasFoto: File | null;
  ktm: File | null;
  paymentProof: File | null;
  onPasFotoChange: ChangeEventHandler<HTMLInputElement>;
  onKtmChange: ChangeEventHandler<HTMLInputElement>;
  onPaymentProofChange: ChangeEventHandler<HTMLInputElement>;
  turnstileRef: RefObject<TurnstileInstance | null>;
  onTurnstileTokenChange: (token: string) => void;
  submissionError: string | null;
};

export function RegistrationFormSteps(props: RegistrationFormStepsProps) {
  const { currentStep, field, textField, values } = props;

  switch (currentStep) {
    case 0:
      return <PersonalDataStep field={field} textField={textField} values={values} />;
    case 1:
      return <HealthAndHobbyStep field={field} textField={textField} values={values} />;
    case 2:
      return <AcademicDataStep field={field} textField={textField} values={values} />;
    case 3:
      return <ContactAndAddressStep field={field} textField={textField} values={values} />;
    case 4:
      return <ParentDataStep field={field} textField={textField} values={values} />;
    case 5:
      return <SocialMediaStep field={field} textField={textField} values={values} />;
    case 6:
      return <MarchingBandExperienceStep field={field} textField={textField} values={values} />;
    case 7:
      return (
        <FilesStep
          pasFoto={props.pasFoto}
          ktm={props.ktm}
          onPasFotoChange={props.onPasFotoChange}
          onKtmChange={props.onKtmChange}
        />
      );
    case 8:
      return (
        <PaymentStep
          paymentProof={props.paymentProof}
          onPaymentProofChange={props.onPaymentProofChange}
        />
      );
    case 9:
      return <PlacementAndVerificationStep {...props} />;
    default:
      return null;
  }
}

function PersonalDataStep({ field, textField }: StepFields) {
  return (
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
              {JENIS_KELAMIN_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </Field>
          <Field label="Agama" required>
            <select {...field("agama")}>
              <option value="" disabled>Pilih opsi</option>
              {AGAMA_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Golongan Darah">
            <select {...field("golonganDarah")}>
              <option value="">Pilih opsi</option>
              {GOLONGAN_DARAH_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
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
  );
}

function HealthAndHobbyStep({ textField }: StepFields) {
  return (
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
          <input {...textField("tigaKata")} placeholder="mis. tekun, ramah, kreatif" />
          <p className="text-xs text-warm-gray mt-1 font-body">Pisahkan dengan koma.</p>
        </Field>
      </div>
    </fieldset>
  );
}

function AcademicDataStep({ field, textField }: StepFields) {
  return (
    <fieldset>
      <legend>Data Akademik</legend>
      <div className="space-y-4">
        <Field label="Jenjang Studi">
          <select {...field("jenjangStudi")}>
            <option value="">Pilih opsi</option>
            {JENJANG_STUDI_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
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
  );
}

function ContactAndAddressStep({ field, textField }: StepFields) {
  return (
    <fieldset>
      <legend>Kontak dan Alamat</legend>
      <div className="space-y-4">
        <Field label="Nomor Telepon atau WhatsApp" required>
          <input type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={PHONE_MAX_DIGITS} {...field("noTelp")} placeholder="mis. 081234567890" autoComplete="tel" />
        </Field>
        <Field label="Alamat Email" required>
          <input type="email" {...textField("email")} placeholder="mis. nama@mail.ugm.ac.id" autoComplete="email" />
        </Field>
        <Field label="Alamat Asal">
          <textarea {...textField("alamatAsal")} placeholder="Alamat sesuai KTP atau domisili asal" />
        </Field>
        <Field label="Jenis Tempat Tinggal di Jogja">
          <select {...field("jenisTempat")}>
            <option value="">Pilih opsi</option>
            {JENIS_TEMPAT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Alamat di Yogyakarta">
          <textarea {...textField("alamatJogja")} placeholder="Alamat kos, asrama, atau rumah saat ini di Yogyakarta" />
        </Field>
      </div>
    </fieldset>
  );
}

function ParentDataStep({ field, textField }: StepFields) {
  return (
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
  );
}

function SocialMediaStep({ textField }: StepFields) {
  return (
    <fieldset>
      <legend>Media Sosial</legend>
      <p className="font-body text-warm-gray text-sm mb-5 leading-relaxed">
        Semua kolom bersifat opsional. Isi nama pengguna akun aktifmu tanpa awalan @.
      </p>
      <div className="space-y-4">
        <Field label="ID Line"><input {...textField("idLine")} placeholder="idlinekamu" /></Field>
        <Field label="Instagram"><input {...textField("idInstagram")} placeholder="@usernamekamu" /></Field>
        <Field label="Facebook"><input {...textField("idFacebook")} placeholder="username Facebook" /></Field>
        <Field label="X (Twitter)"><input {...textField("idTwitter")} placeholder="@usernamekamu" /></Field>
      </div>
    </fieldset>
  );
}

function MarchingBandExperienceStep({ field, textField, values }: StepFields) {
  return (
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
  );
}

function FilesStep({
  pasFoto,
  ktm,
  onPasFotoChange,
  onKtmChange,
}: Pick<
  RegistrationFormStepsProps,
  "pasFoto" | "ktm" | "onPasFotoChange" | "onKtmChange"
>) {
  return (
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
            onChange={onPasFotoChange}
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
            onChange={onKtmChange}
          />
          {ktm && (
            <p className="text-xs text-crimson mt-1 font-body font-medium">
              Terpilih: {ktm.name}
            </p>
          )}
        </Field>
      </div>
    </fieldset>
  );
}

function PaymentStep({
  paymentProof,
  onPaymentProofChange,
}: Pick<
  RegistrationFormStepsProps,
  "paymentProof" | "onPaymentProofChange"
>) {
  return (
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
            onChange={onPaymentProofChange}
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
  );
}

function PlacementAndVerificationStep({
  values,
  update,
  sessions,
  pasFoto,
  ktm,
  paymentProof,
  turnstileRef,
  onTurnstileTokenChange,
  submissionError,
}: RegistrationFormStepsProps) {
  const sessionDays = groupPlacementSessions(sessions);
  const selectedSession = sessions.find(
    (session) => String(session.id) === values.sessionId,
  );
  const summarySections = buildSummarySections({
    values,
    pasFoto,
    ktm,
    paymentProof,
    selectedSession,
  });

  return (
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
                      const unavailableReason =
                        getPlacementSessionUnavailableReason(day.dayLabel);
                      const disabled = full || Boolean(unavailableReason);

                      return (
                        <button
                          key={session.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={disabled}
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
                          <span className={`mt-3 block text-xs font-semibold tabular-nums ${disabled ? "text-crimson" : "text-warm-gray"}`}>
                            {unavailableReason ?? `${session.bookedCount}/${session.quota} peserta${full ? ", penuh" : ""}`}
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
                  <h3 className="font-body text-xs font-bold text-ink">{title}</h3>
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

        <div>
          <p className="font-body text-xs font-bold tracking-[0.12em] text-warm-gray uppercase mb-2">
            Verifikasi
          </p>
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={onTurnstileTokenChange}
            onError={() => onTurnstileTokenChange("")}
            onExpire={() => onTurnstileTokenChange("")}
          />
        </div>

        {submissionError && (
          <p role="alert" className="font-body text-sm text-crimson bg-crimson/5 border border-crimson/20 rounded-lg px-4 py-3">
            {submissionError}
          </p>
        )}
      </div>
    </fieldset>
  );
}

function buildSummarySections({
  values,
  pasFoto,
  ktm,
  paymentProof,
  selectedSession,
}: {
  values: RegistrationFormValues;
  pasFoto: File | null;
  ktm: File | null;
  paymentProof: File | null;
  selectedSession: PlacementSessionOption | undefined;
}) {
  return [
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
}

function todayInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  const controlId = useId();
  const childArray = Children.toArray(children);
  const controlIndex = childArray.findIndex((child) => isValidElement(child));
  const labelledChildren = childArray.map((child, index) =>
    index === controlIndex && isValidElement(child)
      ? cloneElement(child as ReactElement<{ id?: string }>, { id: controlId })
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
