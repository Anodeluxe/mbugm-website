// server/pdf/applicant-document.tsx
//
// The PDF template, built with @react-pdf/renderer's primitives (NOT HTML).
// These look like React components but render to PDF, so you can't use normal
// DOM elements (div/span) or browser CSS here — only <Document>, <Page>,
// <View>, <Text>, etc., styled via StyleSheet.

import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Applicant } from "@/server/db/schema";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#171717",
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#171717",
    paddingBottom: 8,
  },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 10, color: "#555555", marginTop: 2 },
  ref: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 6 },
  section: { marginTop: 12 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    backgroundColor: "#f0f0f0",
    padding: 4,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eeeeee",
  },
  label: { width: "38%", color: "#555555" },
  value: { width: "62%" },
  footer: { marginTop: 16, fontSize: 8, color: "#999999" },
});

function Row({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const display =
    value === null || value === undefined || value === "" ? "-" : String(value);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{display}</Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function ApplicantDocument({
  applicant: a,
  sessionLabel,
}: {
  applicant: Applicant;
  sessionLabel?: string | null;
}) {
  return (
    <Document title={`Formulir ${a.referenceNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Formulir Pendaftaran Marching Band UGM
          </Text>
          <Text style={styles.subtitle}>Unit Kegiatan Mahasiswa</Text>
          <Text style={styles.ref}>No. Referensi: {a.referenceNumber}</Text>
        </View>

        <Section title="Data Diri">
          <Row label="NIM" value={a.nim} />
          <Row label="Nama Lengkap" value={a.namaLengkap} />
          <Row label="Nama Panggilan" value={a.namaPanggilan} />
          <Row
            label="Tempat, Tanggal Lahir"
            value={[a.tempatLahir, a.tanggalLahir].filter(Boolean).join(", ")}
          />
          <Row label="Jenis Kelamin" value={a.jenisKelamin} />
          <Row label="Agama" value={a.agama} />
          <Row label="Golongan Darah" value={a.golonganDarah} />
          <Row
            label="Tinggi / Berat Badan"
            value={`${a.tinggiBadanCm ?? "-"} cm / ${a.beratBadanKg ?? "-"} kg`}
          />
        </Section>

        <Section title="Kesehatan">
          <Row label="Riwayat Penyakit" value={a.riwayatPenyakit} />
          <Row label="Alergi" value={a.alergi} />
          <Row label="Hobi" value={a.hobi} />
        </Section>

        <Section title="Data Akademik">
          <Row label="Jenjang Studi" value={a.jenjangStudi} />
          <Row label="Fakultas" value={a.fakultas} />
          <Row label="Program Studi" value={a.prodi} />
          <Row label="Asal SMA" value={a.asalSma} />
        </Section>

        <Section title="Kontak & Alamat">
          <Row label="Nomor Telepon" value={a.noTelp} />
          <Row label="Email" value={a.email} />
          <Row label="Alamat Asal" value={a.alamatAsal} />
          <Row label="Jenis Tempat Tinggal" value={a.jenisTempat} />
          <Row label="Alamat di Jogja" value={a.alamatJogja} />
        </Section>

        <Section title="Data Orang Tua / Wali">
          <Row label="Nama" value={a.namaOrtu} />
          <Row label="Nomor Telepon" value={a.noOrtu} />
          <Row label="Alamat" value={a.alamatOrtu} />
        </Section>

        <Section title="Media Sosial">
          <Row label="Line" value={a.idLine} />
          <Row label="Instagram" value={a.idInstagram} />
          <Row label="Facebook" value={a.idFacebook} />
          <Row label="Twitter / X" value={a.idTwitter} />
        </Section>

        <Section title="Pengalaman Marching Band">
          <Row label="Bidang Tari" value={a.bidangTari} />
          <Row label="Bidang Musik" value={a.bidangMusik} />
          <Row label="Organisasi" value={a.organisasi} />
          <Row label="Pernah Ikut MB" value={a.pernahMb ? "Ya" : "Tidak"} />
          <Row label="Unit Sebelumnya" value={a.unitSebelumnya} />
          <Row label="Section" value={a.section} />
          <Row label="Kemampuan Alat" value={a.kemampuanAlat} />
        </Section>

        <Section title="Penempatan">
          <Row label="Sesi" value={sessionLabel} />
        </Section>

        <Text style={styles.footer}>
          Dicetak otomatis dari sistem pendaftaran • {a.referenceNumber}
        </Text>
      </Page>
    </Document>
  );
}