// components/registration-form.tsx
//
// A minimal client-side form to prove the pipeline. It collects a few fields,
// adds the hidden anti-bot / idempotency values plus the Turnstile CAPTCHA
// token, and calls the server action.
// Styling is intentionally bare — we'll make it pretty (and multi-step) later.

"use client";

import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { submitApplication } from "@/server/actions/submit-application";
import { AGAMA_OPTIONS, JENIS_KELAMIN_OPTIONS } from "@/lib/constants";

export function RegistrationForm() {
  // Generated once, when the component first mounts.
  // submissionToken makes retries idempotent; formLoadedAt powers the time-trap.
  const [submissionToken] = useState(() => crypto.randomUUID());
  const [formLoadedAt] = useState(() => Date.now());

  // The CAPTCHA token Cloudflare gives us once the widget is solved.
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const [values, setValues] = useState({
    nim: "",
    namaLengkap: "",
    email: "",
    noTelp: "",
    jenisKelamin: "",
    agama: "",
    website: "", // honeypot
  });

  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "submitting" }
    | { state: "success"; referenceNumber: string }
    | { state: "error"; message: string }
  >({ state: "idle" });

  function update(field: keyof typeof values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
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
      // A Turnstile token is single-use. Reset the widget so a retry gets a fresh one.
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
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
      {/* Honeypot — positioned off-screen so humans never see or fill it. */}
      <input
        type="text"
        name="website"
        value={values.website}
        onChange={(e) => update("website", e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px" }}
      />

      <label>
        NIM
        <input
          value={values.nim}
          onChange={(e) => update("nim", e.target.value)}
          required
        />
      </label>

      <label>
        Nama Lengkap
        <input
          value={values.namaLengkap}
          onChange={(e) => update("namaLengkap", e.target.value)}
          required
        />
      </label>

      <label>
        Email
        <input
          type="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
      </label>

      <label>
        Nomor Telepon
        <input
          value={values.noTelp}
          onChange={(e) => update("noTelp", e.target.value)}
          required
        />
      </label>

      <label>
        Jenis Kelamin
        <select
          value={values.jenisKelamin}
          onChange={(e) => update("jenisKelamin", e.target.value)}
          required
        >
          <option value="" disabled>
            --Pilih Salah Satu--
          </option>
          {JENIS_KELAMIN_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      <label>
        Agama
        <select
          value={values.agama}
          onChange={(e) => update("agama", e.target.value)}
          required
        >
          <option value="" disabled>
            --Pilih Salah Satu--
          </option>
          {AGAMA_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      {/* The Turnstile widget. It loads Cloudflare's script automatically and
          calls onSuccess with a token once solved. */}
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

      <button
        type="submit"
        disabled={status.state === "submitting" || !turnstileToken}
      >
        {status.state === "submitting" ? "Mengirim..." : "Daftar"}
      </button>
    </form>
  );
}