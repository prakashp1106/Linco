/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from "react";
import { apiService, LincoSaathiiResponse } from "../services/api";
import { Post } from "../types";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("linco_saathii_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse saved LincoSaathii messages:", e);
    }
    return [
      {
        id: "initial_saathii_msg",
        role: "model",
        content: "Hey! Pareshan mat ho bhai, LincoSaathii hai na. Batao kya ghum hua ya kya mila? Tension mat lo, hum sath mein report fill karke usey dhoond nikalenge! ❤️\n\n(Aap kisi bhi language jaise Hindi, Hinglish, Marathi ya English mein baat kar sakte hain!)",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });
  const [chatLoading, setChatLoading] = useState(false);

  const sendMessage = useCallback(async (
    text: string,
    currentState: Partial<Post>
  ): Promise<LincoSaathiiResponse> => {
    const userMsg: ChatMessage = {
      id: `user_msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    localStorage.setItem("linco_saathii_messages", JSON.stringify(newMessages));
    setChatLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiService.lincoSaathii(history, currentState, text);

      const systemMsg: ChatMessage = {
        id: `saathii_msg_${Date.now()}`,
        role: "model",
        content: res.reply || "Kuch toh gadbad hai bhai, main abhi theek se samajh nahi paya. Fir se batao na.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      const updatedMessages = [...newMessages, systemMsg];
      setMessages(updatedMessages);
      localStorage.setItem("linco_saathii_messages", JSON.stringify(updatedMessages));
      return res;
    } catch (error) {
      console.error("useChat failed:", error);
      const errorMsg: ChatMessage = {
        id: `err_msg_${Date.now()}`,
        role: "model",
        content: "Sorry bhai, network mein thodi problem lag rahi hai. Ek baar fir try karo na yaar!",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      localStorage.setItem("linco_saathii_messages", JSON.stringify(updatedMessages));
      throw error;
    } finally {
      setChatLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    const defaultWelcome: ChatMessage[] = [
      {
        id: "initial_saathii_msg",
        role: "model",
        content: "Hey! Pareshan mat ho bhai, LincoSaathii hai na. Batao kya ghum hua ya kya mila? Tension mat lo, hum sath mein report fill karke usey dhoond nikalenge! ❤️\n\n(Aap kisi bhi language jaise Hindi, Hinglish, Marathi ya English mein baat kar sakte hain!)",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    setMessages(defaultWelcome);
    localStorage.setItem("linco_saathii_messages", JSON.stringify(defaultWelcome));
  }, []);

  return {
    messages,
    setMessages,
    chatLoading,
    sendMessage,
    clearChat,
  };
}
