import { cn } from './utils';

function safeMeterValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function getFillClass(safeValue) {
  if (safeValue >= 90) return 'bg-meter-critical';
  if (safeValue >= 65) return 'bg-meter-warning';
  return 'bg-meter-ok';
}

export function Meter({ value, label, className }) {
  const safeValue = safeMeterValue(value);
  const isCritical = safeValue >= 90;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="meter"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative flex-1 overflow-hidden rounded-full bg-meter-track"
        style={{ height: '7px' /* layout-nudge: meter spec 7px */ }}
      >
        <div
          className={cn('h-full rounded-full', getFillClass(safeValue))}
          style={{ width: `${safeValue}%` }}
        />
      </div>
      {label !== undefined && (
        <span
          className={cn(
            'tabular-nums text-body-sm shrink-0',
            isCritical ? 'text-meter-critical' : 'text-muted'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
