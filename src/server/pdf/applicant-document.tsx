// server/pdf/applicant-document.tsx
//
// PDF template matching the old "Data Pendaftaran" layout: a bordered card with
// a header (logo / title / name+NIM / photo) and a two-column body of striped
// label-value rows. Tuned to fit one A4 page.
//
// FONT: uses built-in Helvetica. To match the rounded look of the original
// exactly, register Poppins with Font.register() and swap the fontFamily.

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { Applicant } from "@/server/db/schema";

const C = {
  header: "#2c3e50",
  label: "#7b8794",
  value: "#323f4b",
  border: "#e4e7eb",
  stripe: "#f5f7f9",
};

const styles = StyleSheet.create({
  page: { padding: 18, fontSize: 8.5, fontFamily: "Helvetica", color: C.value },
  card: { borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 14 },

  header: { flexDirection: "row", marginBottom: 8 },
  logoSlot: { width: 104, height: 92, borderRadius: 6, marginRight: 14, objectFit: "cover" },
  headerRight: { flex: 1, justifyContent: "center" },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.header,
    textAlign: "center",
  },
  titleDivider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginVertical: 6,
  },
  identityRow: { flexDirection: "row", alignItems: "center" },
  identityText: { flex: 1, textAlign: "center" },
  name: { fontSize: 13, color: C.value },
  nim: { fontSize: 13, color: C.value, marginTop: 2 },
  pasFotoSlot: { width: 52, height: 68, objectFit: "cover" },

  body: { flexDirection: "row" },
  col: { flex: 1 },
  colLeft: { paddingRight: 8 },
  colRight: { paddingLeft: 8 },

  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.header,
    marginTop: 10,
    marginBottom: 2,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  row: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 4 },
  rowStriped: { backgroundColor: C.stripe },
  label: { width: "42%", color: C.label, paddingRight: 4 },
  value: { width: "58%", color: C.value },

  imgPlaceholder: {
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "dashed",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  ktmSlot: { width: 110, height: 70, marginVertical: 4, objectFit: "cover" },
});

function disp(value?: string | number | null): string {
  return value === null || value === undefined || value === "" ? "-" : String(value);
}

function formatDate(d?: string | null): string {
  if (!d) return "-";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : d; // YYYY-MM-DD -> DD/MM/YYYY
}

// Renders an image if a src is given, otherwise a labeled dashed placeholder
// (mirrors how the original showed broken "pasfoto"/"ktm" boxes).
function ImageSlot({
  src,
  style,
  label,
}: {
  src?: string;
  style: Style;
  label: string;
}) {
  if (src) return <Image src={src} style={style} />;
  return (
    <View style={[style, styles.imgPlaceholder]}>
      <Text style={{ fontSize: 7, color: C.label }}>{label}</Text>
    </View>
  );
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <>
      {rows.map(([label, value], i) => (
        <View
          key={label}
          style={i % 2 === 0 ? [styles.row, styles.rowStriped] : styles.row}
        >
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </>
  );
}

function Section({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Rows rows={rows} />
    </View>
  );
}

export function ApplicantDocument({
  applicant: a,
  logo,
  pasFoto,
  ktm,
}: {
  applicant: Applicant;
  logo?: string;
  pasFoto?: string;
  ktm?: string;
}) {
  const dataDiri: [string, string][] = [
    ["Nama Lengkap", disp(a.namaLengkap)],
    ["Nama Panggilan", disp(a.namaPanggilan)],
    ["Jenis Kelamin", disp(a.jenisKelamin)],
    ["Agama", disp(a.agama)],
    ["Tempat Lahir", disp(a.tempatLahir)],
    ["Tanggal Lahir", formatDate(a.tanggalLahir)],
    ["Hobi dan Kesukaan", disp(a.hobi)],
    ["Tinggi Badan (cm)", disp(a.tinggiBadanCm)],
    ["Berat Badan (kg)", disp(a.beratBadanKg)],
    ["Golongan Darah", disp(a.golonganDarah)],
    ["Riwayat Penyakit", disp(a.riwayatPenyakit)],
    ["Alergi", disp(a.alergi)],
  ];

  const kontak: [string, string][] = [
    ["Nomor Telepon/WhatsApp", disp(a.noTelp)],
    ["Alamat E-mail", disp(a.email)],
    ["Alamat Asal", disp(a.alamatAsal)],
    ["Alamat Jogja", disp(a.alamatJogja)],
    ["Jenis Tempat Tinggal", disp(a.jenisTempat)],
    ["ID Line", disp(a.idLine)],
    ["ID Instagram", disp(a.idInstagram)],
    ["ID Facebook", disp(a.idFacebook)],
    ["ID Twitter", disp(a.idTwitter)],
  ];

  const ortu: [string, string][] = [
    ["Nama Orangtua/Wali", disp(a.namaOrtu)],
    ["Nomor Telepon Orangtua/Wali", disp(a.noOrtu)],
    ["Alamat Orangtua/Wali", disp(a.alamatOrtu)],
  ];

  const akademik: [string, string][] = [
    ["NIM", disp(a.nim)],
    ["Jenjang Studi", disp(a.jenjangStudi)],
    ["Fakultas", disp(a.fakultas)],
    ["Program Studi", disp(a.prodi)],
    ["Nama Asal Sekolah (SMA/SMK)", disp(a.asalSma)],
  ];

  const tambahan: [string, string][] = [
    ["Pengalaman Bidang Musik", disp(a.bidangMusik)],
    ["Pengalaman Bidang Tari", disp(a.bidangTari)],
    ["Pengalaman Bidang Organisasi", disp(a.organisasi)],
  ];

  const marchingBand: [string, string][] = [
    ["Pernah ikut Marching Band sebelumnya?", a.pernahMb ? "Ya" : "Tidak"],
    ["Unit Sebelumnya", disp(a.unitSebelumnya)],
    ["Section", disp(a.section)],
    ["Kemampuan Alat Musik", disp(a.kemampuanAlat)],
  ];

  return (
    <Document title={`Data Pendaftaran ${a.referenceNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          {/* ---------------- Header ---------------- */}
          <View style={styles.header}>
            <ImageSlot src={logo} style={styles.logoSlot} label="Logo" />
            <View style={styles.headerRight}>
              <Text style={styles.title}>Data Pendaftaran</Text>
              <View style={styles.titleDivider} />
              <View style={styles.identityRow}>
                <View style={styles.identityText}>
                  <Text style={styles.name}>{disp(a.namaLengkap)}</Text>
                  <Text style={styles.nim}>{disp(a.nim)}</Text>
                </View>
                <ImageSlot src={pasFoto} style={styles.pasFotoSlot} label="pasfoto" />
              </View>
            </View>
          </View>

          {/* ---------------- Body: two columns ---------------- */}
          <View style={styles.body}>
            <View style={[styles.col, styles.colLeft]}>
              <Section title="Data Diri" rows={dataDiri} />
              <Section title="Kontak" rows={kontak} />
              <Section title="Data Orangtua/Wali" rows={ortu} />
            </View>

            <View style={[styles.col, styles.colRight]}>
              <View wrap={false}>
                <Text style={styles.sectionTitle}>Data Akademik</Text>
                <ImageSlot src={ktm} style={styles.ktmSlot} label="ktm" />
                <Rows rows={akademik} />
              </View>
              <Section title="Informasi Tambahan" rows={tambahan} />
              <Section title="Pengalaman Marching Band" rows={marchingBand} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}