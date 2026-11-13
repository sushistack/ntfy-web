import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";

const ComposeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
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
        "w-14 h-14 rounded-full bg-accent-ui text-accent-on-surface",
        "shadow-elev-2",
        "flex items-center justify-center",
        "transition-all duration-150 ease-out",
        "hover:brightness-110 active:scale-95",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      )}
    >
      <ComposeIcon />
    </button>
  );
};

export default PublishFab;
