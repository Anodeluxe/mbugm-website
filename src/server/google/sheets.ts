// server/google/sheets.ts

import { getSheets } from "./client";
import type { Applicant } from "@/server/db/schema";

// The tab name in your spreadsheet. Change this if your first tab isn't "Sheet1".
const SHEET_TAB = "Sheet1";

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
];

export async function appendApplicantRow(a: Applicant): Promise<void> {
  const sheets = getSheets();
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
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: `${SHEET_TAB}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}