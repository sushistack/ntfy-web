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
        "bottom-6 right-4",
        "md:right-6",
        "w-14 h-14 rounded-sm bg-accent-ui text-accent-on-surface",
        "shadow-elev-2",
        "flex items-center justify-center",
        "transition-all duration-150 ease-out",
        "hover:-translate-y-1 hover:scale-105 hover:brightness-110 active:translate-y-0 active:scale-95 active:brightness-95",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      )}
    >
      <ComposeIcon />
    </button>
  );
};

export default PublishFab;
