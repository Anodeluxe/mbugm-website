// components/resync-all-button.tsx
//
// Resyncs every unsynced applicant, looping through batches until done. Stops
// if a batch makes no progress (i.e. the remaining ones keep failing), so it
// can't loop forever on a persistent error.

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resyncUnsyncedBatch } from "@/server/actions/resync-all";

export function ResyncAllButton({
  unsyncedCount,
  className,
  idleLabel,
  doneClassName,
  statusClassName,
}: {
  unsyncedCount: number;
  className?: string;
  idleLabel?: string;
  doneClassName?: string;
  statusClassName?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function run() {
    startTransition(async () => {
      let totalDone = 0;
      while (true) {
        const res = await resyncUnsyncedBatch();
        totalDone += res.succeeded;
        setStatus(`${totalDone} data berhasil disinkronkan. Tersisa ${res.remaining} data.`);

        if (res.remaining === 0) {
          setStatus(`Selesai. ${totalDone} data berhasil disinkronkan.`);
          break;
        }
        if (res.succeeded === 0) {
          setStatus(`Proses dihentikan. ${res.remaining} data gagal disinkronkan. Periksa secara manual.`);
          break;
        }
      }
      router.refresh();
    });
  }

  if (unsyncedCount === 0) {
    return <span className={doneClassName}>Semua data tersinkron</span>;
  }

  return (
    <>
      <button type="button" onClick={run} disabled={pending} className={className}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {pending ? "Menyinkronkan…" : (idleLabel ?? `Resync ${unsyncedCount}`)}
      </button>
      {/* Mounted even when empty — a live region added in the same commit as its
          text is usually not announced at all. */}
      <p role="status" className={statusClassName}>
        {status}
      </p>
    </>
  );
}
