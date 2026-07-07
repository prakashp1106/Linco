/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShieldCheck, Info, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CookieConsentProps {
  onLearnMore: () => void;
  addToast: (msg: string, type: "success" | "info" | "warn" | "error") => void;
}

export const CookieConsent: React.FC<CookieConsentProps> = ({ onLearnMore, addToast }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check local storage for consent
    const consent = localStorage.getItem("linco-cookie-consent");
    if (!consent) {
      // Show after a brief elegant delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("linco-cookie-consent", "granted");
    setIsVisible(false);
    addToast("Privacy settings successfully updated. Local sessions isolated.", "success");
  };

  const handleDecline = () => {
    localStorage.setItem("linco-cookie-consent", "declined");
    setIsVisible(false);
    addToast("Essential cookies active. Analytical telemetry disabled.", "info");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          className="fixed bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-45"
          id="cookie-consent-banner"
        >
          <div className="backdrop-blur-xl bg-slate-950/90 border border-slate-800/80 p-5 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.8)] space-y-4">
            
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300">
                  Privacy Sovereignty
                </span>
                <p className="text-xs font-bold text-white">
                  We only collect information required to help recover lost items.
                </p>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Your identity remains private until ownership is verified. No tracking, no profiling, absolute spatiotemporal isolation.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <button
                onClick={handleAccept}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black tracking-wider uppercase rounded-xl transition cursor-pointer text-center text-[10px]"
              >
                Accept All
              </button>
              
              <button
                onClick={onLearnMore}
                className="px-3 py-2 bg-[#0d0d14] border border-[#232332] hover:border-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-center text-[10px]"
              >
                Learn More
              </button>

              <button
                onClick={handleDecline}
                className="p-2 text-slate-500 hover:text-slate-300 cursor-pointer transition"
                title="Decline Non-Essential"
              >
                <X size={14} />
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
