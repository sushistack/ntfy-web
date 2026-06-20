import { cva, cn } from "./utils";

const iconTile = cva("flex items-center justify-center rounded-md w-16 h-16 mb-4", {
    variants: {
        colorway: {
            coral: "bg-priority-max/10 text-priority-max",
            amber: "bg-priority-high/10 text-priority-high animate-pulse motion-reduce:animate-none",
            green: "bg-accent-text/10 text-accent-text",
            muted: "bg-muted/10 text-muted",
        },
    },
    defaultVariants: { colorway: "muted" },
});

const StatePanel = ({ icon, title, desc, action, colorway, className }) => (
    <div className={cn("flex flex-col items-center justify-center text-center px-6 py-10", className)}>
        <div className={iconTile({ colorway })}>{icon}</div>
        <p className="text-title font-semibold text-text mb-2">{title}</p>
        {desc && <p className="text-body-sm text-muted mb-4">{desc}</p>}
        {action}
    </div>
);

export default StatePanel;
