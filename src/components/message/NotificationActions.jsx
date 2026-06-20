import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/Tooltip";
import { ACTION_VIEW, ACTION_HTTP, ACTION_BROADCAST, ACTION_COPY } from "@/app/actions";
import { openUrl } from "@/app/utils";
import subscriptionManager from "@/app/SubscriptionManager";
import notifier from "@/app/Notifier";

const clearNotification = async (notification) => {
  const subscription = await subscriptionManager.get(notification.subscriptionId);
  if (subscription) await notifier.cancel(subscription, notification);
  await subscriptionManager.markNotificationRead(notification.id);
};

function NotificationAction({ action, index, notification, onError }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState("idle"); // idle | ongoing | success | failed

  const variant = index === 0 ? "primary" : "ghost";

  const performHttpAction = async () => {
    setStatus("ongoing");
    onError?.(null);
    try {
      const response = await fetch(action.url, {
        method: action.method ?? "POST",
        headers: action.headers ?? {},
        // Must NOT null-coalesce — null body is valid for GET/DELETE; a non-nullish value causes fetch to reject
        body: action.body,
      });
      if (response.ok) {
        setStatus("success");
        onError?.(null);
        if (action.clear) await clearNotification(notification);
      } else {
        setStatus("failed");
        onError?.(<span className="text-caption text-muted">{t("notification_action_failed_retry_label")}</span>);
      }
    } catch {
      setStatus("failed");
      onError?.(<span className="text-caption text-muted">{t("notification_action_failed_retry_label")}</span>);
    }
  };

  if (action.action === ACTION_BROADCAST) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Disabled buttons don't fire pointer events — wrapper span enables tooltip */}
            <span>
              <Button disabled variant="ghost" size="sm">
                {action.label}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("notification_action_broadcast_not_supported")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (action.action === ACTION_VIEW) {
    const handleClick = async () => {
      openUrl(action.url);
      if (action.clear) await clearNotification(notification);
    };
    return (
      <Button
        variant={variant}
        size="sm"
        onClick={handleClick}
        aria-label={t("notification_action_view_aria_label", { url: action.url })}
      >
        {action.label}
      </Button>
    );
  }

  if (action.action === ACTION_HTTP) {
    const method = action.method ?? "POST";
    let label;
    if (status === "ongoing") label = `${action.label} …`;
    else if (status === "success") label = `${action.label} ✔`;
    else if (status === "failed") label = t("notification_action_failed_retry_label");
    else label = action.label;

    return (
      <Button
        variant={variant}
        size="sm"
        disabled={status === "ongoing" || status === "success"}
        onClick={performHttpAction}
        aria-label={t("notification_action_http_aria_label", { method, url: action.url })}
      >
        {label}
      </Button>
    );
  }

  return null;
}

export function NotificationActions({ notification, onError }) {
  const actions = notification.actions ?? [];
  const visibleActions = actions.filter((a) => a.action !== ACTION_COPY);

  if (visibleActions.length === 0) return null;

  return (
    <>
      {/* Divider — no extra mx needed; parent body slot has px-4 which positions at 1rem from card edge */}
      <div className="h-px bg-border" />
      <div className="flex flex-wrap gap-2 py-2">
        {visibleActions.map((action, i) => (
          <NotificationAction
            key={action.id ?? i}
            action={action}
            index={i}
            notification={notification}
            onError={onError}
          />
        ))}
      </div>
    </>
  );
}
