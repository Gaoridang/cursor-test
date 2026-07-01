"use client";

import { useState } from "react";
import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types";
import styles from "./FoundersCorner.module.css";

const VISIBLE_COUNT = 3;

export function FoundersCorner({ posts }: { posts: Post[] }) {
  const [offset, setOffset] = useState(0);
  const maxOffset = Math.max(0, posts.length - VISIBLE_COUNT);
  const visible = posts.slice(offset, offset + VISIBLE_COUNT);

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>창업자 코너</h2>
        <div className={styles.arrows}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            aria-label="이전 글"
          >
            ◀
          </button>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => setOffset((o) => Math.min(maxOffset, o + 1))}
            disabled={offset >= maxOffset}
            aria-label="다음 글"
          >
            ▶
          </button>
        </div>
      </div>
      <div className={styles.viewport}>
        <div className={styles.track}>
          {visible.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
