import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import db from "@/app/db";
import { ThemeProvider } from "@/components/contexts/ThemeContext";
import { ConnectionProvider } from "@/components/contexts/ConnectionContext";

// Computes hasData outside ConnectionContext (which cannot import useLiveQuery per arch boundary).
const HasDataBridge = ({ children }) => {
  const hasData = useLiveQuery(() => db.notifications.limit(1).count().then((c) => c > 0), []) ?? false;
  return <ConnectionProvider hasData={hasData}>{children}</ConnectionProvider>;
};

const AppProviders = ({ children }) => (
  <ThemeProvider>
    {/* PROVIDER ORDER — append-only. Never restructure. */}
    {/* 3.5: SelectionProvider appended here */}
    {/* 4.4: PublishQueueProvider appended here */}
    <Suspense fallback={null}>
      <BrowserRouter>
        <HasDataBridge>{children}</HasDataBridge>
      </BrowserRouter>
    </Suspense>
  </ThemeProvider>
);

export default AppProviders;
