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
      <header className="flex h-15 items-center justify-between bg-crimson px-8 max-[720px]:h-14 max-[720px]:px-4">
        <div className="flex items-center gap-3 max-[720px]:gap-2.5">
          <Image
            src="/figma/brand-lockup.png"
            alt=""
            width={38}
            height={38}
            priority
            className="h-[38px] w-[38px] object-contain max-[720px]:h-8 max-[720px]:w-8"
          />
          <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-ivory max-[720px]:hidden">
            Admin · Marching Band UGM
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ivory min-[721px]:hidden">
            Admin MBUGM
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[12.5px] font-medium text-ivory/75 max-[720px]:hidden">
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
              className="h-[34px] rounded-[4px] border-[1.5px] border-ivory/55 px-4 text-[12.5px] font-bold text-ivory transition-colors duration-150 hover:border-crimson-press hover:bg-crimson-press max-[720px]:h-8 max-[720px]:px-3 max-[720px]:text-xs"
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
        style={{ background: "repeating-linear-gradient(90deg,#8F1F20 0 22px,#E8E6BF 22px 44px)" }}
      />
      <div
        aria-hidden
        className="h-[5px] min-[721px]:hidden"
        style={{ background: "repeating-linear-gradient(90deg,#8F1F20 0 18px,#E8E6BF 18px 36px)" }}
      />

      <main className="flex-1">{children}</main>
    </div>
  );
}
