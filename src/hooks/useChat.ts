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

const getWelcomeMessage = (): string => {
  try {
    const lang = localStorage.getItem("linco_language") || "en";
    if (lang === "hi") {
      return "नमस्ते! मैं LincoSaathii हूँ, आपका सहायक Lost & Found AI साथी। क्या आपकी कोई वस्तु खो गई है या आपको कुछ मिला है? मुझे संक्षेप में बताइए, हम साथ मिलकर आसानी से रिपोर्ट दर्ज करेंगे।";
    }
    return "Hello! I'm LincoSaathii, your empathetic Lost & Found companion. Did you lose something, or did you find an item? Tell me what happened and we'll create your verified report together!";
  } catch {
    return "Hello! I'm LincoSaathii, your empathetic Lost & Found companion. Did you lose something, or did you find an item? Tell me what happened and we'll create your verified report together!";
  }
};

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
        content: getWelcomeMessage(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

      const activeLang = localStorage.getItem("linco_language") || "en";
      const res = await apiService.lincoSaathii(history, currentState, text, activeLang);

      const systemMsg: ChatMessage = {
        id: `saathii_msg_${Date.now()}`,
        role: "model",
        content: res.reply || (activeLang === "hi" ? "क्षमा करें, मैं इसे ठीक से समझ नहीं सका। कृपया पुनः बताएं।" : "I couldn't quite process that. Could you please rephrase?"),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const updatedMessages = [...newMessages, systemMsg];
      setMessages(updatedMessages);
      localStorage.setItem("linco_saathii_messages", JSON.stringify(updatedMessages));
      return res;
    } catch (error) {
      console.error("useChat failed:", error);
      const activeLang = localStorage.getItem("linco_language") || "en";
      const errorMsg: ChatMessage = {
        id: `err_msg_${Date.now()}`,
        role: "model",
        content: activeLang === "hi" ? "क्षमा करें, नेटवर्क में अस्थायी समस्या है। कृपया पुनः प्रयास करें।" : "We're experiencing a network connection issue. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
        content: getWelcomeMessage(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
