import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";
import { useTheme } from "@/components/contexts/ThemeContext";
import { THEME } from "@/app/Prefs";

const OPTIONS = [
  { value: THEME.SYSTEM, key: "theme_system" },
  { value: THEME.LIGHT, key: "theme_light" },
  { value: THEME.DARK, key: "theme_dark" },
];

export function ThemeToggle() {
  const { t } = useTranslation();
  const { choice, setChoice } = useTheme();

  return (
    <div role="radiogroup" aria-label={t("theme_toggle_label")} className="flex rounded-full border border-control-border">
      {OPTIONS.map(({ value, key }) => (
        <button
          key={value}
          type="button"
          role="radio"
          onClick={() => setChoice(value)}
          aria-checked={choice === value}
          className={cn(
            "px-3 py-1 text-caption rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
            choice === value ? "bg-accent-ui text-accent-on-surface" : "text-muted hover:text-text"
          )}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );
}
