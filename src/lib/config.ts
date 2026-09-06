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
  registrationFee: 10_000,

  // Registration window, in Jogja time (WIB, +07:00). Outside this window the
  // form is closed automatically. To open/close manually, just move the dates.
  opensAt: "2026-08-03T00:00:00+07:00",
  closesAt: "2026-09-11T23:59:59+07:00",

  // Placement dates unavailable during the extended registration period.
  unavailablePlacementDates: ["2026-09-12"],
  unavailablePlacementSessions: ["2026-09-07/1", "2026-09-13/1"],
} as const;

export function formatRupiah(value: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

// True when "now" falls inside the registration window.
export function isRegistrationOpen(now: Date = new Date()): boolean {
  const opens = new Date(config.opensAt);
  const closes = new Date(config.closesAt);
  return now >= opens && now <= closes;
}
