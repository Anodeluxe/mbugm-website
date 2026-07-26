// components/resync-button.tsx
//
// Client button that re-runs the Google sync for one applicant, then refreshes
// the dashboard so the sync badges update.

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resyncApplicant } from "@/server/actions/resync-applicant";

export function ResyncButton({ id, className }: { id: string; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      const res = await resyncApplicant(id);
      if (res.ok) router.refresh();
      else setFailed(true);
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className={className}>
      {pending ? "Menyinkronkan…" : failed ? "Gagal, ulangi" : "Resync"}
    </button>
  );
}
