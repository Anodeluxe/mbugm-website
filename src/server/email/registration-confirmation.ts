import type { Applicant } from "@/server/db/schema";

const SUBJECT = "Bukti Registrasi PAB MB UGM 2026";
const FROM = "PAB MB UGM <noreply@mbugm.org>";

type RegistrationRecipient = Pick<
  Applicant,
  "email" | "namaLengkap" | "referenceNumber"
>;

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/, 1)[0] || "Peserta";
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] as string,
  );
}

export function buildRegistrationConfirmationEmail(fullName: string) {
  const greetingName = firstName(fullName);
  const safeGreetingName = escapeHtml(greetingName);
  const caption = `[PAB MARCHING BAND UGM 2026]
(Bikin pantun tercakep kalian)

Halo, Gadjah Mada Muda dan Gadjah Mada Tua ✨

Cerita dan langkah baru bersama Marching Band Universitas Gadjah Mada akan segera dimulai. Siapkah kamu menjadi bagian dari cerita besar yang menanti?

Perkenalkan, saya (Nama, Prodi, Fakultas, Angkatan), siap mengukir cerita dan menjadi bagian dari keluarga Marching Band UGM Rotasi XLV.

Saya yakin, Marching Band UGM adalah wadah yang tepat untuk tumbuh, belajar, dan mengekspresikan diri. Di sini, kita bisa menjadi pemuda yang kreatif, berani bermimpi, dan terus berkembang. Tempat ini bukan hanya soal memainkan musik bersama, tapi juga tentang menjalin persahabatan, saling mendukung, dan tumbuh bersama sebagai satu keluarga.

Kalau kamu ingin ikut mengukir cerita bersama kami, kunjungi https://mbugm.org sekarang! Bersiaplah menapaki perjalanan tak terlupakan. Stadion Pancasila sudah menanti langkahmu.

Viva Marching Band UGM!

___________
Find us on
Facebook: MB UGM Yogyakarta
Instagram: @mbugm @pabmbugm
X: @MBUGM
TikTok: mbugm
YouTube: MBUGMofficial

☎ Contact Person:
+62 811-2615-555 (Sonya)
+62 857-0735-6038 (Dimas)

#PABMBUGM2026
#MBUGM
#VivaMBUGM
#UGMYogyakarta`;
  const captionHtml = escapeHtml(caption)
    .replace(
      "[PAB MARCHING BAND UGM 2026]",
      "<strong>[PAB MARCHING BAND UGM 2026]</strong>",
    )
    .replace(
      "(Nama, Prodi, Fakultas, Angkatan)",
      "<strong>(Nama, Prodi, Fakultas, Angkatan)</strong>",
    )
    .replace(
      "Marching Band UGM Rotasi XLV",
      "<strong>Marching Band UGM Rotasi XLV</strong>",
    )
    .replace("https://mbugm.org", "<strong>https://mbugm.org</strong>");

  const text = `Halo, ${greetingName}!

Selamat! Kamu telah berhasil mendaftar PAB Marching Band UGM 2026. 🎉

Dimohon untuk melanjutkan ke tahap berikutnya, yaitu placement test sesuai dengan jadwal yang akan dipilih nanti.

Jangan lupa juga untuk:
1. Posting poster PAB Marching Band UGM ke story Instagram-mu.
2. Pasang twibbon PAB Marching Band UGM 2026 di feed Instagram.
3. Tag akun Instagram: @pabmbugm dan @mbugm
4. Sertakan caption sesuai petunjuk yang diberikan.

Berikut link poster PAB MB UGM 2026:
https://acesse.one/posterpabmbugm-2026

Berikut link dan langkah-langkah pemakaian twibon:
https://canva.link/n9g2zptqglpz2vv
1. Buka link twibbon yang disediakan.
2. Kembali ke menu Canva.
3. Tekan titik tiga pada desain, lalu pilih duplikat/buat salinan.
4. Edit twibbon pada desain yang telah di-copy.

Terus semangat dan selamat memulai perjalanan baru bersama PAB Marching Band UGM 2026! 🎶

Gunakan caption berikut untuk dilampirkan pada feed Instagram.

${caption}`;

  const html = `<!doctype html>
<html lang="id">
  <body style="margin:0;background:#f4f4f0;color:#20251f;font-family:Arial,sans-serif;line-height:1.6">
    <div style="display:none;max-height:0;overflow:hidden">Bukti registrasi PAB MB UGM 2026</div>
    <main style="max-width:640px;margin:0 auto;padding:32px 16px">
      <section style="background:#ffffff;border:1px solid #deded7;border-radius:16px;padding:32px">
        <p style="margin:0 0 24px;font-size:20px;font-weight:700">Halo, ${safeGreetingName}!</p>
        <p>Selamat! Kamu telah berhasil mendaftar PAB Marching Band UGM 2026. 🎉</p>
        <p>Dimohon untuk melanjutkan ke tahap berikutnya, yaitu placement test sesuai dengan jadwal yang akan dipilih nanti.</p>
        <p style="margin-bottom:8px">Jangan lupa juga untuk:</p>
        <ol style="padding-left:22px">
          <li>Posting poster PAB Marching Band UGM ke story Instagram-mu.</li>
          <li>Pasang twibbon PAB Marching Band UGM 2026 di feed Instagram.</li>
          <li>Tag akun Instagram: <strong>@pabmbugm</strong> dan <strong>@mbugm</strong>.</li>
          <li>Sertakan caption sesuai petunjuk yang diberikan.</li>
        </ol>
        <p><strong>Poster PAB MB UGM 2026</strong><br><a href="https://acesse.one/posterpabmbugm-2026" style="color:#225f36">https://acesse.one/posterpabmbugm-2026</a></p>
        <p style="margin-bottom:8px"><strong>Twibbon dan langkah pemakaian</strong><br><a href="https://canva.link/n9g2zptqglpz2vv" style="color:#225f36">https://canva.link/n9g2zptqglpz2vv</a></p>
        <ol style="padding-left:22px">
          <li>Buka link twibbon yang disediakan.</li>
          <li>Kembali ke menu Canva.</li>
          <li>Tekan titik tiga pada desain, lalu pilih <strong>duplikat/buat salinan</strong>.</li>
          <li>Edit twibbon pada desain yang telah di-copy.</li>
        </ol>
        <p>Terus semangat dan selamat memulai perjalanan baru bersama PAB Marching Band UGM 2026! 🎶</p>
        <p>Gunakan caption berikut untuk dilampirkan pada feed Instagram.</p>
        <div style="white-space:pre-wrap;background:#f4f4f0;border-left:4px solid #225f36;border-radius:8px;padding:20px">${captionHtml}</div>
      </section>
    </main>
  </body>
</html>`;

  return { subject: SUBJECT, html, text };
}

export async function sendRegistrationConfirmationEmail(
  applicant: RegistrationRecipient,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const email = applicant.email?.trim();
  if (!email) throw new Error("Applicant email is missing");

  const content = buildRegistrationConfirmationEmail(applicant.namaLengkap);
  const replyTo = process.env.REGISTRATION_EMAIL_REPLY_TO?.trim();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `registration-confirmation/${applicant.referenceNumber}`,
      "User-Agent": "mbugm-website/1.0",
    },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      ...content,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  await response.text();
  if (!response.ok) {
    throw new Error(`Resend API failed with status ${response.status}`);
  }
}
