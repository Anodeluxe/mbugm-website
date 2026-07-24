"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import styles from "@/app/page.module.css";

export function SiteHeader({ open }: { open: boolean }) {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => {
    setMenuOpen(true);
    if (!drawerRef.current?.open) drawerRef.current?.showModal();
  };

  const closeMenu = () => drawerRef.current?.close();

  const closeFromBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX > bounds.right) closeMenu();
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Navigasi utama">
        <button
          className={styles.mobileMenuButton}
          type="button"
          aria-label="Buka menu navigasi"
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          onClick={openMenu}
        >
          <span className={styles.burgerIcon} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <Link className={styles.brand} href="/" aria-label="Marching Band UGM, beranda">
          <Image
            src="/figma/brand-lockup.png"
            alt=""
            width={60}
            height={60}
            priority
            unoptimized
          />
          <span>Marching Band UGM</span>
        </Link>

        <div className={styles.navLinks}>
          <Link href="/#tentang">Tentang</Link>
          <Link href="/#kegiatan">Kegiatan</Link>
          <Link href="/#prestasi">Prestasi</Link>
          <Link href="/#lokasi">Lokasi</Link>
          {open ? (
            <Link className={styles.navCta} href="/daftar">Daftar Sekarang</Link>
          ) : (
            <span className={styles.navClosed}>Pendaftaran Ditutup</span>
          )}
        </div>
      </nav>

      <dialog
        id="mobile-navigation"
        className={styles.mobileDrawer}
        ref={drawerRef}
        onClick={closeFromBackdrop}
        onClose={() => setMenuOpen(false)}
      >
        <div className={styles.drawerHeader}>
          <span>Menu</span>
          <button type="button" className={styles.drawerClose} onClick={closeMenu} aria-label="Tutup menu navigasi">
            <span aria-hidden="true" />
          </button>
        </div>

        <nav className={styles.drawerNav} aria-label="Navigasi seluler">
          <Link href="/#tentang" onClick={closeMenu}>Tentang</Link>
          <Link href="/#kegiatan" onClick={closeMenu}>Kegiatan</Link>
          <Link href="/#prestasi" onClick={closeMenu}>Prestasi</Link>
          <Link href="/#lokasi" onClick={closeMenu}>Lokasi</Link>
          {open ? (
            <Link className={styles.drawerCta} href="/daftar" onClick={closeMenu}>
              Daftar Sekarang
            </Link>
          ) : (
            <span className={styles.drawerClosed}>Pendaftaran Ditutup</span>
          )}
        </nav>
      </dialog>
    </header>
  );
}
