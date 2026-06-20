import { createContext, useContext, useMemo } from "react";
import { useMatch } from "react-router-dom";

const SelectionContext = createContext(null);

// Routes that are not topic paths — prevent /:topic wildcard from matching them
const RESERVED_PATHS = new Set(["settings", "login", "all", "signup", "account"]);

export const SelectionProvider = ({ children }) => {
  const detailMatch = useMatch("/:topic/:msgId");
  const topicMatch = useMatch("/:topic");

  const rawTopic = detailMatch?.params?.topic ?? topicMatch?.params?.topic ?? null;
  const rawMsgId = detailMatch?.params?.msgId ?? null;

  const value = useMemo(
    () => ({
      topic: rawTopic && !RESERVED_PATHS.has(rawTopic) ? rawTopic : null,
      msgId: rawMsgId && !RESERVED_PATHS.has(rawMsgId) ? rawMsgId : null,
    }),
    [rawMsgId, rawTopic]
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
};

export const useSelection = () => {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection() must be used inside <SelectionProvider>");
  return ctx;
};
