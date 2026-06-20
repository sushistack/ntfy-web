import { Dialog, VisuallyHidden } from "radix-ui";
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
      className
    )}
    {...props}
  />
);

const DialogContent = ({ className, children, title, ...props }) => (
  <DialogPortal>
    <DialogOverlay />
    <Dialog.Content
      className={cn(
        "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
        "w-full max-w-lg bg-surface border border-border rounded-md shadow-elev-2",
        "z-overlay p-6 focus:outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      {title ? (
        <Dialog.Title className="text-subtitle font-semibold text-text mb-2">{title}</Dialog.Title>
      ) : (
        <VisuallyHidden.Root>
          <Dialog.Title>Dialog</Dialog.Title>
        </VisuallyHidden.Root>
      )}
      {children}
    </Dialog.Content>
  </DialogPortal>
);

export { DialogRoot as Dialog, DialogTrigger, DialogContent, DialogClose };
