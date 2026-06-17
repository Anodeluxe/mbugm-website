// auth.ts
//
// Place at the project root (next to package.json), or in src/ if you use that
// layout. This is the single source of auth config for the whole app.
//
// Admin access = signing in with Google AND being on the email allowlist.

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google], // reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET automatically
  pages: { signIn: "/login" },
  callbacks: {
    // Return false to deny login. Only allowlisted club emails get in.
    signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      return !!email && allowedEmails.includes(email);
    },
  },
});