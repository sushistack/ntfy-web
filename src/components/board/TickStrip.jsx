import { SLOTS_PER_DAY } from "@/app/incidents";
import { cn } from "@/components/ui/utils";

// Fill colour by incident severity (priority 5 / 4 / everything else).
export const toneOf = (priority) => {
  if (priority >= 5) return "bg-priority-max";
  if (priority === 4) return "bg-priority-high";
  return "bg-accent-ui";
};

const sizes = { sm: "h-1.5 gap-px", md: "h-3 gap-[2px]", lg: "h-10 gap-[2px]" };

const tickClass = (i, { slots, okSlot, nowSlot, tone }) => {
  if (slots.has(i)) return tone;
  if (i === okSlot) return "bg-meter-ok";
  if (nowSlot !== null && i > nowSlot) return "bg-meter-track opacity-40"; // not happened yet
  return "bg-meter-track";
};

/**
 * One day as 96 fifteen-minute ticks. `slots` = ticks that fired, `okSlot` = tick where it recovered,
 * `nowSlot` = current tick (outlined); later ticks are faded when `nowSlot` is set.
 */
const TickStrip = ({ slots, okSlot = null, nowSlot = null, tone, size = "md", label, className }) => (
  <div
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    className={cn("grid grid-cols-[repeat(96,minmax(0,1fr))]", sizes[size], className)}
  >
    {Array.from({ length: SLOTS_PER_DAY }, (_, i) => (
      <i
        key={i}
        className={cn("rounded-full", tickClass(i, { slots, okSlot, nowSlot, tone }), i === nowSlot && "ring-[1.5px] ring-text")}
      />
    ))}
  </div>
);

export const TickAxis = ({ className }) => (
  <div aria-hidden="true" className={cn("flex justify-between text-[12px] text-muted mt-2 tabular-nums", className)}>
    {["00", "06", "12", "18", "24"].map((h) => (
      <span key={h}>{h}</span>
    ))}
  </div>
);

export default TickStrip;
