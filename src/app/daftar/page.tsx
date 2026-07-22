// app/daftar/page.tsx - Registration form page
// Server component: queries sessions, guards with registration window check.

import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { RegistrationForm } from "@/components/registration-form";
import { SiteHeader } from "@/components/site-header";
import { config, isRegistrationOpen } from "@/lib/config";
import styles from "../page.module.css";

export default async function DaftarPage() {
  const useLocalFormMock =
    process.env.NODE_ENV !== "production" && process.env.LOCAL_FORM_MOCK === "1";
  const registrationOpen = isRegistrationOpen();

  if (!useLocalFormMock && !registrationOpen) {
    return (
      <div className={`${styles.page} min-h-[100dvh] bg-paper flex flex-col`}>
        <SiteHeader open={false} />
        <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
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
        </main>
      </div>
    );
  }

  const sessions = useLocalFormMock
    ? [
        { id: 1, dayLabel: "Senin, 7 September 2026", sessionNo: 1, quota: 40, bookedCount: 0 },
        { id: 2, dayLabel: "Senin, 7 September 2026", sessionNo: 2, quota: 40, bookedCount: 0 },
        { id: 3, dayLabel: "Selasa, 8 September 2026", sessionNo: 1, quota: 40, bookedCount: 0 },
        { id: 4, dayLabel: "Selasa, 8 September 2026", sessionNo: 2, quota: 40, bookedCount: 0 },
        { id: 5, dayLabel: "Rabu, 9 September 2026", sessionNo: 1, quota: 40, bookedCount: 0 },
        { id: 6, dayLabel: "Rabu, 9 September 2026", sessionNo: 2, quota: 40, bookedCount: 0 },
        { id: 7, dayLabel: "Kamis, 10 September 2026", sessionNo: 1, quota: 40, bookedCount: 0 },
        { id: 8, dayLabel: "Kamis, 10 September 2026", sessionNo: 2, quota: 40, bookedCount: 0 },
        { id: 9, dayLabel: "Jumat, 11 September 2026", sessionNo: 1, quota: 40, bookedCount: 0 },
        { id: 10, dayLabel: "Jumat, 11 September 2026", sessionNo: 2, quota: 40, bookedCount: 0 },
        { id: 11, dayLabel: "Sabtu, 12 September 2026", sessionNo: 1, quota: 40, bookedCount: 0 },
        { id: 12, dayLabel: "Sabtu, 12 September 2026", sessionNo: 2, quota: 40, bookedCount: 0 },
        { id: 13, dayLabel: "Minggu, 13 September 2026", sessionNo: 1, quota: 40, bookedCount: 0 },
        { id: 14, dayLabel: "Minggu, 13 September 2026", sessionNo: 2, quota: 40, bookedCount: 0 },
      ]
    : await getSessions();

  return (
    <div className={`${styles.page} min-h-[100dvh] bg-paper`}>
      <SiteHeader open={registrationOpen} />

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
            {config.eventName} {config.year} - Isi semua kolom yang wajib dengan teliti.
          </p>
        </div>

        <RegistrationForm sessions={sessions} />
      </div>
    </div>
  );
}

async function getSessions() {
  const [{ db }, { applicants, sessions: sessionsTable }] = await Promise.all([
    import("@/server/db"),
    import("@/server/db/schema"),
  ]);

  return db
    .select({
      id: sessionsTable.id,
      dayLabel: sessionsTable.dayLabel,
      sessionNo: sessionsTable.sessionNo,
      quota: sessionsTable.quota,
      bookedCount: count(applicants.id),
    })
    .from(sessionsTable)
    .leftJoin(applicants, eq(applicants.sessionId, sessionsTable.id))
    .groupBy(
      sessionsTable.id,
      sessionsTable.dayLabel,
      sessionsTable.sessionNo,
      sessionsTable.quota,
    )
    .orderBy(sessionsTable.id);
}
