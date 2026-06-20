import { createContext, useContext, useEffect, useReducer } from "react";
import prefs, { THEME } from "../../app/Prefs";

const ThemeContext = createContext(null);
const DARK_CLASS = "dark";

function isDark(choice, systemPrefersDark) {
  return choice === THEME.DARK || (choice === THEME.SYSTEM && systemPrefersDark);
}

export function reducer(state, action) {
  switch (action.type) {
    case "load":
    case "set":
      return { ...state, choice: action.choice };
    case "system_change":
      return { ...state, systemPrefersDark: action.prefersDark };
    default:
      return state;
  }
}

export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    choice: THEME.SYSTEM,
    systemPrefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  }));

  // Load durable choice from IndexedDB on mount
  useEffect(() => {
    prefs.theme().then((choice) =>
      dispatch({ type: "load", choice: choice ?? THEME.SYSTEM })
    );
  }, []);

  // Apply .dark class + mirror to localStorage on every relevant state change
  useEffect(() => {
    document.documentElement.classList.toggle(DARK_CLASS, isDark(state.choice, state.systemPrefersDark));
    try { localStorage.setItem("theme", state.choice); } catch (_) {}
  }, [state.choice, state.systemPrefersDark]);

  // OS preference listener — wired once, cleaned up on unmount
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => dispatch({ type: "system_change", prefersDark: e.matches });
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setChoice = async (newChoice) => {
    dispatch({ type: "set", choice: newChoice });
    try { await prefs.setTheme(newChoice); } catch (_) {}
  };

  return (
    <ThemeContext.Provider value={{ choice: state.choice, setChoice }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() must be used inside <ThemeProvider>");
  return ctx;
}
