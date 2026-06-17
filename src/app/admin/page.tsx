// app/admin/page.tsx
//
// Dashboard home: a list of the most recent applicants. Search/filter, the
// resync button, and batch download come in the next sub-steps.

import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";

export const dynamic = "force-dynamic"; // always show fresh data

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.4rem 0.6rem",
  borderBottom: "2px solid #e2e2e2",
  fontSize: "0.8rem",
  color: "#555",
};
const td: React.CSSProperties = {
  padding: "0.4rem 0.6rem",
  borderBottom: "1px solid #eee",
  fontSize: "0.85rem",
};

function Badge({ ok }: { ok: boolean }) {
  return (
    <span
      style={{
        fontSize: "0.7rem",
        padding: "0.1rem 0.4rem",
        borderRadius: 4,
        background: ok ? "#e6f4ea" : "#fdecea",
        color: ok ? "#1e7e34" : "#b3261e",
      }}
    >
      {ok ? "Tersinkron" : "Belum"}
    </span>
  );
}

export default async function AdminHome() {
  const rows = await db
    .select()
    .from(applicants)
    .orderBy(desc(applicants.createdAt))
    .limit(100);

  return (
    <div>
      <h2>Pendaftar ({rows.length})</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>No. Referensi</th>
            <th style={th}>Nama</th>
            <th style={th}>NIM</th>
            <th style={th}>Drive</th>
            <th style={th}>Sheet</th>
            <th style={th}>PDF</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td style={td}>{a.referenceNumber}</td>
              <td style={td}>{a.namaLengkap}</td>
              <td style={td}>{a.nim}</td>
              <td style={td}><Badge ok={a.driveSynced} /></td>
              <td style={td}><Badge ok={a.sheetSynced} /></td>
              <td style={td}>
                <Link href={`/api/applicants/${a.id}/pdf`} target="_blank">
                  Lihat
                </Link>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={td} colSpan={6}>Belum ada pendaftar.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}