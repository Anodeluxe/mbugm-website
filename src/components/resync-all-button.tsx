// components/resync-all-button.tsx
//
// Resyncs every unsynced applicant, looping through batches until done. Stops
// if a batch makes no progress (i.e. the remaining ones keep failing), so it
// can't loop forever on a persistent error.

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resyncUnsyncedBatch } from "@/server/actions/resync-all";

export function ResyncAllButton({ unsyncedCount }: { unsyncedCount: number }) {
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
    return (
      <span style={{ fontSize: "0.85rem", color: "#1e7e34" }}>
        Semua data telah tersinkron
      </span>
    );
  }

  return (
    <span>
      <button type="button" onClick={run} disabled={pending}>
        {pending ? "Menyinkronkan" : `Sinkronkan semua (${unsyncedCount})`}
      </button>
      {status && (
        <span style={{ marginLeft: "0.75rem", fontSize: "0.8rem", color: "#555" }}>
          {status}
        </span>
      )}
    </span>
  );
}
