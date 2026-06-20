import { DropdownMenu } from "radix-ui";
import { cn } from "./utils";

const Menu = DropdownMenu.Root;
const MenuTrigger = DropdownMenu.Trigger;

const MenuContent = ({ className, ...props }) => (
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      className={cn(
        "min-w-menu bg-surface border border-border rounded-sm shadow-elev-2",
        "py-1 z-overlay",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "motion-reduce:animate-none",
        className
      )}
      sideOffset={4}
      {...props}
    />
  </DropdownMenu.Portal>
);

const MenuItem = ({ className, ...props }) => (
  <DropdownMenu.Item
    className={cn(
      "px-3 py-2 text-body-sm text-text cursor-default",
      "hover:bg-surface-active focus:bg-surface-active outline-none",
      "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
      "data-[disabled]:pointer-events-none data-[disabled]:text-muted",
      className
    )}
    {...props}
  />
);

const MenuSeparator = ({ className, ...props }) => <DropdownMenu.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;

export { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator };
