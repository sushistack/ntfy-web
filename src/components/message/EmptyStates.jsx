import { useTranslation } from "react-i18next";
import StatePanel from "@/components/ui/StatePanel";
import { Button } from "@/components/ui/Button";

const CloudOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M2 2l20 20" />
    <path d="M5.782 5.782A7 7 0 0 0 12 19h7a5 5 0 0 0 1.79-9.65" />
    <path d="M17.386 17.386a7 7 0 0 1-12.154-6.77" />
  </svg>
);

const SignalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M2 20h.01" />
    <path d="M7 20v-4" />
    <path d="M12 20v-8" />
    <path d="M17 20v-12" />
    <path d="M22 20V4" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export const NotConnectedPanel = ({ onSettings }) => {
  const { t } = useTranslation();
  return (
    <StatePanel
      icon={<CloudOffIcon />}
      title={t("empty_state_not_connected_title")}
      desc={t("empty_state_not_connected_desc")}
      action={
        <Button variant="ghost" onClick={onSettings}>
          {t("empty_state_not_connected_action")}
        </Button>
      }
      colorway="coral"
    />
  );
};

export const ConnectingPanel = () => {
  const { t } = useTranslation();
  return (
    <StatePanel
      icon={<SignalIcon />}
      title={t("empty_state_connecting_title")}
      desc={t("empty_state_connecting_desc")}
      colorway="amber"
    />
  );
};

export const NoSubscriptionsPanel = ({ onSubscribe }) => {
  const { t } = useTranslation();
  return (
    <StatePanel
      icon={<BellIcon />}
      title={t("empty_state_no_subscriptions_title")}
      desc={t("empty_state_no_subscriptions_desc")}
      action={
        // THE ONE GREEN BUTTON (UX-DR6). No green variant on Button.
        <button
          type="button"
          onClick={onSubscribe}
          className="bg-accent-ui text-accent-on-surface font-semibold rounded-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          {t("empty_state_no_subscriptions_action")}
        </button>
      }
      colorway="green"
    />
  );
};

const InboxEmptyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const BellSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
    <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
    <path d="M18 8a6 6 0 0 0-9.33-5" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export const NoMessagesTopicPanel = () => {
  const { t } = useTranslation();
  return (
    <StatePanel
      icon={<InboxEmptyIcon />}
      desc={t("empty_state_no_messages_topic_desc")}
      colorway="muted"
    />
  );
};

export const NoMessagesAllPanel = () => {
  const { t } = useTranslation();
  return (
    <StatePanel
      icon={<BellSlashIcon />}
      desc={t("empty_state_no_messages_all_desc")}
      colorway="muted"
    />
  );
};
