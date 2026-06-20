import { cva, cn } from "./utils";

const chip = cva(
  [
    "inline-flex items-center justify-center",
    "text-caption font-normal select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
  ],
  {
    variants: {
      variant: {
        priority: [
          "rounded-badge",
          "uppercase font-extrabold",
          "px-2 py-0.5",
          // bg/text supplied by caller via className — e.g. className="bg-priority-max text-white"
        ],
        topic: ["rounded-full", "bg-topic-chip-bg text-topic-chip-text font-semibold", "px-3 py-1"],
        tag: ["rounded-full", "bg-transparent border border-control-border text-muted", "px-3 py-1"],
      },
    },
    defaultVariants: {
      variant: "tag",
    },
  }
);

export function Chip({ variant, as, className, ...props }) {
  const Tag = as === "button" ? "button" : "span";
  return <Tag className={cn(chip({ variant }), className)} {...props} />;
}
