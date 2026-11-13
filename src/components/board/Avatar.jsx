import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";

const Glyph = ({ d, fill = false }) => (
  <svg
    className="w-1/2 h-1/2"
    viewBox="0 0 24 24"
    fill={fill ? "currentColor" : "none"}
    stroke={fill ? "none" : "currentColor"}
    strokeWidth={2.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const ALERT = <Glyph d="M12 5v9M12 19h.01" />;
const CHECK = <Glyph d="M5 12.5l4.5 4.5L19 7.5" />;
const MOON = <Glyph fill d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />;
const INFO = <Glyph d="M12 11v7M12 6.5h.01" />;

// Round status mark used by board rows: colour + glyph both carry the state (not colour alone).
const looks = {
  open5: ["bg-priority-max/14 text-priority-max", ALERT],
  open4: ["bg-priority-high/16 text-priority-high", ALERT],
  open3: ["bg-accent-ui/14 text-accent-text", ALERT],
  resolved: ["bg-meter-ok/14 text-meter-ok", CHECK],
  quiet: ["bg-surface-2 text-muted", MOON],
  info: ["bg-accent-ui/12 text-accent-text", INFO],
  clear: ["bg-meter-ok/14 text-meter-ok", CHECK],
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
        size === "lg" ? "w-14 h-14" : "w-10 h-10",
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
