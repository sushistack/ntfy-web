import * as React from "react";
import { createContext, Suspense, useContext, useEffect, useState, useMemo } from "react";
import { Box, Toolbar, CssBaseline, Backdrop, CircularProgress, useMediaQuery, ThemeProvider, createTheme } from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";
import { BrowserRouter, Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AllSubscriptions, SingleSubscription } from "./Notifications";
import { darkTheme, lightTheme } from "./theme";
import Navigation from "./Navigation";
import ActionBar from "./ActionBar";
import Preferences from "./Preferences";
import subscriptionManager from "../app/SubscriptionManager";
import userManager from "../app/UserManager";
import { expandUrl, getKebabCaseLangStr, darkModeEnabled, updateFavicon } from "../app/utils";
import ErrorBoundary from "./ErrorBoundary";
import routes from "./routes";
import { useAccountListener, useBackgroundProcesses, useConnectionListeners, useWebPushTopics } from "./hooks";
import PublishDialog from "./PublishDialog";
import Messaging from "./Messaging";
import Login from "./Login";
import ServerAuthForm from "./ServerAuthForm";
import initI18n from "../app/i18n"; // Translations!
import prefs from "../app/Prefs";
import RTLCacheProvider from "./RTLCacheProvider";
import session from "../app/Session";
import { NEW } from "@/config/migration";
import AppProviders from "./AppProviders";
import Feed from "@/components/Feed";
import Sidebar, { SidebarContent } from "./Sidebar";
import AppBarNew from "./AppBar";
import BottomNav from "./BottomNav";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { useConnection } from "@/components/contexts/ConnectionContext";
import { useSelection } from "@/components/contexts/SelectionContext";
import { NotConnectedPanel, ConnectingPanel, NoSubscriptionsPanel } from "@/components/message/EmptyStates";
import DetailPane from "./DetailPane";
import SubscribeDialog from "./SubscribeDialog";
import db from "@/app/db";

initI18n();

export const AccountContext = createContext(null);

/* ── LegacyApp — verbatim copy of the original App function body. Do not refactor. ── */
const LegacyApp = () => {
  const { i18n } = useTranslation();
  const languageDir = i18n.dir();
  const [account, setAccount] = useState(null);
  const accountMemo = useMemo(() => ({ account, setAccount }), [account, setAccount]);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const themePreference = useLiveQuery(() => prefs.theme());
  const theme = React.useMemo(
    () => createTheme({ ...(darkModeEnabled(prefersDarkMode, themePreference) ? darkTheme : lightTheme), direction: languageDir }),
    [prefersDarkMode, themePreference, languageDir]
  );

  useEffect(() => {
    document.documentElement.setAttribute("lang", getKebabCaseLangStr(i18n.language));
    document.dir = languageDir;
  }, [i18n.language, languageDir]);

  useEffect(() => {
    if (!session.exists() && config.require_login && window.location.pathname !== routes.login) {
      window.location.href = routes.login;
    }
  }, []);

  return (
    <Suspense fallback={<Loader />}>
      <RTLCacheProvider>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AccountContext.Provider value={accountMemo}>
              <CssBaseline />
              <ErrorBoundary>
                <Routes>
                  <Route path={routes.login} element={<Login />} />
                  <Route element={<Layout />}>
                    <Route path={routes.app} element={<AllSubscriptions />} />
                    <Route path={routes.settings} element={<Preferences />} />
                    <Route path={routes.subscription} element={<SingleSubscription />} />
                    <Route path={routes.subscriptionExternal} element={<SingleSubscription />} />
                  </Route>
                </Routes>
              </ErrorBoundary>
            </AccountContext.Provider>
          </ThemeProvider>
        </BrowserRouter>
      </RTLCacheProvider>
    </Suspense>
  );
};

/* ── ContentRegion — state panel decision tree (Story 2.6) ── */
const ContentRegion = () => {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const navigate = useNavigate();
  const { connectionState, hasData } = useConnection();
  const subscriptions = useLiveQuery(() => db.subscriptions.filter((s) => !s.internal).toArray(), []) ?? [];

  const panel = (() => {
    if (connectionState === "offline") {
      return <NotConnectedPanel onSettings={() => navigate(routes.settings)} />;
    }
    if ((connectionState === "connecting" || connectionState === "reconnecting") && !hasData) {
      return <ConnectingPanel />;
    }
    if (connectionState === "connected" && subscriptions.length === 0) {
      return <NoSubscriptionsPanel onSubscribe={() => setSubscribeOpen(true)} />;
    }
    return null; // Feed renders here in E3
  })();

  return (
    <>
      {panel}
      <SubscribeDialog
        open={subscribeOpen}
        onSuccess={(sub) => { setSubscribeOpen(false); navigate(routes.forSubscription(sub)); }}
        onCancel={() => setSubscribeOpen(false)}
        subscriptions={subscriptions}
      />
    </>
  );
};

// One route split by CSS breakpoint — mobile: DetailPane full-screen, desktop: Feed (DetailRegion handles the pane)
// useIsDesktop prevents DetailPane from mounting on desktop (DetailRegion already mounts it there)
const lgBreakpointMQ = typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)") : null;
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(lgBreakpointMQ?.matches ?? false);
  useEffect(() => {
    if (!lgBreakpointMQ) return;
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
      <div className="hidden lg:block"><Feed /></div>
    </>
  );
};

