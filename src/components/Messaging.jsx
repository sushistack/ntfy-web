import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useActiveTopic } from "@/components/hooks";
import subscriptionManager from "@/app/SubscriptionManager";
import PublishFab from "./PublishFab";
import PublishDialog from "./PublishDialog";
import config from "@/app/config";

const Messaging = () => {
  const [publishOpen, setPublishOpen] = useState(false);
  const topicName = useActiveTopic();
  const allSubscriptions = useLiveQuery(() => subscriptionManager.all(), []) ?? [];
  const activeTopic = topicName
    ? allSubscriptions.find((s) => s.topic === topicName) ?? null
    : null;

  return (
    <>
      <PublishFab onClick={() => setPublishOpen(true)} />
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        initialTopic={topicName ?? ""}
        baseUrl={activeTopic?.baseUrl ?? config.base_url}
      />
    </>
  );
};

export default Messaging;
