// app/login/page.tsx
//
// The sign-in screen. Lives OUTSIDE /admin so it isn't caught by the admin
// layout's auth guard (which would cause a redirect loop).

import Image from "next/image";
import Link from "next/link";
import { signIn } from "@/auth";

export const metadata = { title: "Masuk · Admin MBUGM" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative flex flex-1 items-center justify-center bg-ivory px-5 py-16 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24.8' height='24.8'%3E%3Crect width='6.2' height='6.2' fill='%23c4c3b6'/%3E%3C/svg%3E")`,
          backgroundSize: "24.8px 24.8px",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-2 max-[720px]:hidden"
        style={{ background: "repeating-linear-gradient(90deg,#AD2829 0 22px,#E8E6BF 22px 44px)" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[7px] min-[721px]:hidden"
        style={{ background: "repeating-linear-gradient(90deg,#AD2829 0 18px,#E8E6BF 18px 36px)" }}
      />

      <div className="relative w-[420px] max-w-full rounded-xl border border-border bg-paper px-10 py-11 text-center shadow-[0_12px_40px_rgba(34,30,27,.12)] max-[720px]:w-full max-[720px]:px-[26px] max-[720px]:py-9">
        <Image
          src="/figma/brand-lockup.png"
          alt="Lambang Marching Band UGM"
          width={76}
          height={76}
          priority
          className="mx-auto h-[76px] w-[76px] object-contain max-[720px]:h-[68px] max-[720px]:w-[68px]"
        />

        <p className="mt-[18px] mb-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-crimson max-[720px]:mt-4 max-[720px]:text-[10.5px]">
          Est. 1979 · Panel Admin
        </p>

        <h1 className="font-display text-[30px] font-bold leading-tight max-[720px]:text-[27px]">
          Admin MBUGM
        </h1>

        <p className="mt-3 text-[13.5px] leading-[1.65] text-warm-gray">
          Masuk dengan akun Google klub untuk mengelola pendaftaran.
        </p>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-error-border bg-error-tint px-[14px] py-[11px] text-left text-[12.5px] font-semibold text-crimson max-[720px]:mt-[18px]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-px shrink-0">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M8 5v3.4M8 10.8v.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Email ini tidak memiliki akses admin.
          </div>
        )}

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/admin" });
          }}
        >
          <button
            type="submit"
            className="mt-6 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-md border-[1.5px] border-border bg-white text-sm font-bold text-ink transition-colors duration-150 hover:border-ink max-[720px]:mt-[22px]"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6C44.1 38 46.5 31.8 46.5 24.5z" />
              <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.2C.9 16 0 19.9 0 24s.9 8 2.6 10.8l7.9-6.2z" />
              <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.6-5.8l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Masuk dengan Google
          </button>
        </form>

        <Link
          href="/"
          className="mt-[22px] inline-block text-[12.5px] font-semibold text-warm-gray transition-colors duration-150 hover:text-ink max-[720px]:mt-5"
        >
          ← Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
