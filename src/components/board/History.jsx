import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { dayStart, slotOf, slotsForDay } from "@/app/incidents";
import { Skeleton } from "@/components/ui/Skeleton";
import StatePanel from "@/components/ui/StatePanel";
import routes from "@/components/routes";
import TickStrip, { TickAxis, toneOf } from "./TickStrip";
import { hhmm, topicLabel, useIncidents } from "./useIncidents";

const DAYS = 7;

const History = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { incidents, now, subsById, loading } = useIncidents(null);

  if (loading) return <Skeleton className="h-40" />;

  const starts = Array.from({ length: DAYS }, (_, i) => dayStart(now, i - (DAYS - 1))); // oldest → today
  const weekStart = starts[0];
  // Alerts only (info one-offs would just be noise here), most frequent first.
  const rows = incidents
    .filter((i) => i.state !== "info")
    .map((i) => ({ ...i, week: i.firings.filter((f) => f >= weekStart) }))
    .filter((i) => i.week.length > 0)
    .sort((a, b) => b.week.length - a.week.length);

  return (
    <div>
      <h1 className="text-display font-semibold tracking-tight text-text">{t("history_title")}</h1>
      <p className="mt-1 mb-6 text-body-sm text-muted max-w-[60ch]">{t("history_description")}</p>

      {rows.length === 0 && <StatePanel title={t("history_empty")} />}

      <ul className="flex flex-col gap-3">
        {rows.map((inc) => {
          const sub = subsById[inc.subscriptionId];
          const days = starts.filter((s) => inc.week.some((f) => f >= s && f < s + 86400)).length;
          return (
            <li key={inc.key}>
              <button
                type="button"
                onClick={() => sub && navigate(`${routes.forSubscription(sub)}?incident=${inc.id}`)}
                className="w-full text-left rounded-md border border-border bg-surface p-4 shadow-elev-1 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 items-baseline">
                  <div className="min-w-0">
                    <p className="text-caption font-semibold text-muted">{topicLabel(sub)}</p>
                    <h2 className="text-body font-semibold text-text">{inc.title}</h2>
                  </div>
                  <p className="text-caption text-muted sm:text-right">
                    <span className="font-semibold text-text">
                      {inc.state === "open"
                        ? t("history_still_firing")
                        : inc.week.length === 1
                        ? t("history_sent_week_one")
                        : t("history_sent_week_other", { count: inc.week.length })}
                    </span>
                    <br />
                    {days === 1 ? t("history_days_one", { time: hhmm(inc.last) }) : t("history_days_other", { count: days })}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-[2.75rem_1fr] gap-x-2.5 gap-y-[3px] items-center">
                  {starts.map((s, d) => {
                    const isToday = d === DAYS - 1;
                    return [
                      <span key={`l${s}`} className={isToday ? "text-caption font-semibold text-text" : "text-caption text-muted"}>
                        {isToday ? t("history_today") : new Date(s * 1000).toLocaleDateString([], { weekday: "short" })}
                      </span>,
                      <TickStrip
                        key={`s${s}`}
                        slots={slotsForDay(inc.week, s)}
                        okSlot={inc.resolvedAt && inc.resolvedAt >= s && inc.resolvedAt < s + 86400 ? slotOf(inc.resolvedAt, s) : null}
                        nowSlot={isToday ? slotOf(now, s) : null}
                        tone={toneOf(inc.priority)}
                        size="sm"
                      />,
                    ];
                  })}
                  <span />
                  <TickAxis />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default History;
