// app/login/page.tsx
//
// The sign-in screen. Lives OUTSIDE /admin so it isn't caught by the admin
// layout's auth guard (which would cause a redirect loop).

import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", padding: "0 1rem", textAlign: "center" }}>
      <h1>Admin MBUGM</h1>
      <p>Masuk dengan akun Google klub untuk mengelola pendaftaran.</p>

      {error && (
        <p style={{ color: "crimson" }}>
          Email ini tidak memiliki akses admin.
        </p>
      )}

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/admin" });
        }}
      >
        <button type="submit" style={{ marginTop: "1rem" }}>
          Masuk dengan Google
        </button>
      </form>
    </main>
  );
}