import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";

const BellIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M7.5 0a.5.5 0 0 1 .5.5v.549A4.5 4.5 0 0 1 12 5.5V9l1.354 1.354A.5.5 0 0 1 13 11H2a.5.5 0 0 1-.354-.854L3 9V5.5A4.5 4.5 0 0 1 7 1.049V.5a.5.5 0 0 1 .5-.5ZM6 12h3a1.5 1.5 0 0 1-3 0Z" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M1 1h6v6H1V1Zm7 0h6v6H8V1ZM1 8h6v6H1V8Zm7 0h6v6H8V8Z" />
  </svg>
);

const GearIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M7.5 5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM5 7.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z" />
    <path fillRule="evenodd" d="M6.2 1.2a.5.5 0 0 1 .455-.195l.024.004.838.14c.292.05.495.31.473.605l-.056.72a5.02 5.02 0 0 1 .914.527l.613-.373a.5.5 0 0 1 .627.1l.016.02.56.686a.5.5 0 0 1-.045.686l-.564.493c.089.305.14.626.14.955s-.051.65-.14.955l.564.493a.5.5 0 0 1 .045.686l-.016.02-.56.686a.5.5 0 0 1-.627.1l-.613-.373a5.02 5.02 0 0 1-.914.527l.056.72a.5.5 0 0 1-.473.605l-.838.14a.5.5 0 0 1-.479-.195l-.44-.58a5.06 5.06 0 0 1-1.055 0l-.44.58a.5.5 0 0 1-.479.195l-.838-.14a.5.5 0 0 1-.473-.605l.056-.72a5.02 5.02 0 0 1-.914-.527l-.613.373a.5.5 0 0 1-.627-.1l-.016-.02-.56-.686a.5.5 0 0 1 .045-.686l.564-.493A5.04 5.04 0 0 1 1 7.5c0-.329.051-.65.14-.955l-.564-.493a.5.5 0 0 1-.045-.686l.016-.02.56-.686a.5.5 0 0 1 .627-.1l.613.373a5.02 5.02 0 0 1 .914-.527l-.056-.72a.5.5 0 0 1 .473-.605l.838-.14a.5.5 0 0 1 .479.195l.44.58c.17-.016.34-.024.515-.024s.345.008.515.024l.44-.58Z" />
  </svg>
);

const NAV_ITEMS = [
  { key: "subscriptions", labelKey: "bottom_nav_subscriptions", Icon: BellIcon, path: "/" },
  { key: "all", labelKey: "bottom_nav_all", Icon: GridIcon, path: "/all" },
  { key: "settings", labelKey: "bottom_nav_settings", Icon: GearIcon, path: "/settings" },
];

const BottomNav = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      aria-label={t("bottom_nav_aria_label")}
      className="flex items-stretch bg-surface border-t border-border md:hidden flex-shrink-0"
    >
      {NAV_ITEMS.map(({ key, labelKey, Icon, path }) => {
        /* "subscriptions" is active on "/" and any topic page; others use exact match */
        const isActive =
          key === "subscriptions"
            ? pathname === "/" || (pathname.length > 1 && !pathname.startsWith("/all") && !pathname.startsWith("/settings"))
            : pathname === path;
        return (
          <button
            key={key}
            type="button"
            onClick={() => navigate(path)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-2 gap-1 text-caption transition-all duration-150 ease-out",
              "hover:bg-surface-active hover:text-accent-text active:scale-95",
              "motion-reduce:transition-none motion-reduce:active:scale-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              isActive ? "text-accent-text" : "text-muted"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon />
            <span>{t(labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
