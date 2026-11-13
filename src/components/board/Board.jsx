import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { dayStart, slotOf, slotsForDay } from "@/app/incidents";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/components/ui/utils";
import { NoMessagesAllPanel, NoMessagesTopicPanel } from "@/components/message/EmptyStates";
import { useActiveTopic } from "@/components/hooks";
import TickStrip, { TickAxis, toneOf } from "./TickStrip";
import { hhmm, topicLabel, useIncidents, when as at } from "./useIncidents";

const IncidentCard = ({ incident, sub, today, nowSlot, quiet, onOpen }) => {
  const { t } = useTranslation();
  const slots = slotsForDay(incident.firings, today);
  const okSlot = incident.resolvedAt ? slotOf(incident.resolvedAt, today) : null;
  const sent = incident.runCount === 1 ? t("board_sent_one") : t("board_sent_other", { count: incident.runCount });
  const when =
    incident.state === "resolved" || incident.state === "quiet"
      ? t("board_range", { from: hhmm(incident.since), to: hhmm(incident.resolvedAt ?? incident.last) })
      : hhmm(incident.last);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "w-full text-left rounded-md border px-4 py-3 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          quiet
            ? "border-dashed border-border bg-transparent hover:bg-surface"
            : "border-border bg-surface shadow-elev-1 hover:bg-surface-2"
        )}
      >
        <div className="flex justify-between gap-3 text-caption">
          <span className="font-semibold text-muted truncate">{topicLabel(sub)}</span>
          <span className="text-muted whitespace-nowrap tabular-nums">{when}</span>
        </div>
        <h3 className={cn("mt-0.5 mb-2 text-body text-text", quiet ? "font-medium" : "font-semibold")}>
          {incident.unread > 0 && (
            <span
              className="inline-block w-2 h-2 mr-2 rounded-full bg-accent-ui align-middle"
              aria-label={t("notifications_new_indicator")}
            />
          )}
          {incident.title}
        </h3>
        <TickStrip
          slots={slots}
          okSlot={okSlot}
          nowSlot={nowSlot}
          tone={toneOf(incident.priority)}
          size={quiet ? "sm" : "md"}
          label={sent}
        />
        {!quiet && (
          <div className="flex justify-between mt-1.5 text-caption text-muted tabular-nums">
            <span>{incident.since < incident.last ? t("board_since", { time: at(incident.since, today) }) : hhmm(incident.last)}</span>
            <span>{sent}</span>
          </div>
        )}
      </button>
    </li>
  );
};

const Section = ({ title, children }) => (
  <section className="mt-6">
    <h2 className="text-caption font-semibold text-muted mb-2">{title}</h2>
    <ul className="flex flex-col gap-2">{children}</ul>
  </section>
);

const Board = () => {
  const { t } = useTranslation();
  const topicName = useActiveTopic();
  const [, setParams] = useSearchParams();
  const { incidents, now, subsById, loading } = useIncidents(topicName);

  if (loading) return <Skeleton className="h-40" />;
  if (incidents.length === 0) return topicName ? <NoMessagesTopicPanel /> : <NoMessagesAllPanel />;

  const today = dayStart(now);
  const nowSlot = slotOf(now, today);
  const open = incidents.filter((i) => i.state === "open");
  const quiet = incidents.filter((i) => (i.state === "quiet" || i.state === "resolved") && i.notifications[0].time >= today);
  const info = incidents.filter((i) => i.state === "info" && i.notifications[0].time >= today);
  const lastToday = incidents.find((i) => i.notifications[0].time >= today)?.notifications[0].time;

  const openIncident = (key) => setParams({ incident: key });
  const card = (incident, isQuiet) => (
    <IncidentCard
      key={incident.key}
      incident={incident}
      sub={subsById[incident.subscriptionId]}
      today={today}
      nowSlot={nowSlot}
      quiet={isQuiet}
      onOpen={() => openIncident(incident.id)}
    />
  );

  return (
    <div>
      <h1 className="text-display font-semibold tracking-tight text-text leading-tight">
        {open.length === 0 ? t("board_summary_clear") : t("board_summary_firing", { count: open.length })}
      </h1>
      <p className="mt-1 text-body-sm text-muted">
        {quiet.length > 0 && `${t("board_summary_quiet", { count: quiet.length })} `}
        {lastToday ? t("board_summary_last", { time: hhmm(lastToday) }) : t("board_summary_none_today")}
      </p>

      {open.length === 0 && (
        <div className="mt-6">
          <TickStrip
            slots={slotsForDay(
              incidents.flatMap((i) => i.firings),
              today
            )}
            nowSlot={nowSlot}
            tone="bg-priority-max"
            size="lg"
            label={t("board_today_strip")}
          />
          <TickAxis />
        </div>
      )}

      {open.length > 0 && <Section title={t("board_section_open")}>{open.map((i) => card(i, false))}</Section>}
      {quiet.length > 0 && <Section title={t("board_section_quiet")}>{quiet.map((i) => card(i, true))}</Section>}
      {info.length > 0 && <Section title={t("board_section_info")}>{info.map((i) => card(i, true))}</Section>}
    </div>
  );
};

export default Board;
