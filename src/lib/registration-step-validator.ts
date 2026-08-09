import {
  ACCEPTED_IMAGE_TYPES,
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  MAX_UPLOAD_BYTES,
  PHONE_MAX_DIGITS,
  PHONE_MIN_DIGITS,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
  isValidBirthDate,
  isValidNim,
  isValidPhone,
  isValidTraits,
} from "./applicant-rules";

export type PlacementSessionOption = {
  id: number;
  dayLabel: string;
  sessionNo: number;
  quota: number;
  bookedCount: number;
};

type RegistrationStepValues = {
  nim: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  agama: string;
  tinggiBadanCm: string;
  beratBadanKg: string;
  tigaKata: string;
  fakultas: string;
  prodi: string;
  noTelp: string;
  email: string;
  noOrtu: string;
  sessionId: string;
};

type UploadCandidate = Pick<File, "size" | "type">;

type ValidationContext = {
  values: RegistrationStepValues;
  sessions: readonly PlacementSessionOption[];
  pasFoto: UploadCandidate | null;
  ktm: UploadCandidate | null;
  paymentProof: UploadCandidate | null;
};

const REQUIRED_PER_STEP: Partial<
  Record<number, (keyof RegistrationStepValues)[]>
> = {
  0: [
    "nim",
    "namaLengkap",
    "tempatLahir",
    "tanggalLahir",
    "jenisKelamin",
    "agama",
  ],
  1: ["tigaKata"],
  2: ["fakultas", "prodi"],
  3: ["noTelp", "email"],
  9: ["sessionId"],
};

const FIELD_LABELS: Partial<Record<keyof RegistrationStepValues, string>> = {
  nim: "NIM",
  namaLengkap: "Nama Lengkap",
  tempatLahir: "Tempat Lahir",
  tanggalLahir: "Tanggal Lahir",
  jenisKelamin: "Jenis Kelamin",
  agama: "Agama",
  tigaKata: "Sebutkan 3 sifat yang menggambarkan dirimu",
  fakultas: "Fakultas",
  prodi: "Program Studi",
  noTelp: "Nomor Telepon",
  email: "Email",
  sessionId: "Sesi Penempatan",
};

export function validateRegistrationImage(
  file: UploadCandidate | null,
  label: string,
) {
  if (!file) return `${label} wajib diunggah.`;
  if (file.size > MAX_UPLOAD_BYTES) return `${label} maksimal 7 MB.`;
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `${label} harus menggunakan format JPG atau PNG.`;
  }
  return null;
}

export class RegistrationStepValidator {
  private readonly context: ValidationContext;

  constructor(context: ValidationContext) {
    this.context = context;
  }

  validate(step: number): string | null {
    const missingField = REQUIRED_PER_STEP[step]?.find(
      (key) => !this.context.values[key].trim(),
    );
    if (missingField) {
      return `Kolom "${FIELD_LABELS[missingField] ?? missingField}" wajib diisi.`;
    }

    switch (step) {
      case 0:
        return this.validateIdentity();
      case 1:
        return isValidTraits(this.context.values.tigaKata)
          ? null
          : "Tuliskan tepat 3 sifat, pisahkan dengan koma, dan batasi setiap sifat maksimal 40 karakter.";
      case 2:
        return this.validateAcademicData();
      case 3:
        return this.validateContact();
      case 4:
        return this.validateGuardianContact();
      case 7:
        return (
          validateRegistrationImage(this.context.pasFoto, "Pas foto") ??
          validateRegistrationImage(this.context.ktm, "Foto KTM")
        );
      case 8:
        return validateRegistrationImage(
          this.context.paymentProof,
          "Bukti pembayaran",
        );
      case 9:
        return this.validatePlacementSession();
      default:
        return null;
    }
  }

  private validateIdentity() {
    const { values } = this.context;
    if (!isValidNim(values.nim)) {
      return "NIM harus terdiri dari 5-32 karakter dan hanya boleh memakai huruf, angka, spasi, garis miring, titik, atau tanda hubung.";
    }
    if (values.namaLengkap.trim().length < 2) {
      return "Nama lengkap minimal 2 karakter.";
    }
    if (values.tempatLahir.trim().length < 2) {
      return "Tempat lahir minimal 2 karakter.";
    }
    if (!isValidBirthDate(values.tanggalLahir)) {
      return "Tanggal lahir harus berupa tanggal nyata antara 1 Januari 1900 dan hari ini.";
    }
    if (
      !this.isOptionalIntegerInRange(
        values.tinggiBadanCm,
        HEIGHT_MIN_CM,
        HEIGHT_MAX_CM,
      )
    ) {
      return `Tinggi badan harus berupa bilangan bulat ${HEIGHT_MIN_CM}-${HEIGHT_MAX_CM} cm.`;
    }
    if (
      !this.isOptionalIntegerInRange(
        values.beratBadanKg,
        WEIGHT_MIN_KG,
        WEIGHT_MAX_KG,
      )
    ) {
      return `Berat badan harus berupa bilangan bulat ${WEIGHT_MIN_KG}-${WEIGHT_MAX_KG} kg.`;
    }
    return null;
  }

  private validateAcademicData() {
    const { values } = this.context;
    if (values.fakultas.trim().length < 2) {
      return "Fakultas minimal 2 karakter.";
    }
    return values.prodi.trim().length < 2
      ? "Program studi minimal 2 karakter."
      : null;
  }

  private validateContact() {
    const { values } = this.context;
    if (!isValidPhone(values.noTelp)) {
      return `Nomor telepon harus mengandung ${PHONE_MIN_DIGITS}-${PHONE_MAX_DIGITS} digit.`;
    }
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)
      ? null
      : "Format email belum valid.";
  }

  private validateGuardianContact() {
    const { noOrtu } = this.context.values;
    return noOrtu.trim() && !isValidPhone(noOrtu)
      ? `Nomor telepon orang tua harus mengandung ${PHONE_MIN_DIGITS}-${PHONE_MAX_DIGITS} digit.`
      : null;
  }

  private validatePlacementSession() {
    const { sessions, values } = this.context;
    if (sessions.length === 0) {
      return "Sesi penempatan belum tersedia. Hubungi panitia — pendaftaran belum bisa dikirim.";
    }
    const selected = sessions.find(
      (session) => String(session.id) === values.sessionId,
    );
    if (!selected) return "Pilih sesi penempatan yang tersedia.";
    return selected.bookedCount >= selected.quota
      ? "Sesi yang dipilih sudah penuh. Silakan pilih sesi lain."
      : null;
  }

  private isOptionalIntegerInRange(value: string, min: number, max: number) {
    if (!value.trim()) return true;
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max;
  }
}
