import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import subscriptionManager from "@/app/SubscriptionManager";
import { cn } from "@/components/ui/utils";
import { getTopicFromPath } from "./Sidebar";

const HamburgerIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M1 3h13v1H1V3Zm0 4h13v1H1V7Zm0 4h13v1H1v-1Z" />
  </svg>
);

const AppBar = ({ onMenuOpen = () => {}, drawerOpen = false }) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const topic = getTopicFromPath(pathname);
  const subscriptions = useLiveQuery(() => subscriptionManager.all(), []) ?? [];
  const sub = topic ? subscriptions.find((s) => s.topic === topic) : null;
  let title = t("app_bar_title_all");
  if (pathname === "/history") title = t("sidebar_history");
  else if (pathname === "/settings") title = t("sidebar_settings");
  else if (topic) title = sub?.displayName || topic;

  return (
    <header className="flex items-center h-14 px-2 bg-bg md:hidden flex-shrink-0">
      <button
        type="button"
        onClick={onMenuOpen}
        aria-label={t(drawerOpen ? "app_bar_menu_close" : "app_bar_menu_open")}
        aria-expanded={drawerOpen}
        className={cn(
          "p-2 rounded-sm text-muted transition-all duration-150 ease-out",
          "hover:bg-surface-active hover:text-accent-text hover:scale-105 active:scale-95",
          "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        )}
      >
        <HamburgerIcon />
      </button>

      <h1 className="flex-1 px-2 text-body font-bold tracking-tight text-text truncate">{title}</h1>

      {/* Connection dot placeholder — Story 2.3 replaces this */}
      <div className="w-8 h-8" aria-hidden="true" />
    </header>
  );
};

export default AppBar;
