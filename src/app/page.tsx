// app/page.tsx
//
// Server component: loads the placement sessions from the database and passes
// them to the form so the "Sesi Penempatan" dropdown is populated.

import { db } from "@/server/db";
import { sessions as sessionsTable } from "@/server/db/schema";
import { RegistrationForm } from "@/components/registration-form";

export default async function Page() {
  const sessions = await db
    .select({
      id: sessionsTable.id,
      dayLabel: sessionsTable.dayLabel,
      sessionNo: sessionsTable.sessionNo,
    })
    .from(sessionsTable)
    .orderBy(sessionsTable.dayLabel, sessionsTable.sessionNo);

  return (
    <main style={{ maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Pendaftaran Marching Band UGM</h1>
      <RegistrationForm sessions={sessions} />
    </main>
  );
}