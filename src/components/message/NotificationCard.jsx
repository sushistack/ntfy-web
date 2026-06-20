import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils";
import { unmatchedTags, formatShortDateTime } from "@/app/utils";
import { PriorityBadge } from "./PriorityBadge";
import { TopicChip } from "./TopicChip";
import { TagChip } from "./TagChip";

const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const MoreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

export function NotificationCard({
  notification,
  subscriptionName,
  onTap,
  isSelected,
  body,
  pending,
  error,
  onMuteToggle,
  isMuted,
}) {
  const { t, i18n } = useTranslation();
  const priority = notification.priority ?? 3;
  const tags = unmatchedTags(notification.tags);
  const hasBody = body != null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTap?.(notification);
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onTap?.(notification)}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
        isSelected && "bg-surface-active"
      )}
    >
      {/* Accent bar — P4/P5 only */}
      {priority >= 4 && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1",
            priority === 5 ? "bg-priority-max" : "bg-priority-high"
          )}
          style={{
            boxShadow: priority === 5 ? "var(--glow-priority-max)" : "var(--glow-priority-high)",
          }}
        />
      )}

      {/* Header band */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 pl-5">
        <PriorityBadge priority={priority} />
        <p className="flex-1 text-subtitle font-semibold text-text truncate">
          {notification.title || notification.message}
        </p>
        {notification.new === 1 && (
          <span
            role="status"
            aria-label={t("notification_card_unread_label")}
            className="w-2 h-2 rounded-full bg-accent-ui shrink-0"
            style={{ boxShadow: "var(--glow-accent-dot)" }}
          />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMuteToggle?.();
          }}
          aria-label={t(isMuted ? "notification_card_unmute_toggle_label" : "notification_card_mute_toggle_label")}
          aria-pressed={isMuted ?? false}
          className="p-1 rounded-sm text-muted hover:text-text hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] transition-colors"
        >
          <BellIcon />
        </button>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={t("notification_card_overflow_label")}
          className="p-1 rounded-sm text-muted hover:text-text hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] transition-colors"
        >
          <MoreIcon />
        </button>
      </div>

      {/* Divider — only when body slot is filled */}
      {hasBody && <div className="h-px bg-border mx-4" />}

      {/* Body / slot area */}
      <div className="px-4">
        {body}
        {pending}
        {error}
      </div>

      {/* Tags row */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 pt-1">
          {tags.map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      )}

      {/* Meta row: topic chip + timestamp */}
      <div className="flex items-center justify-between px-4 py-2">
        <TopicChip name={subscriptionName} />
        <span className="text-caption text-muted">
          {formatShortDateTime(notification.time, i18n.language)}
        </span>
      </div>
    </Card>
  );
}
