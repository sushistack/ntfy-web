import { Popover } from "radix-ui";
import { cn } from "./utils";

const PopoverRoot = Popover.Root;
const PopoverTrigger = Popover.Trigger;

const PopoverContent = ({ className, align = "start", sideOffset = 4, ...props }) => (
  <Popover.Portal>
    <Popover.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "bg-surface border border-border rounded-sm shadow-elev-2 p-4 z-popover",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  </Popover.Portal>
);

export { PopoverRoot as Popover, PopoverTrigger, PopoverContent };
