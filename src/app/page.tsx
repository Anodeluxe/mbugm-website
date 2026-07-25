import Image from "next/image";
import Link from "next/link";
import { HeroParallax } from "@/components/hero-parallax";
import { SiteHeader } from "@/components/site-header";
import { config, isRegistrationOpen } from "@/lib/config";
import styles from "./page.module.css";

const registrationOpen = isRegistrationOpen();
const googleMapsEmbedUrl =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3031.8075272304286!2d110.3848214!3d-7.769798100000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a59b469fe8cd7%3A0xc76dc4d1ec7572e2!2sStadion%20Pancasila%20UGM%20%E2%80%94%20Universitas%20Gajah%20Mada!5e1!3m2!1sid!2sid!4v1784517950509!5m2!1sid!2sid";
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));

const galleryImages = [
  ["gallery-9358.png", "Brass line MBUGM dalam formasi"],
  ["gallery-9367.png", "Color guard MBUGM sedang tampil"],
  ["gallery-3405.png", "Anggota MBUGM bersama tim perkusi"],
  ["gallery-9364.png", "Penampilan perkusi MBUGM"],
  ["gallery-3693.png", "Battery MBUGM di lapangan"],
  ["gallery-3490.png", "Pemain brass MBUGM saat pertunjukan"],
  ["gallery-3849.png", "Anggota MBUGM membawa instrumen"],
  ["gallery-3676.png", "Dokumentasi penampilan MBUGM"],
  ["gallery-5072.png", "Dokumentasi kegiatan MBUGM"],
  ["gallery-9672.png", "Dokumentasi anggota MBUGM"],
  ["gallery-3499.png", "Dokumentasi kegiatan Marching Band UGM"],
  ["gallery-3757.png", "Penampilan anggota Marching Band UGM"],
  ["gallery-3986.png", "Aksi lapangan Marching Band UGM"],
  ["gallery-3885.png", "Kebersamaan anggota Marching Band UGM"],
] as const;

export default function Page() {
  return (
    <div className={styles.page}>
      <SiteHeader open={registrationOpen} />
      <main>
        <Hero open={registrationOpen} />
        <Stats />
        <About />
        <Location />
        <GalleryCta open={registrationOpen} />
      </main>
      <Footer />
    </div>
  );
}

function Hero({ open }: { open: boolean }) {
  return (
    <HeroParallax className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}><span />Est. 1979</p>
        <h1 id="hero-title">Bergabung bersama kami</h1>
        <p className={styles.heroLead}>
          Lebih dari empat dekade mencetak musisi, penari, dan pemimpin. Satu komunitas,
          satu irama. Kekeluargaan yang bertahan seumur hidup.
        </p>
        <div className={styles.registrationPeriod}>
          <span aria-hidden="true" />
          <div>
            <p>Periode Pendaftaran {config.year}</p>
            <time>{formatDate(config.opensAt)} sampai {formatDate(config.closesAt)}</time>
          </div>
        </div>
        <div className={styles.heroActions}>
          {open ? (
            <Link className={styles.primaryButton} href="/daftar">
              Daftar Sekarang
            </Link>
          ) : (
            <span className={styles.disabledButton}>Pendaftaran Ditutup</span>
          )}
          <a className={styles.secondaryButton} href="#tentang">Pelajari Lebih Lanjut</a>
        </div>
      </div>

      <div className={styles.heroCollage} aria-label="Dokumentasi penampilan Marching Band UGM">
        <HeroPhoto className={styles.arena} src="hero-arena.png" alt="Formasi MBUGM di arena GPMB" priority />
        <HeroPhoto className={styles.flag} src="hero-flag.png" alt="Color guard MBUGM mengibarkan bendera" priority />
        <HeroPhoto className={styles.percussion} src="hero-percussion.png" alt="Pemain perkusi dan brass MBUGM" />
        <HeroPhoto className={styles.brass} src="hero-brass.png" alt="Brass line MBUGM melintas di arena" />
        <div className={styles.drillDots} aria-hidden="true" />
      </div>

      <div className={styles.lowerCollage} aria-hidden="true">
        <HeroPhoto className={styles.family} src="hero-family.png" alt="" />
        <HeroPhoto className={styles.guard} src="hero-guard.png" alt="" />
      </div>
    </HeroParallax>
  );
}

function HeroPhoto({
  className,
  src,
  alt,
  priority = false,
}: {
  className: string;
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <figure className={styles.photo + " " + className}>
      <Image
        src={"/figma/" + src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 900px) 80vw, 40vw"
      />
    </figure>
  );
}

function Stats() {
  const stats = [
    ["1979", "Tahun Berdiri"],
    ["10x", "Juara GPMB Nasional"],
    ["46+", "Tahun Pengalaman"],
    ["3000+", "Alumni Aktif"],
  ];

  return (
    <section id="prestasi" className={styles.stats} aria-label="Statistik Marching Band UGM">
      <div className={styles.statsGrid}>
        {stats.map(([value, label]) => (
          <div key={label}><strong>{value}</strong><span>{label}</span></div>
        ))}
      </div>
      <div className={styles.fieldLines} aria-hidden="true"><span /><span /><span /></div>
    </section>
  );
}

