import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";
import { useConnection } from "@/components/contexts/ConnectionContext";
import LiveRegion from "@/components/ui/LiveRegion";

const DOT_COLORS = {
  connected: "text-accent-ui",
  connecting: "text-priority-high",
  reconnecting: "text-priority-high",
  offline: "text-muted",
};

const LABEL_KEY = {
  connected: "connection_indicator_connected",
  connecting: "connection_indicator_connecting",
  reconnecting: "connection_indicator_connecting",
  offline: "connection_indicator_disconnected",
};

const ConnectionIndicator = () => {
  const { t } = useTranslation();
  const { connectionState } = useConnection();
  const prevStateRef = useRef(null);
  const [announcement, setAnnouncement] = useState("");

  const isAnimating = connectionState === "connecting" || connectionState === "reconnecting";
  const label = t(LABEL_KEY[connectionState] ?? LABEL_KEY.offline);

  useEffect(() => {
    if (prevStateRef.current !== null && prevStateRef.current !== connectionState) {
      setAnnouncement(label);
    }
    prevStateRef.current = connectionState;
  }, [connectionState, label]);

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn("w-2 h-2 rounded-full bg-current", DOT_COLORS[connectionState] ?? "text-muted", isAnimating && "motion-safe:animate-pulse")}
        aria-hidden="true"
      />
      <span className="text-xs font-medium">{label}</span>
      <LiveRegion message={announcement} />
    </div>
  );
};

export default ConnectionIndicator;
