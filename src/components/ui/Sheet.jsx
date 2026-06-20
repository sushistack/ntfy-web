import { Dialog } from "radix-ui";
import { cn, cva } from "./utils";

const sheetContent = cva(
  "fixed bg-surface border-border shadow-elev-2 z-overlay focus:outline-none",
  {
    variants: {
      side: {
        bottom: "inset-x-0 bottom-0 border-t rounded-t-md",
        right: "inset-y-0 right-0 h-full w-full max-w-sm border-l",
        left: "inset-y-0 left-0 h-full w-full max-w-sm border-r",
      },
    },
    defaultVariants: { side: "bottom" },
  }
);

const SheetRoot = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;

const SheetOverlay = ({ className, ...props }) => (
  <Dialog.Overlay
    className={cn("fixed inset-0 bg-overlay z-overlay", className)}
    {...props}
  />
);

const SheetContent = ({ side = "bottom", className, children, ...props }) => (
  <Dialog.Portal>
    <SheetOverlay />
    <Dialog.Content className={cn(sheetContent({ side }), className)} {...props}>
      {children}
    </Dialog.Content>
  </Dialog.Portal>
);

export { SheetRoot as Sheet, SheetTrigger, SheetContent, SheetClose };
