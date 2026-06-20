import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";
import { Chip } from "@/components/ui/Chip";
import { unmatchedTags } from "@/app/utils";
import { TopicChip } from "./TopicChip";
import { CARD_TAG } from "./StructuredCard";

const SERVICE_PREFIX = "service:";
const MAX_GENERAL = 2;

// Fixed color for service tags.
const SERVICE_CLASS = "bg-[#2a3142] text-[#9db4d8] border-transparent font-medium";

// Palette for general tags — literal classes so Tailwind JIT keeps them; tag name hashes into it
// so the same tag always gets the same color.
const TAG_PALETTE = [
  "bg-[#332b52] text-[#c4b5fd]",
  "bg-[#143a34] text-[#7fe0cb]",
  "bg-[#3a2f14] text-[#f5c97a]",
  "bg-[#3a1f22] text-[#f5a3a5]",
  "bg-[#14303a] text-[#7fc8e0]",
  "bg-[#283a14] text-[#b7e07f]",
];

const paletteFor = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
};

// Tag row: topic + service tags (fixed color, leftmost), then general tags (hashed color,
// max 2 with a "+N more" expander).
export function CardTags({ tags, topicName }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const text = unmatchedTags(tags ?? []).filter((tg) => tg !== CARD_TAG);
  const services = text
    .filter((tg) => tg.startsWith(SERVICE_PREFIX))
    .map((tg) => tg.slice(SERVICE_PREFIX.length))
    .filter(Boolean);
  const general = text.filter((tg) => !tg.startsWith(SERVICE_PREFIX));

  if (!topicName && services.length === 0 && general.length === 0) return null;

  const shownGeneral = expanded ? general : general.slice(0, MAX_GENERAL);
  const extra = general.length - shownGeneral.length;

  return (
    <div className="flex flex-wrap items-center gap-1 min-w-0">
      {topicName && <TopicChip name={topicName} />}
      {services.map((s) => (
        <Chip key={`svc:${s}`} variant="tag" className={SERVICE_CLASS}>
          {s}
        </Chip>
      ))}
      {shownGeneral.map((g) => (
        <Chip key={`gen:${g}`} variant="tag" className={cn("border-transparent", paletteFor(g))}>
          {g}
        </Chip>
      ))}
      {extra > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(true);
          }}
          className="text-caption text-muted hover:text-accent-text px-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          +{extra} {t("card_tags_more")}
        </button>
      )}
    </div>
  );
}
