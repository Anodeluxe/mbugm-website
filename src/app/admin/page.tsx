// app/admin/page.tsx
//
// Dashboard home: a single long list (up to 1000 rows — comfortably above the
// ~500 expected) with search, a sync filter, per-row resync, and a bulk
// "resync all unsynced" button. Search runs through the URL (?q=&filter=).
//
// Two renderings of the same rows: a table above 720px, stacked cards below it
// (with the bulk actions moved into a sticky bottom bar so they stay reachable).

import Link from "next/link";
import { config } from "@/lib/config";
import { getPlacementSessionTime } from "@/lib/placement-sessions";
import { ResyncButton } from "@/components/resync-button";
import { ResyncAllButton } from "@/components/resync-all-button";
import { isApplicantDriveComplete } from "@/server/google/sync-integrity.mjs";
import { ApplicantAdminQuery } from "@/server/application/applicant-admin-query";

export const dynamic = "force-dynamic";

const TH =
  "border-b-2 border-ink px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-[0.12em] text-warm-gray";
const TD = "border-b border-border p-3";

// globals.css gives inputs their white/bordered/8px-radius base; these are the
// deltas this screen needs on top of it.
const FIELD = "mt-0 text-[13.5px]";

const ROW_RESYNC =
  "h-[30px] rounded-[4px] border-[1.5px] border-border bg-white px-3 text-xs font-bold text-crimson-press transition-colors duration-150 hover:border-crimson hover:bg-error-tint disabled:opacity-45";
const CARD_ACTION =
  "flex h-[38px] flex-1 items-center justify-center rounded-md border-[1.5px] border-border text-[12.5px] font-bold transition-colors duration-150";

