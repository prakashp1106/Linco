/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, ShieldCheck, HelpCircle, User, ExternalLink, Mail, Globe, Map } from "lucide-react";
import { motion } from "motion/react";

export const AboutTab: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-8 max-w-4xl mx-auto"
      id="about-tab"
    >
      {/* Hero */}
      <div className="text-center space-y-3 p-8 rounded-3xl bg-[#07070a]/90 border border-[#161621] backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full" />
        <h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
          About LINCO AI Portal
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The next-generation, community-driven, AI-orchestrated Lost &amp; Found platform designed for cities across India. Powered by Gemini, secured with end-to-end client cryptography.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-[#07070a]/90 border border-[#161621] backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles size={18} />
          </div>
          <h3 className="text-base font-bold text-slate-200">Gemini-Orchestrated Matching</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            LINCO utilizes advanced semantic analysis via Google's Gemini LLM. It maps descriptions, categories, and locations in real-time to connect lost reports with matching found reports.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#07070a]/90 border border-[#161621] backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <ShieldCheck size={18} />
          </div>
          <h3 className="text-base font-bold text-slate-200">Client-Side End-to-End Encryption</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your contact information is encrypted in your browser using the AES-GCM Web Crypto standard derived from your 4-digit PIN. The server only stores cryptographically hashed PINs (using bcrypt) and never sees your contact number in clear text.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#07070a]/90 border border-[#161621] backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Map size={18} />
          </div>
          <h3 className="text-base font-bold text-slate-200">Dynamic Multi-Map Geospatial Tracking</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Seamless switching between MapmyIndia (advanced premium locations platform) and OpenStreetMap Nominatim fallback engine for coordinate lookup and interactive radius checks.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#07070a]/90 border border-[#161621] backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <HelpCircle size={18} />
          </div>
          <h3 className="text-base font-bold text-slate-200">Smart Ownership Proving</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Found an item? Claimants must prove ownership by answering custom AI-generated verification questions based on unique visual specifics, which are evaluated strictly by Gemini without exposing details.
          </p>
        </div>
      </div>

      {/* Support details */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#07070a]/90 border border-[#161621] space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <User size={16} className="text-cyan-400" />
          Technical Support &amp; Community
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          LINCO operates as a community utility. If you experience issues or would like to integrate LINCO into your local college campus, residential society, or office complex, please contact our support desk:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#030304]/80 border border-[#161621]">
            <Mail size={16} className="text-violet-400 shrink-0" />
            <div>
              <p className="text-slate-500 text-[10px]">Email Support</p>
              <a href="mailto:rinapathak470@gmail.com" className="text-slate-300 hover:text-cyan-400 font-mono transition">
                rinapathak470@gmail.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#030304]/80 border border-[#161621]">
            <Globe size={16} className="text-cyan-400 shrink-0" />
            <div>
              <p className="text-slate-500 text-[10px]">Official Website</p>
              <a href="#" className="text-slate-300 hover:text-cyan-400 font-mono flex items-center gap-1 transition">
                linco-portal.ai <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
