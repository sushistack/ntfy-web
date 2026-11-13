import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import subscriptionManager from "@/app/SubscriptionManager";
import { useActiveTopic } from "@/components/hooks";
import routes from "@/components/routes";
import { cn } from "@/components/ui/utils";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import SubscribeDialog from "./SubscribeDialog";

/* ── Inline SVG icons (avoids adding @radix-ui/react-icons dep) ── */
const BellOffIcon = ({ className }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M1.646 1.646a.5.5 0 0 1 .708 0L13.354 13.354a.5.5 0 0 1-.708.708l-1.293-1.293A3 3 0 0 1 6 13a.5.5 0 1 1 0-1 2 2 0 0 0 1.938-1.496L1.646 2.354a.5.5 0 0 1 0-.708ZM5 6.5V5.56A2.5 2.5 0 0 1 10 5.5v3.44l-5-4.94ZM8.5 12H6a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H8.5Z" />
  </svg>
);

const GearIcon = ({ className }) => (
  <svg
    className={cn("w-5 h-5", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg
    className={cn("w-5 h-5", className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

const HomeIcon = () => (
  <svg
    className="w-4.5 h-4.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2a6 6 0 0 0-6 6v3.6l-1.7 3.4A1 1 0 0 0 5.2 16.5h13.6a1 1 0 0 0 .9-1.5L18 11.6V8a6 6 0 0 0-6-6Zm-2.8 16a2.9 2.9 0 0 0 5.6 0z" />
  </svg>
);

/** Rounded icon square for primary destinations; filled blue when active. */
const IconTile = ({ active, children }) => (
  <span
    className={cn(
      "grid place-items-center w-8 h-8 shrink-0 rounded-sm transition-colors",
      active ? "bg-accent-ui text-accent-on-surface" : "bg-surface-2 text-muted group-hover/nav:bg-border"
    )}
    aria-hidden="true"
  >
    {children}
  </span>
);

// Stable per-topic colour so topics are recognisable at a glance (decorative; the name sits beside it).
const AVATAR_COLORS = ["#3182f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981", "#0ea5e9", "#ef4444", "#64748b"];
const colorFor = (name) => {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) % 997;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const TopicAvatar = ({ name, muted }) => {
  const color = colorFor(name);
  return (
    <span
      aria-hidden="true"
      className={cn("grid place-items-center w-8 h-8 shrink-0 rounded-full text-body-sm font-bold", muted && "opacity-50")}
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
    >
      {[...name][0]?.toUpperCase()}
    </span>
  );
};

const DotsHorizontalIcon = ({ className }) => (
  <svg className={cn("w-4 h-4", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M3.625 7.5a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Zm5 0a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Zm5 0a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Z" />
  </svg>
);

/* ── Sidebar content (shared between desktop sidebar and mobile drawer) ── */
/* Derive active topic from URL path — useParams() requires a Route match; useLocation() is always available */
const SYSTEM_PATHS = new Set(["/", "/all", "/settings", "/history", "/login", "/signup", "/account"]);
export const getTopicFromPath = (pathname) => {
  const seg = pathname.split("/")[1] || "";
  return seg && !SYSTEM_PATHS.has(`/${seg}`) ? seg : undefined;
};

export const SidebarContent = ({ collapsed = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeSub = useActiveTopic();
  const { pathname } = useLocation();
  const subscriptions = useLiveQuery(() => subscriptionManager.all()) ?? [];
  const visibleSubs = subscriptions.filter((s) => !s.internal);

  const [renameSub, setRenameSub] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [clearSub, setClearSub] = useState(null);
  const [subscribeOpen, setSubscribeOpen] = useState(false);

  const handleSidebarMuteToggle = async (sub) => {
    const next = sub.mutedUntil ? 0 : 1;
    try {
      await subscriptionManager.setMutedUntil(sub.id, next);
    } catch (e) {
      console.error("[Sidebar] mute toggle failed", e);
    }
  };

  const handleRename = async () => {
    if (!renameSub || !renameValue.trim()) return;
    try {
      await subscriptionManager.setDisplayName(renameSub.id, renameValue.trim());
      setRenameSub(null);
    } catch (e) {
      console.error("[Sidebar] rename failed", e);
    }
  };

  const handleClearConfirm = async () => {
    if (!clearSub) return;
    try {
      await subscriptionManager.deleteNotifications(clearSub.id);
      setClearSub(null);
    } catch (e) {
      console.error("[Sidebar] clear notifications failed", e);
    }
  };

  const handleUnsubscribe = async (sub) => {
    const wasActive = sub.topic === activeSub;
    await subscriptionManager.remove(sub);
    if (wasActive) {
      const all = await subscriptionManager.all();
      const next = all.find((s) => !s.internal && s.id !== sub.id);
      if (next) {
        navigate(routes.forSubscription(next));
      } else {
        navigate(routes.app);
      }
    }
  };

  const navRow = (active) =>
    cn(
      "group/nav flex items-center gap-3 w-full rounded-sm text-left text-body transition-colors",
      collapsed ? "justify-center p-1.5" : "px-2 py-1.5",
      active ? "bg-surface-2 font-semibold text-text" : "text-text hover:bg-surface-2",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    );
  const isBoard = !activeSub && pathname === "/";
  const isHistory = pathname === "/history";
  const isSettings = pathname === "/settings";

  return (
    <nav className={cn("flex flex-col h-full pb-3 overflow-y-auto", collapsed ? "px-1.5" : "px-3")} aria-label={t("sidebar_aria_label")}>
      {/* Primary destinations */}
      <div className="flex flex-col gap-0.5">
        <button type="button" onClick={() => navigate("/")} className={navRow(isBoard)} aria-current={isBoard ? "page" : undefined}>
          <IconTile active={isBoard}>
            <HomeIcon />
          </IconTile>
          {collapsed ? (
            <span className="sr-only">{t("sidebar_all_notifications")}</span>
          ) : (
            <span className="truncate">{t("sidebar_all_notifications")}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => navigate("/history")}
          className={navRow(isHistory)}
          aria-current={isHistory ? "page" : undefined}
          aria-label={collapsed ? t("sidebar_history") : undefined}
        >
          <IconTile active={isHistory}>
            <ClockIcon className="w-4.5 h-4.5" />
          </IconTile>
          {!collapsed && <span>{t("sidebar_history")}</span>}
        </button>
      </div>

      {/* Topics */}
      <div className={cn("mt-6 mb-1 flex items-center", collapsed ? "justify-center" : "justify-between pl-2")}>
        {!collapsed && <span className="text-caption font-semibold text-muted">{t("sidebar_topics_title")}</span>}
        <button
          type="button"
          onClick={() => setSubscribeOpen(true)}
          className={cn(
            "grid place-items-center w-8 h-8 rounded-full text-muted hover:bg-surface-2 hover:text-text transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          )}
          title={t("sidebar_add_topic")}
        >
          <PlusIcon className="w-4.5 h-4.5" />
          <span className="sr-only">{t("sidebar_add_topic")}</span>
        </button>
      </div>

      {visibleSubs.length === 0 && !collapsed && (
        <button
          type="button"
          onClick={() => setSubscribeOpen(true)}
          className="mx-1 mt-1 rounded-sm border border-dashed border-border px-3 py-3 text-left text-body-sm text-muted hover:bg-surface-2"
        >
          {t("sidebar_no_topics")}
        </button>
      )}

      <div className="flex flex-col gap-0.5">
        {visibleSubs.map((sub) => {
          const isActive = sub.topic === activeSub;
          const isMuted = (sub.mutedUntil ?? 0) > 0;
          const name = sub.displayName ?? sub.topic;
          return (
            <div
              key={sub.id}
              className={cn(
                "group relative flex items-center rounded-sm transition-colors",
                isActive ? "bg-surface-2" : "hover:bg-surface-2"
              )}
            >
              {/* Navigation area */}
              <button
                type="button"
                onClick={() => navigate(routes.forSubscription(sub))}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-1 items-center gap-3 min-w-0 text-left text-body",
                  collapsed ? "justify-center p-1.5" : "pl-2 py-1.5",
                  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                )}
              >
                <TopicAvatar name={name} muted={isMuted} />
                {collapsed ? (
                  <span className="sr-only">{name}</span>
                ) : (
                  <span className={cn("truncate text-text", isActive && "font-semibold", isMuted && "text-muted")}>{name}</span>
                )}
              </button>

              {!collapsed && (
                <div className="flex items-center gap-0.5 pr-1.5 pl-1">
                  {/* Muted indicator — passive icon (not a button); mute toggle lives in the ⋯ menu */}
                  {isMuted && (
                    <span
                      className="shrink-0 text-muted"
                      role="img"
                      aria-label={t("sidebar_topic_muted_indicator")}
                      title={t("sidebar_topic_muted_indicator")}
                    >
                      <BellOffIcon className="w-4 h-4" />
                    </span>
                  )}
                  {sub.new > 0 && (
                    <span className="min-w-4.5 h-4.5 px-1.5 grid place-items-center rounded-full bg-accent-ui text-caption font-bold text-accent-on-surface tabular-nums">
                      {sub.new <= 99 ? sub.new : "99+"}
                    </span>
                  )}
                  <Menu>
                    <MenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "grid place-items-center w-8 h-8 rounded-full text-muted transition-opacity",
                          // Quiet until the row is hovered/focused; always visible on touch (no hover there).
                          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100",
                          "hover:bg-border hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        )}
                        aria-label={t("sub_menu_trigger_label", { name })}
                      >
                        <DotsHorizontalIcon />
                      </button>
                    </MenuTrigger>
                    <MenuContent align="start" side="right">
                      <MenuItem onSelect={() => handleSidebarMuteToggle(sub)}>
                        {t(isMuted ? "sidebar_topic_unmute_label" : "sidebar_topic_mute_label")}
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem
                        onSelect={() => {
                          setRenameSub(sub);
                          setRenameValue(name);
                        }}
                      >
                        {t("sub_menu_rename")}
                      </MenuItem>
                      <MenuItem onSelect={() => setClearSub(sub)}>{t("sub_menu_clear")}</MenuItem>
                      <MenuSeparator />
                      <MenuItem onSelect={() => handleUnsubscribe(sub)}>{t("sub_menu_unsubscribe")}</MenuItem>
                    </MenuContent>
                  </Menu>
                </div>
              )}
              {collapsed && sub.new > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-accent-ui ring-2 ring-surface" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      {/* Rename dialog — outside map to avoid N instances */}
      <Dialog open={!!renameSub} onOpenChange={(open) => !open && setRenameSub(null)}>
        <DialogContent title={t("sub_rename_dialog_title")}>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            placeholder={t("sub_rename_dialog_placeholder")}
            maxLength={64}
            className={cn(
              "w-full px-3 py-2 mt-2 mb-4 text-body-sm",
              "bg-surface-2 border border-control-border rounded-sm text-text placeholder:text-muted",
              "focus:outline-none focus:ring-2 focus:ring-focus-ring"
            )}
          />
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">{t("common_cancel")}</Button>
            </DialogClose>
            <Button variant="primary" onClick={handleRename}>
              {t("common_save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear-all confirm dialog — outside map */}
      <Dialog open={!!clearSub} onOpenChange={(open) => !open && setClearSub(null)}>
        <DialogContent title={t("sub_menu_clear")}>
          <p className="text-body-sm text-muted mt-1 mb-4">{t("sub_clear_confirm_body")}</p>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="ghost">{t("common_cancel")}</Button>
            </DialogClose>
            <Button variant="primary" onClick={handleClearConfirm}>
              {t("sub_clear_confirm_action")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spacer */}
      <div className="flex-1 min-h-6" />

      {/* Settings */}
      <button
        type="button"
        onClick={() => navigate("/settings")}
        className={navRow(isSettings)}
        aria-current={isSettings ? "page" : undefined}
        aria-label={collapsed ? t("sidebar_settings") : undefined}
      >
        <IconTile active={isSettings}>
          <GearIcon className="w-4.5 h-4.5" />
        </IconTile>
        {!collapsed && <span>{t("sidebar_settings")}</span>}
      </button>

      <SubscribeDialog
        open={subscribeOpen}
        subscriptions={subscriptions}
        onCancel={() => setSubscribeOpen(false)}
        onSuccess={(subscription) => {
          setSubscribeOpen(false);
          navigate(routes.forSubscription(subscription));
        }}
      />
    </nav>
  );
};

/* ── App brand (sidebar header + mobile drawer header) ── */
export const SidebarBrand = ({ collapsed = false }) => {
  const { t } = useTranslation();
  return (
    <div className={cn("flex items-center gap-2.5 pt-5 pb-4", collapsed ? "justify-center px-1.5" : "px-5")}>
      <span className="grid place-items-center w-8 h-8 rounded-sm bg-accent-ui text-accent-on-surface" aria-hidden="true">
        <BellIcon />
      </span>
      {!collapsed && <span className="text-subtitle font-bold tracking-tight text-text">{t("brand_name")}</span>}
    </div>
  );
};

/* ── Desktop/tablet sidebar frame ── */
const Sidebar = ({ collapsed = false }) => (
  <aside className={cn("flex flex-col h-full bg-surface", collapsed ? "w-16" : "w-nav-drawer")}>
    <SidebarBrand collapsed={collapsed} />
    <SidebarContent collapsed={collapsed} />
  </aside>
);

export default Sidebar;