function Badge({
  ok,
  label,
  className = "",
}: {
  ok: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[4px] px-[9px] py-[3px] text-[11.5px] font-bold ${
        ok ? "bg-parchment text-badge-ok" : "bg-error-tint text-crimson"
      } ${className}`}
    >
      {label ?? (ok ? "Tersinkron" : "Belum")}
    </span>
  );
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter } = await searchParams;
  const { total, unsyncedCount, rows, pdfBatches } =
    await new ApplicantAdminQuery({ q, filter }).execute();

  // The mobile filter chips are plain links onto the same ?filter= param.
  const chipHref = (next?: "unsynced") => {
    const p = new URLSearchParams();
    if (q && q.trim()) p.set("q", q.trim());
    if (next) p.set("filter", next);
    return p.toString() ? `/admin?${p.toString()}` : "/admin";
  };
  const onlyUnsynced = filter === "unsynced";

  return (
    <div className="mx-auto w-full max-w-[1140px] px-8 pt-9 pb-12 max-[720px]:px-4 max-[720px]:pt-5 max-[720px]:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-[720px]:w-full">
          <p className="mb-2.5 flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-[0.16em] text-crimson max-[720px]:hidden">
            <span aria-hidden className="h-0.5 w-7 bg-crimson" />
            Penerimaan Anggota Baru {config.year}
          </p>
          <div className="flex items-baseline gap-[14px] max-[720px]:justify-between">
            <h1 className="font-display text-[40px] font-bold leading-[1.1] max-[720px]:text-[28px]">
              Pendaftar
            </h1>
            <span className="rounded-[4px] bg-parchment px-2.5 py-[3px] text-[12.5px] font-bold text-crimson-press max-[720px]:px-2 max-[720px]:py-0.5 max-[720px]:text-[11.5px]">
              {total}
              <span className="max-[720px]:hidden"> total</span>
            </span>
          </div>
        </div>

        <div className="ml-auto grid grid-cols-[auto_auto] items-start justify-end gap-x-3 gap-y-1 max-[720px]:hidden">
          {pdfBatches.length > 0 && (
            <form action="/api/applicants/batch-pdf" method="get" className="flex gap-2">
              {q && <input type="hidden" name="q" value={q.trim()} />}
              {filter === "unsynced" && <input type="hidden" name="filter" value="unsynced" />}
              {pdfBatches.length > 1 && (
                <select
                  name="page"
                  aria-label="Pilih rentang PDF"
                  className="mt-0 h-[42px] w-auto text-[13px]"
                >
                  {pdfBatches.map(({ page, start, end }) => (
                    <option key={page} value={page}>
                      {start} - {end}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="submit"
                className="inline-flex h-[42px] items-center gap-2 rounded-[4px] border-2 border-ink px-5 text-[13px] font-bold text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M8 2v8m0 0L5 7m3 3l3-3M3 13h10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Unduh PDF
              </button>
            </form>
          )}
          <ResyncAllButton
            unsyncedCount={unsyncedCount}
            idleLabel={`Resync ${unsyncedCount} belum tersinkron`}
            className="col-start-2 inline-flex h-[42px] items-center gap-2 rounded-[4px] bg-crimson px-5 text-[13px] font-bold text-paper transition-colors duration-150 hover:bg-crimson-press disabled:opacity-45"
            doneClassName="col-start-2 inline-flex h-[42px] items-center rounded-[4px] bg-parchment px-5 text-[13px] font-bold text-badge-ok"
            statusClassName="col-span-2 row-start-2 max-w-[400px] justify-self-end text-right text-[11.5px] leading-relaxed text-warm-gray empty:hidden"
          />
        </div>
      </div>

      <form
        method="get"
        className="mt-[26px] flex gap-2.5 max-[720px]:mt-3.5 max-[720px]:flex-wrap"
      >
        <div className="relative w-[340px] max-[720px]:w-full">
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-[13px] text-warm-gray"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M14 14l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            aria-label="Cari pendaftar"
            placeholder="Cari nama, NIM, no. referensi, email"
            className={`${FIELD} pl-9`}
          />
        </div>

        {/* Hidden on mobile but still submitted, so the chips' filter survives a search */}
        <select
          name="filter"
          defaultValue={filter ?? "all"}
          aria-label="Saring pendaftar"
          className={`${FIELD} w-auto max-[720px]:hidden`}
        >
          <option value="all">Semua pendaftar</option>
          <option value="unsynced">Belum tersinkron</option>
        </select>

        <button
          type="submit"
          className="h-[42px] rounded-lg bg-ink px-5 text-[13px] font-bold text-paper transition-colors duration-150 hover:bg-crimson max-[720px]:hidden"
        >
          Cari
        </button>

        {(q || onlyUnsynced) && (
          <Link
            href="/admin"
            className="self-center text-[12.5px] font-semibold text-warm-gray transition-colors duration-150 hover:text-ink"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Mobile stand-in for the desktop select */}
      <div className="mt-2.5 flex gap-2 min-[721px]:hidden">
        <Link
          href={chipHref()}
          className={`inline-flex h-[34px] items-center rounded-full px-3.5 text-xs transition-colors duration-150 ${
            onlyUnsynced
              ? "border-[1.5px] border-border bg-white font-semibold text-warm-gray"
              : "bg-ink font-bold text-paper"
          }`}
        >
          Semua
        </Link>
        <Link
          href={chipHref("unsynced")}
          className={`inline-flex h-[34px] items-center rounded-full px-3.5 text-xs transition-colors duration-150 ${
            onlyUnsynced
              ? "bg-ink font-bold text-paper"
              : "border-[1.5px] border-border bg-white font-semibold text-warm-gray"
          }`}
        >
          Belum tersinkron · {unsyncedCount}
        </Link>
      </div>

      <p className="mt-[18px] mb-2 text-xs text-warm-gray max-[720px]:hidden">
        Menampilkan {rows.length} dari {total} pendaftar
        {rows.length === 1000 ? " (maks. 1000)" : ""}
      </p>

      <table className="w-full border-collapse max-[720px]:hidden">
        <thead>
          <tr>
            <th className={TH}>No. Referensi</th>
            <th className={TH}>Nama</th>
            <th className={TH}>NIM</th>
            <th className={TH}>Penempatan</th>
            <th className={TH}>Drive</th>
            <th className={TH}>Sheet</th>
            <th className={TH}>PDF</th>
            <th className={`${TH} text-right`}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ applicant: a, placementSession }) => (
            <tr key={a.id} className="transition-colors duration-150 hover:bg-ivory">
              <td
                className={`${TD} text-[13px] font-semibold tracking-[0.02em] whitespace-nowrap text-crimson-press`}
              >
                {a.referenceNumber}
              </td>
              <td className={`${TD} text-[13.5px] font-semibold`}>{a.namaLengkap}</td>
              <td className={`${TD} text-[13px] whitespace-nowrap text-warm-gray`}>{a.nim}</td>
              <td className={`${TD} min-w-[190px]`}>
                {placementSession ? (
                  <>
                    <p className="text-[12.5px] font-semibold leading-snug">
                      {placementSession.dayLabel}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-warm-gray">
                      Sesi {placementSession.sessionNo},{" "}
                      {getPlacementSessionTime(
                        placementSession.dayLabel,
                        placementSession.sessionNo,
                      )}
                    </p>
                  </>
                ) : (
                  <span className="text-[12px] text-warm-gray">Belum dipilih</span>
                )}
              </td>
              <td className={TD}>
                <Badge ok={isApplicantDriveComplete(a)} />
              </td>
              <td className={TD}>
                <Badge ok={a.sheetSynced} />
              </td>
              <td className={TD}>
                <Link
                  href={`/api/applicants/${a.id}/pdf`}
                  target="_blank"
                  className="text-[13px] font-semibold text-crimson transition-colors duration-150 hover:text-crimson-press"
                >
                  Lihat
                </Link>
              </td>
              <td className={`${TD} text-right`}>
                <ResyncButton id={a.id} className={ROW_RESYNC} />
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className={`${TD} text-[13px] text-warm-gray`} colSpan={8}>
                Tidak ada pendaftar yang cocok.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── Mobile: the same rows as cards ── */}
      <div className="flex flex-col gap-2.5 pt-4 pb-24 min-[721px]:hidden">
        {rows.map(({ applicant: a, placementSession }) => {
          const allSynced = isApplicantDriveComplete(a) && a.sheetSynced;
          return (
            <div key={a.id} className="rounded-lg border border-border bg-white p-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[10.5px] font-extrabold tracking-[0.1em] text-crimson-press">
                  {a.referenceNumber}
                </span>
                <Badge
                  ok={allSynced}
                  label={allSynced ? "Tersinkron" : "Belum sync"}
                  className="px-2 py-0.5 text-[10.5px]"
                />
              </div>
              <p className="mt-1.5 mb-0.5 text-[15px] font-bold">{a.namaLengkap}</p>
              <p className="text-xs text-warm-gray">{a.nim}</p>
              <div className="mt-2 border-t border-border/60 pt-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-warm-gray">
                  Penempatan
                </p>
                {placementSession ? (
                  <>
                    <p className="mt-1 text-[12.5px] font-semibold leading-snug">
                      {placementSession.dayLabel}
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-warm-gray">
                      Sesi {placementSession.sessionNo},{" "}
                      {getPlacementSessionTime(
                        placementSession.dayLabel,
                        placementSession.sessionNo,
                      )}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-warm-gray">Belum dipilih</p>
                )}
              </div>
              <div className="mt-3 flex gap-2 border-t border-border/60 pt-2.5">
                <Link
                  href={`/api/applicants/${a.id}/pdf`}
                  target="_blank"
                  className={`${CARD_ACTION} text-ink hover:bg-ivory`}
                >
                  Lihat PDF
                </Link>
                <ResyncButton
                  id={a.id}
                  className={`${CARD_ACTION} text-crimson-press hover:border-crimson hover:bg-error-tint disabled:opacity-45`}
                />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="py-6 text-center text-[13px] text-warm-gray">
            Tidak ada pendaftar yang cocok.
          </p>
        )}
      </div>

      {/* Bulk actions follow you down the list on mobile */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap gap-2.5 border-t border-border bg-paper/95 px-4 py-3 backdrop-blur-[6px] min-[721px]:hidden">
        {pdfBatches.length > 0 && (
          <form action="/api/applicants/batch-pdf" method="get" className="flex flex-1 gap-2">
            {q && <input type="hidden" name="q" value={q.trim()} />}
            {filter === "unsynced" && <input type="hidden" name="filter" value="unsynced" />}
            {pdfBatches.length > 1 && (
              <select
                name="page"
                aria-label="Pilih rentang PDF"
                className="mt-0 h-[46px] w-[92px] shrink-0 px-2 text-[12px]"
              >
                {pdfBatches.map(({ page, start, end }) => (
                  <option key={page} value={page}>
                    {start} - {end}
                  </option>
                ))}
              </select>
            )}
            <button
              type="submit"
              className="flex h-[46px] flex-1 items-center justify-center rounded-md border-2 border-ink px-3 text-[13px] font-bold text-ink transition-colors duration-150"
            >
              Unduh PDF
            </button>
          </form>
        )}
        <ResyncAllButton
          unsyncedCount={unsyncedCount}
          idleLabel={`Resync ${unsyncedCount}`}
          className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-md bg-crimson text-[13px] font-bold text-paper transition-colors duration-150 disabled:opacity-45"
          doneClassName="flex h-[46px] flex-1 items-center justify-center rounded-md bg-parchment text-[13px] font-bold text-badge-ok"
          statusClassName="basis-full text-center text-[11.5px] text-warm-gray empty:hidden"
        />
      </div>
    </div>
  );
}
