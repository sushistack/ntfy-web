import { createContext, useContext, useReducer, useEffect, useRef } from "react";
import connectionManager from "../../app/ConnectionManager";
import subscriptionManager from "../../app/SubscriptionManager";

const DEBOUNCE_MS = 300;

export const CONN_STATES = Object.freeze({
  CONNECTED: "connected",
  CONNECTING: "connecting",
  RECONNECTING: "reconnecting",
  OFFLINE: "offline",
});

function deriveAggregateState(subStates) {
  if (subStates.size === 0) return CONN_STATES.OFFLINE;
  const entries = [...subStates.values()];
  const anyConnected = entries.some((e) => e.state === "connected");
  if (anyConnected) return CONN_STATES.CONNECTED;
  const anyConnecting = entries.some((e) => e.state === "connecting");
  if (!anyConnecting) return CONN_STATES.OFFLINE;
  const wasEverConnected = entries.some((e) => e.wasConnected);
  return wasEverConnected ? CONN_STATES.RECONNECTING : CONN_STATES.CONNECTING;
}

const initialState = {
  subStates: new Map(),
  connectionState: CONN_STATES.OFFLINE,
  hasData: false,
};

export const connectionReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_SUB_STATE": {
      const prev = state.subStates.get(action.subscriptionId) ?? { state: null, wasConnected: false };
      const wasConnected = prev.wasConnected || prev.state === "connected";
      const next = new Map(state.subStates);
      next.set(action.subscriptionId, { state: action.state, wasConnected });
      return { ...state, subStates: next, connectionState: deriveAggregateState(next) };
    }
    case "REMOVE_SUB": {
      const next = new Map(state.subStates);
      next.delete(action.subscriptionId);
      return { ...state, subStates: next, connectionState: deriveAggregateState(next) };
    }
    case "SET_HAS_DATA":
      return { ...state, hasData: action.hasData };
    default:
      return state;
  }
};

const ConnectionContext = createContext(null);

export const ConnectionProvider = ({ children, hasData }) => {
  const [state, dispatch] = useReducer(connectionReducer, initialState);
  const debounceRef = useRef({});

  useEffect(() => {
    connectionManager.registerStateListener((subscriptionId, connState) => {
      // PRESERVE existing behavior: subscriptionManager must still be updated
      subscriptionManager.updateState(subscriptionId, connState);
      if (debounceRef.current[subscriptionId]) clearTimeout(debounceRef.current[subscriptionId]);
      debounceRef.current[subscriptionId] = setTimeout(() => {
        dispatch({ type: "UPDATE_SUB_STATE", subscriptionId, state: connState });
        delete debounceRef.current[subscriptionId];
      }, DEBOUNCE_MS);
    });
    return () => {
      connectionManager.resetStateListener();
      Object.values(debounceRef.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    dispatch({ type: "SET_HAS_DATA", hasData: hasData ?? false });
  }, [hasData]);

  return (
    <ConnectionContext.Provider value={{ connectionState: state.connectionState, hasData: state.hasData }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection() must be used inside <ConnectionProvider>");
  return ctx;
};
