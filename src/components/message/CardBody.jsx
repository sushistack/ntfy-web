import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";
import { Meter } from "@/components/ui/Meter";
import MarkdownContent from "./MarkdownContent";

function detectShape(message) {
  if (!message || !message.trim()) return "paragraph";

  const lines = message
    .trim()
    .split("\n")
    .filter((l) => l.trim());

  if (lines.length < 2) return "paragraph";

  const kvPattern = /^[^:]+:\s*.*$/;
  const allKv = lines.every((l) => kvPattern.test(l.trim()));
  if (!allKv) return "paragraph";

  const hasNumeric = lines.some((l) => {
    const match = l.match(/^[^:]+:\s*(.*)/);
    const value = match?.[1]?.trim() ?? "";
    return /^\d+(\.\d+)?%$/.test(value) || /^\d+(\.\d+)?$/.test(value);
  });

  return hasNumeric ? "rich-kv" : "kv";
}

const parseKvLines = (message) =>
  message
    .trim()
    .split("\n")
    .filter((l) => l.trim())
    .map((line) => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (!match) return { key: line, value: "", numericValue: null, isError: false };
      const [, key, value] = match;
      const percentMatch = value.trim().match(/^(\d+(\.\d+)?)%$/);
      const numericMatch = value.trim().match(/^(\d+(\.\d+)?)$/);
      let numericValue = null;
      if (percentMatch) {
        numericValue = parseFloat(percentMatch[1]);
      } else if (numericMatch) {
        numericValue = parseFloat(numericMatch[1]);
      }
      const isError = /error|fail|err/i.test(key);
      return { key: key.trim(), value: value.trim(), numericValue, isError };
    });

const KV_ICONS = {
  cpu: "⚙",
  disk: "💾",
  memory: "🧠",
  mem: "🧠",
  ram: "🧠",
  load: "📈",
  uptime: "⏱",
  status: "●",
  error: "✕",
  warning: "⚠",
  temp: "🌡",
  temperature: "🌡",
  ping: "◎",
  speed: "▶",
  version: "#",
  exit: "⏎",
};

const KvIcon = ({ keyName }) => {
  const icon = KV_ICONS[keyName?.toLowerCase()] ?? "·";
  return (
    <span className="font-mono text-body-sm text-muted shrink-0 w-4 text-center" aria-hidden="true">
      {icon}
    </span>
  );
};

const ParagraphBody = ({ message }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-2">
      <div className={cn("text-body-sm text-muted", !expanded && "line-clamp-3")}>
        <MarkdownContent content={message} />
      </div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="text-body-sm text-accent-text mt-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        {expanded ? t("card_body_collapse") : t("card_body_expand")}
      </button>
    </div>
  );
};

const KvBody = ({ lines }) => (
  <dl className="text-body-sm space-y-1 py-2">
    {lines.map(({ key, value, isError }, index) => (
      <div key={`${key}:${value}:${index}`} className="flex items-baseline gap-2">
        <KvIcon keyName={key} />
        <dt className="text-muted font-medium shrink-0">{key}</dt>
        <dd className={cn("ml-auto", isError ? "text-priority-urgent" : "text-accent-text")}>{value}</dd>
      </div>
    ))}
  </dl>
);

const RichKvBody = ({ lines }) => (
  <dl className="text-body-sm space-y-2 py-2">
    {lines.map(({ key, value, numericValue }, index) => (
      <div key={`${key}:${value}:${index}`} className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <KvIcon keyName={key} />
          <dt className="text-muted font-medium shrink-0">{key}</dt>
          <dd className="ml-auto tabular-nums">{value}</dd>
        </div>
        {numericValue !== null && <Meter value={numericValue} label={value} />}
      </div>
    ))}
  </dl>
);

const CardBody = ({ notification }) => {
  try {
    const { message } = notification;
    const shape = detectShape(message);

    if (shape === "paragraph") return <ParagraphBody message={message ?? ""} />;

    const lines = parseKvLines(message);
    if (shape === "rich-kv") return <RichKvBody lines={lines} />;
    return <KvBody lines={lines} />;
  } catch {
    return <p className="text-body-sm text-muted whitespace-pre-wrap py-2">{notification?.message ?? ""}</p>;
  }
};

export default CardBody;
