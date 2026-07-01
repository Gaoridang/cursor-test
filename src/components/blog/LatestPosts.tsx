import Link from "next/link";
import Image from "next/image";
import { PostMeta } from "@/components/ui/PostMeta";
import type { Post, SearchResult } from "@/lib/types";
import styles from "./LatestPosts.module.css";

type Item = Post | SearchResult;

export function PostListItem({
  post,
  titleHtml,
}: {
  post: Item;
  titleHtml?: string;
}) {
  return (
    <Link href={`/blog/${post.slug}`} className={styles.item}>
      <div className={styles.thumb}>
        <Image src={post.image} alt={post.title} fill sizes="72px" />
      </div>
      <div>
        {titleHtml ? (
          <h3 className={styles.itemTitle} dangerouslySetInnerHTML={{ __html: titleHtml }} />
        ) : (
          <h3 className={styles.itemTitle}>{post.title}</h3>
        )}
        <div className={styles.meta}>
          <PostMeta date={post.date} readTime={post.readTime} />
        </div>
      </div>
    </Link>
  );
}

export function LatestPosts({ posts, title = "최신 글" }: { posts: Post[]; title?: string }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.list}>
        {posts.map((post) => (
          <PostListItem key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
