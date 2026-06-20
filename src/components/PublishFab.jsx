import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";

const ComposeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const PublishFab = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("publish_fab_label")}
      className={cn(
        "fixed z-fab",
        "bottom-[calc(56px+1rem)] right-4",
        "md:bottom-6 md:right-6",
        "w-14 h-14 rounded-[10px] bg-accent text-[#0C1A12]",
        "shadow-elev-2",
        "flex items-center justify-center",
        "hover:brightness-110 active:brightness-90 transition-[filter]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
      )}
    >
      <ComposeIcon />
    </button>
  );
};

export default PublishFab;
