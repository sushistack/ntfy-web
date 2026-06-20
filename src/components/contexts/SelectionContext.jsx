import { createContext, useContext } from "react";
import { useMatch } from "react-router-dom";

const SelectionContext = createContext(null);

export const SelectionProvider = ({ children }) => {
  const detailMatch = useMatch("/:topic/:msgId");
  const topicMatch = useMatch("/:topic");

  const value = {
    topic: detailMatch?.params?.topic ?? topicMatch?.params?.topic ?? null,
    msgId: detailMatch?.params?.msgId ?? null,
  };

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
};

export const useSelection = () => {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection() must be used inside <SelectionProvider>");
  return ctx;
};
