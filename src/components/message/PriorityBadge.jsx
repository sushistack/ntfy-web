import { useTranslation } from "react-i18next";
import { Chip } from "@/components/ui/Chip";

export function PriorityBadge({ priority }) {
  const { t } = useTranslation();

  if (!priority || priority < 4) return null;

  const isMax = priority === 5;
  return (
    <Chip
      variant="priority"
      className={
        isMax
          ? "bg-priority-max text-priority-max-on-surface"
          : "bg-priority-high text-priority-high-on-surface"
      }
      aria-label={t("notifications_priority_x", { priority })}
    >
      {isMax ? t("notification_card_badge_max") : t("notification_card_badge_high")}
    </Chip>
  );
}
