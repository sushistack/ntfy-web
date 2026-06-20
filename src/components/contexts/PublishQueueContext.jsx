import { createContext, useContext, useReducer, useEffect } from "react";
import api from "@/app/Api";
import { useConnection, CONN_STATES } from "./ConnectionContext";

// Action type constants
const ADD_ENTRY = "ADD_ENTRY";
const CLEAR_ENTRY = "CLEAR_ENTRY";
const MARK_FAILED = "MARK_FAILED";
const SET_QUEUED = "SET_QUEUED";
const SET_SENDING = "SET_SENDING";

export const publishQueueReducer = (state, action) => {
  switch (action.type) {
    case ADD_ENTRY:
      return { ...state, entries: [...state.entries, action.entry] };
    case CLEAR_ENTRY:
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id) };
    case MARK_FAILED:
      return {
        ...state,
        entries: state.entries.map((e) => (e.id === action.id ? { ...e, state: "failed" } : e)),
      };
    case SET_QUEUED:
      return {
        ...state,
        entries: state.entries.map((e) => (e.id === action.id ? { ...e, state: "queued" } : e)),
      };
    case SET_SENDING:
      return {
        ...state,
        entries: state.entries.map((e) => (e.id === action.id ? { ...e, state: "sending" } : e)),
      };
    default:
      return state;
  }
};

const PublishQueueContext = createContext(null);

export const PublishQueueProvider = ({ children }) => {
  const [state, dispatch] = useReducer(publishQueueReducer, { entries: [] });
  const { connectionState } = useConnection();

  const _sendEntry = async (entry) => {
    try {
      await api.publish(entry.baseUrl, entry.topic, entry.body, {
        title: entry.title || undefined,
        priority: entry.priority !== 3 ? entry.priority : undefined,
        tags: entry.tags || undefined,
      });
      dispatch({ type: CLEAR_ENTRY, id: entry.id });
    } catch {
      dispatch({ type: MARK_FAILED, id: entry.id });
    }
  };

  const enqueue = (payload) => {
    const id = crypto.randomUUID();
    const entryState = connectionState === CONN_STATES.CONNECTED ? "sending" : "queued";
    const entry = { id, ...payload, state: entryState };
    dispatch({ type: ADD_ENTRY, entry });
    if (connectionState === CONN_STATES.CONNECTED) {
      _sendEntry(entry);
    }
  };

  const retry = (id) => {
    const entry = state.entries.find((e) => e.id === id);
    if (!entry) return;
    dispatch({ type: SET_SENDING, id });
    _sendEntry({ ...entry, state: "sending" });
  };

  const dismiss = (id) => {
    dispatch({ type: CLEAR_ENTRY, id });
  };

  useEffect(() => {
    if (connectionState !== CONN_STATES.CONNECTED) return;
    const queued = state.entries.filter((e) => e.state === "queued");
    if (queued.length === 0) return;
    queued.forEach((entry) => {
      dispatch({ type: SET_SENDING, id: entry.id });
      _sendEntry(entry);
    });
  }, [connectionState]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PublishQueueContext.Provider value={{ queue: state.entries, enqueue, retry, dismiss }}>
      {children}
    </PublishQueueContext.Provider>
  );
};

export const usePublishQueue = () => {
  const ctx = useContext(PublishQueueContext);
  if (!ctx) throw new Error("usePublishQueue() must be used inside <PublishQueueProvider>");
  return ctx;
};
