import * as React from "react";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import Feed from "@/components/Feed";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { useSelection } from "@/components/contexts/SelectionContext";
import { useBackgroundProcesses, useConnectionListeners, useWebPushTopics } from "./hooks";
import userManager from "../app/UserManager";
import subscriptionManager from "../app/SubscriptionManager";
import session from "../app/Session";
import config from "../app/config";
import { getKebabCaseLangStr, updateFavicon } from "../app/utils";
import ErrorBoundary from "./ErrorBoundary";
import routes from "./routes";
import initI18n from "../app/i18n";
import AppProviders from "./AppProviders";
import Sidebar, { SidebarContent } from "./Sidebar";
import AppBarNew from "./AppBar";
import BottomNav from "./BottomNav";
import DetailPane from "./DetailPane";
import Messaging from "./Messaging";
import SettingsPage from "./SettingsPage";
import Login from "./Login";

initI18n();

/* ── ShellWiring — wires connection listeners and background processes (replaces Layout's hook calls) ── */
const ShellWiring = () => {
  const { i18n } = useTranslation();
  const subscriptions = useLiveQuery(() => subscriptionManager.all()) ?? [];
  const users = useLiveQuery(() => userManager.all()) ?? [];
  const webPushTopics = useWebPushTopics();
  const newNotificationsCount = subscriptions
    .filter((subscription) => !subscription.internal)
    .reduce((count, subscription) => count + subscription.new, 0);

  useConnectionListeners(null, subscriptions, users, webPushTopics);
  useBackgroundProcesses();

  React.useEffect(() => {
    document.documentElement.setAttribute("lang", getKebabCaseLangStr(i18n.language));
  }, [i18n.language]);

  React.useEffect(() => {
    document.title = newNotificationsCount > 0 ? `(${newNotificationsCount}) ntfy` : "ntfy";
    window.navigator.setAppBadge?.(newNotificationsCount);
    updateFavicon(newNotificationsCount);
  }, [newNotificationsCount]);

  return null;
};

// One route split by CSS breakpoint — mobile: DetailPane full-screen, desktop: Feed (DetailRegion handles the pane)
const lgBreakpointMQ = typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)") : null;
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(lgBreakpointMQ?.matches ?? false);
  React.useEffect(() => {
    if (!lgBreakpointMQ) return undefined;
    const handler = (e) => setIsDesktop(e.matches);
    lgBreakpointMQ.addEventListener("change", handler);
    return () => lgBreakpointMQ.removeEventListener("change", handler);
  }, []);
  return isDesktop;
};

const MsgDetailRoute = () => {
  const isDesktop = useIsDesktop();
  return (
    <>
      {!isDesktop && <DetailPane />}
      <div className="hidden lg:block">
        <Feed />
      </div>
    </>
  );
};

// Desktop right pane — hidden when no notification is selected
const DetailRegion = () => {
  const { msgId } = useSelection();
  return <div className="hidden lg:block w-detail-pane border-l border-border overflow-y-auto">{msgId && <DetailPane />}</div>;
};

/* ── NewShell — responsive 3-column layout ── */
const NewShell = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <ErrorBoundary>
      <ShellWiring />
      <div className="flex flex-col h-dvh bg-bg">
        {/* Mobile top bar — hidden on md+ */}
        <AppBarNew onMenuOpen={() => setDrawerOpen(true)} drawerOpen={drawerOpen} />

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop sidebar (lg+): full width. Tablet (md→lg): icon-rail. Hidden below md. */}
          <div className="hidden lg:flex">
            <Sidebar collapsed={false} />
          </div>
          <div className="hidden md:flex lg:hidden">
            <Sidebar collapsed />
          </div>

          {/* Feed/content column — tabIndex={-1} allows programmatic focus for a11y back navigation */}
          <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
            <div className="max-w-feed mx-auto px-4 py-6">
              <Routes>
                <Route path={routes.app} element={<Feed />} />
                {/* /:topic/:msgId must come BEFORE /:topic — more specific first in RR6 */}
                <Route path={routes.msgDetail} element={<MsgDetailRoute />} />
                <Route path={routes.subscription} element={<Feed />} />
                <Route path={routes.subscriptionExternal} element={<Feed />} />
                <Route path={routes.settings} element={<SettingsPage />} />
              </Routes>
            </div>
          </main>

          {/* Detail region — desktop right pane */}
          <DetailRegion />
        </div>

        {/* Mobile bottom nav — hidden on md+ */}
        <BottomNav />

        {/* Publish FAB + publish modal — fixed chrome, must be outside overflow-hidden columns */}
        <Messaging />

        {/* Mobile drawer — Sidebar inside Sheet */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="w-nav-drawer">
            <SidebarContent collapsed={false} />
          </SheetContent>
        </Sheet>
      </div>
    </ErrorBoundary>
  );
};

const LoginRoute = () => {
  if (!config.require_login || session.exists()) {
    return <Navigate to={routes.app} replace />;
  }
  return <Login />;
};

const ProtectedShell = () => {
  if (config.require_login && !session.exists()) {
    return <Navigate to={routes.login} replace />;
  }
  return <NewShell />;
};

const App = () => (
  <AppProviders>
    <Routes>
      <Route path={routes.login} element={<LoginRoute />} />
      <Route path="*" element={<ProtectedShell />} />
    </Routes>
  </AppProviders>
);

export default App;
