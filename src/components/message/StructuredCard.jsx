import { Meter } from "@/components/ui/Meter";
import { cn } from "@/components/ui/utils";
import MarkdownContent from "./MarkdownContent";

// Structured cards: the sender flags the message with the `card` tag (X-Tags) and sends a
// JSON body — { type: "kv" | "list" | "chart" | "sections", ... }. ntfy treats the body as
// plain text; we parse it client-side and render real components. Anything that doesn't match
// falls back to normal markdown/text rendering.
export const CARD_TAG = "card";

const KNOWN_TYPES = new Set(["kv", "list", "chart", "sections"]);

// Leading line icons for common monitoring keys. Looked up by `icon ?? key` (lowercased), exact match
// first, then the first word; unknown keys get a neutral dot. Same names as before (senders unchanged).
const P = {
  cpu: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM9 9h6v6H9z",
  disk: "M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  memory: "M6 7h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM8 7v10M12 7v10M16 7v10",
  load: "M4 19h16M6 15l4-4 3 3 5-6",
  uptime: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  status: "M22 12h-4l-3 8L9 4l-3 8H2",
  error: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15 9l-6 6M9 9l6 6",
  warning: "M10.3 4 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01",
  temp: "M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z",
  ping: "M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
  speed: "M12 14l4-4M3.5 17a9 9 0 1 1 17 0",
  version: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7.5 7.5h.01",
  exit: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5Z",
  net: "M7 17V4M3 8l4-4 4 4M17 7v13M21 16l-4 4-4-4",
  service: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3H4V6ZM4 13h16v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5ZM8 6.5h.01M8 16.5h.01",
  agent: "M12 8V4H8M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2ZM9 13v1M15 13v1",
  host: "M4 5h16v11H4zM8 20h8M12 16v4",
  name: "M4 7h16M4 12h10M4 17h7",
  path: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
};
const KV_ICONS = {
  ...P,
  mem: P.memory,
  ram: P.memory,
  temperature: P.temp,
  network: P.net,
  services: P.service,
  fix: P.exit,
  newest: P.uptime,
  age: P.uptime,
  monitor: P.status,
  url: P.ping,
  target: P.ping,
};

export const KvIcon = ({ keyName }) => {
  const k = (keyName ?? "").toLowerCase();
  const d = KV_ICONS[k] ?? KV_ICONS[k.split(/\s+/)[0]];
  return (
    <span className="grid place-items-center w-8 h-8 shrink-0 rounded-sm bg-surface-2 text-muted" aria-hidden="true">
      {d ? (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={d} />
        </svg>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-muted" />
      )}
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

// A value that looks like a path / URL / id (no spaces, has / or :) reads better as code.
const looksLikePath = (v) => typeof v === "string" && !/\s/.test(v) && /[/:]/.test(v) && v.length > 12;

const KvRow = ({ row }) => {
  const hasMeter = Number.isFinite(Number(row?.meter));
  const status = row?.status;
  const value = row?.value;
  return (
    <div className="flex items-start gap-3 py-3 text-body-sm">
      <KvIcon keyName={row?.icon ?? row?.key} />
      {/* Narrow: key above value. sm+: key column + value. */}
      <div className="flex-1 min-w-0 sm:flex sm:items-start sm:gap-3 pt-1.5 leading-snug">
        <dt className="text-caption text-muted truncate sm:w-24 sm:shrink-0 sm:text-body-sm">{row?.key}</dt>
        <dd
          className={cn(
            "mt-0.5 sm:mt-0 flex items-start gap-1.5 tabular-nums font-medium min-w-0 sm:flex-1",
            STATUS_VALUE_COLOR[status] ?? "text-text"
          )}
        >
          {status && !hasMeter && <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0", STATUS_DOT[status] ?? "bg-muted")} />}
          {looksLikePath(value) ? (
            <code className="min-w-0 break-all rounded-badge bg-surface-2 px-1.5 py-0.5 font-mono text-caption font-normal">{value}</code>
          ) : (
            <span className="min-w-0 break-words">{value}</span>
          )}
          {hasMeter && <Meter value={Number(row.meter)} className="flex-1 min-w-0 mt-1.5" />}
        </dd>
      </div>
    </div>
  );
};

// columns: 2 → two columns on sm+ (always 1 column on narrow/mobile). Default 1.
export const KvView = ({ rows, columns }) => {
  const safe = Array.isArray(rows) ? rows : [];
  const twoCol = Number(columns) === 2;
  return (
    <dl className={cn("py-1", twoCol ? "grid grid-cols-1 sm:grid-cols-2 gap-x-6" : "divide-y divide-border")}>
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
