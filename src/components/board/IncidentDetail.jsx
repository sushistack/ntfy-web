import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import subscriptionManager from "@/app/SubscriptionManager";
import { dayStart, slotOf, slotsForDay } from "@/app/incidents";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import StatePanel from "@/components/ui/StatePanel";
import { cn } from "@/components/ui/utils";
import CardBody from "@/components/message/CardBody";
import { NotificationActions } from "@/components/message/NotificationActions";
import { useActiveTopic } from "@/components/hooks";
import TickStrip, { TickAxis, toneOf } from "./TickStrip";
import StatusAvatar, { lookFor } from "./Avatar";
import { focus } from "./Board";
import { topicLabel, useIncidents, when } from "./useIncidents";

const SENT_AT_LIMIT = 12;

const statusLine = (t, incident, now) => {
  const hhmm = (time) => when(time, now);
  switch (incident.state) {
    case "open":
      return t("incident_status_open", { time: hhmm(incident.since) });
    case "quiet":
      return t("incident_status_quiet", { time: hhmm(incident.last) });
    case "resolved":
      return t("incident_status_resolved", { time: hhmm(incident.resolvedAt) });
    default:
      return t("incident_status_info", { time: hhmm(incident.last) });
  }
};

const BackIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const IncidentDetail = ({ incidentKey }) => {
  const { t } = useTranslation();
  const topicName = useActiveTopic();
  const [, setParams] = useSearchParams();
  const { incidents, now, subsById, loading } = useIncidents(topicName);
  const [actionError, setActionError] = useState(null);
  const back = () => setParams({});

  if (loading) return <Skeleton className="h-40 rounded-md" />;
  const incident = incidents.find((i) => i.id === incidentKey);
  if (!incident) {
    return (
      <StatePanel
        title={t("incident_not_found")}
        action={
          <Button variant="ghost" onClick={back}>
            {t("board_back")}
          </Button>
        }
      />
    );
  }

  const sub = subsById[incident.subscriptionId];
  const today = dayStart(now);
  const sentToday = incident.firings.filter((f) => f >= today).length;
  const sent = sentToday === 1 ? t("board_sent_today_one") : t("board_sent_today_other", { count: sentToday });
  const markRead = () => incident.notifications.filter((n) => n.new === 1).forEach((n) => subscriptionManager.markNotificationRead(n.id));
  const mute = () => subscriptionManager.setMutedUntil(incident.subscriptionId, now + 3600);

  return (
    <article className="pb-24">
      <button
        type="button"
        onClick={back}
        className={cn(
          "-ml-1.5 inline-flex items-center gap-0.5 rounded-sm py-1 pr-2 text-[15px] font-medium text-muted hover:text-text",
          focus
        )}
      >
        <BackIcon />
        {t("board_back")}
      </button>

      <header className="mt-5 px-1">
        <StatusAvatar look={lookFor(incident)} size="lg" />
        <p className="mt-4 text-[14px] font-semibold text-accent-text">{topicLabel(sub)}</p>
        <h1 className="mt-1 text-[28px] leading-[1.25] font-bold tracking-[-0.025em] text-text break-words">{incident.title}</h1>
        <p className="mt-2 text-[15px] text-muted">
          {statusLine(t, incident, now)} {sent}.
        </p>
      </header>

      <div className="mt-6 rounded-md bg-surface p-5 shadow-elev-1">
        <TickStrip
          slots={slotsForDay(incident.firings, today)}
          okSlot={incident.resolvedAt ? slotOf(incident.resolvedAt, today) : null}
          nowSlot={slotOf(now, today)}
          tone={toneOf(incident.priority)}
          size="lg"
          label={sent}
        />
        <TickAxis />
      </div>

      {/* Latest message in full: structured card / markdown + its own action buttons */}
      <div className="mt-3 rounded-md bg-surface p-5 shadow-elev-1">
        <CardBody notification={incident.latest} />
        <NotificationActions notification={incident.latest} onError={setActionError} />
        {actionError}
      </div>

      <div className={cn("mt-3 grid gap-2", incident.unread > 0 ? "grid-cols-2" : "grid-cols-1")}>
        <Button variant="ghost" size="lg" className="h-14 rounded-[16px] bg-surface shadow-elev-1" onClick={mute}>
          {t("incident_mute_hour")}
        </Button>
        {incident.unread > 0 && (
          <Button size="lg" className="h-14 rounded-[16px]" onClick={markRead}>
            {t("incident_mark_read")}
          </Button>
        )}
      </div>

      {incident.firings.length > 1 && (
        <section className="mt-9">
          <h2 className="mb-3 px-1 text-[18px] font-bold text-text tracking-[-0.01em]">{t("incident_sent_at")}</h2>
          <ul className="flex flex-wrap gap-2 px-1">
            {incident.firings
              .slice(-SENT_AT_LIMIT)
              .reverse()
              .map((time) => (
                <li key={time} className="rounded-full bg-surface px-3 py-1.5 text-[13px] font-medium tabular-nums text-text shadow-elev-1">
                  {when(time, now)}
                </li>
              ))}
            {incident.firings.length > SENT_AT_LIMIT && (
              <li className="px-1 py-1.5 text-[13px] text-muted">
                {t("incident_sent_earlier", { count: incident.firings.length - SENT_AT_LIMIT })}
              </li>
            )}
          </ul>
        </section>
      )}
    </article>
  );
};

export default IncidentDetail;
