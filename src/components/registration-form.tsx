// components/registration-form.tsx
//
// Full registration form, grouped into sections. Still intentionally plain —
// the visual design pass comes later. Every value is held as a string and the
// server's Zod schema coerces/validates it.

"use client";

import { useRef, useState } from "react";
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
  nim: "",
  namaLengkap: "",
  namaPanggilan: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  agama: "",
  golonganDarah: "",
  tinggiBadanCm: "",
  beratBadanKg: "",
  riwayatPenyakit: "",
  alergi: "",
  hobi: "",
  jenjangStudi: "",
  fakultas: "",
  prodi: "",
  asalSma: "",
  noTelp: "",
  email: "",
  alamatAsal: "",
  jenisTempat: "",
  alamatJogja: "",
  namaOrtu: "",
  noOrtu: "",
  alamatOrtu: "",
  idLine: "",
  idInstagram: "",
  idFacebook: "",
  idTwitter: "",
  bidangTari: "",
  bidangMusik: "",
  organisasi: "",
  pernahMb: "false",
  unitSebelumnya: "",
  section: "",
  kemampuanAlat: "",
  sessionId: "",
  website: "", // honeypot
};

type FormValues = typeof INITIAL;

export function RegistrationForm({ sessions }: { sessions: SessionOption[] }) {
  const [submissionToken] = useState(() => crypto.randomUUID());
  const [formLoadedAt] = useState(() => Date.now());
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const [values, setValues] = useState<FormValues>(INITIAL);
  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "submitting" }
    | { state: "success"; referenceNumber: string }
    | { state: "error"; message: string }
  >({ state: "idle" });

  function update(name: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }
  // Shortcut to wire an input/select to a field.
  function field(name: keyof FormValues) {
    return {
      value: values[name],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      ) => update(name, e.target.value),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!turnstileToken) {
      setStatus({ state: "error", message: "Mohon selesaikan verifikasi CAPTCHA." });
      return;
    }
    setStatus({ state: "submitting" });

    const result = await submitApplication({
      ...values,
      submissionToken,
      formLoadedAt,
      turnstileToken,
    });

    if (result.ok) {
      setStatus({ state: "success", referenceNumber: result.referenceNumber });
    } else {
      setStatus({ state: "error", message: result.error });
      turnstileRef.current?.reset();
      setTurnstileToken("");
    }
  }

  if (status.state === "success") {
    return (
      <div>
        <h2>Pendaftaran berhasil!</h2>
        <p>
          Nomor referensi Anda: <strong>{status.referenceNumber}</strong>
        </p>
        <p>Simpan nomor ini sebagai bukti pendaftaran.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Honeypot — off-screen, hidden from humans. */}
      <input
        type="text"
        name="website"
        {...field("website")}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px" }}
      />

      <fieldset>
        <legend>Data Diri</legend>
        <label>NIM <input {...field("nim")} required /></label>
        <label>Nama Lengkap <input {...field("namaLengkap")} required /></label>
        <label>Nama Panggilan <input {...field("namaPanggilan")} /></label>
        <label>Tempat Lahir <input {...field("tempatLahir")} required /></label>
        <label>Tanggal Lahir <input type="date" {...field("tanggalLahir")} required /></label>
        <label>
          Jenis Kelamin
          <select {...field("jenisKelamin")} required>
            <option value="" disabled>--Pilih Salah Satu--</option>
            {JENIS_KELAMIN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label>
          Agama
          <select {...field("agama")} required>
            <option value="" disabled>--Pilih Salah Satu--</option>
            {AGAMA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label>
          Golongan Darah
          <select {...field("golonganDarah")}>
            <option value="">--Pilih--</option>
            {GOLONGAN_DARAH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label>Tinggi Badan (cm) <input type="number" min="0" {...field("tinggiBadanCm")} /></label>
        <label>Berat Badan (kg) <input type="number" min="0" {...field("beratBadanKg")} /></label>
      </fieldset>

      <fieldset>
        <legend>Kesehatan</legend>
        <label>Riwayat Penyakit <textarea {...field("riwayatPenyakit")} /></label>
        <label>Alergi <textarea {...field("alergi")} /></label>
        <label>Hobi <input {...field("hobi")} /></label>
      </fieldset>

      <fieldset>
        <legend>Data Akademik</legend>
        <label>
          Jenjang Studi
          <select {...field("jenjangStudi")}>
            <option value="">--Pilih--</option>
            {JENJANG_STUDI_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label>Fakultas <input {...field("fakultas")} required /></label>
        <label>Program Studi <input {...field("prodi")} required /></label>
        <label>Asal SMA <input {...field("asalSma")} /></label>
      </fieldset>

      <fieldset>
        <legend>Kontak & Alamat</legend>
        <label>Nomor Telepon <input {...field("noTelp")} required /></label>
        <label>Email <input type="email" {...field("email")} required /></label>
        <label>Alamat Asal <textarea {...field("alamatAsal")} /></label>
        <label>
          Jenis Tempat Tinggal di Jogja
          <select {...field("jenisTempat")}>
            <option value="">--Pilih--</option>
            {JENIS_TEMPAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label>Alamat di Jogja <textarea {...field("alamatJogja")} /></label>
      </fieldset>

      <fieldset>
        <legend>Data Orang Tua / Wali</legend>
        <label>Nama Orang Tua / Wali <input {...field("namaOrtu")} /></label>
        <label>Nomor Telepon Orang Tua / Wali <input {...field("noOrtu")} /></label>
        <label>Alamat Orang Tua / Wali <textarea {...field("alamatOrtu")} /></label>
      </fieldset>

      <fieldset>
        <legend>Media Sosial</legend>
        <label>ID Line <input {...field("idLine")} /></label>
        <label>Instagram <input {...field("idInstagram")} /></label>
        <label>Facebook <input {...field("idFacebook")} /></label>
        <label>Twitter / X <input {...field("idTwitter")} /></label>
      </fieldset>

      <fieldset>
        <legend>Pengalaman Marching Band</legend>
        <label>Bidang Tari <input {...field("bidangTari")} /></label>
        <label>Bidang Musik <input {...field("bidangMusik")} /></label>
        <label>Organisasi <input {...field("organisasi")} /></label>
        <label>
          Pernah Ikut Marching Band?
          <select {...field("pernahMb")}>
            <option value="false">Tidak</option>
            <option value="true">Ya</option>
          </select>
        </label>
        <label>Unit Sebelumnya <input {...field("unitSebelumnya")} /></label>
        <label>Section <input {...field("section")} /></label>
        <label>Kemampuan Alat <textarea {...field("kemampuanAlat")} /></label>
      </fieldset>

      <fieldset>
        <legend>Penempatan</legend>
        <label>
          Sesi Penempatan
          <select {...field("sessionId")}>
            <option value="">--Pilih Sesi--</option>
            {sessions.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.dayLabel} — Sesi {s.sessionNo}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <Turnstile
        ref={turnstileRef}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
        onSuccess={(token) => setTurnstileToken(token)}
        onError={() => setTurnstileToken("")}
        onExpire={() => setTurnstileToken("")}
      />

      {status.state === "error" && (
        <p style={{ color: "crimson" }}>{status.message}</p>
      )}

      <button type="submit" disabled={status.state === "submitting" || !turnstileToken}>
        {status.state === "submitting" ? "Mengirim..." : "Daftar"}
      </button>
    </form>
  );
}