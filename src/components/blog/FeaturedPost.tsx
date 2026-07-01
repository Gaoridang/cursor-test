import Link from "next/link";
import Image from "next/image";
import { CategoryTag } from "@/components/ui/CategoryTag";
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
          <CategoryTag label={post.category} />
          <h2 className={styles.title}>{post.title}</h2>
          <PostMeta date={post.date} readTime={post.readTime} />
        </div>
      </div>
    </Link>
  );
}
