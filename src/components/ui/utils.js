import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

export { cva } from "class-variance-authority";

// Tailwind v4 generates utilities from @theme custom properties, but
// tailwind-merge doesn't know our custom text-* tokens. Without this config,
// it treats text-body-sm (font-size) and text-button-fill-text (color) as
// conflicting and drops the earlier one. We separate the groups explicitly.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "title", "subtitle", "body", "body-sm", "caption", "mono", "heading", "heading-sm", "heading-lg", "label", "label-sm"] },
      ],
    },
  },
});

export const cn = (...inputs) => twMerge(clsx(inputs));
