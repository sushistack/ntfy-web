import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import subscriptionManager from "@/app/SubscriptionManager";
import { useActiveTopic } from "@/components/hooks";
import routes from "@/components/routes";
import { cn } from "@/components/ui/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

/* ── Inline SVG icons (avoids adding @radix-ui/react-icons dep) ── */
const BellIcon = ({ className }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M7.5 0a.5.5 0 0 1 .5.5v.549A4.5 4.5 0 0 1 12 5.5V9l1.354 1.354A.5.5 0 0 1 13 11H2a.5.5 0 0 1-.354-.854L3 9V5.5A4.5 4.5 0 0 1 7 1.049V.5a.5.5 0 0 1 .5-.5ZM6 12h3a1.5 1.5 0 0 1-3 0Z" />
  </svg>
);

const BellOffIcon = ({ className }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M1.646 1.646a.5.5 0 0 1 .708 0L13.354 13.354a.5.5 0 0 1-.708.708l-1.293-1.293A3 3 0 0 1 6 13a.5.5 0 1 1 0-1 2 2 0 0 0 1.938-1.496L1.646 2.354a.5.5 0 0 1 0-.708ZM5 6.5V5.56A2.5 2.5 0 0 1 10 5.5v3.44l-5-4.94ZM8.5 12H6a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H8.5Z" />
  </svg>
);

const GearIcon = ({ className }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M7.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM5 7.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" />
    <path
      fillRule="evenodd"
      d="M6.2 1.2a.5.5 0 0 1 .455-.195l.024.004.838.14c.292.05.495.31.473.605l-.056.72a5.02 5.02 0 0 1 .914.527l.613-.373a.5.5 0 0 1 .627.1l.016.02.56.686a.5.5 0 0 1-.045.686l-.564.493c.089.305.14.626.14.955s-.051.65-.14.955l.564.493a.5.5 0 0 1 .045.686l-.016.02-.56.686a.5.5 0 0 1-.627.1l-.613-.373a5.02 5.02 0 0 1-.914.527l.056.72a.5.5 0 0 1-.473.605l-.838.14a.5.5 0 0 1-.479-.195l-.44-.58a5.06 5.06 0 0 1-1.055 0l-.44.58a.5.5 0 0 1-.479.195l-.838-.14a.5.5 0 0 1-.473-.605l.056-.72a5.02 5.02 0 0 1-.914-.527l-.613.373a.5.5 0 0 1-.627-.1l-.016-.02-.56-.686a.5.5 0 0 1 .045-.686l.564-.493A5.04 5.04 0 0 1 1 7.5c0-.329.051-.65.14-.955l-.564-.493a.5.5 0 0 1-.045-.686l.016-.02.56-.686a.5.5 0 0 1 .627-.1l.613.373a5.02 5.02 0 0 1 .914-.527l-.056-.72a.5.5 0 0 1 .473-.605l.838-.14a.5.5 0 0 1 .479.195l.44.58c.17-.016.34-.024.515-.024s.345.008.515.024l.44-.58Z"
    />
  </svg>
);

const GridIcon = ({ className }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M1 1h6v6H1V1Zm7 0h6v6H8V1ZM1 8h6v6H1V8Zm7 0h6v6H8V8Z" />
  </svg>
);

