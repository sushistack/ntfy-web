import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/components/ui/utils";

const MESSAGES_VIEW = { view: "messages" };

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
        "px-4 py-1.5 rounded-full text-body-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        active ? "bg-text text-surface" : "text-muted hover:text-text" // inverted pill reads as selected in both themes
      )}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label={t("board_view_label")} className="mb-6">
      <div className="grid grid-cols-2 gap-0.5 rounded-full bg-border p-1 sm:inline-grid">
        {item(!messages, t("board_view_board"), () => setParams({}))}
        {item(messages, t("board_view_messages"), () => setParams(MESSAGES_VIEW))}
      </div>
    </div>
  );
};

export default ViewToggle;
