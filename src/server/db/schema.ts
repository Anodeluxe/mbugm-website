// Full schema for the MBUGM registration site — see build plan §5.

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  date,
  timestamp,
  serial,
  index,
  unique,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const sexEnum = pgEnum("sex", ["Laki-laki", "Perempuan"]);

export const bloodTypeEnum = pgEnum("blood_type", ["A", "B", "AB", "O"]);

export const studyLevelEnum = pgEnum("study_level", [
  "D3",
  "D4",
  "S1",
  "S2",
  "S3",
  "Profesi",
]);

export const housingTypeEnum = pgEnum("housing_type", [
  "Kos",
  "Asrama",
  "Rumah orang tua",
  "Rumah saudara",
  "Lainnya",
]);

export const appStatusEnum = pgEnum("app_status", [
  "submitted",
  "under_review",
  "accepted",
  "waitlisted",
  "rejected",
  "withdrawn",
]);

/* ------------------------------------------------------------------ */
/* Placement sessions (replaces the old `jadwal` table)               */
/* ------------------------------------------------------------------ */

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    dayLabel: text("day_label").notNull(), // e.g. "Sabtu, 12 Juli"
    sessionNo: integer("session_no").notNull(), // 1 or 2
    quota: integer("quota").notNull(),
  },
  (table) => [
    unique("sessions_day_session_unique").on(table.dayLabel, table.sessionNo),
  ],
);

/* ------------------------------------------------------------------ */
/* Applicants (replaces the old `formulir` table)                     */
/* ------------------------------------------------------------------ */

export const applicants = pgTable(
  "applicants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceNumber: text("reference_number").notNull().unique(), // shown to applicant, e.g. MBUGM-2026-0001
    submissionToken: text("submission_token").notNull().unique(), // idempotency key — stops double-submit
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ip: text("ip"), // stored as text for portability (Postgres INET also works if you prefer)
    status: appStatusEnum("status").notNull().default("submitted"),

    // Identity (NIM is the hard de-dup key)
    nim: text("nim").notNull().unique(),
    namaLengkap: text("nama_lengkap").notNull(),
    namaPanggilan: text("nama_panggilan"),
    tempatLahir: text("tempat_lahir"),
    tanggalLahir: date("tanggal_lahir"),
    jenisKelamin: sexEnum("jenis_kelamin"),
    agama: text("agama"),
    golonganDarah: bloodTypeEnum("golongan_darah"),
    tinggiBadanCm: integer("tinggi_badan_cm"),
    beratBadanKg: integer("berat_badan_kg"),

    // Health
    riwayatPenyakit: text("riwayat_penyakit"),
    alergi: text("alergi"),
    hobi: text("hobi"),
    tigaKata: text("tiga_kata"), // "3 kata yang menggambarkan dirimu"

    // Academic
    jenjangStudi: studyLevelEnum("jenjang_studi"),
    fakultas: text("fakultas"),
    prodi: text("prodi"),
    asalSma: text("asal_sma"),

    // Contact
    noTelp: text("no_telp"),
    email: text("email"), // indexed for soft de-dup, not unique
    alamatAsal: text("alamat_asal"),
    alamatJogja: text("alamat_jogja"),
    jenisTempat: housingTypeEnum("jenis_tempat"),

    // Guardian
    namaOrtu: text("nama_ortu"),
    noOrtu: text("no_ortu"),
    alamatOrtu: text("alamat_ortu"),

    // Socials (all optional)
    idLine: text("id_line"),
    idInstagram: text("id_instagram"),
    idFacebook: text("id_facebook"),
    idTwitter: text("id_twitter"),

    // Marching-band specific
    bidangMusik: text("bidang_musik"),
    bidangTari: text("bidang_tari"),
    organisasi: text("organisasi"),
    pernahMb: boolean("pernah_mb").notNull().default(false),
    unitSebelumnya: text("unit_sebelumnya"),
    section: text("section"),
    kemampuanAlat: text("kemampuan_alat"),

    // Placement
    sessionId: integer("session_id").references(() => sessions.id),

    // Files (Google Drive file IDs)
    pasFotoDriveId: text("pas_foto_drive_id"),
    fotoKtmDriveId: text("foto_ktm_drive_id"),
    pdfDriveId: text("pdf_drive_id"),
    paymentProofDriveId: text("payment_proof_drive_id"),

    // Payment
    paymentStatus: boolean("payment_status").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),

    // Sync flags (drive the "resync" safety net)
    pdfGenerated: boolean("pdf_generated").notNull().default(false),
    driveSynced: boolean("drive_synced").notNull().default(false),
    sheetSynced: boolean("sheet_synced").notNull().default(false),
  },
  (table) => [
    index("idx_applicants_email").on(table.email),
    index("idx_applicants_created_at").on(table.createdAt),
    index("idx_applicants_status").on(table.status),
  ],
);

/* ------------------------------------------------------------------ */
/* Inferred types — import these in your app code for type safety      */
/* ------------------------------------------------------------------ */

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Applicant = typeof applicants.$inferSelect;
export type NewApplicant = typeof applicants.$inferInsert;