const DotsHorizontalIcon = ({ className }) => (
  <svg className={cn("w-4 h-4", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M3.625 7.5a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Zm5 0a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Zm5 0a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Z" />
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
  const activeSub = useActiveTopic();
  const subscriptions = useLiveQuery(() => subscriptionManager.all()) ?? [];
  const visibleSubs = subscriptions.filter((s) => !s.internal);

  const [renameSub, setRenameSub] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [clearSub, setClearSub] = useState(null);

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

  return (
    <nav className="flex flex-col h-full py-2 overflow-y-auto" aria-label={t("sidebar_aria_label")}>
      {/* All notifications row */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-sm text-body-sm transition-colors w-full text-left",
          "hover:bg-surface",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          !activeSub && "bg-surface-2"
        )}
      >
        <span
          className={cn(
            "flex-shrink-0 w-1 h-4 rounded-full",
            !activeSub ? "bg-accent-ui [box-shadow:var(--glow-accent-dot)]" : "bg-transparent"
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
        const isActive = sub.topic === activeSub;
        const isMuted = (sub.mutedUntil ?? 0) > 0;
        const topicIcon = isMuted ? (
          <BellOffIcon className="flex-shrink-0 text-muted" />
        ) : (
          <BellIcon className={cn("flex-shrink-0", isActive ? "text-accent-text" : "text-muted")} />
        );
        return (
          <div
            key={sub.id}
            className={cn("group relative flex items-center rounded-sm transition-colors", "hover:bg-surface", isActive && "bg-surface-2")}
          >
            {/* Navigation area */}
            <button
              type="button"
              onClick={() => navigate(routes.forSubscription(sub))}
              className={cn(
                "flex flex-1 items-center gap-3 pl-3 py-2 min-w-0 text-left",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-1 h-4 rounded-full",
                  isActive ? "bg-accent-ui [box-shadow:var(--glow-accent-dot)]" : "bg-transparent"
                )}
                aria-hidden="true"
              />
              {collapsed ? (
                topicIcon
              ) : (
                <>
                  {topicIcon}
                  <span className="text-text text-body-sm truncate">{sub.displayName ?? sub.topic}</span>
                  {sub.new > 0 && (
                    <span className="ml-auto pr-1 text-caption font-medium text-accent-text">{sub.new <= 99 ? sub.new : "99+"}</span>
                  )}
                </>
              )}
            </button>

            {/* Mute toggle */}
            {!collapsed && (
              <button
                type="button"
                onClick={() => handleSidebarMuteToggle(sub)}
                aria-label={t(isMuted ? "sidebar_topic_unmute_label" : "sidebar_topic_mute_label")}
                aria-pressed={isMuted}
                className={cn(
                  "shrink-0 p-1 rounded-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                  isMuted ? "text-muted hover:text-text" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                )}
              >
                {isMuted ? <BellOffIcon /> : <BellIcon />}
              </button>
            )}

            {/* Context menu — only in expanded sidebar */}
            {!collapsed && (
              <Menu>
                <MenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex-shrink-0 p-2 mr-1 rounded-sm text-muted",
                      "hover:text-text hover:bg-surface-active",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    )}
                    aria-label={t("sub_menu_trigger_label", { name: sub.displayName ?? sub.topic })}
                  >
                    <DotsHorizontalIcon />
                  </button>
                </MenuTrigger>
                <MenuContent align="start" side="right">
                  <MenuItem
                    onSelect={() => {
                      setRenameSub(sub);
                      setRenameValue(sub.displayName ?? sub.topic);
                    }}
                  >
                    {t("sub_menu_rename")}
                  </MenuItem>
                  <MenuItem onSelect={() => setClearSub(sub)}>{t("sub_menu_clear")}</MenuItem>
                  <MenuSeparator />
                  <MenuItem onSelect={() => handleUnsubscribe(sub)}>{t("sub_menu_unsubscribe")}</MenuItem>
                </MenuContent>
              </Menu>
            )}
          </div>
        );
      })}

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

      {/* Add topic action */}
      {!collapsed && (
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 px-3 py-2 mt-1 rounded-sm text-body-sm font-medium text-accent-text transition-colors w-full text-left",
            "hover:bg-surface",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
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
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        )}
      >
        <GearIcon className="flex-shrink-0 text-muted" />
        {!collapsed && <span className="text-text">{t("sidebar_settings")}</span>}
      </button>
    </nav>
  );
};

/* ── Desktop/tablet sidebar frame ── */
const Sidebar = ({ collapsed = false }) => {
  const { t } = useTranslation();
  return (
    <aside className={cn("flex flex-col h-full bg-surface border-r border-border", collapsed ? "w-14" : "w-nav-drawer")}>
      {/* Logo / brand */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-border">
          <span className="text-body font-medium text-text">{t("app_name")}</span>
        </div>
      )}
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
};

export default Sidebar;
