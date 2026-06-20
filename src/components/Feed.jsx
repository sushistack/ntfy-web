import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import InfiniteScroll from "react-infinite-scroll-component";
import { useLiveQuery } from "dexie-react-hooks";
import subscriptionManager from "../app/SubscriptionManager";
import DataBoundary from "@/components/ui/DataBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import { NotificationCard } from "./message/NotificationCard";
import CardBody from "./message/CardBody";
import { NotificationActions } from "./message/NotificationActions";
import { NoMessagesTopicPanel, NoMessagesAllPanel } from "./message/EmptyStates";
import { useActiveTopic } from "./hooks";
import { useSelection } from "@/components/contexts/SelectionContext";
import { usePublishQueue } from "@/components/contexts/PublishQueueContext";
import { SendingIndicator, RetryBar } from "./message/QueueSlots";

const PAGE_SIZE = 20;

const FeedCard = ({ notification, subscriptionName, showTopicChip, isSelected, isMuted, onMuteToggle }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState(null);
  const [muteError, setMuteError] = useState(false);

  const handleMuteToggle = async () => {
    setMuteError(false);
    try {
      await onMuteToggle?.();
    } catch {
      setMuteError(true);
    }
  };

  return (
    <NotificationCard
      notification={notification}
      subscriptionName={subscriptionName}
      showTopicChip={showTopicChip}
      isSelected={isSelected}
      isMuted={isMuted}
      onMuteToggle={handleMuteToggle}
      onTap={(n) => navigate(`/${n.topic}/${n.id}`)}
      body={
        <>
          <CardBody notification={notification} />
          <NotificationActions notification={notification} onError={setActionError} />
        </>
      }
      error={
        muteError ? (
          <button
            type="button"
            onClick={handleMuteToggle}
            className="text-caption text-priority-high underline py-1"
          >
            {t("notification_action_failed_retry_label")}
          </button>
        ) : actionError
      }
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
  const subscription = topicName
    ? allSubscriptions.find(s => s.topic === topicName) ?? null
    : null;

  const subsById = useMemo(
    () => Object.fromEntries(allSubscriptions.map(s => [s.id, s])),
    [allSubscriptions]
  );

  const optimisticEntries = isAllFeed
    ? queue
    : queue.filter((e) => subscription && e.topic === subscription.topic && e.baseUrl === subscription.baseUrl);

  const rawNotifications = useLiveQuery(
    () => isAllFeed
      ? subscriptionManager.getAllNotifications()
      : subscription ? subscriptionManager.getNotifications(subscription.id) : undefined,
    [isAllFeed, subscription?.id]
  );

  const isLoading = rawNotifications === undefined;
  const notifications = rawNotifications ?? [];
  const isEmpty = !isLoading && notifications.length === 0 && optimisticEntries.length === 0;

  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const visible = notifications.slice(0, displayCount);

  // Per-topic mute: all cards share one subscription, so define once outside the map
  const topicIsMuted = (subscription?.mutedUntil ?? 0) > 0;
  const handleTopicMuteToggle = async () => {
    if (!subscription) return;
    const next = subscription.mutedUntil ? 0 : 1;
    await subscriptionManager.setMutedUntil(subscription.id, next);
  };

  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
    document.getElementById("main")?.scrollTo(0, 0);
  }, [subscription?.id]);

  return (
    <>
      {!isAllFeed && subscription && (
        <div
          className="sticky top-0 z-10 bg-surface border-b border-border px-5 py-3"
          role="region"
          aria-label={t("feed_sticky_header_label")}
        >
          <span className="text-body font-semibold text-text">
            {subscription.displayName || subscription.topic}
          </span>
        </div>
      )}

      <DataBoundary
        loading={isLoading}
        hasCache={false}
        skeletonCount={5}
        empty={isEmpty}
        emptySlot={isAllFeed ? <NoMessagesAllPanel /> : <NoMessagesTopicPanel />}
      >
        <InfiniteScroll
          dataLength={visible.length}
          next={() => setDisplayCount(prev => prev + PAGE_SIZE)}
          hasMore={visible.length < notifications.length}
          loader={<Skeleton className="mt-3" />}
          scrollThreshold={0.7}
          scrollableTarget="main"
        >
          <ul
            role="list"
            aria-live="polite"
            aria-label={t("feed_notifications_list")}
            aria-relevant="additions"
          >
            {optimisticEntries.map((entry) => {
              const optSub = isAllFeed ? allSubscriptions.find((s) => s.baseUrl === entry.baseUrl && s.topic === entry.topic) : subscription;
              const syntheticNotification = {
                id: `optimistic-${entry.id}`,
                title: entry.title,
                message: entry.body,
                priority: entry.priority,
                tags: entry.tags ? entry.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
                time: entry.enqueuedAt,
                new: 0,
                subscriptionId: optSub?.id ?? null,
              };
              return (
                <li key={entry.id} className="motion-safe:animate-[slide-in-top_0.25s_ease-out]">
                  <NotificationCard
                    notification={syntheticNotification}
                    subscriptionName={isAllFeed ? (optSub?.displayName || optSub?.topic) : undefined}
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
            {visible.map((n, index) => {
              const notifSub = isAllFeed ? subsById[n.subscriptionId] : null;
              const subscriptionName = isAllFeed
                ? (notifSub?.displayName || notifSub?.topic)
                : undefined;
              const isMuted = isAllFeed
                ? (notifSub?.mutedUntil ?? 0) > 0
                : topicIsMuted;
              const onMuteToggle = isAllFeed
                ? async () => {
                    if (!notifSub) return;
                    const next = notifSub.mutedUntil ? 0 : 1;
                    await subscriptionManager.setMutedUntil(notifSub.id, next);
                  }
                : handleTopicMuteToggle;
              return (
                <li
                  key={n.id}
                  className={index === 0 ? "motion-safe:animate-[slide-in-top_0.25s_ease-out]" : undefined}
                >
                  <FeedCard
                    notification={n}
                    subscriptionName={subscriptionName}
                    showTopicChip={isAllFeed}
                    isSelected={n.id === msgId}
                    isMuted={isMuted}
                    onMuteToggle={onMuteToggle}
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
