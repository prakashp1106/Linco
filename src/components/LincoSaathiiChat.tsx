import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { 
  Send, 
  MessageSquare, 
  X, 
  Mic, 
  MicOff, 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  MapPin, 
  User, 
  Phone, 
  Shield, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  HelpCircle,
  HeartHandshake
} from "lucide-react";
import { useChat } from "../hooks/useChat";

interface LincoSaathiiChatProps {
  addToast?: (message: string, type: "info" | "success" | "warn" | "error") => void;
  onFieldUpdate: (fields: {
    type?: "Lost" | "Found";
    item?: string;
    category?: string;
    details?: string;
    urgency?: string;
    address?: string;
    contact?: string;
    reward?: string;
    securityPin?: string;
    image?: string | null;
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
    reward?: string;
    securityPin?: string;
    image?: string | null;
  };
}

const RobotAvatarIcon = ({ size = 20, className = "text-cyan-400" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="1.5" r="1.2" fill="currentColor" />
    <rect x="4" y="5.5" width="16" height="13.5" rx="4" fill="#030817" stroke="currentColor" strokeWidth="2" />
    <rect x="1.5" y="9.5" width="2" height="5.5" rx="1" fill="currentColor" />
    <rect x="20.5" y="9.5" width="2" height="5.5" rx="1" fill="currentColor" />
    <circle cx="8.5" cy="11" r="1.5" fill="#22d3ee" />
    <circle cx="15.5" cy="11" r="1.5" fill="#a78bfa" />
    <path d="M9 15C10.2 15.8 13.8 15.8 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="10" y="19" width="4" height="2" fill="currentColor" />
  </svg>
);

const CATEGORIES = [
  { name: "Electronics", icon: "📱" },
  { name: "Documents", icon: "📄" },
  { name: "Wallet / Purse", icon: "👛" },
  { name: "Keys", icon: "🔑" },
  { name: "Pet", icon: "🐕" },
  { name: "Bag / Luggage", icon: "🎒" },
  { name: "Jewelry", icon: "💎" },
  { name: "ID / Card", icon: "💳" },
  { name: "Vehicle", icon: "🚗" },
  { name: "Clothing", icon: "👕" },
  { name: "Other", icon: "📦" }
];

const LincoSaathiiChatInner: React.FC<LincoSaathiiChatProps> = ({
  onFieldUpdate,
  triggerSubmit,
  currentState,
  addToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [inputMessage, setInputMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showVoiceToast, setShowVoiceToast] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const { messages, setMessages, chatLoading, sendMessage: sendChatMessage } = useChat();

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, chatLoading]);

  // Lock background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Listen for custom event to open the chat externally
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-linco-chat", handleOpenChat);
    return () => window.removeEventListener("open-linco-chat", handleOpenChat);
  }, []);

  // Clean up any pending toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const triggerVoiceToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setShowVoiceToast(true);
    toastTimeoutRef.current = setTimeout(() => {
      setShowVoiceToast(false);
    }, 4500);
  };

  // Determine current active step based on empty fields dynamically
  useEffect(() => {
    if (!currentState.type) {
      setActiveStep(1);
    } else if (!currentState.item || !currentState.category) {
      setActiveStep(2);
    } else if (!currentState.address) {
      setActiveStep(3);
    } else if (!currentState.details) {
      setActiveStep(4);
    } else if (currentState.type === "Lost" && currentState.reward === undefined) {
      setActiveStep(5);
    } else if (!currentState.image) {
      setActiveStep(6);
    } else if (!currentState.contact || !currentState.securityPin) {
      setActiveStep(7);
    } else {
      setActiveStep(8);
    }
  }, [currentState]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || chatLoading || isThinking) return;

    if (!customText) setInputMessage("");

    setIsThinking(true);

    try {
      // Call standard useChat hook to append the user message and query Gemini on server
      const data = await sendChatMessage(textToSend, currentState as any);

      // Extract and update fields from Gemini
      if (data.extractedFields) {
        const cleanedFields: any = {};
        Object.keys(data.extractedFields).forEach((key) => {
          const val = data.extractedFields?.[key as keyof typeof data.extractedFields];
          if (val !== null && val !== undefined) {
            cleanedFields[key] = val;
          }
        });
        
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

      // If user approved, auto-submit
      if (data.shouldAutoSubmit) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: "model",
            content: "⚡ Perfect! I am publishing your report now...",
            timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setTimeout(() => {
          triggerSubmit();
          setIsOpen(false);
        }, 1200);
      }
    } catch (err) {
      console.error("AI Assistant response error:", err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSelectType = (type: "Lost" | "Found") => {
    onFieldUpdate({ type });
    const userMsg = {
      id: `user_type_${Date.now()}`,
      role: "user" as const,
      content: `I ${type === "Lost" ? "lost" : "found"} an item.`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    const botMsg = {
      id: `bot_type_${Date.now()}`,
      role: "model" as const,
      content: type === "Lost" 
        ? "Oh no! Pareshan mat ho, we will find it together. What item did you lose? Choose a category or type below."
        : "Excellent gesture! Helping others is fantastic. What item did you find? Choose a category or type below.",
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleSelectCategory = (category: string) => {
    onFieldUpdate({ category, item: category });
    const userMsg = {
      id: `user_cat_${Date.now()}`,
      role: "user" as const,
      content: `Category is ${category}.`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    const botMsg = {
      id: `bot_cat_${Date.now()}`,
      role: "model" as const,
      content: `Got it! Added to ${category}. Now, where did this happen? (approximate location/address)`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      if (addToast) {
        addToast("Geolocation is not supported by your browser", "error");
      } else {
        console.error("Geolocation is not supported by your browser");
      }
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onFieldUpdate({ address: `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
        const userMsg = {
          id: `user_loc_${Date.now()}`,
          role: "user" as const,
          content: `📍 Location coordinate lock: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };
        const botMsg = {
          id: `bot_loc_${Date.now()}`,
          role: "model" as const,
          content: "Perfect location lock! Now, can you describe the item briefly? Any colors, brands, unique marks?",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, userMsg, botMsg]);
      },
      (err) => {
        console.error("GPS Error:", err);
        if (addToast) {
          addToast("Could not retrieve GPS coordinates. Please type the location.", "error");
        } else {
          console.error("Could not retrieve GPS coordinates. Please type the location.");
        }
      }
    );
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onFieldUpdate({ image: base64 });
      
      const userMsg = {
        id: `user_img_${Date.now()}`,
        role: "user" as const,
        content: `📸 Uploaded image: ${file.name}`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      const botMsg = {
        id: `bot_img_${Date.now()}`,
        role: "model" as const,
        content: "Awesome, photo received! This will help our backend matching algorithms scan visually. Let's get your contact number next.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
    };
    reader.readAsDataURL(file);
  };

  const handleManualNextStep = () => {
    setActiveStep((prev) => Math.min(8, prev + 1));
  };

  const handleManualPrevStep = () => {
    setActiveStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <>
      {/* 1. SIDEBAR PROMO CARD (REPLACES CRAMPED SIDEBAR CHAT) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 blur-[4px] animate-pulse opacity-50" />
            <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-cyan-500/30 p-1.5 relative z-10 flex items-center justify-center">
              <RobotAvatarIcon size={24} className="text-cyan-400" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-100 tracking-wide flex items-center gap-1.5 font-sans">
              LINCO Sathi
              <span className="text-[9px] font-bold uppercase tracking-widest bg-cyan-400/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-400/20">AI Assistant</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">Your Conversational Companion</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
          Report your lost or found item in under 60 seconds. Speak or type in Hinglish, Hindi, or English. Our AI automatically extracts fields, reverse-geocodes locations, and formats your entry.
        </p>

        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all duration-300 shadow-lg shadow-cyan-500/10 cursor-pointer flex items-center justify-center gap-2 border border-cyan-400/20 active:scale-[0.98]"
        >
          <Sparkles size={14} className="animate-pulse" />
          Start AI Report Assistant
        </button>
      </div>

      {/* 2. FLOATING ACTION BUTTON FOR MOBILE AND QUICK LAUNCH */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 text-slate-950 flex items-center justify-center shadow-2xl relative group cursor-pointer border border-cyan-400/30"
          title="Open AI Assistant"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <RobotAvatarIcon size={24} className="text-slate-950 group-hover:rotate-12 transition-transform duration-200" />
        </motion.button>
      </div>

      {/* Hidden file inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleImageFileChange} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      {/* 3. FULL-SCREEN AI ASSISTANT MODAL */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              id="fullscreen-assistant-overlay"
              className="fixed inset-0 z-[999999] bg-[#030712] w-screen h-[100dvh] flex flex-col overflow-hidden select-none"
              style={{
                height: "100dvh",
                width: "100vw",
                paddingTop: "env(safe-area-inset-top, 0px)",
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                paddingLeft: "env(safe-area-inset-left, 0px)",
                paddingRight: "env(safe-area-inset-right, 0px)",
              }}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800 bg-[#08080c]/95 backdrop-blur-md flex items-center justify-between shrink-0 relative z-20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-cyan-500/20 flex items-center justify-center">
                    <RobotAvatarIcon size={20} className="text-cyan-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-100 tracking-wide flex items-center gap-1.5 uppercase font-mono">
                      🤖 LINCO Sathi
                    </h2>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Your AI Lost & Found Assistant</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Step Progress indicator */}
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Onboarding Progress</p>
                      <p className="text-xs text-cyan-400 font-black tracking-widest mt-0.5 font-mono">Step {activeStep} of 8</p>
                    </div>
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-300"
                        style={{ width: `${(activeStep / 8) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-100 border border-slate-800 transition duration-200 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Progress bar for mobile */}
              <div className="sm:hidden w-full h-[3px] bg-slate-950 shrink-0">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-300"
                  style={{ width: `${(activeStep / 8) * 100}%` }}
                />
              </div>

              {/* Split Content Pane: Listing preview on Left, Chat window on Right */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Preview Pane (Desktop Only) */}
                <div className="hidden md:flex w-[320px] border-r border-slate-800/80 bg-slate-950/40 p-6 flex-col justify-between shrink-0 overflow-y-auto">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Real-time Draft Preview</h3>
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                    </div>

                    {/* Listing Card */}
                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-xl">
                      {/* Image preview */}
                      <div className="aspect-video w-full rounded-xl bg-slate-950 border border-slate-800/50 flex items-center justify-center overflow-hidden relative group">
                        {currentState.image ? (
                          <img src={currentState.image} alt="Draft uploaded" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-600">
                            <ImageIcon size={24} className="opacity-60 mb-1" />
                            <span className="text-[9px] font-bold uppercase tracking-widest font-mono">No Image Uploaded</span>
                          </div>
                        )}
                        <span className="absolute top-2 left-2 text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-400">
                          {currentState.type || "Lost"}
                        </span>
                      </div>

                      {/* Info details */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">Item / Category</p>
                          <h4 className="text-xs font-extrabold text-slate-200 mt-0.5 truncate">
                            {currentState.item || "Untitled Item Draft"}
                          </h4>
                          <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-slate-950 rounded text-slate-400 mt-1">
                            {currentState.category || "Unassigned"}
                          </span>
                        </div>

                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">📍 Location</p>
                          <p className="text-[11px] text-slate-300 font-semibold mt-0.5 truncate flex items-center gap-1">
                            <MapPin size={10} className="text-cyan-400 shrink-0" />
                            {currentState.address || "Not specified yet"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">📝 Details</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {currentState.details || "Provide additional markings or descriptors..."}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-slate-500">Security PIN</span>
                          <span className="text-slate-300 font-mono tracking-widest">
                            {currentState.securityPin ? "****" : "Unset"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] text-slate-600 font-mono tracking-widest text-center mt-4">
                    LINCO AI ENCRYPTION STANDARD
                  </div>
                </div>

                {/* Right Chat Area (Main Window) */}
                <div className="flex-1 flex flex-col bg-slate-950/20 overflow-hidden relative">
                  {/* Premium Voice Assistant Toast Message */}
                  <AnimatePresence>
                    {showVoiceToast && (
                      <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000000] w-[90%] max-w-sm bg-slate-950/95 border border-cyan-500/30 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl flex gap-3 items-start"
                      >
                        <div className="p-2 bg-cyan-950/80 rounded-xl text-cyan-400 border border-cyan-500/20 shrink-0">
                          <Mic size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-100 flex items-center gap-1.5">
                            Voice Assistant <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold text-cyan-300">Coming Soon</span>
                          </h4>
                          <p className="text-slate-300 text-[11px] sm:text-xs mt-1 leading-relaxed">
                            Voice conversations are coming soon. We are building a more powerful AI voice experience.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowVoiceToast(false)}
                          className="text-slate-500 hover:text-slate-300 transition shrink-0 p-1 hover:bg-slate-900 rounded-lg cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin select-text">
                    
                    {/* Welcome message wrapper */}
                    <div className="max-w-2xl mx-auto space-y-4">
                      {messages.map((m) => {
                        const isModel = m.role === "model";
                        return (
                          <div 
                            key={m.id}
                            className={`flex gap-3.5 ${isModel ? "justify-start" : "justify-end"}`}
                          >
                            {isModel && (
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-cyan-500/10 flex items-center justify-center shrink-0 shadow">
                                <RobotAvatarIcon size={16} />
                              </div>
                            )}
                            <div className="max-w-[80%]">
                              <div 
                                className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                                  isModel 
                                    ? "bg-slate-900 text-slate-100 border border-slate-800/60 rounded-tl-sm font-medium" 
                                    : "bg-gradient-to-r from-cyan-500/15 to-violet-600/15 border border-cyan-500/20 text-cyan-100 font-semibold rounded-tr-sm"
                                }`}
                                style={{ whiteSpace: "pre-line" }}
                              >
                                {m.content}
                              </div>
                              <span className={`text-[9px] text-slate-600 mt-1 block font-mono ${!isModel ? "text-right" : ""}`}>
                                {m.timestamp}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Display Guided onboarding interactive pills based on current step */}
                      <div className="pl-11 pt-1">
                        {activeStep === 1 && (
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => handleSelectType("Lost")}
                              className="px-5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-extrabold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-2 active:scale-95 shadow-md"
                            >
                              🔴 Lost Item
                            </button>
                            <button
                              onClick={() => handleSelectType("Found")}
                              className="px-5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-2 active:scale-95 shadow-md"
                            >
                              🟢 Found Item
                            </button>
                          </div>
                        )}

                        {activeStep === 2 && (
                          <div className="space-y-3">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Suggested item categories</p>
                            <div className="flex flex-wrap gap-2">
                              {CATEGORIES.map((cat) => (
                                <button
                                  key={cat.name}
                                  onClick={() => handleSelectCategory(cat.name)}
                                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800/80 text-slate-300 hover:text-slate-100 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                                >
                                  <span>{cat.icon}</span>
                                  <span>{cat.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeStep === 3 && (
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={handleUseCurrentLocation}
                              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-extrabold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-2 active:scale-95 shadow"
                            >
                              <MapPin size={14} className="animate-pulse" />
                              Use My Current GPS Location
                            </button>
                            <button
                              onClick={() => setInputMessage("Pune Station")}
                              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                            >
                              Pune Station
                            </button>
                            <button
                              onClick={() => setInputMessage("Baner, Pune")}
                              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
                            >
                              Baner, Pune
                            </button>
                          </div>
                        )}

                        {activeStep === 5 && (
                          <div className="space-y-3">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Set Urgency Level</p>
                            <div className="flex flex-wrap gap-2">
                              {["Normal", "Contains ID", "Urgent", "Critical"].map((urg) => (
                                <button
                                  key={urg}
                                  onClick={() => {
                                    onFieldUpdate({ urgency: urg });
                                    handleSendMessage(`Set urgency level to ${urg}`);
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                                >
                                  {urg}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeStep === 6 && (
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => cameraInputRef.current?.click()}
                              className="px-4 py-3 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 font-extrabold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-2"
                            >
                              <Camera size={14} />
                              Take Live Photo
                            </button>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-extrabold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-2"
                            >
                              <ImageIcon size={14} />
                              Choose from Gallery
                            </button>
                            <button
                              onClick={() => {
                                onFieldUpdate({ image: null });
                                handleSendMessage("Skip photo upload");
                              }}
                              className="px-4 py-3 rounded-xl bg-slate-950/40 hover:bg-slate-900 border border-transparent text-slate-500 font-extrabold text-xs tracking-wider uppercase transition cursor-pointer"
                            >
                              Skip Photo
                            </button>
                          </div>
                        )}

                        {activeStep === 8 && (
                          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md space-y-4 shadow-xl">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-emerald-400" />
                              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Onboarding Review Completed!</h4>
                            </div>
                            
                            <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed font-sans">
                              <p>• <span className="font-bold text-slate-300">Type:</span> {currentState.type}</p>
                              <p>• <span className="font-bold text-slate-300">Item:</span> {currentState.item}</p>
                              <p>• <span className="font-bold text-slate-300">Category:</span> {currentState.category}</p>
                              <p>• <span className="font-bold text-slate-300">Location:</span> {currentState.address}</p>
                              <p>• <span className="font-bold text-slate-300">Contact:</span> {currentState.contact}</p>
                              <p>• <span className="font-bold text-slate-300">Security PIN:</span> {currentState.securityPin || "0000"}</p>
                            </div>

                            <button
                              onClick={() => {
                                setMessages((prev) => [
                                  ...prev,
                                  {
                                    id: `confirm_${Date.now()}`,
                                    role: "user",
                                    content: "Yes, publish my lost and found listing!",
                                    timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
                                  },
                                ]);
                                setTimeout(() => {
                                  triggerSubmit();
                                  setIsOpen(false);
                                }, 800);
                              }}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                              ⚡ Publish Post Now
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Thinking Shimmer Loading Indicator */}
                      {(isThinking || chatLoading) && (
                        <div className="flex gap-3.5 justify-start">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-cyan-500/10 flex items-center justify-center shrink-0">
                            <RobotAvatarIcon size={16} />
                          </div>
                          <div className="max-w-[80%]">
                            <div className="px-4 py-3 bg-slate-900 border border-slate-800/80 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono font-medium animate-pulse">LINCO Sathi is thinking...</span>
                              <div className="flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Manual pagination/navigation bar for conversational steps */}
                  <div className="px-6 py-2 border-t border-b border-slate-900 bg-slate-950/45 flex items-center justify-between text-xs font-bold text-slate-500 shrink-0">
                    <button
                      onClick={handleManualPrevStep}
                      disabled={activeStep === 1}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800/40 text-slate-400 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      Back
                    </button>
                    <span className="font-mono text-[10px] tracking-widest uppercase">Conversational step {activeStep} of 8</span>
                    <button
                      onClick={handleManualNextStep}
                      disabled={activeStep === 8}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800/40 text-slate-400 disabled:opacity-30 cursor-pointer"
                    >
                      Next
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Input Form Area */}
                  <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/85 backdrop-blur shrink-0">
                    <div className="max-w-2xl mx-auto">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage();
                        }}
                        className="relative flex items-center"
                      >
                        {/* Interactive Left Side Actions (Voice, Camera, Upload) */}
                        <div className="absolute left-3 flex items-center gap-1.5 sm:gap-2 z-10">
                          {/* Microphone Voice Button (Visually disabled style, triggers premium toast) */}
                          <button
                            type="button"
                            onClick={triggerVoiceToast}
                            className="p-2 rounded-xl bg-slate-900/60 text-slate-500 hover:text-slate-400 border border-slate-800/20 transition duration-200 cursor-pointer"
                            title="Voice Assistant (Coming Soon)"
                          >
                            <Mic size={15} />
                          </button>

                          {/* Camera Button */}
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition duration-200 cursor-pointer"
                            title="Take Live Camera Shot"
                          >
                            <Camera size={15} />
                          </button>

                          {/* Gallery Button */}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition duration-200 cursor-pointer"
                            title="Upload from Gallery"
                          >
                            <ImageIcon size={15} />
                          </button>
                        </div>

                        {/* Input Area */}
                        <input
                          type="text"
                          placeholder="Bhai lost/found item details type kijiye..."
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          disabled={isThinking || chatLoading}
                          className="w-full pl-32 pr-14 py-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 focus:border-cyan-500/40 text-xs sm:text-sm text-slate-100 outline-none placeholder:text-slate-600 transition"
                        />

                        {/* Send Button */}
                        <button
                          type="submit"
                          disabled={isThinking || chatLoading || !inputMessage.trim()}
                          className="absolute right-3 p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold transition duration-200 disabled:opacity-30 cursor-pointer shadow"
                          title="Send Message"
                        >
                          <Send size={14} />
                        </button>
                      </form>

                      {/* Small Info line */}
                      <p className="text-[8px] text-slate-600 text-center mt-2.5 font-mono tracking-widest uppercase select-none">
                        LINCO Conversational Intelligence Core Model 3.5
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

class LincoSaathiiErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("LincoSaathiiChat caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertCircle size={20} />
            <h4 className="font-bold text-sm">LINCO Sathi Error</h4>
          </div>
          <p className="text-xs text-rose-300">
            Something went wrong while loading the chatbot assistant. Please refresh the page or try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-xl text-xs transition duration-200"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const LincoSaathiiChat: React.FC<LincoSaathiiChatProps> = (props) => {
  return (
    <LincoSaathiiErrorBoundary>
      <LincoSaathiiChatInner {...props} />
    </LincoSaathiiErrorBoundary>
  );
};
