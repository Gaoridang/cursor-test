"use client";

import styles from "./Pagination.module.css";

interface PaginationProps {
  current?: number;
  total?: number;
}

export function Pagination({ current = 1, total = 5 }: PaginationProps) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button type="button" className={styles.arrow} disabled={current === 1} aria-label="Previous page">
        ◀
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className={`${styles.page} ${page === current ? styles.active : ""}`}
          aria-current={page === current ? "page" : undefined}
        >
          {page}
        </button>
      ))}
      <button type="button" className={styles.arrow} disabled={current === total} aria-label="Next page">
        ▶
      </button>
    </nav>
  );
}
