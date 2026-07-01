import { CategoryTag } from "./CategoryTag";
import { TagList } from "./TagList";
import styles from "./PostLabels.module.css";

type PostLabelsLayout = "stacked" | "inline" | "compact";

interface PostLabelsProps {
  category?: string;
  tags?: string[];
  layout?: PostLabelsLayout;
  maxTags?: number;
}

export function PostLabels({
  category,
  tags,
  layout = "stacked",
  maxTags,
}: PostLabelsProps) {
  const hasCategory = Boolean(category);
  const hasTags = Boolean(tags?.length);

  if (!hasCategory && !hasTags) return null;

  const visibleTags = maxTags !== undefined ? tags!.slice(0, maxTags) : tags;
  const overflowCount =
    maxTags !== undefined && tags ? Math.max(0, tags.length - maxTags) : 0;

  if (layout === "inline" || layout === "compact") {
    return (
      <div className={`${styles.root} ${styles[layout]}`}>
        {hasCategory && <CategoryTag label={category!} />}
        {hasTags && <TagList tags={visibleTags!} />}
        {overflowCount > 0 && <span className={styles.overflow}>+{overflowCount}</span>}
      </div>
    );
  }

  return (
    <div className={`${styles.root} ${styles.stacked}`}>
      {hasCategory && (
        <div className={styles.categoryRow}>
          <CategoryTag label={category!} />
        </div>
      )}
      {hasTags && (
        <div className={styles.tagsRow}>
          <TagList tags={visibleTags!} />
          {overflowCount > 0 && <span className={styles.overflow}>+{overflowCount}</span>}
        </div>
      )}
    </div>
  );
}
