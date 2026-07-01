import Link from "next/link";
import Image from "next/image";
import { PostLabels } from "@/components/ui/PostLabels";
import { PostMeta } from "@/components/ui/PostMeta";
import type { Post } from "@/lib/types";
import styles from "./FeaturedPost.module.css";

export function FeaturedPost({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={post.image}
          alt={post.title}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, 65vw"
          priority
        />
      </div>
      <div className={styles.overlay}>
        <div className={styles.content}>
          <div className={styles.labels}>
            <PostLabels category={post.category} tags={post.tags} layout="stacked" />
          </div>
          <h2 className={styles.title}>{post.title}</h2>
          <div className={styles.meta}>
            <PostMeta date={post.date} readTime={post.readTime} />
          </div>
        </div>
      </div>
    </Link>
  );
}
