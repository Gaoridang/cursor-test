import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { LatestPosts } from "@/components/blog/LatestPosts";
import { FoundersCorner } from "@/components/blog/FoundersCorner";
import { Pagination } from "@/components/blog/Pagination";
import { getAllPosts } from "@/lib/posts";
import styles from "./page.module.css";

export default function HomePage() {
  const posts = getAllPosts();
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const latest = posts.filter((p) => p.slug !== featured?.slug).slice(0, 4);
  const founders = posts.slice(0, 6);

  if (!featured) {
    return (
      <div className="container" style={{ padding: "64px 24px", textAlign: "center" }}>
        <p>아직 글이 없습니다. content/posts/ 에 마크다운 파일을 추가하세요.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <section className={styles.hero}>
        <FeaturedPost post={featured} />
        <LatestPosts posts={latest} />
      </section>
      <FoundersCorner posts={founders} />
      <Pagination />
    </div>
  );
}
