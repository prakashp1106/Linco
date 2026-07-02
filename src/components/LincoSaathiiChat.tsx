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

import { useChat } from "../hooks/useChat";

export const LincoSaathiiChat: React.FC<LincoSaathiiChatProps> = ({
  onFieldUpdate,
  triggerSubmit,
  currentState,
}) => {
  const [isOpen, setIsOpen] = useState(false); // Mobile modal toggle state
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { messages, setMessages, chatLoading, sendMessage: sendChatMessage } = useChat();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading]);

  const sendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || chatLoading) return;

    if (!customText) setInputMessage("");

    try {
      const data = await sendChatMessage(textToSend, currentState as any);

      // If fields were extracted, update the main form!
      if (data.extractedFields) {
        const cleanedFields: any = {};
        Object.keys(data.extractedFields).forEach((key) => {
          const val = data.extractedFields?.[key as keyof typeof data.extractedFields];
          if (val !== null && val !== undefined) {
            cleanedFields[key] = val;
          }
        });
        
        // Ensure urgency is mapped correctly to our accepted state
        if (cleanedFields.urgency) {
          const urgLower = String(cleanedFields.urgency).toLowerCase();
          if (urgLower.includes("id")) {
            cleanedFields.urgency = "Contains ID";
          } else if (urgLower.includes("medic") || urgLower.includes("critic")) {
            cleanedFields.urgency = "Medical";
          } else if (urgLower.includes("urgent")) {
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
      console.error("Failed to send chatbot message:", err);
    }
  };

  const renderChatContent = () => (
    <div className="flex flex-col h-full bg-slate-950/45 border border-slate-900/90 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl relative">
      {/* Top Banner with premium alignment and glow */}
      <div className="p-3.5 bg-gradient-to-r from-violet-950/20 via-slate-950/50 to-cyan-950/20 border-b border-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Cyber robot avatar with a breathing glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 blur-[4px] animate-pulse opacity-60" />
            <div className="w-9 h-9 rounded-2xl bg-slate-950 border border-cyan-500/30 p-1 relative z-10 flex items-center justify-center shadow-lg shadow-violet-500/10">
              <RobotAvatarIcon size={22} className="text-cyan-400 animate-pulse" />
            </div>
            {/* Pulsing online badge right on avatar corner */}
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-slate-950 bg-emerald-500 z-20"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-xs sm:text-sm text-slate-100 tracking-wide">LincoSaathii</span>
              <span className="text-[8px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-md leading-none">
                AI Friend
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-none">Your Lost & Found Guide</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] text-emerald-400 font-mono font-extrabold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Online</span>
          
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
              transition={{ duration: 0.2 }}
              className={`flex gap-2.5 ${isModel ? "justify-start" : "justify-end"}`}
            >
              {isModel && (
                <div className="relative shrink-0 mt-0.5">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 blur-[2px] opacity-70"></div>
                  <div className="w-7 h-7 rounded-xl bg-slate-950 border border-cyan-500/30 p-1 relative z-10 flex items-center justify-center shadow-md">
                    <RobotAvatarIcon size={15} />
                  </div>
                </div>
              )}
              <div className="max-w-[85%]">
                <div
                  className={`px-4 py-3 rounded-2xl text-xs md:text-[13px] leading-relaxed ${
                    isModel
                      ? "bg-slate-900/60 border border-slate-800/80 text-slate-100 rounded-tl-sm shadow-md font-medium"
                      : "bg-gradient-to-r from-cyan-500/10 to-violet-600/15 border border-cyan-500/20 text-cyan-200 font-semibold rounded-tr-sm shadow-lg shadow-cyan-500/5"
                  }`}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {m.content}
                </div>
                <span className={`text-[8.5px] text-slate-600 font-semibold block mt-1.5 ${!isModel ? "text-right" : ""}`}>
                  {m.timestamp}
                </span>
              </div>
            </motion.div>
          );
        })}
        {chatLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="relative shrink-0 animate-pulse mt-0.5">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 blur-[2px] opacity-70"></div>
              <div className="w-7 h-7 rounded-xl bg-slate-950 border border-cyan-500/30 p-1 relative z-10 flex items-center justify-center shadow-md">
                <RobotAvatarIcon size={15} />
              </div>
            </div>
            <div className="px-4 py-3 bg-slate-900/40 border border-slate-800/60 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 pb-2 pt-0.5 flex flex-wrap gap-1.5">
        {messages.length === 1 && (
          <>
            <button
              onClick={() => sendMessage("Bhai mera wallet kho gaya hai :(")}
              className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/30 text-[10px] text-slate-300 font-bold transition duration-150 shadow-sm cursor-pointer"
            >
              👛 Wallet kho gaya
            </button>
            <button
              onClick={() => sendMessage("Mujhe ek laptop charger mila hai desk par.")}
              className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/30 text-[10px] text-slate-300 font-bold transition duration-150 shadow-sm cursor-pointer"
            >
              🔌 Charger mila hai
            </button>
            <button
              onClick={() => sendMessage("Mera dog park se ghum ho gaya hai.")}
              className="px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/30 text-[10px] text-slate-300 font-bold transition duration-150 shadow-sm cursor-pointer"
            >
              🐶 Pet lost status
            </button>
          </>
        )}
      </div>

      {/* Input Form scaled down with custom styling and neat typography */}
      <div className="p-3.5 bg-slate-950/90 border-t border-slate-900/80">
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
            disabled={chatLoading}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 focus:border-cyan-500/40 text-xs text-slate-200 outline-none placeholder:text-slate-600 transition"
          />
          <button
            type="submit"
            disabled={chatLoading || !inputMessage.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold transition duration-150 flex items-center justify-center shrink-0 disabled:opacity-40 cursor-pointer shadow-md"
          >
            <Send size={14} />
          </button>
        </form>
        <p className="text-[7.5px] sm:text-[8px] text-slate-600 text-center mt-2.5 font-mono tracking-widest uppercase leading-snug">
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
