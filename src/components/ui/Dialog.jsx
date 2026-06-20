import { Dialog, VisuallyHidden } from "radix-ui";
import { useTranslation } from "react-i18next";
import { cn } from "./utils";

const DialogRoot = Dialog.Root;
const DialogTrigger = Dialog.Trigger;
const DialogPortal = Dialog.Portal;
const DialogClose = Dialog.Close;

const DialogOverlay = ({ className, ...props }) => (
  <Dialog.Overlay
    className={cn(
      "fixed inset-0 bg-overlay z-overlay",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "motion-reduce:animate-none",
      className
    )}
    {...props}
  />
);

const DialogContent = ({ className, children, title, ...props }) => {
  const { t } = useTranslation();
  return (
    <DialogPortal>
      <DialogOverlay />
      <Dialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-full max-w-lg bg-surface border border-border rounded-md shadow-elev-2",
          "z-overlay p-6 focus:outline-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "motion-reduce:animate-none",
          className
        )}
        {...props}
      >
        {title ? (
          <Dialog.Title className="text-subtitle font-semibold text-text mb-2">{title}</Dialog.Title>
        ) : (
          <VisuallyHidden.Root>
            <Dialog.Title>{t("ui_dialog_title")}</Dialog.Title>
          </VisuallyHidden.Root>
        )}
        {children}
      </Dialog.Content>
    </DialogPortal>
  );
};

export { DialogRoot as Dialog, DialogTrigger, DialogContent, DialogClose };
