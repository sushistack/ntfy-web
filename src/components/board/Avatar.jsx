import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";

// Round status mark used by board rows: colour + glyph both carry the state (not colour alone).
const looks = {
  open5: ["bg-[color-mix(in_srgb,var(--color-priority-max)_14%,transparent)] text-priority-max", "!"],
  open4: ["bg-[color-mix(in_srgb,var(--color-priority-high)_16%,transparent)] text-priority-high", "!"],
  open3: ["bg-[color-mix(in_srgb,var(--color-accent-ui)_14%,transparent)] text-accent-text", "!"],
  resolved: ["bg-[color-mix(in_srgb,var(--color-meter-ok)_14%,transparent)] text-meter-ok", "✓"],
  quiet: ["bg-surface-2 text-muted", "–"],
  info: ["bg-[color-mix(in_srgb,var(--color-accent-ui)_12%,transparent)] text-accent-text", "i"],
  clear: ["bg-[color-mix(in_srgb,var(--color-meter-ok)_14%,transparent)] text-meter-ok", "✓"],
};

export const lookFor = (incident) => {
  if (incident.state !== "open") return incident.state;
  if (incident.priority >= 5) return "open5";
  return incident.priority === 4 ? "open4" : "open3";
};

const StatusAvatar = ({ look, unread = false, size = "md" }) => {
  const { t } = useTranslation();
  const [colors, glyph] = looks[look];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex-shrink-0 grid place-items-center rounded-full font-bold",
        size === "lg" ? "w-14 h-14 text-[24px]" : "w-10 h-10 text-[17px]",
        colors
      )}
    >
      {glyph}
      {unread && (
        <span
          role="img"
          aria-label={t("notifications_new_indicator")}
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-ui ring-2 ring-surface"
        />
      )}
    </span>
  );
};

export default StatusAvatar;
