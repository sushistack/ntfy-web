import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/components/ui/utils";

/** Board ↔ raw message feed switch for the current topic (or all topics). */
const ViewToggle = ({ messages }) => {
  const { t } = useTranslation();
  const [, setParams] = useSearchParams();
  const item = (active, label, onClick) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        active ? "bg-surface text-text shadow-elev-1" : "text-muted hover:text-text"
      )}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label={t("board_view_label")} className="flex justify-end mb-6">
      <div className="inline-flex gap-0.5 rounded-full bg-border p-1">
        {item(!messages, t("board_view_board"), () => setParams({}))}
        {item(messages, t("board_view_messages"), () => setParams({ view: "messages" }))}
      </div>
    </div>
  );
};

export default ViewToggle;
