import { forwardRef } from "react";
import { cn } from "./utils";

export const Card = forwardRef(({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-card",
        "bg-surface",
        "border border-border",
        "shadow-elev-1",
        "md:hover:shadow-elev-2",
        "transition-all duration-200 ease-out",
        "md:hover:-translate-y-0.5",
        "motion-reduce:transition-none motion-reduce:transform-none",
        className
      )}
      {...props}
    />
  ));
