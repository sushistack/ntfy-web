import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import subscriptionManager from "@/app/SubscriptionManager";
import { dayStart, groupIncidents } from "@/app/incidents";

/** Current unix seconds, refreshed every minute so "firing" turns into "went quiet" without new messages. */
export const useNow = () => {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
};

/** Incidents for one topic (or all topics when `topicName` is null), plus subscription lookup. */
export const useIncidents = (topicName) => {
  const now = useNow();
  const subscriptions = useLiveQuery(() => subscriptionManager.all(), []);
  const subscription = topicName ? subscriptions?.find((s) => s.topic === topicName) : null;
  const notifications = useLiveQuery(() => {
    if (!topicName) return subscriptionManager.getAllNotifications();
    if (subscription) return subscriptionManager.getNotifications(subscription.id);
    return undefined;
  }, [topicName, subscription?.id]);

  const subsById = useMemo(() => Object.fromEntries((subscriptions ?? []).map((s) => [s.id, s])), [subscriptions]);
  const incidents = useMemo(() => (notifications ? groupIncidents(notifications, now) : []), [notifications, now]);

  return { incidents, now, subsById, loading: notifications === undefined };
};

export const topicLabel = (sub) => sub?.displayName || sub?.topic || "";

export const hhmm = (t) => new Date(t * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

/** "14:05" for today, "Wed 21:00" for earlier days. */
export const when = (t, now) =>
  t >= dayStart(now)
    ? hhmm(t)
    : new Date(t * 1000).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });
