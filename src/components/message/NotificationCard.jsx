import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
import { unmatchedTags, formatShortDateTime } from "@/app/utils";
import subscriptionManager from "@/app/SubscriptionManager";
import { PriorityBadge } from "./PriorityBadge";
import { TopicChip } from "./TopicChip";
import { TagChip } from "./TagChip";

const REVEAL_MAX = 96;
const SNAP_THRESHOLD = 72;

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
  showTopicChip = false,
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

  // Swipe gesture state
  const cardRef = useRef(null);
  const dragRef = useRef({ startX: 0, startY: 0, isDragging: false, isLocked: false });
  const suppressNextClickRef = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [revealedSide, setRevealedSide] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Collapse when tapping outside a revealed card (guard: skip when delete dialog is open)
  useEffect(() => {
    if (!revealedSide) return undefined;
    const handler = (e) => {
      if (deleteConfirmOpen) return;
      if (!cardRef.current?.contains(e.target)) {
        setRevealedSide(null);
        setSwipeOffset(0);
        dragRef.current.isLocked = false;
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [revealedSide, deleteConfirmOpen]);

  const collapse = () => {
    setRevealedSide(null);
    setSwipeOffset(0);
    dragRef.current.isLocked = false;
  };

  const handlePointerDown = (e) => {
    if (e.pointerType !== "touch" || dragRef.current.isLocked) return;
    dragRef.current = { ...dragRef.current, startX: e.clientX, startY: e.clientY, isDragging: true };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    // Vertical scroll intent — cancel swipe, release capture so scroll container gets events
    if (Math.abs(deltaY) > Math.abs(deltaX) + 10) {
      dragRef.current.isDragging = false;
      setSwipeOffset(0);
      e.currentTarget.releasePointerCapture(e.pointerId);
      return;
    }
    setSwipeOffset(Math.max(-REVEAL_MAX, Math.min(REVEAL_MAX, deltaX)));
  };

  const handlePointerUp = (e) => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    const deltaX = e.clientX - dragRef.current.startX;
    if (Math.abs(deltaX) < 10) {
      // Treat as tap — use ref to suppress the subsequent synthetic click (e.preventDefault on
      // pointerup is not reliable on iOS Safari)
      suppressNextClickRef.current = true;
      onTap?.(notification);
      setSwipeOffset(0);
      return;
    }
    if (deltaX <= -SNAP_THRESHOLD) {
      setRevealedSide("delete");
    } else if (deltaX >= SNAP_THRESHOLD && notification.new === 1) {
      setRevealedSide("mark-read");
    } else {
      setRevealedSide(null);
    }
    setSwipeOffset(0);
  };

  const handlePointerCancel = () => {
    dragRef.current.isDragging = false;
    collapse();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTap?.(notification);
    }
  };

  const handleSwipeMarkRead = () => {
    subscriptionManager.markNotificationRead(notification.id);
    collapse();
  };

  const handleSwipeDeleteConfirm = () => {
    subscriptionManager.deleteNotification(notification.id);
    setDeleteConfirmOpen(false);
    collapse();
    cardRef.current?.focus();
  };

  // Snap position when revealed overrides live swipeOffset
  let contentOffset = swipeOffset;
  if (revealedSide === "delete") {
    contentOffset = -REVEAL_MAX;
  } else if (revealedSide === "mark-read") {
    contentOffset = REVEAL_MAX;
  }

  const contentStyle = {
    transform: `translateX(${contentOffset}px)`,
    transition: dragRef.current.isDragging || prefersReducedMotion ? "none" : "transform 200ms ease-out",
  };

  return (
    <Card
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (suppressNextClickRef.current) { suppressNextClickRef.current = false; return; }
        onTap?.(notification);
      }}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={cn(
        "relative overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        isSelected && "bg-surface-active"
      )}
    >
      {/* Mark-read backing layer (leading, left).
          Uses inline style for position so test selectors on Tailwind "absolute" don't collide with the accent bar.
          Button fills the full layer so the entire colored area is tappable. */}
      <div
        style={{ position: "absolute", left: 0, top: 0, bottom: 0 }}
        className="w-24 bg-accent-text"
      >
        <button
          type="button"
          tabIndex={revealedSide === "mark-read" ? 0 : -1}
          aria-label={t("swipe_mark_read_label")}
          onClick={(e) => {
            e.stopPropagation();
            handleSwipeMarkRead();
          }}
          className="w-full h-full focus:outline-none focus:ring-1 focus:ring-focus-ring rounded-sm"
        />
      </div>

      {/* Delete backing layer (trailing, right).
          Uses inline style for position — same reason as mark-read backing.
          Button fills the full layer so the entire colored area is tappable. */}
      <div
        style={{ position: "absolute", right: 0, top: 0, bottom: 0 }}
        className="w-24 bg-priority-max"
      >
        <button
          type="button"
          tabIndex={revealedSide === "delete" ? 0 : -1}
          aria-label={t("swipe_delete_label")}
          onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirmOpen(true);
            dragRef.current.isLocked = true;
          }}
          className="w-full h-full focus:outline-none focus:ring-1 focus:ring-focus-ring rounded-sm"
        />
      </div>

      {/* Content layer — slides over backing layers on swipe */}
      <div
        style={contentStyle}
        className={cn("relative bg-surface", isSelected && "bg-surface-active")}
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
            className="p-1 rounded-sm text-muted hover:text-text hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors"
          >
            <BellIcon />
          </button>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label={t("notification_card_overflow_label")}
            className="p-1 rounded-sm text-muted hover:text-text hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring transition-colors"
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

        {/* Meta row: topic chip (all-feed only) + timestamp */}
        <div className="flex items-center justify-between px-4 py-2">
          {showTopicChip && subscriptionName ? <TopicChip name={subscriptionName} /> : <span />}
          <span className="text-caption text-muted">
            {formatShortDateTime(notification.time, i18n.language)}
          </span>
        </div>
      </div>

      {/* Delete confirm Dialog — Portal renders outside Card; state co-located here for lifecycle */}
      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) {
            collapse();
            cardRef.current?.focus();
          }
        }}
      >
        <DialogContent title={t("card_overflow_delete_confirm_body")}>
          <div className="flex gap-2 justify-end mt-4">
            <DialogClose asChild>
              <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
                {t("card_overflow_delete_confirm_cancel")}
              </Button>
            </DialogClose>
            <Button variant="primary" onClick={handleSwipeDeleteConfirm}>
              {t("card_overflow_delete_confirm_action")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
