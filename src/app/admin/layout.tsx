// app/admin/layout.tsx
//
// The guard for EVERY admin page. Because all /admin/* pages render through this
// layout, the auth check here protects the entire dashboard — no edge middleware
// needed (which keeps it working the same on Next.js 15 and 16).

import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-15 items-center justify-between border-b border-border bg-paper px-8 max-[720px]:h-14 max-[720px]:px-4">
        <div className="flex items-center gap-3 max-[720px]:gap-2.5">
          <Image
            src="/figma/brand-lockup.png"
            alt=""
            width={38}
            height={38}
            priority
            className="h-[38px] w-[38px] object-contain max-[720px]:h-8 max-[720px]:w-8"
          />
          <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink max-[720px]:hidden">
            Admin · Marching Band UGM
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink min-[721px]:hidden">
            Admin MBUGM
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[12.5px] font-medium text-warm-gray max-[720px]:hidden">
            {session.user?.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="h-[34px] rounded-[4px] border-[1.5px] border-ink/35 px-4 text-[12.5px] font-bold text-ink transition-colors duration-150 hover:border-crimson hover:bg-crimson hover:text-paper max-[720px]:h-8 max-[720px]:px-3 max-[720px]:text-xs"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>

      {/* Ceremonial banner stripes — the marching-band pennant, cut to a 6px rule */}
      <div
        aria-hidden
        className="h-1.5 max-[720px]:hidden"
        style={{ background: "repeating-linear-gradient(90deg,var(--color-crimson-press) 0 22px,var(--color-parchment) 22px 44px)" }}
      />
      <div
        aria-hidden
        className="h-[5px] min-[721px]:hidden"
        style={{ background: "repeating-linear-gradient(90deg,var(--color-crimson-press) 0 18px,var(--color-parchment) 18px 36px)" }}
      />

      <main className="flex-1">{children}</main>
    </div>
  );
}
