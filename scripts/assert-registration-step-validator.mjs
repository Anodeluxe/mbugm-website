import assert from "node:assert/strict";
import { RegistrationStepValidator } from "../src/lib/registration-step-validator.ts";

const values = {
  nim: "23/521764/TK/57572",
  namaLengkap: "Budi Santoso",
  tempatLahir: "Yogyakarta",
  tanggalLahir: "2005-01-01",
  jenisKelamin: "Laki-laki",
  agama: "Islam",
  tinggiBadanCm: "170",
  beratBadanKg: "60",
  tigaKata: "Disiplin, kreatif, ramah",
  fakultas: "Teknik",
  prodi: "Teknik Mesin",
  noTelp: "08123456789",
  email: "budi@example.com",
  noOrtu: "081298765432",
  sessionId: "1",
};
const image = { size: 100, type: "image/jpeg" };
const session = {
  id: 1,
  dayLabel: "Minggu, 13 September 2026",
  sessionNo: 2,
  quota: 40,
  bookedCount: 0,
};

const validator = (overrides = {}) =>
  new RegistrationStepValidator({
    values,
    sessions: [session],
    pasFoto: image,
    ktm: image,
    paymentProof: image,
    now: new Date("2026-09-01T12:00:00+07:00"),
    ...overrides,
  });

assert.equal(validator().validate(0), null);
assert.match(
  validator({ values: { ...values, nim: "" } }).validate(0),
  /NIM.*wajib diisi/,
);
assert.match(
  validator({ values: { ...values, nim: undefined } }).validate(0),
  /NIM.*wajib diisi/,
);
assert.equal(
  validator({
    values: {
      ...values,
      tinggiBadanCm: undefined,
      beratBadanKg: undefined,
      noOrtu: undefined,
    },
  }).validate(0),
  null,
);
assert.equal(
  validator({ values: { ...values, noOrtu: undefined } }).validate(4),
  null,
);
assert.equal(validator().validate(7), null);
assert.match(validator({ pasFoto: null }).validate(7), /Pas foto.*wajib/);
assert.match(
  validator({ sessions: [{ ...session, bookedCount: 40 }] }).validate(9),
  /sudah penuh/,
);
assert.match(
  validator({
    sessions: [{ ...session, dayLabel: "Sabtu, 12 September 2026" }],
  }).validate(9),
  /perpanjangan/,
);

console.log("Registration step validator checks passed.");