function About() {
  return (
    <section id="tentang" className={styles.about}>
      <div className={styles.aboutIntro}>
        <p className={styles.sectionLabel}>Tentang Kami</p>
        <h2>Kiblat marching band Indonesia sejak 1979</h2>
        <p className={styles.aboutCaption}>
          Visi kami: menjadi representasi terbaik UGM dan kebanggaan masyarakat Yogyakarta
          di panggung nasional maupun internasional.
        </p>
      </div>
      <div className={styles.aboutBody}>
        <p>
          Marching Band Universitas Gadjah Mada berdiri pada <strong>11 Maret 1979</strong>,
          bermula sebagai unit <em>drum corps</em> kampus. Selama lebih dari empat dekade,
          MBUGM telah berkembang menjadi salah satu unit marching band paling bergengsi di
          Indonesia. Rekam jejak kami mencakup gelar juara GPMB berulang kali dari 2010
          hingga 2017, penampilan di Istana Negara, Gedung Agung, Festival Kesenian
          Yogyakarta, dan berbagai acara internasional.
        </p>
        <p>
          MBUGM bukan hanya tentang piala atau panggung. Setiap anggota belajar tentang{" "}
          <strong>kekeluargaan</strong>,{" "}
          <strong>gotong royong</strong>, disiplin, dan tanggung jawab. Ikatan ini melampaui
          masa kuliah dan membentuk komunitas alumni yang saling mendukung hingga ke seluruh
          penjuru negeri.
        </p>
        <p>
          Setiap tahun, kami membuka pintu bagi mahasiswa UGM dari semua jurusan dan latar
          belakang. Di sini, mereka dapat bertumbuh dan menemukan versi terbaik dirinya
          dalam balutan seragam kebanggaan merah putih.
        </p>
      </div>
    </section>
  );
}

function Location() {
  return (
    <section id="lokasi" className={styles.location} aria-labelledby="location-title">
      <div className={styles.locationCard}>
        <div className={styles.mapPlaceholder}>
          <iframe
            src={googleMapsEmbedUrl}
            title="Peta Stadion Pancasila UGM"
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <div className={styles.locationCopy}>
          <p>Lokasi</p>
          <h2 id="location-title">Stadion Pancasila UGM</h2>
          <address>Jl. Pancasila, Caturtunggal, Kec. Depok, Kabupaten Sleman, D.I. Yogyakarta</address>
        </div>
      </div>
      <div className={styles.stadiumArt} aria-hidden="true">
        <Image src="/figma/stadium-lineart.png" alt="" fill sizes="(max-width: 900px) 100vw, 63vw" />
      </div>
    </section>
  );
}

function GalleryCta({ open }: { open: boolean }) {
  return (
    <section id="kegiatan" className={styles.galleryCta} aria-labelledby="cta-title">
      <div className={styles.galleryStrip}>
        {galleryImages.map(([src, alt]) => (
          <button
            className={styles.galleryItem}
            key={src}
            type="button"
            aria-label={"Tampilkan foto: " + alt}
          >
            <Image
              src={"/figma/" + src}
              alt={alt}
              fill
              sizes="(max-width: 720px) 90px, (max-width: 1050px) 126px, 30vw"
              quality={100}
            />
          </button>
        ))}
      </div>
      <div className={styles.ctaCopy}>
        <p><span />Penerimaan Anggota Baru {config.year}<span /></p>
        <h2 id="cta-title">Siap Jadi Bagian dari Keluarga MBUGM?</h2>
        <div>
          Daftarkan dirimu sekarang dan mulai perjalananmu bersama komunitas marching band
          terbaik di Indonesia.
        </div>
        {open ? (
          <Link className={styles.ctaButton} href="/daftar">
            Mulai Pendaftaran
          </Link>
        ) : (
          <span className={styles.ctaDisabled}>Pendaftaran Sedang Ditutup</span>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div className={styles.footerBrand}>
          <div><span>MB</span><strong>Marching Band UGM</strong></div>
          <p>Unit Kegiatan Mahasiswa Universitas Gadjah Mada. Berdiri 11 Maret 1979.</p>
        </div>
        <div className={styles.footerColumn}>
          <p>Navigasi</p>
          <a href="#prestasi">Prestasi</a>
          <a href="#lokasi">Lokasi</a>
          <a href="#tentang">Tentang</a>
        </div>
        <div className={styles.footerColumn}>
          <p>Kontak</p>
          <a href="mailto:marchingband@ugm.ac.id">marchingband@ugm.ac.id</a>
          <a href="https://www.instagram.com/mbugm.official/">@mbugm.official</a>
          <span>Stadion Pancasila UGM</span>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>© {config.year} Marching Band UGM. Dibuat dengan kebanggaan oleh Rotasi XLIII.</span>
        <span>{config.shortName}</span>
      </div>
    </footer>
  );
}
