import { SLOTS_PER_DAY } from "@/app/incidents";
import { cn } from "@/components/ui/utils";

// Fill colour by incident severity (priority 5 / 4 / everything else).
export const toneOf = (priority) => (priority >= 5 ? "bg-priority-max" : priority === 4 ? "bg-priority-high" : "bg-accent-ui");

const heights = { sm: "h-2", md: "h-3.5", lg: "h-8" };

/**
 * One day as 96 fifteen-minute ticks. `slots` = ticks that fired, `okSlot` = tick where it recovered,
 * `nowSlot` = current tick (outlined), ticks after it are drawn hollow when `nowSlot` is set.
 */
const TickStrip = ({ slots, okSlot = null, nowSlot = null, tone, size = "md", label, className }) => (
  <div
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={cn("grid grid-cols-[repeat(96,minmax(0,1fr))] gap-px", heights[size], className)}
  >
    {Array.from({ length: SLOTS_PER_DAY }, (_, i) => (
      <i
        key={i}
        className={cn(
          "rounded-[1px]",
          slots.has(i)
            ? tone
            : i === okSlot
            ? "bg-meter-ok"
            : nowSlot !== null && i > nowSlot
            ? "ring-1 ring-inset ring-meter-track"
            : "bg-meter-track",
          i === nowSlot && "ring-1 ring-text"
        )}
      />
    ))}
  </div>
);

export const TickAxis = ({ className }) => (
  <div aria-hidden="true" className={cn("flex justify-between text-caption text-muted mt-1", className)}>
    {["00", "06", "12", "18", "24"].map((h) => (
      <span key={h}>{h}</span>
    ))}
  </div>
);

export default TickStrip;
