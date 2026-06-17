// lib/config.ts
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  THE ONE FILE TO EDIT EACH YEAR.                                          │
// │  Change the values below, swap public/logo.png, commit, and push.         │
// │  You should not need to touch any component to run a new recruitment year. │
// └─────────────────────────────────────────────────────────────────────────┘

export const config = {
  // Used in reference numbers (e.g. MBUGM-2026-A3F9K) and labels.
  year: 2026,
  referencePrefix: "MBUGM",

  // Branding text shown on the landing page.
  eventName: "Penerimaan Anggota Baru Marching Band UGM",
  shortName: "PAB 2026",

  // Brand accent color (the design pass will use this more widely).
  accentColor: "#0f2e1f",

  // Registration window, in Jogja time (WIB, +07:00). Outside this window the
  // form is closed automatically. To open/close manually, just move the dates.
  opensAt: "2025-07-01T00:00:00+07:00",
  closesAt: "2026-07-31T23:59:59+07:00",
} as const;

// True when "now" falls inside the registration window.
export function isRegistrationOpen(now: Date = new Date()): boolean {
  const opens = new Date(config.opensAt);
  const closes = new Date(config.closesAt);
  return now >= opens && now <= closes;
}