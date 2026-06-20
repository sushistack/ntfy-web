import { cn } from './utils.js';

export function Skeleton({ variant = 'card', className }) {
  if (variant === 'line') {
    return (
      <div
        className={cn(
          'h-4 w-full rounded-full bg-surface-2',
          'animate-pulse motion-reduce:animate-none',
          className
        )}
      />
    );
  }

  if (variant === 'block') {
    return (
      <div
        className={cn(
          'h-20 w-full rounded-md bg-surface-2',
          'animate-pulse motion-reduce:animate-none',
          className
        )}
      />
    );
  }

  // card variant — matches NotificationCard layout from Story 3.1
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface shadow-elev-1',
        'animate-pulse motion-reduce:animate-none',
        className
      )}
    >
      {/* Header band: priority badge + title + trailing bell + overflow */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="h-5 w-12 shrink-0 rounded-badge bg-surface-2" />
        <div className="h-4 flex-1 rounded-full bg-surface-2" />
        <div className="h-5 w-5 shrink-0 rounded-full bg-surface-2" />
        <div className="h-5 w-5 shrink-0 rounded-full bg-surface-2" />
      </div>
      {/* Body: 3 lines at decreasing widths */}
      <div className="flex flex-col gap-2 px-5 py-4">
        <div className="h-3 w-full rounded-full bg-surface-2" />
        <div className="h-3 w-4/5 rounded-full bg-surface-2" />
        <div className="h-3 w-3/5 rounded-full bg-surface-2" />
      </div>
      {/* Meta row: topic chip (left) + timestamp (right) */}
      <div className="flex items-center justify-between px-5 pb-4">
        <div className="h-5 w-20 rounded-full bg-surface-2" />
        <div className="h-3 w-16 rounded-full bg-surface-2" />
      </div>
    </div>
  );
}
