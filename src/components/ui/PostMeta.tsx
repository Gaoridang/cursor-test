import { formatDate } from "@/lib/dates";

export function PostMeta({ date, readTime }: { date: string; readTime: number }) {
  return (
    <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
      {formatDate(date)} • {readTime}분 읽기
    </span>
  );
}
