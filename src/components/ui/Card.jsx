import { forwardRef } from "react";
import { cn } from "./utils";

export const Card = forwardRef(({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-card", // = --radius-md
        "bg-surface",
        "shadow-elev-1", // white sheet on the gray canvas; no outline, no hover lift
        "transition-transform duration-150 active:scale-[0.99]",
        "motion-reduce:transition-none motion-reduce:transform-none",
        className
      )}
      {...props}
    />
  ));
