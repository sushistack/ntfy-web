import * as React from "react";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import Feed from "@/components/Feed";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
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

const FeedRoute = () => (
  <div className="max-w-feed mx-auto px-4 py-6">
    <Feed />
  </div>
);

/* ── NewShell — responsive layout (feed is the single view; cards render full) ── */
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
            <Routes>
              <Route path={routes.app} element={<FeedRoute />} />
              {/* /:topic/:msgId kept as a deep-link target — renders the topic feed (no separate detail view) */}
              <Route path={routes.msgDetail} element={<FeedRoute />} />
              <Route path={routes.subscription} element={<FeedRoute />} />
              <Route path={routes.subscriptionExternal} element={<FeedRoute />} />
              <Route path={routes.settings} element={<SettingsPage />} />
            </Routes>
          </main>
        </div>

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
