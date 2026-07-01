import { CategoryTag } from "./CategoryTag";
import { TagList } from "./TagList";
import styles from "./PostLabels.module.css";

interface PostLabelsProps {
  category?: string;
  tags?: string[];
}

export function PostLabels({ category, tags }: PostLabelsProps) {
  const hasCategory = Boolean(category);
  const hasTags = Boolean(tags?.length);

  if (!hasCategory && !hasTags) return null;

  return (
    <div className={styles.labels}>
      {hasCategory && <CategoryTag label={category!} />}
      {hasTags && (
        <div className={styles.tags}>
          <TagList tags={tags!} />
        </div>
      )}
    </div>
  );
}
