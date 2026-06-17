// app/page.tsx
//
// Server component: shows the registration form during the open window, or a
// "closed" notice outside it. Branding comes from lib/config.ts.

import { db } from "@/server/db";
import { sessions as sessionsTable } from "@/server/db/schema";
import { RegistrationForm } from "@/components/registration-form";
import { config, isRegistrationOpen } from "@/lib/config";

const mainStyle: React.CSSProperties = {
  maxWidth: 640,
  margin: "2rem auto",
  padding: "0 1rem",
};

export default async function Page() {
  // Closed: don't render the form (or query sessions) at all.
  if (!isRegistrationOpen()) {
    return (
      <main style={mainStyle}>
        <h1 style={{ color: config.accentColor }}>{config.eventName}</h1>
        <p>Pendaftaran sedang ditutup. Silakan kembali pada periode pendaftaran berikutnya.</p>
      </main>
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
    <main style={mainStyle}>
      <h1 style={{ color: config.accentColor }}>{config.eventName}</h1>
      <RegistrationForm sessions={sessions} />
    </main>
  );
}