import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";
import { useTheme } from "./contexts/ThemeContext";
import { useNotificationPermissionListener } from "./hooks";
import ServerAuthForm from "./ServerAuthForm";
import notifier from "../app/Notifier";
import prefs from "../app/Prefs";
import { playSound, sounds } from "../app/utils";

const SECTIONS = ["general", "server", "appearance", "notifications", "retention"];

const LANGUAGES = [
  { value: "en", labelKey: "language_en" },
  { value: "ko", labelKey: "language_ko" },
];

const SectionHeading = ({ title, hint }) => (
  <div className="mb-7">
    <h2 className="text-subtitle font-semibold text-text">{title}</h2>
    {hint && <p className="text-body-sm text-muted mt-0.5">{hint}</p>}
    <div className="mt-3 border-t border-border" />
  </div>
);

const SettingRow = ({ label, hint, children, forId }) => (
  <div className={cn("flex justify-between gap-4 py-3 border-b border-border last:border-0", hint ? "items-start" : "items-center")}>
    <div>
      {forId ? (
        <label htmlFor={forId} className="text-body-sm text-text cursor-pointer">
          {label}
        </label>
      ) : (
        <span className="text-body-sm text-text">{label}</span>
      )}
      {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const SelectControl = ({ value, onChange, children, id }) => (
  <select
    id={id}
    className="rounded-sm bg-surface-2 border border-control-border px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-focus-ring appearance-none min-w-36"
    value={value}
    onChange={onChange}
  >
    {children}
  </select>
);

const DELETE_AFTER_OPTIONS = [
  { value: 0, labelKey: "prefs_notifications_delete_after_never" },
  { value: 10800, labelKey: "prefs_notifications_delete_after_three_hours" },
  { value: 86400, labelKey: "prefs_notifications_delete_after_one_day" },
  { value: 604800, labelKey: "prefs_notifications_delete_after_one_week" },
  { value: 2592000, labelKey: "prefs_notifications_delete_after_one_month" },
];

const MIN_PRIORITY_OPTIONS = [
  { value: 1, labelKey: "prefs_notifications_min_priority_any" },
  { value: 2, labelKey: "prefs_notifications_min_priority_low_and_higher" },
  { value: 3, labelKey: "prefs_notifications_min_priority_default_and_higher" },
  { value: 4, labelKey: "prefs_notifications_min_priority_high_and_higher" },
  { value: 5, labelKey: "prefs_notifications_min_priority_max_only" },
];

function NavIcon({ section }) {
  if (section === "general") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    );
  }
  if (section === "server") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="4" rx="1" />
        <rect x="2" y="10" width="20" height="4" rx="1" />
        <rect x="2" y="17" width="20" height="4" rx="1" />
        <circle cx="18" cy="5" r="0.75" fill="currentColor" />
        <circle cx="18" cy="12" r="0.75" fill="currentColor" />
        <circle cx="18" cy="19" r="0.75" fill="currentColor" />
      </svg>
    );
  }
  if (section === "appearance") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" />
      </svg>
    );
  }
  if (section === "notifications") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  }
  if (section === "retention") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6m4-6v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    );
  }
  return null;
}

function GeneralSection({ t }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage ?? "en";
  return (
    <div>
      <SectionHeading title={t("settings_nav_general")} hint={t("settings_general_hint")} />
      <SettingRow label={t("settings_language_label")} forId="settings-language">
        <SelectControl id="settings-language" value={currentLang} onChange={(e) => i18n.changeLanguage(e.target.value)}>
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {t(lang.labelKey)}
            </option>
          ))}
        </SelectControl>
      </SettingRow>
    </div>
  );
}

function ServerSection({ t }) {
  return (
    <div>
      <SectionHeading title={t("settings_nav_server_auth")} hint={t("settings_server_hint")} />
      <ServerAuthForm />
    </div>
  );
}

function AppearanceSection({ t }) {
  const { choice, setChoice } = useTheme();
  return (
    <div>
      <SectionHeading title={t("settings_nav_appearance")} hint={t("settings_appearance_hint")} />
      <TabsRoot value={choice} onValueChange={setChoice}>
        <TabsList>
          <TabsTrigger value="light">{t("theme_light")}</TabsTrigger>
          <TabsTrigger value="dark">{t("theme_dark")}</TabsTrigger>
          <TabsTrigger value="system">{t("theme_system")}</TabsTrigger>
        </TabsList>
        <TabsContent value="light" />
        <TabsContent value="dark" />
        <TabsContent value="system" />
      </TabsRoot>
    </div>
  );
}

