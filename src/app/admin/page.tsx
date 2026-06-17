// app/admin/page.tsx
//
// Dashboard home: a single long list (up to 1000 rows — comfortably above the
// ~500 expected) with search, a sync filter, per-row resync, and a bulk
// "resync all unsynced" button. Search runs through the URL (?q=&filter=).

import Link from "next/link";
import { and, or, ilike, eq, desc, count } from "drizzle-orm";
import { db } from "@/server/db";
import { applicants } from "@/server/db/schema";
import { ResyncButton } from "@/components/resync-button";
import { ResyncAllButton } from "@/components/resync-all-button";

export const dynamic = "force-dynamic";

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
const searchField: React.CSSProperties = {
  width: "auto",
  display: "inline-block",
  marginRight: "0.5rem",
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

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter } = await searchParams;

  const unsynced = or(
    eq(applicants.driveSynced, false),
    eq(applicants.sheetSynced, false),
  );

  // Total unsynced (across everyone, not just the filtered view) for the bulk button.
  const [{ value: unsyncedCount }] = await db
    .select({ value: count() })
    .from(applicants)
    .where(unsynced);

  // Build the list query from the URL params.
  const conditions = [];
  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(applicants.namaLengkap, like),
        ilike(applicants.nim, like),
        ilike(applicants.referenceNumber, like),
        ilike(applicants.email, like),
      ),
    );
  }
  if (filter === "unsynced") conditions.push(unsynced);
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(applicants)
    .where(where)
    .orderBy(desc(applicants.createdAt))
    .limit(1000);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }}>Pendaftar</h2>
        <ResyncAllButton unsyncedCount={unsyncedCount} />
      </div>

      <form method="get" style={{ margin: "1rem 0" }}>
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Cari nama, NIM, no. referensi, email..."
          style={{ ...searchField, width: 280 }}
        />
        <select name="filter" defaultValue={filter ?? "all"} style={searchField}>
          <option value="all">Semua</option>
          <option value="unsynced">Belum tersinkron</option>
        </select>
        <button type="submit">Cari</button>
        {(q || filter === "unsynced") && (
          <Link href="/admin" style={{ marginLeft: "0.75rem", fontSize: "0.85rem" }}>
            Reset
          </Link>
        )}
      </form>

      <p style={{ fontSize: "0.8rem", color: "#777" }}>
        Menampilkan {rows.length} pendaftar{rows.length === 1000 ? " (maks. 1000)" : ""}.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>No. Referensi</th>
            <th style={th}>Nama</th>
            <th style={th}>NIM</th>
            <th style={th}>Drive</th>
            <th style={th}>Sheet</th>
            <th style={th}>PDF</th>
            <th style={th}>Aksi</th>
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
              <td style={td}><ResyncButton id={a.id} /></td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td style={td} colSpan={7}>Tidak ada pendaftar yang cocok.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}