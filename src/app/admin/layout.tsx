// app/admin/layout.tsx
//
// The guard for EVERY admin page. Because all /admin/* pages render through this
// layout, the auth check here protects the entire dashboard — no edge middleware
// needed (which keeps it working the same on Next.js 15 and 16).

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
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "1rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e2e2",
          paddingBottom: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <strong>Admin MBUGM</strong>
        <span style={{ fontSize: "0.85rem", color: "#555" }}>
          {session.user?.email}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            style={{ display: "inline", marginLeft: "0.75rem" }}
          >
            <button type="submit">Keluar</button>
          </form>
        </span>
      </header>
      {children}
    </div>
  );
}