import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import db from "@/app/db";
import { ThemeProvider } from "@/components/contexts/ThemeContext";
import { ConnectionProvider } from "@/components/contexts/ConnectionContext";
import { SelectionProvider } from "@/components/contexts/SelectionContext";
import { PublishQueueProvider } from "@/components/contexts/PublishQueueContext";

// Computes hasData outside ConnectionContext (which cannot import useLiveQuery per arch boundary).
const HasDataBridge = ({ children }) => {
  const hasData = useLiveQuery(() => db.notifications.limit(1).count().then((c) => c > 0), []) ?? false;
  return (
    <ConnectionProvider hasData={hasData}>
      <SelectionProvider>
        <PublishQueueProvider>{children}</PublishQueueProvider>
      </SelectionProvider>
    </ConnectionProvider>
  );
};

const AppProviders = ({ children }) => (
  <ThemeProvider>
    {/* PROVIDER ORDER — append-only. Never restructure. */}
    {/* Theme → BrowserRouter → HasDataBridge → ConnectionProvider → SelectionProvider → PublishQueueProvider → children */}
    <Suspense fallback={null}>
      <BrowserRouter>
        <HasDataBridge>{children}</HasDataBridge>
      </BrowserRouter>
    </Suspense>
  </ThemeProvider>
);

export default AppProviders;
