import { cva, cn } from "./utils";

const button = cva(
  [
    "inline-flex items-center justify-center",
    "font-semibold select-none transition-all duration-150 ease-out",
    "rounded-sm", // = --radius-sm (14px)
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
    "active:scale-97", // press feedback only; no hover lift
    "motion-reduce:transition-none motion-reduce:active:scale-100",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-button-fill text-button-fill-text hover:brightness-95",
        ghost: "bg-surface-2 text-text hover:brightness-95", // secondary: soft gray fill, no outline
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

export function Button({ variant, size, className, type = "button", ...props }) {
  // eslint-disable-next-line react/button-has-type -- wrapper preserves the caller's valid native button type.
  return <button type={type} className={cn(button({ variant, size }), className)} {...props} />;
}
