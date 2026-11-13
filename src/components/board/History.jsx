import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { dayStart, slotOf, slotsForDay } from "@/app/incidents";
import { Skeleton } from "@/components/ui/Skeleton";
import StatePanel from "@/components/ui/StatePanel";
import { cn } from "@/components/ui/utils";
import routes from "@/components/routes";
import TickStrip, { TickAxis, toneOf } from "./TickStrip";
import StatusAvatar, { lookFor } from "./Avatar";
import { focus, press } from "./Board";
import { hhmm, topicLabel, useIncidents } from "./useIncidents";

const DAYS = 7;
const WEEKDAY_SHORT = { weekday: "short" };

const summary = (t, inc) => {
  if (inc.state === "open") return t("history_still_firing");
  return inc.week.length === 1 ? t("history_sent_week_one") : t("history_sent_week_other", { count: inc.week.length });
};

const History = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { incidents, now, subsById, loading } = useIncidents(null);

  if (loading) return <Skeleton className="h-40 rounded-md" />;

  const starts = Array.from({ length: DAYS }, (_, i) => dayStart(now, i - (DAYS - 1))); // oldest → today
  const weekStart = starts[0];
  // Alerts only (info one-offs would just be noise here), most frequent first.
  const rows = incidents
    .filter((i) => i.state !== "info")
    .map((i) => ({ ...i, week: i.firings.filter((f) => f >= weekStart) }))
    .filter((i) => i.week.length > 0)
    .sort((a, b) => b.week.length - a.week.length);

  return (
    <div className="pb-24">
      <header className="px-1">
        <h1 className="text-display leading-tight font-bold tracking-tight text-text">{t("history_title")}</h1>
        <p className="mt-2 text-body text-muted max-w-prose">{t("history_description")}</p>
      </header>

      {rows.length === 0 && <StatePanel title={t("history_empty")} />}

      <ul className="mt-7 flex flex-col gap-3">
        {rows.map((inc) => {
          const sub = subsById[inc.subscriptionId];
          const days = starts.filter((s) => inc.week.some((f) => f >= s && f < s + 86400)).length;
          return (
            <li key={inc.key}>
              <button
                type="button"
                onClick={() => sub && navigate(`${routes.forSubscription(sub)}?incident=${inc.id}`)}
                className={cn("w-full text-left rounded-md bg-surface p-5 shadow-elev-1", press, focus)}
              >
                <div className="flex items-start gap-3.5">
                  <StatusAvatar look={lookFor(inc)} />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-body leading-snug font-semibold text-text break-words">{inc.title}</h2>
                    <p className="mt-0.5 text-body-sm text-muted">
                      {topicLabel(sub)} · <span className="font-semibold text-text">{summary(t, inc)}</span>
                    </p>
                    <p className="text-caption text-muted">
                      {days === 1 ? t("history_days_one", { time: hhmm(inc.last) }) : t("history_days_other", { count: days })}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-1">
                  {starts.map((s, d) => {
                    const isToday = d === DAYS - 1;
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <span className={cn("w-10 shrink-0 text-caption", isToday ? "font-bold text-text" : "text-muted")}>
                          {isToday ? t("history_today") : new Date(s * 1000).toLocaleDateString([], WEEKDAY_SHORT)}
                        </span>
                        <TickStrip
                          className="flex-1"
                          slots={slotsForDay(inc.week, s)}
                          okSlot={inc.resolvedAt && inc.resolvedAt >= s && inc.resolvedAt < s + 86400 ? slotOf(inc.resolvedAt, s) : null}
                          nowSlot={isToday ? slotOf(now, s) : null}
                          tone={toneOf(inc.priority)}
                          size="sm"
                        />
                      </div>
                    );
                  })}
                  <TickAxis className="ml-12" />
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
