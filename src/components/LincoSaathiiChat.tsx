import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, MessageSquare, X } from "lucide-react";

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

// Modern, futuristic SVG Robot Avatar component with clean vector styling
const RobotAvatarIcon = ({ size = 20, className = "text-cyan-400" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Antennas */}
    <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="1.5" r="1.2" fill="currentColor" />
    
    {/* Head/Body container */}
    <rect x="4" y="5.5" width="16" height="13.5" rx="4" fill="#030817" stroke="currentColor" strokeWidth="2" />
    
    {/* Side Ear receivers */}
    <rect x="1.5" y="9.5" width="2" height="5.5" rx="1" fill="currentColor" />
    <rect x="20.5" y="9.5" width="2" height="5.5" rx="1" fill="currentColor" />
    
    {/* Double glowing eyes with purple-cyan palette */}
    <circle cx="8.5" cy="11" r="1.5" fill="#22d3ee" />
    <circle cx="15.5" cy="11" r="1.5" fill="#a78bfa" />
    
    {/* Friendly digital mouth display */}
    <path d="M9 15C10.2 15.8 13.8 15.8 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    
    {/* Neck link */}
    <rect x="10" y="19" width="4" height="2" fill="currentColor" />
  </svg>
);

export const LincoSaathiiChat: React.FC<LincoSaathiiChatProps> = ({
  onFieldUpdate,
  triggerSubmit,
  currentState,
}) => {
  const [isOpen, setIsOpen] = useState(false); // Mobile modal toggle state
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize state with stable direct evaluation of LocalStorage to prevent mounting blinking bugs!
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("linco_saathii_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse saved LincoSaathii messages:", e);
    }
    // Return pristine initial welcome message if no saved storage exists
    return [
      {
        id: "welcome",
        role: "model",
        content: "Hey! Pareshan mat ho bhai, LincoSaathii hai na. Batao kya ghum hua ya kya mila? Tension mat lo, hum sath mein report fill karke usey dhoond nikalenge! ❤️\n\n(Aap kisi bhi language jaise Hindi, Hinglish, Marathi ya English mein baat kar sakte hain!)",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  // Save conversation messages to localStorage reliably
  useEffect(() => {
    try {
      localStorage.setItem("linco_saathii_messages", JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to persist LincoSaathii messages in localStorage:", e);
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

  const renderChatContent = () => (
    <div className="flex flex-col h-full bg-[#020817]/90 border border-slate-900/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative">
      {/* Top Banner with high precision alignment */}
      <div className="p-3 bg-gradient-to-r from-violet-950/40 to-cyan-950/40 border-b border-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Futuristic friendly cyber robot avatar layout with glowing neon border */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 blur-[3px] animate-pulse opacity-80" />
            <div className="w-9 h-9 rounded-2xl bg-[#020817] border border-cyan-500/30 p-1 relative z-10 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <RobotAvatarIcon size={22} />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-xs sm:text-sm text-slate-100 tracking-wide">LincoSaathii</span>
              <span className="text-[9px] font-black uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full leading-none">
                AI Friend
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-none">Conversational Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status Indicator */}
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-emerald-400 font-mono font-extrabold uppercase tracking-wider">Active</span>
          
          {/* Close button for mobile modal layout */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-slate-200 transition bg-slate-950/40 rounded-lg border border-slate-900 ml-1"
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
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 blur-[2px] opacity-70"></div>
                  <div className="w-7 h-7 rounded-xl bg-[#020817] border border-cyan-500/30 p-1 relative z-10 flex items-center justify-center shadow-md">
                    <RobotAvatarIcon size={15} />
                  </div>
                </div>
              )}
              <div className="max-w-[82%]">
                <div
                  className={`px-4 py-3 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    isModel
                      ? "bg-gradient-to-br from-slate-950/60 to-slate-900/60 border border-slate-900/80 text-slate-200 rounded-tl-sm shadow-md font-semibold"
                      : "bg-gradient-to-r from-cyan-500/80 to-violet-600/80 text-slate-950 font-black rounded-tr-sm shadow-lg shadow-cyan-500/5"
                  }`}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {m.content}
                </div>
                <span className={`text-[9px] text-slate-600 font-semibold block mt-1.5 ${!isModel ? "text-right" : ""}`}>
                  {m.timestamp}
                </span>
              </div>
            </motion.div>
          );
        })}
        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="relative shrink-0 animate-pulse">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 blur-[2px] opacity-70"></div>
              <div className="w-7 h-7 rounded-xl bg-[#020817] border border-cyan-500/30 p-1 relative z-10 flex items-center justify-center shadow-md">
                <RobotAvatarIcon size={15} />
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
      <div className="px-4 pb-1.5 pt-0.5 flex flex-wrap gap-1.5">
        {messages.length === 1 && (
          <>
            <button
              onClick={() => sendMessage("Bhai mera wallet kho gaya hai :(")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 text-[10px] text-slate-300 font-extrabold transition"
            >
              👛 Wallet kho gaya
            </button>
            <button
              onClick={() => sendMessage("Mujhe ek laptop charger mila hai desk par.")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 text-[10px] text-slate-300 font-extrabold transition"
            >
              🔌 Charger mila hai
            </button>
            <button
              onClick={() => sendMessage("Mera dog park se ghum ho gaya hai.")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-900 text-[10px] text-slate-300 font-extrabold transition"
            >
              🐶 Pet lost status
            </button>
          </>
        )}
      </div>

      {/* Input Form scaled down with custom styling and neat typography */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-900/60">
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
            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 focus:border-cyan-500/40 text-xs text-slate-200 outline-none placeholder:text-slate-600 transition"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold transition flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </form>
        <p className="text-[7.5px] sm:text-[8px] text-slate-500 text-center mt-2 font-mono tracking-widest uppercase leading-snug">
          LINCO SAATHII AUTOMATED INPUT FORM POPULATION SYSTEM
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP PERMANENT PANEL SIDEBAR */}
      <div className="hidden lg:block h-[560px]">
        {renderChatContent()}
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
          <RobotAvatarIcon size={24} className="text-[#020817] group-hover:rotate-12 transition-transform duration-200" />
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
              {renderChatContent()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
