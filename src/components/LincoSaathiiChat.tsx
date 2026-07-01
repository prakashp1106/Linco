import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, MessageSquare, X, User, Check, AlertCircle } from "lucide-react";

interface LincoSaathiiChatProps {
  onFieldUpdate: (fields: {
    type?: "Lost" | "Found";
    item?: string;
    category?: string;
    details?: string;
    urgency?: string;
    address?: string;
    contact?: string;
  }) => void;
  triggerSubmit: () => void;
  currentState: {
    type: "Lost" | "Found";
    item: string;
    category: string;
    details: string;
    urgency: string;
    address: string;
    contact: string;
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export const LincoSaathiiChat: React.FC<LincoSaathiiChatProps> = ({
  onFieldUpdate,
  triggerSubmit,
  currentState,
}) => {
  const [isOpen, setIsOpen] = useState(false); // Used for mobile toggle modal
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize with welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "model",
          content: "Hey! Pareshan mat ho bhai, LincoSaathii hai na. Batao kya ghum hua ya kya mila? Tension mat lo, hum sath mein report fill karke usey dhoond nikalenge! ❤️\n\n(Aap kisi bhi language jaise Hindi, Hinglish, Marathi ya English mein baat kar sakte hain!)",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage("");
    setLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/ai/linco-saathii", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: chatHistory,
          currentState,
          message: textToSend,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "LincoSaathii is momentarily sleeping.");

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: data.reply || "Kuch toh gadbad hai bhai, main abhi theek se samajh nahi paya. Fir se batao na.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If fields were extracted, update the main form!
      if (data.extractedFields) {
        const cleanedFields: any = {};
        Object.keys(data.extractedFields).forEach((key) => {
          if (data.extractedFields[key] !== null) {
            cleanedFields[key] = data.extractedFields[key];
          }
        });
        
        // Ensure urgency is mapped correctly to our accepted state
        if (cleanedFields.urgency) {
          if (cleanedFields.urgency.toLowerCase().includes("id")) {
            cleanedFields.urgency = "Contains ID";
          } else if (cleanedFields.urgency.toLowerCase().includes("medic") || cleanedFields.urgency.toLowerCase().includes("critic")) {
            cleanedFields.urgency = "Medical";
          } else if (cleanedFields.urgency.toLowerCase().includes("urgent")) {
            cleanedFields.urgency = "Urgent";
          } else {
            cleanedFields.urgency = "Normal";
          }
        }

        if (Object.keys(cleanedFields).length > 0) {
          onFieldUpdate(cleanedFields);
        }
      }

      // If user approved, auto-submit!
      if (data.shouldAutoSubmit) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "model",
            content: "⚡ Perfect! Main aapka post abhi publish kar raha hoon...",
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setTimeout(() => {
          triggerSubmit();
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: "Sorry bhai, network mein thoda issue lag raha hai. Par tum form manually bhi fill kar sakte ho! Mai yahin hoon.",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const ChatContent = () => (
    <div className="flex flex-col h-full bg-[#020817]/90 border border-slate-900/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative">
      {/* Top Banner */}
      <div className="p-4 bg-gradient-to-r from-violet-950/60 to-cyan-950/60 border-b border-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-500 p-0.5 shadow-lg shadow-violet-500/20">
            <div className="w-full h-full bg-[#020817] rounded-[14px] flex items-center justify-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 text-lg">
              ✨
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-sm text-slate-100 tracking-wide">LincoSaathii</span>
              <span className="text-[9px] font-extrabold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">
                AI Friend
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Empathetic Conversational Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider mr-1">Active</span>
          
          {/* Close button for mobile modal */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-200 transition bg-slate-950/40 rounded-lg border border-slate-900"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((m) => {
          const isModel = m.role === "model";
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${isModel ? "justify-start" : "justify-end"}`}
            >
              {isModel && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-500 p-0.5 shrink-0 shadow-md">
                  <div className="w-full h-full bg-[#020817] rounded-[10px] flex items-center justify-center text-xs">
                    🤝
                  </div>
                </div>
              )}
              <div className="max-w-[82%]">
                <div
                  className={`px-4 py-3 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    isModel
                      ? "bg-gradient-to-br from-slate-950/60 to-slate-900/60 border border-slate-900/80 text-slate-200 rounded-tl-sm shadow-md"
                      : "bg-gradient-to-r from-cyan-500/80 to-violet-600/80 text-slate-950 font-semibold rounded-tr-sm shadow-lg shadow-cyan-500/5"
                  }`}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {m.content}
                </div>
                <span className={`text-[9px] text-slate-600 font-medium block mt-1.5 ${!isModel ? "text-right" : ""}`}>
                  {m.timestamp}
                </span>
              </div>
            </motion.div>
          );
        })}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-400 to-violet-500 p-0.5 shrink-0 animate-pulse">
              <div className="w-full h-full bg-[#020817] rounded-[10px] flex items-center justify-center text-xs">
                ✨
              </div>
            </div>
            <div className="px-4 py-3 bg-slate-950/60 border border-slate-900/80 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5">
        {messages.length === 1 && (
          <>
            <button
              onClick={() => sendMessage("Bhai mera wallet kho gaya hai :(")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 text-[10px] text-slate-300 font-medium transition"
            >
              👛 Wallet kho gaya
            </button>
            <button
              onClick={() => sendMessage("Mujhe ek laptop charger mila hai desk par.")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 text-[10px] text-slate-300 font-medium transition"
            >
              🔌 Charger mila hai
            </button>
            <button
              onClick={() => sendMessage("Mera dog park se ghum ho gaya hai.")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 text-[10px] text-slate-300 font-medium transition"
            >
              🐶 Pet lost status
            </button>
          </>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-slate-950/60 border-t border-slate-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            placeholder="LincoSaathii se baat karein..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-900 focus:border-cyan-500/40 text-xs md:text-sm text-slate-200 outline-none placeholder:text-slate-600 transition"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold transition flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </form>
        <p className="text-[8px] text-slate-600 text-center mt-2 font-mono">
          LINCO SATHII AUTOMATICATED INPUT FORM POPULATION SYSTEM
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP PERMANENT PANEL SIDEBAR */}
      <div className="hidden lg:block h-[560px]">
        <ChatContent />
      </div>

      {/* 2. MOBILE FLOATING ACTION BUTTON */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 text-slate-950 flex items-center justify-center shadow-2xl relative group"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <MessageSquare size={22} className="group-hover:rotate-12 transition-transform duration-200" />
        </motion.button>
      </div>

      {/* 3. MOBILE MODAL DRAWER OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-md flex items-end justify-center p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md h-[80vh] relative"
            >
              <ChatContent />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
