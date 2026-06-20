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
        "transition-shadow",
        className
      )}
      {...props}
    />
  ));
