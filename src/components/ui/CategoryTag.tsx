import styles from "./CategoryTag.module.css";

export function CategoryTag({ label }: { label: string }) {
  return <span className={styles.tag}>{label}</span>;
}
