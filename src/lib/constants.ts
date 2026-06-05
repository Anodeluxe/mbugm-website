// Single source of truth for every dropdown's options.
// Both the form (frontend) and the Zod schema (backend) import from here,
// so a list only ever needs to change in ONE place.

export const AGAMA_OPTIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
] as const;

export const JENIS_KELAMIN_OPTIONS = ["Laki-laki", "Perempuan"] as const;

export const GOLONGAN_DARAH_OPTIONS = ["A", "B", "AB", "O"] as const;

export const JENJANG_STUDI_OPTIONS = [
  "D3",
  "D4",
  "S1",
  "S2",
  "S3",
  "Profesi",
] as const;

export const JENIS_TEMPAT_OPTIONS = [
  "Kos",
  "Asrama",
  "Rumah orang tua",
  "Rumah saudara",
  "Lainnya",
] as const;