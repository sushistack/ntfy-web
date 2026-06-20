import { cn } from "./utils";

export function Card({ className, ...props }) {
  return (
    <div
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
}
