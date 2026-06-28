// app/daftar/page.tsx — Registration form page
// Server component: queries sessions, guards with registration window check.

import Link from "next/link";
import { db } from "@/server/db";
import { sessions as sessionsTable } from "@/server/db/schema";
import { RegistrationForm } from "@/components/registration-form";
import { config, isRegistrationOpen } from "@/lib/config";

export default async function DaftarPage() {
  if (!isRegistrationOpen()) {
    return (
      <div className="min-h-[100dvh] bg-paper flex flex-col items-center justify-center px-4 text-center">
        <div className="w-12 h-12 bg-parchment rounded-full flex items-center justify-center mb-6">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#AD2829" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-3">
          Pendaftaran Sedang Ditutup
        </h1>
        <p className="font-body text-warm-gray text-sm sm:text-base max-w-[44ch] leading-relaxed mb-8">
          {config.eventName} belum dibuka. Silakan kembali pada periode pendaftaran{" "}
          {config.year}.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-ink text-ink hover:bg-ink hover:text-paper font-body font-semibold rounded-md transition-colors text-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const sessions = await db
    .select({
      id: sessionsTable.id,
      dayLabel: sessionsTable.dayLabel,
      sessionNo: sessionsTable.sessionNo,
    })
    .from(sessionsTable)
    .orderBy(sessionsTable.dayLabel, sessionsTable.sessionNo);

  return (
    <div className="min-h-[100dvh] bg-paper">
      {/* Top bar */}
      <div className="border-b border-border bg-paper/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-crimson rounded-sm flex items-center justify-center shrink-0">
              <span className="text-paper font-display font-bold text-xs leading-none">MB</span>
            </div>
            <span className="font-body text-sm font-semibold text-ink hidden sm:block">
              Marching Band UGM
            </span>
          </Link>
          <span className="font-body text-xs text-warm-gray">
            {config.shortName} — Formulir Pendaftaran
          </span>
        </div>
      </div>

      {/* Form container */}
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-warm-gray hover:text-ink font-body text-xs font-medium transition-colors mb-6"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Beranda
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink leading-tight mb-1">
            Formulir Pendaftaran
          </h1>
          <p className="font-body text-warm-gray text-sm">
            {config.eventName} {config.year} — Isi semua kolom yang wajib dengan teliti.
          </p>
        </div>

        <RegistrationForm sessions={sessions} />
      </div>
    </div>
  );
}
