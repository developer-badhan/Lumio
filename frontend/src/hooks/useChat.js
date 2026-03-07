import { useContext } from "react";
import ChatContext from "../context/ChatContext";

// useChat — consume the ChatContext safely.
export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }

  return context;
};