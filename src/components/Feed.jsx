import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import InfiniteScroll from "react-infinite-scroll-component";
import { useLiveQuery } from "dexie-react-hooks";
import DataBoundary from "@/components/ui/DataBoundary";
import LiveRegion from "@/components/ui/LiveRegion";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSelection } from "@/components/contexts/SelectionContext";
import { usePublishQueue } from "@/components/contexts/PublishQueueContext";
import subscriptionManager from "../app/SubscriptionManager";
import { NotificationCard } from "./message/NotificationCard";
import CardBody from "./message/CardBody";
import { NotificationActions } from "./message/NotificationActions";
import { NoMessagesTopicPanel, NoMessagesAllPanel } from "./message/EmptyStates";
import { useActiveTopic } from "./hooks";
import { SendingIndicator, RetryBar } from "./message/QueueSlots";
import { findArrivingNotifications } from "./feedAnnouncements";

const PAGE_SIZE = 20;

const FeedCard = ({ notification, subscriptionName, showTopicChip, isSelected }) => {
  const [actionError, setActionError] = useState(null);

  return (
    <NotificationCard
      notification={notification}
      subscriptionName={subscriptionName}
      showTopicChip={showTopicChip}
      isSelected={isSelected}
      onTap={(n) => subscriptionManager.markNotificationRead(n.id)}
      body={
        <>
          <CardBody notification={notification} />
          <NotificationActions notification={notification} onError={setActionError} />
        </>
      }
      error={actionError}
    />
  );
};

const Feed = () => {
  const { t } = useTranslation();
  const topicName = useActiveTopic(); // topic string or null
  const isAllFeed = !topicName;
  const { msgId } = useSelection();
  const { queue } = usePublishQueue();

  // Look up the full subscription object for the active topic
  const allSubscriptions = useLiveQuery(() => subscriptionManager.all(), []) ?? [];
  const subscription = topicName ? allSubscriptions.find((s) => s.topic === topicName) ?? null : null;

  const subsById = useMemo(() => Object.fromEntries(allSubscriptions.map((s) => [s.id, s])), [allSubscriptions]);

  const optimisticEntries = isAllFeed
    ? queue
    : queue.filter((e) => subscription && e.topic === subscription.topic && e.baseUrl === subscription.baseUrl);

  const rawNotifications = useLiveQuery(() => {
    if (isAllFeed) return subscriptionManager.getAllNotifications();
    if (subscription) return subscriptionManager.getNotifications(subscription.id);
    return undefined;
  }, [isAllFeed, subscription?.id]);

  const isLoading = rawNotifications === undefined;
  const notifications = rawNotifications ?? [];
  const isEmpty = !isLoading && notifications.length === 0 && optimisticEntries.length === 0;

  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const seenNotificationsRef = useRef({ scope: null, ids: new Set() });
  const [arrivalAnnouncement, setArrivalAnnouncement] = useState({ message: "", sequence: 0 });
  const [animatingIds, setAnimatingIds] = useState(() => new Set());
  const visible = notifications.slice(0, displayCount);
  const notificationScope = isAllFeed ? "all" : subscription?.id ?? null;

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    document.getElementById("main")?.scrollTo(0, 0);
  }, [subscription?.id]);

  useEffect(() => {
    if (isLoading || notificationScope === null) return;

    const currentIds = new Set(notifications.map((notification) => notification.id));
    if (seenNotificationsRef.current.scope !== notificationScope) {
      seenNotificationsRef.current = { scope: notificationScope, ids: currentIds };
      return;
    }

    const arriving = findArrivingNotifications(notifications, seenNotificationsRef.current.ids);
    seenNotificationsRef.current.ids = currentIds;
    if (arriving.length > 0) {
      setArrivalAnnouncement((current) => ({
        message: t("notifications_new_indicator"),
        sequence: current.sequence + 1,
      }));
      // Slide-in only the notifications that actually just arrived (not whatever sits at index 0)
      const arrivingIds = arriving.map((n) => n.id);
      setAnimatingIds((prev) => new Set([...prev, ...arrivingIds]));
    }
  }, [isLoading, notificationScope, notifications, t]);

  return (
    <>
      <LiveRegion message={arrivalAnnouncement.message} announcementKey={arrivalAnnouncement.sequence} />

      <DataBoundary
        loading={isLoading}
        hasCache={false}
        skeletonCount={5}
        empty={isEmpty}
        emptySlot={isAllFeed ? <NoMessagesAllPanel /> : <NoMessagesTopicPanel />}
      >
        <InfiniteScroll
          dataLength={visible.length}
          next={() => setDisplayCount((prev) => prev + PAGE_SIZE)}
          hasMore={visible.length < notifications.length}
          loader={<Skeleton className="mt-3" />}
          scrollThreshold={0.7}
          scrollableTarget="main"
        >
          <ul aria-label={t("feed_notifications_list")} className="flex flex-col gap-[1.125rem]">
            {optimisticEntries.map((entry) => {
              const optSub = isAllFeed
                ? allSubscriptions.find((s) => s.baseUrl === entry.baseUrl && s.topic === entry.topic)
                : subscription;
              const syntheticNotification = {
                id: `optimistic-${entry.id}`,
                title: entry.title,
                message: entry.body,
                priority: entry.priority,
                tags: entry.tags
                  ? entry.tags
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : [],
                time: entry.enqueuedAt,
                new: 0,
                subscriptionId: optSub?.id ?? null,
              };
              return (
                <li key={entry.id} className="motion-safe:animate-slide-in-top">
                  <NotificationCard
                    notification={syntheticNotification}
                    subscriptionName={isAllFeed ? optSub?.displayName || optSub?.topic : undefined}
                    showTopicChip={isAllFeed}
                    isSelected={false}
                    onTap={() => {}}
                    body={null}
                    pending={entry.state !== "failed" ? <SendingIndicator state={entry.state} /> : null}
                    error={entry.state === "failed" ? <RetryBar id={entry.id} /> : null}
                  />
                </li>
              );
            })}
            {visible.map((n) => {
              const notifSub = isAllFeed ? subsById[n.subscriptionId] : null;
              const subscriptionName = isAllFeed ? notifSub?.displayName || notifSub?.topic : undefined;
              return (
                <li key={n.id} className={animatingIds.has(n.id) ? "motion-safe:animate-slide-in-top" : undefined}>
                  <FeedCard
                    notification={n}
                    subscriptionName={subscriptionName}
                    showTopicChip={isAllFeed}
                    isSelected={n.id === msgId}
                  />
                </li>
              );
            })}
          </ul>
        </InfiniteScroll>
      </DataBoundary>
    </>
  );
};

export default Feed;
