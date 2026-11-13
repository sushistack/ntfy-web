import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { dayStart, slotOf, slotsForDay } from "@/app/incidents";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/components/ui/utils";
import { NoMessagesAllPanel, NoMessagesTopicPanel } from "@/components/message/EmptyStates";
import { useActiveTopic } from "@/components/hooks";
import TickStrip, { TickAxis, toneOf } from "./TickStrip";
import StatusAvatar, { lookFor } from "./Avatar";
import { hhmm, topicLabel, useIncidents, when as at } from "./useIncidents";

export const press = "transition-transform duration-150 active:scale-98 motion-reduce:transition-none motion-reduce:active:scale-100";
export const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

const sentToday = (t, incident, today) => {
  const count = incident.firings.filter((f) => f >= today).length;
  return count === 1 ? t("board_sent_today_one") : t("board_sent_today_other", { count });
};

/** Firing now: a full card each, with the day strip. */
const OpenCard = ({ incident, sub, today, nowSlot, onOpen }) => {
  const { t } = useTranslation();
  const sent = sentToday(t, incident, today);
  const since = incident.since < incident.last ? t("board_since", { time: at(incident.since, today) }) : hhmm(incident.last);
  return (
    <li>
      <button type="button" onClick={onOpen} className={cn("w-full text-left rounded-md bg-surface p-5 shadow-elev-1", press, focus)}>
        <div className="flex items-start gap-3.5">
          <StatusAvatar look={lookFor(incident)} unread={incident.unread > 0} />
          <div className="min-w-0 flex-1">
            <h3 className="text-body leading-snug font-semibold text-text break-words">{incident.title}</h3>
            <p className="mt-0.5 text-body-sm text-muted truncate">
              {topicLabel(sub)} · {since}
            </p>
          </div>
          <span className="text-caption text-muted tabular-nums whitespace-nowrap pt-0.5">{hhmm(incident.last)}</span>
        </div>
        <TickStrip
          className="mt-4"
          slots={slotsForDay(incident.firings, today)}
          nowSlot={nowSlot}
          tone={toneOf(incident.priority)}
          label={sent}
        />
        <p className="mt-2 text-caption text-muted">{sent}</p>
      </button>
    </li>
  );
};

/** Went quiet / info: compact rows grouped on one sheet. */
const QuietRow = ({ incident, sub, today, onOpen }) => {
  const { t } = useTranslation();
  const from = hhmm(incident.since);
  const to = hhmm(incident.resolvedAt ?? incident.last);
  const range = incident.state === "info" || from === to ? to : t("board_range", { from, to });
  return (
    <li>
      <button type="button" onClick={onOpen} className={cn("w-full text-left px-5 py-4 hover:bg-surface-2", focus)}>
        <div className="flex items-center gap-3.5">
          <StatusAvatar look={lookFor(incident)} unread={incident.unread > 0} />
          <div className="min-w-0 flex-1">
            <h3 className="text-body leading-snug font-medium text-text break-words">{incident.title}</h3>
            <p className="mt-0.5 text-caption text-muted truncate">
              {topicLabel(sub)} · {range}
            </p>
          </div>
        </div>
        <TickStrip
          className="mt-3 ml-13.5"
          size="sm"
          slots={slotsForDay(incident.firings, today)}
          okSlot={incident.resolvedAt ? slotOf(incident.resolvedAt, today) : null}
          tone={toneOf(incident.priority)}
          label={sentToday(t, incident, today)}
        />
      </button>
    </li>
  );
};

const Section = ({ title, children, sheet = false }) => (
  <section className="mt-9">
    <h2 className="mb-3 px-1 text-subtitle font-bold text-text tracking-tight">{title}</h2>
    <ul className={sheet ? "rounded-md bg-surface shadow-elev-1 overflow-hidden py-1" : "flex flex-col gap-3"}>{children}</ul>
  </section>
);

const Board = () => {
  const { t } = useTranslation();
  const topicName = useActiveTopic();
  const [, setParams] = useSearchParams();
  const { incidents, now, subsById, loading } = useIncidents(topicName);

  if (loading) return <Skeleton className="h-40 rounded-md" />;
  if (incidents.length === 0) return topicName ? <NoMessagesTopicPanel /> : <NoMessagesAllPanel />;

  const today = dayStart(now);
  const nowSlot = slotOf(now, today);
  const open = incidents.filter((i) => i.state === "open");
  const quiet = incidents.filter((i) => (i.state === "quiet" || i.state === "resolved") && i.notifications[0].time >= today);
  const info = incidents.filter((i) => i.state === "info" && i.notifications[0].time >= today);
  const lastToday = incidents.find((i) => i.notifications[0].time >= today)?.notifications[0].time;
  const rowProps = (incident) => ({
    incident,
    sub: subsById[incident.subscriptionId],
    today,
    onOpen: () => setParams({ incident: incident.id }),
  });

  return (
    <div className="pb-24">
      <header className="px-1">
        {open.length === 0 && <StatusAvatar look="clear" size="lg" />}
        <h1 className={cn("text-display leading-tight font-bold tracking-tight text-text", open.length === 0 && "mt-4")}>
          {open.length === 0 ? t("board_summary_clear") : t("board_summary_firing", { count: open.length })}
        </h1>
        <p className="mt-2 text-body text-muted">
          {quiet.length > 0 && `${t("board_summary_quiet", { count: quiet.length })} `}
          {lastToday ? t("board_summary_last", { time: hhmm(lastToday) }) : t("board_summary_none_today")}
        </p>
      </header>

      {open.length === 0 && (
        <div className="mt-6 rounded-md bg-surface p-5 shadow-elev-1">
          <TickStrip
            size="lg"
            slots={slotsForDay(
              incidents.flatMap((i) => i.firings),
              today
            )}
            nowSlot={nowSlot}
            tone="bg-priority-max"
            label={t("board_today_strip")}
          />
          <TickAxis />
        </div>
      )}

      {open.length > 0 && (
        <Section title={t("board_section_open")}>
          {open.map((i) => (
            <OpenCard key={i.key} {...rowProps(i)} nowSlot={nowSlot} />
          ))}
        </Section>
      )}
      {quiet.length > 0 && (
        <Section title={t("board_section_quiet")} sheet>
          {quiet.map((i) => (
            <QuietRow key={i.key} {...rowProps(i)} />
          ))}
        </Section>
      )}
      {info.length > 0 && (
        <Section title={t("board_section_info")} sheet>
          {info.map((i) => (
            <QuietRow key={i.key} {...rowProps(i)} />
          ))}
        </Section>
      )}
    </div>
  );
};

export default Board;
