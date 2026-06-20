import { Meter } from "@/components/ui/Meter";
import { cn } from "@/components/ui/utils";
import MarkdownContent from "./MarkdownContent";

// Structured cards: the sender flags the message with the `card` tag (X-Tags) and sends a
// JSON body — { type: "kv" | "list" | "chart" | "sections", ... }. ntfy treats the body as
// plain text; we parse it client-side and render real components. Anything that doesn't match
// falls back to normal markdown/text rendering.
export const CARD_TAG = "card";

const KNOWN_TYPES = new Set(["kv", "list", "chart", "sections"]);

// Leading mono icons for common monitoring keys (Beszel look). Falls back to the first word, then "·".
const KV_ICONS = {
  cpu: "⚙", disk: "💾", memory: "🧠", mem: "🧠", ram: "🧠", load: "📈",
  uptime: "⏱", status: "●", error: "✕", warning: "⚠", temp: "🌡", temperature: "🌡",
  ping: "◎", speed: "▶", version: "#", exit: "⏎", net: "⇅", network: "⇅",
  services: "❏", service: "❏", agent: "▶", host: "🖥", name: "●",
};

export const KvIcon = ({ keyName }) => {
  const k = (keyName ?? "").toLowerCase();
  const icon = KV_ICONS[k] ?? KV_ICONS[k.split(/\s+/)[0]] ?? "·";
  return (
    <span className="font-mono text-body-sm text-muted shrink-0 w-4 text-center" aria-hidden="true">
      {icon}
    </span>
  );
};

export function parseCardSpec(notification) {
  const tags = notification?.tags ?? [];
  if (!Array.isArray(tags) || !tags.includes(CARD_TAG)) return null;
  try {
    const spec = JSON.parse(notification.message ?? "");
    if (spec && typeof spec === "object" && KNOWN_TYPES.has(spec.type)) return spec;
  } catch {
    /* tagged but not JSON — let the caller fall back to markdown */
  }
  return null;
}

// error → coral value; ok/warn carry a status dot (when there's no meter to color instead)
const STATUS_VALUE_COLOR = { error: "text-priority-urgent" };
const STATUS_DOT = { ok: "bg-accent-ui", warn: "bg-priority-high", error: "bg-priority-max" };

const KvRow = ({ row }) => {
  const hasMeter = Number.isFinite(Number(row?.meter));
  const status = row?.status;
  return (
    <div className="flex items-center gap-2.5 text-body-sm">
      <KvIcon keyName={row?.icon ?? row?.key} />
      <dt className="text-muted shrink-0 w-20 truncate">{row?.key}</dt>
      <dd
        className={cn(
          "flex items-center gap-1.5 shrink-0 min-w-[3.5rem] tabular-nums",
          STATUS_VALUE_COLOR[status] ?? "text-text"
        )}
      >
        {status && !hasMeter && <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_DOT[status] ?? "bg-muted")} />}
        {row?.value}
      </dd>
      {hasMeter && <Meter value={Number(row.meter)} className="flex-1 min-w-0" />}
    </div>
  );
};

// columns: 2 → two columns on sm+ (always 1 column on narrow/mobile). Default 1.
export const KvView = ({ rows, columns }) => {
  const safe = Array.isArray(rows) ? rows : [];
  const twoCol = Number(columns) === 2;
  return (
    <dl className={cn("py-2", twoCol ? "grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5" : "space-y-1.5")}>
      {safe.map((r, i) => (
        <KvRow key={`${r?.key}:${i}`} row={r} />
      ))}
    </dl>
  );
};

const ListView = ({ items, ordered }) => {
  const safe = Array.isArray(items) ? items : [];
  const ListTag = ordered ? "ol" : "ul";
  return (
    <div className="py-2">
      <ListTag className={cn("text-body-sm text-muted space-y-0.5 list-inside", ordered ? "list-decimal" : "list-disc")}>
        {safe.map((it, i) => (
          <li key={i}>{String(it)}</li>
        ))}
      </ListTag>
    </div>
  );
};

// Dep-free chart. preserveAspectRatio="none" stretches the viewBox to the fixed-height box;
// non-scaling-stroke keeps the line crisp under that stretch.
const ChartView = ({ kind, data, unit }) => {
  const points = (Array.isArray(data) ? data : [])
    .map((d) => ({ label: d?.label ?? "", value: Number(d?.value) }))
    .filter((d) => Number.isFinite(d.value))
    .slice(0, 60);
  if (points.length === 0) return null;

  const W = 300;
  const H = 120;
  const pad = 4;
  const max = Math.max(...points.map((p) => p.value), 0);
  const min = Math.min(...points.map((p) => p.value), 0);
  const span = max - min || 1;
  const chartH = H - pad * 2;
  const yOf = (v) => pad + chartH - ((v - min) / span) * chartH;
  const xOf = (i) => pad + (i / Math.max(points.length - 1, 1)) * (W - pad * 2);
  const isLine = kind === "line";

  return (
    <div className="py-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ height: H }}
        className="w-full text-accent-text"
        role="img"
        aria-label="chart"
      >
        {isLine ? (
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            points={points.map((p, i) => `${xOf(i)},${yOf(p.value)}`).join(" ")}
          />
        ) : (
          points.map((p, i) => {
            const bw = (W - pad * 2) / points.length;
            const top = yOf(p.value);
            return (
              <rect
                key={i}
                x={pad + i * bw + bw * 0.15}
                y={top}
                width={bw * 0.7}
                height={Math.max(H - pad - top, 0)}
                fill="currentColor"
                rx="1"
              />
            );
          })
        )}
      </svg>
      {points.length <= 12 && (
        <div className="flex justify-between text-caption text-muted mt-1">
          {points.map((p, i) => (
            <span key={i} className="tabular-nums">
              {p.label || `${p.value}${unit ?? ""}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const MarkdownBlock = ({ text }) => (
  <div className="py-1 max-w-message leading-body text-body text-text">
    <MarkdownContent content={text ?? ""} />
  </div>
);

// One block — used standalone (top-level kv/list/chart) and inside `sections`.
const Block = ({ block }) => {
  switch (block?.type) {
    case "markdown":
      return <MarkdownBlock text={block.text} />;
    case "kv":
      return <KvView rows={block.rows} columns={block.columns} />;
    case "list":
      return <ListView items={block.items} ordered={block.ordered} />;
    case "chart":
      return <ChartView kind={block.kind} data={block.data} unit={block.unit} />;
    default:
      return null; // unknown / nested "sections" → ignored
  }
};

const StructuredCard = ({ spec }) => {
  if (spec?.type === "sections") {
    const blocks = Array.isArray(spec.blocks) ? spec.blocks : [];
    return (
      <div className="space-y-3 py-1">
        {blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>
    );
  }
  return <Block block={spec} />;
};

export default StructuredCard;
