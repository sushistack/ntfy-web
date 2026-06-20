import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/Button";
import { usePublishQueue } from "@/components/contexts/PublishQueueContext";

export const SendingIndicator = ({ state }) => {
  const { t } = useTranslation();
  return (
    <span className={cn("flex items-center gap-1.5 text-sm text-muted")}>
      {state === "sending" && (
        <svg className="animate-spin motion-reduce:animate-none h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {state === "sending" ? t("publish_queue_sending") : t("publish_queue_queued")}
    </span>
  );
};

export const RetryBar = ({ id }) => {
  const { t } = useTranslation();
  const { retry, dismiss } = usePublishQueue();
  return (
    <span className="flex items-center gap-1 text-sm text-muted">
      {t("publish_queue_failed")}
      <Button variant="ghost" size="sm" aria-label={t("publish_queue_retry_label")} onClick={() => retry(id)}>
        {t("publish_queue_retry")}
      </Button>
      <Button variant="ghost" size="sm" aria-label={t("publish_queue_dismiss_label")} onClick={() => dismiss(id)}>
        {t("publish_queue_dismiss")}
      </Button>
    </span>
  );
};
