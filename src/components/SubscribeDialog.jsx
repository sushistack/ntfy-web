import * as React from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "./ui/Dialog";
import { Sheet, SheetContent } from "./ui/Sheet";
import { Button } from "./ui/Button";
import { Switch } from "./ui/Switch";
import api from "../app/Api";
import { randomAlphanumericString, topicUrl, validTopic, validUrl } from "../app/utils";
import userManager from "../app/UserManager";
import subscriptionManager from "../app/SubscriptionManager";
import poller from "../app/Poller";
import config from "../app/config";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

// accountApi.addSubscription was removed with account-management cleanup.
export const subscribeTopic = async (baseUrl, topic, opts) => subscriptionManager.add(baseUrl, topic, opts);

const SubscribeDialog = (props) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [baseUrl, setBaseUrl] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [showLoginPage, setShowLoginPage] = React.useState(false);

  React.useEffect(() => {
    if (!props.open) {
      setTopic("");
      setBaseUrl("");
      setShowLoginPage(false);
    }
  }, [props.open]);

  const handleSuccess = async () => {
    const actualBaseUrl = baseUrl || config.base_url;
    const subscription = await subscribeTopic(actualBaseUrl, topic, {});
    poller.pollInBackground(subscription); // dangling — intentional, starts background poll
    props.onSuccess(subscription);
  };

  const dialogTitle = showLoginPage ? t("subscribe_dialog_login_title") : t("subscribe_dialog_subscribe_title");

  const content = !showLoginPage ? (
    <SubscribePage
      baseUrl={baseUrl}
      setBaseUrl={setBaseUrl}
      topic={topic}
      setTopic={setTopic}
      subscriptions={props.subscriptions}
      onCancel={props.onCancel}
      onNeedsLogin={() => setShowLoginPage(true)}
      onSuccess={handleSuccess}
    />
  ) : (
    <LoginPage baseUrl={baseUrl} topic={topic} onBack={() => setShowLoginPage(false)} onSuccess={handleSuccess} />
  );

  if (isMobile) {
    return (
      <Sheet open={props.open} onOpenChange={(open) => !open && props.onCancel()}>
        <SheetContent side="bottom">
          <h2 className="text-subtitle font-semibold text-text px-4 pt-4">{dialogTitle}</h2>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onCancel()}>
      <DialogContent title={dialogTitle}>{content}</DialogContent>
    </Dialog>
  );
};

const SubscribePage = (props) => {
  const { t } = useTranslation();
  const [error, setError] = React.useState("");
  const [anotherServerVisible, setAnotherServerVisible] = React.useState(false);

  const subscribeButtonEnabled = (() => {
    const effectiveBaseUrl = anotherServerVisible ? props.baseUrl : config.base_url;
    const topicUrlStr = topicUrl(effectiveBaseUrl, props.topic);
    const existingTopicUrls = (props.subscriptions ?? []).map((s) => topicUrl(s.baseUrl, s.topic));
    const isExisting = existingTopicUrls.includes(topicUrlStr);
    if (anotherServerVisible) {
      return validTopic(props.topic) && validUrl(props.baseUrl) && !isExisting;
    }
    return validTopic(props.topic) && !isExisting;
  })();

  const handleSubscribe = async () => {
    const effectiveBaseUrl = anotherServerVisible ? props.baseUrl : config.base_url;
    const user = await userManager.get(effectiveBaseUrl);
    const username = user ? user.username : t("subscribe_dialog_error_user_anonymous");
    const success = await api.topicAuth(effectiveBaseUrl, props.topic, user);
    if (!success) {
      if (user) {
        setError(t("subscribe_dialog_error_user_not_authorized", { username }));
        return;
      }
      props.onNeedsLogin();
      return;
    }
    props.onSuccess();
  };

  return (
    <div className="p-4">
      <p className="text-body-sm text-muted mb-4">{t("subscribe_dialog_subscribe_description")}</p>
      {!anotherServerVisible && (
        <p className="text-body-sm text-muted mb-3 break-all" aria-label={t("subscribe_dialog_subscribe_base_url_label")}>
          {config.base_url}
        </p>
      )}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          maxLength={64}
          placeholder={t("subscribe_dialog_subscribe_topic_placeholder")}
          value={props.topic}
          onChange={(e) => props.setTopic(e.target.value)}
          className="flex-1 bg-transparent border-b border-control-border py-1 text-body text-text focus:outline-none focus:border-accent-ui focus-visible:ring-2 focus-visible:ring-focus-ring"
          aria-label={t("subscribe_dialog_subscribe_topic_placeholder")}
        />
        <Button variant="ghost" size="sm" type="button" onClick={() => props.setTopic(randomAlphanumericString(16))}>
          {t("subscribe_dialog_subscribe_button_generate_topic_name")}
        </Button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Switch
          checked={anotherServerVisible}
          onCheckedChange={(checked) => {
            props.setBaseUrl("");
            setAnotherServerVisible(checked);
          }}
          aria-label={t("subscribe_dialog_subscribe_use_another_label")}
        />
        <span className="text-body-sm text-muted">{t("subscribe_dialog_subscribe_use_another_label")}</span>
      </div>
      {anotherServerVisible && (
        <input
          type="url"
          placeholder={config.base_url}
          value={props.baseUrl}
          onChange={(e) => props.setBaseUrl(e.target.value)}
          className="w-full bg-transparent border-b border-control-border py-1 text-body text-text focus:outline-none focus:border-accent-ui focus-visible:ring-2 focus-visible:ring-focus-ring mb-2"
          aria-label={t("subscribe_dialog_subscribe_base_url_label")}
        />
      )}
      {error && <p className="text-caption text-priority-urgent mt-2">{error}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" type="button" onClick={props.onCancel}>
          {t("subscribe_dialog_subscribe_button_cancel")}
        </Button>
        <Button type="button" disabled={!subscribeButtonEnabled} onClick={handleSubscribe}>
          {t("subscribe_dialog_subscribe_button_subscribe")}
        </Button>
      </div>
    </div>
  );
};

const LoginPage = (props) => {
  const { t } = useTranslation();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const baseUrl = props.baseUrl || config.base_url;
  const loginEnabled = username.trim() !== "" && password !== "";

  const handleLogin = async () => {
    const user = { baseUrl, username, password };
    const success = await api.topicAuth(baseUrl, props.topic, user);
    if (!success) {
      setError(t("subscribe_dialog_error_user_not_authorized", { username }));
      return;
    }
    await userManager.save(user);
    props.onSuccess();
  };

  return (
    <div className="p-4">
      <p className="text-body-sm text-muted mb-4">{t("subscribe_dialog_login_description")}</p>
      <input
        type="text"
        placeholder={t("subscribe_dialog_login_username_label")}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full bg-transparent border-b border-control-border py-1 text-body text-text focus:outline-none focus:border-accent-ui focus-visible:ring-2 focus-visible:ring-focus-ring mb-3"
        aria-label={t("subscribe_dialog_login_username_label")}
      />
      <input
        type="password"
        placeholder={t("subscribe_dialog_login_password_label")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full bg-transparent border-b border-control-border py-1 text-body text-text focus:outline-none focus:border-accent-ui focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-label={t("subscribe_dialog_login_password_label")}
      />
      {error && <p className="text-caption text-priority-urgent mt-2">{error}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" type="button" onClick={props.onBack}>
          {t("common_back")}
        </Button>
        <Button type="button" disabled={!loginEnabled} onClick={handleLogin}>
          {t("subscribe_dialog_login_button_login")}
        </Button>
      </div>
    </div>
  );
};

export default SubscribeDialog;
