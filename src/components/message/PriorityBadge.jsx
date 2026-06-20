import { useTranslation } from "react-i18next";
import { Chip } from "@/components/ui/Chip";

export function PriorityBadge({ priority }) {
  const { t } = useTranslation();

  if (!priority || priority < 4) return null;

  const isMax = priority === 5;
  return (
    <Chip
      variant="priority"
      // layout-nudge: DESIGN.md priority-badge foreground — near-black on saturated bg
      className={isMax ? "bg-priority-max text-[#1A0E0E]" : "bg-priority-high text-[#241403]"}
      aria-label={t("notifications_priority_x", { priority })}
    >
      {isMax ? t("notification_card_badge_max") : t("notification_card_badge_high")}
    </Chip>
  );
}
