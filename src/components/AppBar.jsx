import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
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
  const title = topic ?? t("app_bar_title_all");

  return (
    <header className="flex items-center h-14 px-2 bg-surface border-b border-border md:hidden flex-shrink-0">
      <button
        type="button"
        onClick={onMenuOpen}
        aria-label={t(drawerOpen ? "app_bar_menu_close" : "app_bar_menu_open")}
        aria-expanded={drawerOpen}
        className={cn(
          "p-2 rounded-sm text-muted transition-colors",
          "hover:bg-surface-2",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        )}
      >
        <HamburgerIcon />
      </button>

      <h1 className="flex-1 px-2 text-body font-medium text-text truncate">{title}</h1>

      {/* Connection dot placeholder — Story 2.3 replaces this */}
      <div className="w-8 h-8" aria-hidden="true" />
    </header>
  );
};

export default AppBar;
