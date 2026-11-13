import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import subscriptionManager from "@/app/SubscriptionManager";
import { dayStart, slotOf, slotsForDay } from "@/app/incidents";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import StatePanel from "@/components/ui/StatePanel";
import CardBody from "@/components/message/CardBody";
import { NotificationActions } from "@/components/message/NotificationActions";
import { useActiveTopic } from "@/components/hooks";
import TickStrip, { TickAxis, toneOf } from "./TickStrip";
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

const IncidentDetail = ({ incidentKey }) => {
  const { t } = useTranslation();
  const topicName = useActiveTopic();
  const [, setParams] = useSearchParams();
  const { incidents, now, subsById, loading } = useIncidents(topicName);
  const [actionError, setActionError] = useState(null);
  const back = () => setParams({});

  if (loading) return <Skeleton className="h-40" />;
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
  const sent = incident.runCount === 1 ? t("board_sent_one") : t("board_sent_other", { count: incident.runCount });
  const markRead = () => incident.notifications.filter((n) => n.new === 1).forEach((n) => subscriptionManager.markNotificationRead(n.id));
  const mute = () => subscriptionManager.setMutedUntil(incident.subscriptionId, now + 3600);

  return (
    <article className="pb-24">
      <button
        type="button"
        onClick={back}
        className="text-body-sm text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded-sm"
      >
        ‹ {t("board_back")}
      </button>
      <p className="mt-3 text-caption font-semibold text-muted">{topicLabel(sub)}</p>
      <h1 className="text-display font-semibold tracking-tight text-text leading-tight">{incident.title}</h1>
      <p className="mt-1 text-body-sm text-muted">
        {statusLine(t, incident, now)} {sent}.
      </p>

      <div className="mt-5">
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
      <div className="mt-5 rounded-md border border-border bg-surface p-4">
        <CardBody notification={incident.latest} />
        <NotificationActions notification={incident.latest} onError={setActionError} />
        {actionError}
      </div>

      {incident.firings.length > 1 && (
        <>
          <h2 className="mt-6 mb-2 text-caption font-semibold text-muted">{t("incident_sent_at")}</h2>
          <ul className="flex flex-wrap gap-1.5">
            {incident.firings
              .slice(-SENT_AT_LIMIT)
              .reverse()
              .map((time) => (
                <li key={time} className="rounded-badge border border-border bg-surface px-2 py-0.5 text-caption tabular-nums text-text">
                  {when(time, now)}
                </li>
              ))}
            {incident.firings.length > SENT_AT_LIMIT && (
              <li className="px-1 py-0.5 text-caption text-muted">
                {t("incident_sent_earlier", { count: incident.firings.length - SENT_AT_LIMIT })}
              </li>
            )}
          </ul>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {incident.unread > 0 && <Button onClick={markRead}>{t("incident_mark_read")}</Button>}
        <Button variant="ghost" onClick={mute}>
          {t("incident_mute_hour")}
        </Button>
      </div>
    </article>
  );
};

export default IncidentDetail;
