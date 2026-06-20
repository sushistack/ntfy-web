import { Tooltip } from "radix-ui";
import { cn } from "./utils";

const TooltipProvider = Tooltip.Provider;
const TooltipRoot = Tooltip.Root;
const TooltipTrigger = Tooltip.Trigger;

const TooltipContent = ({ className, sideOffset = 4, ...props }) => (
  <Tooltip.Portal>
    <Tooltip.Content
      sideOffset={sideOffset}
      className={cn(
        "bg-surface border border-border rounded-sm shadow-elev-1",
        "px-2 py-1 text-caption text-muted z-popover",
        "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0",
        "motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  </Tooltip.Portal>
);

export { TooltipProvider, TooltipRoot as Tooltip, TooltipTrigger, TooltipContent };
