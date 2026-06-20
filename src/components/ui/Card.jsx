import { forwardRef } from "react";
import { cn } from "./utils";

export const Card = forwardRef(function Card({ className, ...props }, ref) {
  return (
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
  );
});
