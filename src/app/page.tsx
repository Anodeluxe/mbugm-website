// app/page.tsx — Full landing page for PAB MBUGM
// Aesthetic: Collegiate heritage × warm editorial. Crimson + parchment for ceremony,
// paper + ink for content. Drill-dot texture from field formation identity.

import Link from "next/link";
import { config, isRegistrationOpen } from "@/lib/config";

const registrationOpen = isRegistrationOpen();

const OPENS_DATE = new Date(config.opensAt).toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});
const CLOSES_DATE = new Date(config.closesAt).toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

export default function Page() {
  return (
    <>
      <Navbar open={registrationOpen} />
      <main>
        <Hero open={registrationOpen} />
        <StatsStrip />
        <About />
        <Activities />
        <Achievements />
        <ScheduleLocation />
        <SecondaryCta open={registrationOpen} />
      </main>
      <Footer />
    </>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────────────── */
function Navbar({ open }: { open: boolean }) {
  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur-sm border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-crimson rounded-sm flex items-center justify-center shrink-0">
            <span className="text-paper font-display font-bold text-sm leading-none">MB</span>
          </div>
          <span className="font-display font-semibold text-ink text-lg leading-none hidden sm:block">
            Marching Band UGM
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <a href="#tentang" className="text-warm-gray hover:text-ink text-sm font-medium px-3 py-2 rounded-md hover:bg-parchment/60 transition-colors hidden md:block">
            Tentang
          </a>
          <a href="#kegiatan" className="text-warm-gray hover:text-ink text-sm font-medium px-3 py-2 rounded-md hover:bg-parchment/60 transition-colors hidden md:block">
            Kegiatan
          </a>
          <a href="#prestasi" className="text-warm-gray hover:text-ink text-sm font-medium px-3 py-2 rounded-md hover:bg-parchment/60 transition-colors hidden md:block">
            Prestasi
          </a>
          {open ? (
            <Link
              href="/daftar"
              className="ml-2 px-4 py-2 bg-crimson hover:bg-crimson-press text-paper text-sm font-semibold rounded-md transition-colors"
            >
              Daftar Sekarang
            </Link>
          ) : (
            <span className="ml-2 px-4 py-2 bg-border text-warm-gray text-sm font-semibold rounded-md cursor-not-allowed">
              Ditutup
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
function Hero({ open }: { open: boolean }) {
  return (
    <section className="relative min-h-[100dvh] bg-parchment overflow-hidden flex items-center">
      {/* Drill-dot texture overlay */}
      <div className="drill-dots absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden="true" />

      {/* Crimson accent stripe — ceremonial banner strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-crimson" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: text */}
          <div>
            {/* Heritage badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="h-px w-8 bg-crimson shrink-0" />
              <span className="text-xs font-body font-bold tracking-[0.18em] text-crimson uppercase">
                Est. 1979
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-[1.05] mb-6">
              Bergabung&nbsp;dengan&nbsp;Marching&nbsp;Band Kebanggaan&nbsp;UGM
            </h1>

            <p className="text-warm-gray font-body text-base sm:text-lg leading-relaxed mb-8 max-w-[52ch]">
              Lebih dari empat dekade mencetak musisi, penari, dan pemimpin. Satu komunitas,
              satu irama — kekeluargaan yang bertahan seumur hidup.
            </p>

            {/* Period */}
            <div className="mb-8 flex items-start gap-3">
              <div className="w-1 self-stretch bg-crimson rounded-full shrink-0 mt-1" />
              <div>
                <p className="text-xs font-body font-bold tracking-[0.14em] text-crimson uppercase mb-1">
                  Periode Pendaftaran {config.year}
                </p>
                <p className="text-ink font-body font-medium text-sm">
                  {OPENS_DATE} — {CLOSES_DATE}
                </p>
                {!open && (
                  <p className="text-warm-gray text-xs mt-1">Pendaftaran saat ini ditutup.</p>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              {open ? (
                <Link
                  href="/daftar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-crimson hover:bg-crimson-press text-paper font-body font-semibold rounded-md transition-colors text-sm sm:text-base"
                >
                  Daftar Sekarang
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              ) : (
                <span className="inline-flex items-center px-6 py-3 bg-border text-warm-gray font-body font-semibold rounded-md text-sm sm:text-base cursor-not-allowed">
                  Pendaftaran Ditutup
                </span>
              )}
              <a
                href="#tentang"
                className="inline-flex items-center px-6 py-3 border-2 border-ink text-ink hover:bg-ink hover:text-paper font-body font-semibold rounded-md transition-colors text-sm sm:text-base"
              >
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>

          {/* Right: photo */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(34,30,27,0.18)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://picsum.photos/seed/mbugm-formasi/800/600"
                alt="Formasi lapangan Marching Band UGM"
                className="w-full h-72 sm:h-96 lg:h-[480px] object-cover"
                width={800}
                height={600}
              />
              {/* Crimson overlay strip at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-ink/70 to-transparent">
                <p className="text-paper font-body text-xs font-medium tracking-wide">
                  Formasi lapangan — Stadion Pancasila UGM
                </p>
              </div>
            </div>
            {/* Decorative offset block */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-crimson rounded-xl -z-10 opacity-80" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <span className="text-xs font-body text-ink tracking-widest uppercase">Gulir</span>
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden="true">
          <path d="M8 2v16M2 14l6 6 6-6" stroke="#221E1B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </section>
  );
}

/* ─── Stats strip ─────────────────────────────────────────────────────────── */
function StatsStrip() {
  const stats = [
    { value: "1979", label: "Tahun Berdiri" },
    { value: "10×", label: "Juara GPMB Nasional" },
    { value: "46+", label: "Tahun Pengalaman" },
    { value: "3.000+", label: "Alumni Aktif" },
  ];

  return (
    <section className="bg-crimson py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="font-display text-3xl sm:text-4xl font-bold text-paper leading-none mb-1">
                {s.value}
              </dt>
              <dd className="font-body text-xs sm:text-sm text-parchment/80 tracking-wide uppercase font-medium">
                {s.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ─── About ───────────────────────────────────────────────────────────────── */
function About() {
  return (
    <section id="tentang" className="py-20 sm:py-28 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-start">
          {/* Left: pull-quote */}
          <div className="lg:sticky lg:top-24">
            <span className="block text-xs font-body font-bold tracking-[0.18em] text-crimson uppercase mb-6">
              Tentang Kami
            </span>
            <blockquote className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-ink leading-[1.1] mb-6">
              &ldquo;Kiblat marching band Indonesia — sejak 1979.&rdquo;
            </blockquote>
            <p className="font-body text-warm-gray text-sm leading-relaxed">
              Visi kami: menjadi representasi terbaik UGM dan kebanggaan masyarakat Yogyakarta di panggung
              nasional maupun internasional.
            </p>
          </div>

          {/* Right: body copy */}
          <div className="font-body text-ink leading-relaxed space-y-5 text-[1.0625rem]">
            <p>
              Marching Band Universitas Gadjah Mada berdiri pada <strong>11 Maret 1979</strong>, bermula
              sebagai unit <em>drum corps</em> kampus. Selama lebih dari empat dekade, MBUGM telah
              berkembang menjadi salah satu unit marching band paling bergengsi di Indonesia — dengan
              rekam jejak juara GPMB berulang kali sepanjang 2010–2017, penampilan di Istana Negara,
              Gedung Agung, Festival Kesenian Yogyakarta, dan berbagai acara internasional.
            </p>
            <p>
              Apa yang membedakan MBUGM bukan hanya piala atau panggung — melainkan nilai yang ditanamkan
              kepada setiap anggota: <strong>kekeluargaan</strong>, <strong>gotong royong</strong>,
              disiplin, dan tanggung jawab. Ikatan ini melampaui masa kuliah dan membentuk komunitas alumni
              yang saling mendukung hingga ke seluruh penjuru negeri.
            </p>
            <p>
              Setiap tahun, kami membuka pintu bagi mahasiswa UGM baru — dari semua jurusan, semua latar
              belakang — untuk bergabung dan menemukan versi terbaik diri mereka dalam balutan seragam
              kebanggaan merah-putih.
            </p>

            <div className="pt-4 border-t border-border">
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Lokasi Latihan", value: "Stadion Pancasila UGM, Yogyakarta" },
                  { label: "Jadwal Rutin", value: "Selasa & Kamis, 15.30–18.00 WIB" },
                  { label: "Bidang", value: "Brass, Percussion, Color Guard, Dance" },
                  { label: "Afiliasi", value: "GPMB, Kemenpora, FKY" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <span className="text-xs font-bold tracking-[0.12em] text-warm-gray uppercase mb-0.5">
                      {item.label}
                    </span>
                    <span className="text-ink font-medium text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Activities ──────────────────────────────────────────────────────────── */
function Activities() {
  const items = [
    {
      title: "Latihan Rutin",
      desc: "Selasa & Kamis setiap pekan di Stadion Pancasila. Fondasi teknis dan kekompakan tim dibangun di sini — dari nada pertama hingga formasi lapangan.",
      accent: "bg-parchment",
      tag: "Reguler",
    },
    {
      title: "Karantina PAB",
      desc: "Program intensif pascapenerimaan anggota baru. Bukan sekadar latihan — ini adalah ritual pembentukan tim dan pengenalan budaya MBUGM.",
      accent: "bg-crimson/10",
      tag: "Tahunan",
    },
    {
      title: "Parade & Konser",
      desc: "Penampilan non-kompetisi di Festival Kesenian Yogyakarta, Dies Natalis UGM, dan undangan resmi lainnya. Panggung nyata di depan ribuan penonton.",
      accent: "bg-parchment",
      tag: "Sepanjang Tahun",
    },
    {
      title: "Kompetisi Nasional",
      desc: "Mentas di GPMB dan lomba marching band tingkat nasional. Di sinilah ribuan jam latihan diuji — dan nama UGM dibanggakan.",
      accent: "bg-crimson/10",
      tag: "Berkala",
    },
  ];

  return (
    <section id="kegiatan" className="py-20 sm:py-28 bg-parchment/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="text-xs font-body font-bold tracking-[0.18em] text-crimson uppercase">
            Kegiatan
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-3 leading-tight">
            Apa yang kamu lakukan<br className="hidden sm:block" /> sebagai anggota MBUGM
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {items.map((item) => (
            <article key={item.title} className={`${item.accent} rounded-2xl p-7 border border-border/60`}>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/70 text-crimson-press text-xs font-body font-bold tracking-wide mb-4">
                {item.tag}
              </span>
              <h3 className="font-display text-xl font-bold text-ink mb-3">{item.title}</h3>
              <p className="font-body text-warm-gray text-sm leading-relaxed max-w-[48ch]">
                {item.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Achievements ────────────────────────────────────────────────────────── */
function Achievements() {
  const items = [
    {
      year: "2017",
      event: "Grand Prix Marching Band Nasional",
      result: "Juara Umum",
      venue: "Istora Senayan, Jakarta",
    },
    {
      year: "2019",
      event: "Penampilan Kenegaraan",
      result: "Tampil di Istana Negara",
      venue: "HUT RI ke-74, Jakarta",
    },
    {
      year: "2023",
      event: "Festival Kesenian Yogyakarta",
      result: "Penampilan Utama",
      venue: "Taman Budaya Yogyakarta",
    },
  ];

  return (
    <section id="prestasi" className="py-20 sm:py-28 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-start">
          <div>
            <span className="text-xs font-body font-bold tracking-[0.18em] text-crimson uppercase">
              Prestasi
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-3 leading-tight">
              Rekam Jejak yang Berbicara
            </h2>
            <p className="font-body text-warm-gray text-sm mt-4 leading-relaxed max-w-[38ch]">
              Dari panggung kampus ke Istana Negara — perjalanan MBUGM ditulis dalam catatan prestasi
              yang mencerminkan dedikasi setiap generasi anggota.
            </p>
          </div>

          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.year + item.event} className="py-6 first:pt-0 last:pb-0 flex gap-6 items-start">
                <div className="shrink-0 w-16 text-right">
                  <span className="font-display text-2xl font-bold text-crimson leading-none">
                    {item.year}
                  </span>
                </div>
                <div>
                  <p className="font-body text-xs font-bold tracking-[0.1em] text-warm-gray uppercase mb-1">
                    {item.event}
                  </p>
                  <p className="font-display text-lg font-bold text-ink leading-snug">{item.result}</p>
                  <p className="font-body text-sm text-warm-gray mt-0.5">{item.venue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Schedule & Location ─────────────────────────────────────────────────── */
function ScheduleLocation() {
  return (
    <section className="py-20 sm:py-28 bg-parchment/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <span className="text-xs font-body font-bold tracking-[0.18em] text-crimson uppercase">
              Jadwal & Lokasi
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-3 mb-8 leading-tight">
              Temukan Kami di Lapangan
            </h2>

            <div className="space-y-5">
              {[
                { day: "Selasa", time: "15.30 – 18.00 WIB", note: "Latihan reguler — semua seksi" },
                { day: "Kamis", time: "15.30 – 18.00 WIB", note: "Latihan reguler — semua seksi" },
                { day: "Sabtu", time: "Sesuai agenda", note: "Persiapan kompetisi / penampilan khusus" },
              ].map((s) => (
                <div key={s.day} className="flex gap-5 items-start">
                  <div className="shrink-0 w-24 pt-0.5">
                    <span className="font-display font-bold text-ink text-lg">{s.day}</span>
                  </div>
                  <div>
                    <p className="font-body font-semibold text-ink text-sm">{s.time}</p>
                    <p className="font-body text-warm-gray text-xs mt-0.5">{s.note}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 bg-paper rounded-xl border border-border">
              <p className="font-body text-xs font-bold tracking-[0.1em] text-warm-gray uppercase mb-1">
                Lokasi
              </p>
              <p className="font-body font-semibold text-ink text-sm">Stadion Pancasila UGM</p>
              <p className="font-body text-warm-gray text-xs mt-0.5">
                Jl. Pancasila, Caturtunggal, Kec. Depok, Kabupaten Sleman, D.I. Yogyakarta
              </p>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="rounded-2xl overflow-hidden border border-border shadow-[0_4px_16px_rgba(34,30,27,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://picsum.photos/seed/stadion-pancasila/720/480"
              alt="Peta lokasi Stadion Pancasila UGM"
              className="w-full h-64 sm:h-80 lg:h-96 object-cover"
              width={720}
              height={480}
            />
            <div className="p-4 bg-paper flex items-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AD2829" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="font-body text-xs text-warm-gray">Stadion Pancasila, Universitas Gadjah Mada</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Secondary CTA ───────────────────────────────────────────────────────── */
function SecondaryCta({ open }: { open: boolean }) {
  return (
    <section className="relative bg-crimson py-20 sm:py-24 overflow-hidden">
      <div className="drill-dots absolute inset-0 opacity-[0.06] pointer-events-none" aria-hidden="true" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <span className="inline-flex items-center gap-2 mb-4">
          <span className="h-px w-6 bg-parchment/50" />
          <span className="text-xs font-body font-bold tracking-[0.18em] text-parchment/70 uppercase">
            Penerimaan Anggota Baru {config.year}
          </span>
          <span className="h-px w-6 bg-parchment/50" />
        </span>
        <h2 className="font-display text-3xl sm:text-5xl font-bold text-paper mb-5 leading-tight">
          Siap Jadi Bagian dari Keluarga MBUGM?
        </h2>
        <p className="font-body text-parchment/80 text-base sm:text-lg mb-8 leading-relaxed max-w-[52ch] mx-auto">
          Daftarkan dirimu sekarang dan mulai perjalananmu bersama komunitas marching band terbaik di Indonesia.
        </p>
        {open ? (
          <Link
            href="/daftar"
            className="inline-flex items-center gap-2 px-8 py-4 bg-parchment hover:bg-paper text-crimson font-body font-bold rounded-md transition-colors text-base"
          >
            Mulai Pendaftaran
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="inline-flex items-center px-8 py-4 bg-parchment/30 text-parchment/60 font-body font-bold rounded-md cursor-not-allowed text-base">
              Pendaftaran Sedang Ditutup
            </span>
            <p className="text-parchment/50 text-sm font-body">
              Dibuka: {OPENS_DATE}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-ink text-paper py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-crimson rounded-sm flex items-center justify-center shrink-0">
                <span className="text-paper font-display font-bold text-xs leading-none">MB</span>
              </div>
              <span className="font-display font-semibold text-paper text-base">Marching Band UGM</span>
            </div>
            <p className="font-body text-paper/50 text-sm leading-relaxed max-w-[40ch]">
              Unit Kegiatan Mahasiswa Universitas Gadjah Mada. Berdiri 11 Maret 1979.
            </p>
          </div>

          <div>
            <p className="font-body text-xs font-bold tracking-[0.14em] text-paper/40 uppercase mb-3">
              Navigasi
            </p>
            <ul className="space-y-2">
              {[
                ["#tentang", "Tentang"],
                ["#kegiatan", "Kegiatan"],
                ["#prestasi", "Prestasi"],
                ["#jadwal", "Jadwal"],
              ].map(([href, label]) => (
                <li key={label}>
                  <a href={href} className="font-body text-paper/60 hover:text-paper text-sm transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-body text-xs font-bold tracking-[0.14em] text-paper/40 uppercase mb-3">
              Kontak
            </p>
            <ul className="space-y-2 font-body text-sm text-paper/60">
              <li>marchingband@ugm.ac.id</li>
              <li>@mbugm.official</li>
              <li>Stadion Pancasila UGM</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-paper/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="font-body text-paper/30 text-xs">
            &copy; {config.year} Marching Band UGM. Dibuat dengan kebanggaan oleh Rotasi XLIII.
          </p>
          <p className="font-body text-paper/20 text-xs">
            {config.shortName}
          </p>
        </div>
      </div>
    </footer>
  );
}
