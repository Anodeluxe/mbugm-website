export const APPLICANT_TEXT_LIMITS = {
  website: 200,
  nim: 32,
  namaLengkap: 120,
  namaPanggilan: 60,
  tempatLahir: 100,
  riwayatPenyakit: 500,
  alergi: 500,
  hobi: 300,
  tigaKata: 140,
  fakultas: 120,
  prodi: 120,
  asalSma: 120,
  noTelp: 25,
  email: 254,
  alamatAsal: 500,
  alamatJogja: 500,
  namaOrtu: 120,
  noOrtu: 25,
  alamatOrtu: 500,
  idLine: 100,
  idInstagram: 100,
  idFacebook: 100,
  idTwitter: 100,
  bidangTari: 500,
  bidangMusik: 500,
  organisasi: 500,
  unitSebelumnya: 150,
  section: 100,
  kemampuanAlat: 500,
} as const;

export const PHONE_MIN_DIGITS = 8;
export const PHONE_MAX_DIGITS = 18;
export const HEIGHT_MIN_CM = 50;
export const HEIGHT_MAX_CM = 500;
export const WEIGHT_MIN_KG = 10;
export const WEIGHT_MAX_KG = 500;
export const MAX_UPLOAD_BYTES = 7 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;

function dateInJakarta(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function isValidBirthDate(
  value: string,
  today = dateInJakarta(new Date()),
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const realDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return realDate && value >= "1900-01-01" && value <= today;
}

export function isValidNim(value: string) {
  const trimmed = value.trim();
  return (
    trimmed.length >= 5 &&
    trimmed.length <= APPLICANT_TEXT_LIMITS.nim &&
    /^[A-Za-z0-9./ -]+$/.test(trimmed)
  );
}

export function phoneDigitCount(value: string) {
  return value.replace(/\D/g, "").length;
}

export function isValidPhone(value: string) {
  const trimmed = value.trim();
  const digits = phoneDigitCount(trimmed);
  return (
    /^[+()\d\s-]+$/.test(trimmed) &&
    digits >= PHONE_MIN_DIGITS &&
    digits <= PHONE_MAX_DIGITS
  );
}

export function parseTraits(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((trait) => trait.trim())
    .filter(Boolean);
}

export function isValidTraits(value: string) {
  const traits = parseTraits(value);
  return (
    value.trim().length <= APPLICANT_TEXT_LIMITS.tigaKata &&
    traits.length === 3 &&
    traits.every((trait) => trait.length >= 2 && trait.length <= 40)
  );
}

export function isAcceptedImage(file: Pick<File, "size" | "type">) {
  return (
    file.size <= MAX_UPLOAD_BYTES &&
    (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)
  );
}
