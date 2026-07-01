import { formatDate } from "@/lib/dates";
import styles from "./PostMeta.module.css";

export function PostMeta({ date, readTime }: { date: string; readTime: number }) {
  return (
    <span className={styles.meta}>
      {formatDate(date)} · {readTime}분 읽기
    </span>
  );
}
