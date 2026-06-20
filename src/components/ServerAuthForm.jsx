import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import config from "../app/config";
import userManager from "../app/UserManager";
import { Button } from "@/components/ui/Button";
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

const AUTH_TYPE = { TOKEN: "token", PASSWORD: "password" };

const ServerAuthForm = () => {
  const { t } = useTranslation();
  const [authType, setAuthType] = useState(AUTH_TYPE.TOKEN);
  const [username, setUsername] = useState("");
  const [credential, setCredential] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const existingUser = useLiveQuery(() => userManager.get(config.base_url), []);

  useEffect(() => {
    if (existingUser !== undefined) {
      setUsername(existingUser?.username ?? "");
      setCredential(existingUser?.token ?? existingUser?.password ?? "");
      if (existingUser?.password && !existingUser?.token) {
        setAuthType(AUTH_TYPE.PASSWORD);
      }
    }
  }, [existingUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const userRecord =
        authType === AUTH_TYPE.TOKEN
          ? { baseUrl: config.base_url, username, token: credential }
          : { baseUrl: config.base_url, username, password: credential };
      await userManager.save(userRecord);
    } catch (err) {
      setError(t("server_auth_form_save_error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-1">
        <label className="text-body-sm font-medium text-foreground">{t("server_auth_form_server_url_label")}</label>
        <p className="text-body-sm text-muted break-all">{config.base_url}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-body-sm font-medium text-foreground">{t("server_auth_form_auth_type_label")}</label>
        <TabsRoot value={authType} onValueChange={(v) => { setAuthType(v); setCredential(""); }}>
          <TabsList>
            <TabsTrigger value={AUTH_TYPE.TOKEN}>{t("server_auth_form_auth_type_token")}</TabsTrigger>
            <TabsTrigger value={AUTH_TYPE.PASSWORD}>{t("server_auth_form_auth_type_password")}</TabsTrigger>
          </TabsList>

          <TabsContent value={AUTH_TYPE.TOKEN}>
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="saf-username-token" className="text-body-sm font-medium text-foreground">
                  {t("server_auth_form_username_label")}
                </label>
                <input
                  id="saf-username-token"
                  className="w-full rounded-sm bg-surface-2 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-ui"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-label={t("server_auth_form_username_label")}
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="saf-token" className="text-body-sm font-medium text-foreground">
                  {t("server_auth_form_token_label")}
                </label>
                <input
                  id="saf-token"
                  className="w-full rounded-sm bg-surface-2 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-ui"
                  type="password"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  aria-label={t("server_auth_form_token_label")}
                  autoComplete="off"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value={AUTH_TYPE.PASSWORD}>
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="saf-username-pw" className="text-body-sm font-medium text-foreground">
                  {t("server_auth_form_username_label")}
                </label>
                <input
                  id="saf-username-pw"
                  className="w-full rounded-sm bg-surface-2 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-ui"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-label={t("server_auth_form_username_label")}
                  autoComplete="username"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="saf-password" className="text-body-sm font-medium text-foreground">
                  {t("server_auth_form_password_label")}
                </label>
                <input
                  id="saf-password"
                  className="w-full rounded-sm bg-surface-2 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-ui"
                  type="password"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  aria-label={t("server_auth_form_password_label")}
                  autoComplete="current-password"
                />
              </div>
            </div>
          </TabsContent>
        </TabsRoot>
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-priority-urgent">{error}</p>
      )}

      <Button variant="primary" type="submit" disabled={saving}>{t("server_auth_form_save_button")}</Button>
    </form>
  );
};

export default ServerAuthForm;
