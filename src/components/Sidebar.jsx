import { useLiveQuery } from "dexie-react-hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import subscriptionManager from "@/app/SubscriptionManager";
import routes from "@/components/routes";
import { cn } from "@/components/ui/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

/* ── Inline SVG icons (avoids adding @radix-ui/react-icons dep) ── */
const BellIcon = ({ className }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M7.5 0a.5.5 0 0 1 .5.5v.549A4.5 4.5 0 0 1 12 5.5V9l1.354 1.354A.5.5 0 0 1 13 11H2a.5.5 0 0 1-.354-.854L3 9V5.5A4.5 4.5 0 0 1 7 1.049V.5a.5.5 0 0 1 .5-.5ZM6 12h3a1.5 1.5 0 0 1-3 0Z" />
  </svg>
);

const GearIcon = ({ className }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M7.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM5 7.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" />
    <path fillRule="evenodd" d="M6.2 1.2a.5.5 0 0 1 .455-.195l.024.004.838.14c.292.05.495.31.473.605l-.056.72a5.02 5.02 0 0 1 .914.527l.613-.373a.5.5 0 0 1 .627.1l.016.02.56.686a.5.5 0 0 1-.045.686l-.564.493c.089.305.14.626.14.955s-.051.65-.14.955l.564.493a.5.5 0 0 1 .045.686l-.016.02-.56.686a.5.5 0 0 1-.627.1l-.613-.373a5.02 5.02 0 0 1-.914.527l.056.72a.5.5 0 0 1-.473.605l-.838.14a.5.5 0 0 1-.479-.195l-.44-.58a5.06 5.06 0 0 1-1.055 0l-.44.58a.5.5 0 0 1-.479.195l-.838-.14a.5.5 0 0 1-.473-.605l.056-.72a5.02 5.02 0 0 1-.914-.527l-.613.373a.5.5 0 0 1-.627-.1l-.016-.02-.56-.686a.5.5 0 0 1 .045-.686l.564-.493A5.04 5.04 0 0 1 1 7.5c0-.329.051-.65.14-.955l-.564-.493a.5.5 0 0 1-.045-.686l.016-.02.56-.686a.5.5 0 0 1 .627-.1l.613.373a5.02 5.02 0 0 1 .914-.527l-.056-.72a.5.5 0 0 1 .473-.605l.838-.14a.5.5 0 0 1 .479.195l.44.58c.17-.016.34-.024.515-.024s.345.008.515.024l.44-.58Z" />
  </svg>
);

const GridIcon = ({ className }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M1 1h6v6H1V1Zm7 0h6v6H8V1ZM1 8h6v6H1V8Zm7 0h6v6H8V8Z" />
  </svg>
);

/* ── Sidebar content (shared between desktop sidebar and mobile drawer) ── */
/* Derive active topic from URL path — useParams() requires a Route match; useLocation() is always available */
const SYSTEM_PATHS = new Set(["/", "/all", "/settings", "/login", "/signup", "/account"]);
export const getTopicFromPath = (pathname) => {
  const seg = pathname.split("/")[1] || "";
  return seg && !SYSTEM_PATHS.has(`/${seg}`) ? seg : undefined;
};

export const SidebarContent = ({ collapsed = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const topic = getTopicFromPath(pathname);
  const subscriptions = useLiveQuery(() => subscriptionManager.all()) ?? [];
  const visibleSubs = subscriptions.filter((s) => !s.internal);

  return (
    <nav
      className="flex flex-col h-full py-2 overflow-y-auto"
      aria-label={t("sidebar_aria_label")}
    >
      {/* All notifications row */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-sm text-body-sm transition-colors w-full text-left",
          "hover:bg-surface",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
          !topic && "bg-surface-2"
        )}
      >
        {/* Active indicator dot */}
        <span
          className={cn(
            "flex-shrink-0 w-1 h-4 rounded-full",
            !topic
              ? "bg-accent-ui [box-shadow:var(--glow-accent-dot)]"
              : "bg-transparent"
          )}
          aria-hidden="true"
        />
        {collapsed ? (
          <GridIcon className="flex-shrink-0 text-muted" />
        ) : (
          <>
            <GridIcon className="flex-shrink-0 text-muted" />
            <span className="text-text truncate">{t("sidebar_all_notifications")}</span>
          </>
        )}
      </button>

      {/* Subscriptions list */}
      {visibleSubs.map((sub) => {
        const isActive = sub.topic === topic;
        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => navigate(routes.forSubscription(sub))}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-sm text-body-sm transition-colors w-full text-left",
              "hover:bg-surface",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
              isActive && "bg-surface-2"
            )}
          >
            <span
              className={cn(
                "flex-shrink-0 w-1 h-4 rounded-full",
                isActive
                  ? "bg-accent-ui [box-shadow:var(--glow-accent-dot)]"
                  : "bg-transparent"
              )}
              aria-hidden="true"
            />
            {collapsed ? (
              <BellIcon className={cn("flex-shrink-0", isActive ? "text-accent-text" : "text-muted")} />
            ) : (
              <>
                <BellIcon className={cn("flex-shrink-0", isActive ? "text-accent-text" : "text-muted")} />
                <span className="text-text truncate">{sub.topic}</span>
                {sub.new > 0 && (
                  <span className="ml-auto text-caption font-medium text-accent-text">
                    {sub.new <= 99 ? sub.new : "99+"}
                  </span>
                )}
              </>
            )}
          </button>
        );
      })}

      {/* Add topic action */}
      {!collapsed && (
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 px-3 py-2 mt-1 rounded-sm text-body-sm font-medium text-accent-text transition-colors w-full text-left",
            "hover:bg-surface",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          )}
        >
          {t("sidebar_add_topic")}
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme toggle */}
      {!collapsed && (
        <div className="px-3 py-2">
          <ThemeToggle />
        </div>
      )}

      {/* Settings */}
      <button
        type="button"
        onClick={() => navigate("/settings")}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-sm text-body-sm transition-colors w-full text-left",
          "hover:bg-surface",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
        )}
      >
        <GearIcon className="flex-shrink-0 text-muted" />
        {!collapsed && <span className="text-text">{t("sidebar_settings")}</span>}
      </button>
    </nav>
  );
};

/* ── Desktop/tablet sidebar frame ── */
const Sidebar = ({ collapsed = false }) => (
  <aside
    className={cn(
      "flex flex-col h-full bg-surface border-r border-border",
      collapsed ? "w-14" : "w-[280px]" /* layout-nudge: spec width */
    )}
  >
    {/* Logo / brand */}
    {!collapsed && (
      <div className="px-4 py-3 border-b border-border">
        <span className="text-body font-medium text-text">{t("app_name")}</span>
      </div>
    )}
    <SidebarContent collapsed={collapsed} />
  </aside>
);

export default Sidebar;
