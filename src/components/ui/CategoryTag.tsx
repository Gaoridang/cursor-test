import styles from "./CategoryTag.module.css";

export function CategoryTag({ label }: { label: string }) {
  return (
    <span className={styles.tag}>
      <span className={styles.dot} aria-hidden />
      {label}
    </span>
  );
}
