import Link from "next/link";
import Image from "next/image";
import { CategoryTag } from "@/components/ui/CategoryTag";
import { PostMeta } from "@/components/ui/PostMeta";
import type { Post } from "@/lib/types";
import styles from "./PostCard.module.css";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={post.image}
          alt={post.title}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className={styles.body}>
        <CategoryTag label={post.category} />
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.excerpt}>{post.excerpt}</p>
        <PostMeta date={post.date} readTime={post.readTime} />
      </div>
    </Link>
  );
}
