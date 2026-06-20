import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "./utils";

export function Switch({ checked, onCheckedChange, disabled, className, ...props }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        "border-2 border-control-border transition-colors motion-reduce:transition-none",
        "data-[state=checked]:bg-accent-ui data-[state=unchecked]:bg-surface-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-elev-1",
          "transition-transform motion-reduce:transition-none data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  );
}
