import { cva, cn } from "./utils";

const button = cva(
  [
    "inline-flex items-center justify-center",
    "font-semibold select-none transition-colors",
    "rounded-sm",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-button-fill text-button-fill-text hover:bg-surface-2",
        ghost: "bg-transparent border border-border text-muted hover:bg-surface-2",
      },
      size: {
        sm: "h-8 px-3 text-caption",
        md: "h-10 px-4 text-body-sm",
        lg: "h-12 px-5 text-body",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export function Button({ variant, size, className, ...props }) {
  return (
    <button className={cn(button({ variant, size }), className)} {...props} />
  );
}
