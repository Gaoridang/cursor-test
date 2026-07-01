"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SearchModal } from "@/components/search/SearchModal";
import { prefetchSearchResources } from "@/lib/search/prefetch";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { label: "소개", href: "/about" },
  { label: "제품", href: "/products" },
  { label: "후기", href: "/testimonial" },
  { label: "블로그", href: "/", active: true },
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    prefetchSearchResources();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            essos
          </Link>

          <nav className={styles.nav} aria-label="주 메뉴">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.navLink} ${item.active ? styles.navActive : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.searchBtn}
              onClick={() => setSearchOpen(true)}
              aria-label="글 검색"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className={styles.kbd}>⌘K</span>
            </button>

            <a href="#" className={styles.login}>
              로그인
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>

            <Button variant="primary" href="#">
              시작하기
            </Button>

            <button
              type="button"
              className={styles.menuBtn}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="메뉴 열기"
              aria-expanded={mobileOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        <nav
          className={`${styles.mobileNav} ${mobileOpen ? styles.mobileNavOpen : ""}`}
          aria-label="모바일 메뉴"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={styles.navLink}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
