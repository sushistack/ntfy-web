import { useTranslation } from "react-i18next";
import { Chip } from "@/components/ui/Chip";

// Color + label per priority (1=min … 5=max). Low/normal use neutral surface tokens;
// high/max keep the amber/coral accent. ponytail: reuse existing tokens, no new palette.
const STYLES = {
  1: "bg-surface-2 text-muted",
  2: "bg-surface-2 text-muted",
  3: "bg-surface-2 text-text",
  4: "bg-priority-high text-priority-high-on-surface",
  5: "bg-priority-max text-priority-max-on-surface",
};

const LABEL_KEYS = {
  1: "notification_card_badge_min",
  2: "notification_card_badge_low",
  3: "notification_card_badge_normal",
  4: "notification_card_badge_high",
  5: "notification_card_badge_max",
};

export function PriorityBadge({ priority }) {
  const { t } = useTranslation();

  const p = priority ?? 3;
  if (!STYLES[p]) return null;

  return (
    <Chip
      variant="priority"
      className={STYLES[p]}
      aria-label={t("notifications_priority_x", { priority: p })}
    >
      {t(LABEL_KEYS[p])}
    </Chip>
  );
}
