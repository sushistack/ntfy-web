import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from './utils';

export const TabsRoot = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-sm bg-surface-2 p-1',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5',
        'text-body-sm font-medium transition-all',
        'data-[state=active]:bg-surface-active data-[state=active]:text-text data-[state=active]:shadow-elev-1',
        'data-[state=inactive]:text-muted',
        'hover:text-text hover:bg-surface-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
        className
      )}
      {...props}
    />
  );
}