// Desktop right pane — hidden when no notification is selected
const DetailRegion = () => {
  const { msgId } = useSelection();
  return (
    <div className="hidden lg:block w-[420px] border-l border-border overflow-y-auto"> {/* layout-nudge: placeholder width; finalised in 3.5 */}
      {msgId && <DetailPane />}
    </div>
  );
};

/* ── NewShell — responsive 3-column layout wired by Tasks 4–6 ── */
const NewShell = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col h-dvh bg-bg">
      {/* Mobile top bar — hidden on md+ */}
      <AppBarNew onMenuOpen={() => setDrawerOpen(true)} drawerOpen={drawerOpen} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar (lg+): full width. Tablet (md→lg): icon-rail. Hidden below md. */}
        <div className="hidden lg:flex">
          <Sidebar collapsed={false} />
        </div>
        <div className="hidden md:flex lg:hidden">
          <Sidebar collapsed={true} />
        </div>

        {/* Feed/content column — tabIndex={-1} allows programmatic focus for a11y back navigation */}
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
          <div className="max-w-[720px] mx-auto px-4 py-6">
            <Routes>
              {NEW.feed ? (
                <>
                  <Route path={routes.app} element={<Feed />} />
                  {/* /:topic/:msgId must come BEFORE /:topic — more specific first in RR6 */}
                  <Route path={routes.msgDetail} element={<MsgDetailRoute />} />
                  <Route path={routes.subscription} element={<Feed />} />
                  <Route path={routes.subscriptionExternal} element={<Feed />} />
                </>
              ) : (
                <>
                  <Route path={routes.app} element={<ContentRegion />} />
                  <Route path={routes.subscription} element={<ContentRegion />} />
                  <Route path={routes.subscriptionExternal} element={<ContentRegion />} />
                </>
              )}
              <Route path={routes.settings} element={<ServerAuthForm />} />
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
        <SheetContent side="left" className="w-[280px]"> {/* layout-nudge: nav drawer width matches desktop sidebar */}
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

/* ── App entry point — branches on migration flag ── */
const App = () => (NEW.shell ? <AppProviders><NewShell /></AppProviders> : <LegacyApp />);

export default App;

/* ─── Legacy helpers (used only by LegacyApp / Layout) ─────────────────────── */

const updateTitle = (newNotificationsCount) => {
  document.title = newNotificationsCount > 0 ? `(${newNotificationsCount}) ntfy` : "ntfy";
  window.navigator.setAppBadge?.(newNotificationsCount);
  updateFavicon(newNotificationsCount);
};

const Layout = () => {
  const params = useParams();
  const { account, setAccount } = useContext(AccountContext);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sendDialogOpenMode, setSendDialogOpenMode] = useState("");
  const users = useLiveQuery(() => userManager.all());
  const subscriptions = useLiveQuery(() => subscriptionManager.all());
  const webPushTopics = useWebPushTopics();
  const subscriptionsWithoutInternal = subscriptions?.filter((s) => !s.internal);
  const newNotificationsCount = subscriptionsWithoutInternal?.reduce((prev, cur) => prev + cur.new, 0) || 0;
  const [selected] = (subscriptionsWithoutInternal || []).filter(
    (s) =>
      (params.baseUrl && expandUrl(params.baseUrl).includes(s.baseUrl) && params.topic === s.topic) ||
      (config.base_url === s.baseUrl && params.topic === s.topic)
  );

  useConnectionListeners(account, subscriptions, users, webPushTopics);
  useAccountListener(setAccount);
  useBackgroundProcesses();
  useEffect(() => updateTitle(newNotificationsCount), [newNotificationsCount]);

  return (
    <Box sx={{ display: "flex" }}>
      <ActionBar selected={selected} onMobileDrawerToggle={() => setMobileDrawerOpen(!mobileDrawerOpen)} />
      <Navigation
        subscriptions={subscriptionsWithoutInternal}
        selectedSubscription={selected}
        mobileDrawerOpen={mobileDrawerOpen}
        onMobileDrawerToggle={() => setMobileDrawerOpen(!mobileDrawerOpen)}
        onPublishMessageClick={() => setSendDialogOpenMode(PublishDialog.OPEN_MODE_DEFAULT)}
      />
      <Main>
        <Toolbar />
        <Outlet
          context={{
            subscriptions: subscriptionsWithoutInternal,
            selected,
          }}
        />
      </Main>
      <Messaging selected={selected} dialogOpenMode={sendDialogOpenMode} onDialogOpenModeChange={setSendDialogOpenMode} />
    </Box>
  );
};

const Main = (props) => (
  <Box
    id="main"
    component="main"
    sx={{
      display: "flex",
      flexGrow: 1,
      flexDirection: "column",
      padding: { xs: 0, md: 3 },
      width: { sm: `calc(100% - ${Navigation.width}px)` },
      height: "100dvh",
      overflow: "auto",
      backgroundColor: ({ palette }) => (palette.mode === "light" ? palette.grey[100] : palette.grey[900]),
    }}
  >
    {props.children}
  </Box>
);

const Loader = () => (
  <Backdrop
    open
    sx={{
      zIndex: 100000,
      backgroundColor: ({ palette }) => (palette.mode === "light" ? palette.grey[100] : palette.grey[900]),
    }}
  >
    <CircularProgress color="success" disableShrink />
  </Backdrop>
);
