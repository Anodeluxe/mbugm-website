// components/resync-button.tsx
//
// Client button that re-runs the Google sync for one applicant, then refreshes
// the dashboard so the sync badges update.

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resyncApplicant } from "@/server/actions/resync-applicant";

export function ResyncButton({ id }: { id: string }) {
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
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
    >
      {pending ? "Menyinkron..." : failed ? "Gagal, ulangi" : "Resync"}
    </button>
  );
}