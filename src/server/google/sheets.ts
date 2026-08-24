// server/google/sheets.ts

import { getSheets } from "./client";
import type { Applicant } from "@/server/db/schema";
import { getPlacementSessionLabel } from "@/server/placement-session";
import { hasApplicantReference } from "./sync-integrity.mjs";

// The tab name in your spreadsheet. Change this if your first tab isn't "Sheet1".
const SHEET_TAB = "Sheet1";
// ponytail: per-runtime lock; use a DB outbox if cross-instance duplicates appear.
const pendingRows = new Map<string, Promise<void>>();

// Paste this as row 1 of your sheet so the columns line up with the rows below.
export const SHEET_HEADERS = [
  "Waktu Daftar",
  "No. Referensi",
  "NIM",
  "Nama Lengkap",
  "Nama Panggilan",
  "Jenis Kelamin",
  "Agama",
  "Tempat Lahir",
  "Tanggal Lahir",
  "Gol. Darah",
  "Tinggi (cm)",
  "Berat (kg)",
  "Email",
  "No. Telepon",
  "Jenjang Studi",
  "Fakultas",
  "Program Studi",
  "Asal SMA",
  "Pernah MB",
  "Unit Sebelumnya",
  "Section",
  "3 Kata",
  "Sesi Penempatan",
];

export function ensureApplicantRow(a: Applicant): Promise<void> {
  const pending = pendingRows.get(a.referenceNumber);
  if (pending) return pending;

  const operation = ensureApplicantRowOnce(a).finally(() => {
    pendingRows.delete(a.referenceNumber);
  });
  pendingRows.set(a.referenceNumber, operation);
  return operation;
}

async function ensureApplicantRowOnce(a: Applicant): Promise<void> {
  const sheets = getSheets();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error("GOOGLE_SHEET_ID is not set");

  const existingReferences = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB}!B2:B`,
  });
  if (
    hasApplicantReference(existingReferences.data.values, a.referenceNumber)
  ) {
    return;
  }

  const placementSession = await getPlacementSessionLabel(a.sessionId);
  const row = [
    a.createdAt ? a.createdAt.toISOString() : "",
    a.referenceNumber,
    a.nim,
    a.namaLengkap,
    a.namaPanggilan ?? "",
    a.jenisKelamin ?? "",
    a.agama ?? "",
    a.tempatLahir ?? "",
    a.tanggalLahir ?? "",
    a.golonganDarah ?? "",
    a.tinggiBadanCm ?? "",
    a.beratBadanKg ?? "",
    a.email ?? "",
    a.noTelp ?? "",
    a.jenjangStudi ?? "",
    a.fakultas ?? "",
    a.prodi ?? "",
    a.asalSma ?? "",
    a.pernahMb ? "Ya" : "Tidak",
    a.unitSebelumnya ?? "",
    a.section ?? "",
    a.tigaKata ?? "",
    placementSession,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_TAB}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}
