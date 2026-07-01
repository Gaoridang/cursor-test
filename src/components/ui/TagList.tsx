import styles from "./TagList.module.css";

export function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  return (
    <ul className={styles.list} aria-label="태그">
      {tags.map((tag) => (
        <li key={tag} className={styles.tag}>
          #{tag}
        </li>
      ))}
    </ul>
  );
}
