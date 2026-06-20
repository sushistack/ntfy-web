import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { useSelection } from "@/components/contexts/SelectionContext";
import subscriptionManager from "@/app/SubscriptionManager";
import db from "@/app/db";
import { Button } from "@/components/ui/Button";
import { PriorityBadge } from "@/components/message/PriorityBadge";
import { TopicChip } from "@/components/message/TopicChip";
import { TagChip } from "@/components/message/TagChip";
import MarkdownContent from "@/components/message/MarkdownContent";
import AttachmentBox from "@/components/message/AttachmentBox";
import { NotificationActions } from "@/components/message/NotificationActions";
import { formatShortDateTime, unmatchedTags } from "@/app/utils";

// Inline error boundary: catches markdown render errors and renders raw text fallback
class MarkdownBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  componentDidCatch() {
    this.setState({ failed: true });
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const DetailPane = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { msgId } = useSelection();
  const headingRef = useRef(null);
  const [actionError, setActionError] = useState(null);

  const notification = useLiveQuery(
    () => (msgId ? db.notifications.get(msgId) : null),
    [msgId]
  ) ?? null;

  const subscription = useLiveQuery(
    () => (notification?.subscriptionId ? db.subscriptions.get(notification.subscriptionId) : null),
    [notification?.subscriptionId]
  );
  const subscriptionName = subscription?.displayName || notification?.topic || "";

  // Mark notification as read when it mounts (only when unread)
  useEffect(() => {
    if (notification?.new === 1) {
      subscriptionManager.markNotificationRead(notification.id);
    }
  }, [notification?.id]);

  // Move focus to heading on mobile open (AC #4)
  useEffect(() => {
    if (msgId && headingRef.current) {
      headingRef.current.focus();
    }
  }, [msgId]);

  if (!msgId || !notification) {
    return null;
  }

  const tags = unmatchedTags(notification.tags ?? []);

  return (
    <article className="flex flex-col gap-4 h-full p-4 overflow-y-auto">
      {/* Mobile-only back button */}
      <div className="flex items-center gap-2 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigate(-1);
            // Minimal a11y: return focus toward the feed after back navigation (AC #4 / NFR3)
            requestAnimationFrame(() => document.getElementById("main")?.focus());
          }}
          aria-label={t("detail_back_button")}
        >
          {t("detail_back_button")}
        </Button>
      </div>

      {/* Header: priority badge + title */}
      <div className="flex items-start gap-2">
        <PriorityBadge priority={notification.priority ?? 3} />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-title font-semibold text-text outline-none"
        >
          {/* Slice to 60 chars when there's no title so the heading doesn't duplicate the full body */}
          {notification.title || notification.message?.slice(0, 60)}
        </h2>
      </div>

      {/* Full markdown body — key resets the error boundary when notification changes */}
      <MarkdownBoundary
        key={msgId}
        fallback={
          <p className="max-w-message leading-body text-body text-text">
            {notification.message}
          </p>
        }
      >
        <div className="max-w-message leading-body text-body text-text">
          <MarkdownContent content={notification.message} />
        </div>
      </MarkdownBoundary>

      {/* Attachment */}
      {notification.attachment && (
        <AttachmentBox attachment={notification.attachment} />
      )}

      {/* Tags row */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>
      )}

      {/* Inline action buttons — NotificationActions handles null/empty internally */}
      <NotificationActions notification={notification} onError={setActionError} />
      {/* actionError is already a styled node from NotificationActions; render directly */}
      {actionError}

      {/* Meta row: topic chip + timestamp */}
      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-border">
        <TopicChip name={subscriptionName} />
        <span className="text-caption text-muted">
          {formatShortDateTime(notification.time, i18n.language)}
        </span>
      </div>
    </article>
  );
};

export default DetailPane;
