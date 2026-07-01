import { notFound } from "next/navigation";
import Image from "next/image";
import { PostLabels } from "@/components/ui/PostLabels";
import { PostMeta } from "@/components/ui/PostMeta";
import { PostCard } from "@/components/blog/PostCard";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "찾을 수 없음" };
  return {
    title: `${post.title} — essos`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getAllPosts()
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  return (
    <article>
      <div className={styles.hero}>
        <Image
          src={post.image}
          alt={post.title}
          fill
          className={styles.heroImage}
          priority
          sizes="100vw"
        />
        <div className={styles.heroOverlay}>
          <PostLabels category={post.category} tags={post.tags} />
          <h1 className={styles.title}>{post.title}</h1>
          <PostMeta date={post.date} readTime={post.readTime} />
        </div>
      </div>

      <div className={`prose ${styles.body}`} dangerouslySetInnerHTML={{ __html: post.html }} />

      {related.length > 0 && (
        <section className={styles.related} aria-labelledby="related-posts-heading">
          <div className={styles.relatedHeading}>
            <span className={styles.relatedLabel}>더 읽어보기</span>
            <h2 id="related-posts-heading" className={styles.relatedTitle}>
              관련 글
            </h2>
          </div>
          <div className={styles.relatedGrid}>
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
