import MarkdownContent from "./MarkdownContent";
import StructuredCard, { parseCardSpec, KvView } from "./StructuredCard";

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
    .map((line, lineIndex) => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (!match) return { id: `${line}:${lineIndex}`, key: line, value: "", numericValue: null, isError: false };
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
      return { id: `${key.trim()}:${value.trim()}:${lineIndex}`, key: key.trim(), value: value.trim(), numericValue, isError };
    });

// Adapt loose `key: value` lines to StructuredCard rows so the heuristic path
// renders identically to a tagged kv card (icon + value + inline meter).
const linesToRows = (lines) =>
  lines.map(({ key, value, numericValue, isError }) => ({
    key,
    value,
    meter: Number.isFinite(numericValue) ? numericValue : undefined,
    status: isError ? "error" : undefined,
  }));

const ParagraphBody = ({ message }) => (
  <div className="py-2 max-w-message leading-body text-body text-text">
    <MarkdownContent content={message} />
  </div>
);

const CardBody = ({ notification }) => {
  try {
    // Tag-flagged JSON body → real components (kv / list / chart). Untagged → text heuristic.
    const spec = parseCardSpec(notification);
    if (spec) return <StructuredCard spec={spec} />;

    const { message } = notification;
    if (detectShape(message) === "paragraph") return <ParagraphBody message={message ?? ""} />;

    return <KvView rows={linesToRows(parseKvLines(message))} />;
  } catch {
    return <p className="text-body-sm text-muted whitespace-pre-wrap py-2">{notification?.message ?? ""}</p>;
  }
};

export default CardBody;