export function NotificationPermissionRow({ t }) {
  useNotificationPermissionListener(() => notifier.granted());

  if (notifier.iosSupportedButInstallRequired()) {
    return (
      <SettingRow label={t("prefs_notifications_permission_title")}>
        <span className="text-body-sm text-muted">{t("prefs_notifications_permission_ios_install_required")}</span>
      </SettingRow>
    );
  }
  if (!notifier.browserSupported()) {
    return (
      <SettingRow label={t("prefs_notifications_permission_title")}>
        <span className="text-body-sm text-muted">{t("prefs_notifications_permission_not_supported")}</span>
      </SettingRow>
    );
  }
  if (!notifier.contextSupported()) {
    return (
      <SettingRow label={t("prefs_notifications_permission_title")}>
        <span className="text-body-sm text-muted">{t("prefs_notifications_permission_context_not_supported")}</span>
      </SettingRow>
    );
  }
  if (notifier.notRequested()) {
    return (
      <SettingRow label={t("prefs_notifications_permission_title")} hint={t("prefs_notifications_permission_not_requested_description")}>
        <Button variant="primary" size="sm" onClick={() => notifier.maybeRequestPermission()}>
          {t("prefs_notifications_permission_grant_button")}
        </Button>
      </SettingRow>
    );
  }
  if (notifier.granted()) {
    return (
      <SettingRow label={t("prefs_notifications_permission_title")}>
        <span className="text-body-sm text-accent-text">{t("prefs_notifications_permission_granted")}</span>
      </SettingRow>
    );
  }
  return (
    <SettingRow label={t("prefs_notifications_permission_title")}>
      <span className="text-body-sm text-muted">{t("prefs_notifications_permission_denied")}</span>
    </SettingRow>
  );
}

function NotificationsSection({ t }) {
  const sound = useLiveQuery(() => prefs.sound()) ?? "ding";
  const minPriority = useLiveQuery(() => prefs.minPriority()) ?? 1;
  const webPushEnabled = useLiveQuery(() => prefs.webPushEnabled()) ?? false;

  const soundOptions = [
    { value: "none", label: t("prefs_notifications_sound_no_sound") },
    ...Object.entries(sounds).map(([key, { label }]) => ({ value: key, label })),
  ];

  return (
    <div>
      <SectionHeading title={t("settings_nav_notifications")} hint={t("settings_notifications_hint")} />
      <SettingRow label={t("settings_sound_label")} forId="settings-sound">
        <div className="flex items-center gap-2">
          <SelectControl id="settings-sound" value={sound} onChange={(e) => prefs.setSound(e.target.value)}>
            {soundOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </SelectControl>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => playSound(sound)}
            disabled={sound === "none"}
            aria-label={t("prefs_notifications_sound_play")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </Button>
        </div>
      </SettingRow>
      <SettingRow label={t("settings_min_priority_label")} forId="settings-min-priority">
        <SelectControl id="settings-min-priority" value={minPriority} onChange={(e) => prefs.setMinPriority(Number(e.target.value))}>
          {MIN_PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </SelectControl>
      </SettingRow>
      <SettingRow label={t("settings_web_push_label")}>
        <Switch checked={!!webPushEnabled} onCheckedChange={(v) => prefs.setWebPushEnabled(v)} aria-label={t("settings_web_push_label")} />
      </SettingRow>
    </div>
  );
}

function RetentionSection({ t }) {
  const deleteAfter = useLiveQuery(() => prefs.deleteAfter()) ?? 604800;

  return (
    <div>
      <SectionHeading title={t("settings_nav_retention")} hint={t("settings_retention_hint")} />
      <SettingRow label={t("settings_delete_after_label")} forId="settings-delete-after">
        <SelectControl id="settings-delete-after" value={deleteAfter} onChange={(e) => prefs.setDeleteAfter(Number(e.target.value))}>
          {DELETE_AFTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </SelectControl>
      </SettingRow>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("general");

  const navItems = SECTIONS.map((id) => ({
    id,
    labelKey: `settings_nav_${id === "server" ? "server_auth" : id}`,
  }));

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSection t={t} />;
      case "server":
        return <ServerSection t={t} />;
      case "appearance":
        return <AppearanceSection t={t} />;
      case "notifications":
        return <NotificationsSection t={t} />;
      case "retention":
        return <RetentionSection t={t} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      <div className="settings-shell-panel app-panel-enter grid bg-surface border border-border rounded-none overflow-hidden">
        {/* Left nav */}
        <nav aria-label={t("nav_button_settings")} className="border-r border-border p-2 flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={t(item.labelKey)}
            onClick={() => setActiveSection(item.id)}
            aria-current={activeSection === item.id ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-sm text-body-sm transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              "hover:translate-x-0.5 hover:bg-surface-active hover:text-accent-text active:translate-x-0",
              "motion-reduce:transition-none motion-reduce:hover:translate-x-0",
              activeSection === item.id ? "bg-surface-2 text-text font-medium shadow-elev-1" : "text-muted"
            )}
          >
            <NavIcon section={item.id} />
            <span aria-hidden="true">
              {t(item.labelKey)}
            </span>
          </button>
        ))}
        </nav>

        {/* Content pane */}
        <div key={activeSection} className="min-w-0 overflow-y-auto px-8 py-8 app-content-enter">{renderContent()}</div>
      </div>
    </div>
  );
}
