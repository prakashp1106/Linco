/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShieldCheck,
  ArrowRight,
  Search,
  ChevronDown,
  Lock,
  Users,
  Building2,
  GraduationCap,
  Train,
  HeartHandshake
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { LincoLogo } from "./LincoLogo";
import { LincoStoryScroll } from "./LincoStoryScroll";
import { LincoInteractiveDiscovery } from "./LincoInteractiveDiscovery";
import { LincoProductShowcases } from "./LincoProductShowcases";
import { useLanguage } from "../context/LanguageContext";

interface LandingPageProps {
  stats: {
    total: number;
    lost: number;
    found: number;
    resolved: number;
  };
  onNavigateToReport: (type?: "Lost" | "Found", category?: string) => void;
  onNavigateToFeed: () => void;
  onNavigateToMatches: () => void;
  onOpenNotifications: () => void;
  onFocusAIAssistant: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  stats,
  onNavigateToReport,
  onNavigateToFeed,
  onNavigateToMatches,
  onFocusAIAssistant
}) => {
  const { t } = useLanguage();
  const [openFaq, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does LINCO protect my private contact details?",
      a: "Your personal phone number and exact address stay completely private. When you report an item, your contact info is hidden from the public feed. It is only shared when both finder and owner mutually verify and agree to connect."
    },
    {
      q: "How does LINCO ensure items go to their genuine owners?",
      a: "LINCO prepares non-revealing verification questions based on unique details of the item (such as a hidden engraving, interior photo, or wallpaper). Claimants confirm these details before contact details are exchanged."
    },
    {
      q: "What should I do if I find someone's belongings?",
      a: "Click 'I Found Something', upload a quick photo or description, and tell us where it is safely kept. LINCO immediately notifies matching owners so they can verify their property safely."
    },
    {
      q: "Is LINCO free to use for communities?",
      a: "Yes. LINCO is free for students, transit commuters, housing societies, and neighborhood hubs to make lost property recovery simple, dignified, and fast."
    }
  ];

  return (
    <div className="w-full select-none pb-24 md:pb-12">
      
      {/* ========================================================================= */}
      {/* 1. EMOTIONAL HERO & CONTINUOUS STORY (SCENE 1 TO 5) */}
      {/* ========================================================================= */}
      <LincoStoryScroll 
        onNavigateToReport={onNavigateToReport}
        onNavigateToFeed={onNavigateToFeed}
        onNavigateToMatches={onNavigateToMatches}
      />

      {/* ========================================================================= */}
      {/* 2. "WHAT'S MISSING?" (Wallet, Phone, Keys, Bag) */}
      {/* ========================================================================= */}
      <LincoInteractiveDiscovery 
        onSelectCategory={(cat) => onNavigateToReport("Lost", cat)}
      />

      {/* ========================================================================= */}
      {/* 3. HOW LINCO WORKS (01 Report, 02 Match, 03 Trust & Reunion) */}
      {/* ========================================================================= */}
      <LincoProductShowcases 
        onNavigateToReport={onNavigateToReport}
        onNavigateToMatches={onNavigateToMatches}
      />

      {/* Secondary Story & Community Content */}
      <div className="space-y-20 sm:space-y-28 max-w-5xl mx-auto px-4 sm:px-6 w-full py-8">

        {/* ========================================================================= */}
        {/* 4. TRUST & PRIVACY — PEACE OF MIND */}
        {/* ========================================================================= */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200/90 text-left space-y-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Peace of Mind
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Designed around privacy and trust.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We believe recovering your belongings shouldn&rsquo;t mean giving away your privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Lock size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Phone numbers hidden</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your phone number is never posted publicly on the community feed. Strangers cannot cold-call you.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Proof before contact</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A simple question only the genuine owner knows confirms ownership before anything else happens.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <HeartHandshake size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Mutual consent</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Contact information is unlocked only when both finder and owner tap &ldquo;I agree to connect&rdquo;.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. BUILT FOR REAL PEOPLE (Colleges, Metros, Societies, Cafes) */}
        {/* ========================================================================= */}
        <section className="space-y-8 text-center">
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Everyday Places
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Where LINCO works best
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Designed for colleges, metro corridors, residential societies, and neighborhood hubs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {[
              {
                icon: GraduationCap,
                title: "Colleges & Campuses",
                desc: "Notebooks, student IDs, earbuds, or backpacks left in lecture halls or libraries.",
                color: "text-indigo-600"
              },
              {
                icon: Train,
                title: "Metros & Commutes",
                desc: "Umbrellas, smart cards, keychains, or phones left on seats or platform benches.",
                color: "text-sky-600"
              },
              {
                icon: Building2,
                title: "Societies & Flats",
                desc: "Keys dropped in society gardens, misplaced courier packages, or sports gear.",
                color: "text-emerald-600"
              },
              {
                icon: Users,
                title: "Cafes & Public Hubs",
                desc: "Wallets, glasses, chargers, or files left behind at dining tables and counters.",
                color: "text-amber-600"
              }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Icon size={16} className={card.color} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. COMMUNITY RECOVERY NUMBERS */}
        {/* ========================================================================= */}
        <section className="space-y-6 text-center max-w-4xl mx-auto">
          <div className="space-y-1 max-w-md mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Community Statistics
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Every return is a story saved
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                value: stats.total,
                label: "Items Registered",
                color: "text-slate-900",
                bg: "bg-slate-50"
              },
              {
                value: stats.lost,
                label: "Active Searches",
                color: "text-rose-600",
                bg: "bg-rose-50/50"
              },
              {
                value: stats.found,
                label: "Safe with Finders",
                color: "text-emerald-700",
                bg: "bg-emerald-50/50"
              },
              {
                value: stats.resolved,
                label: "Reunited with Owners",
                color: "text-indigo-600",
                bg: "bg-indigo-50/50"
              }
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-5 rounded-2xl border border-slate-200/80 ${stat.bg} text-center space-y-1`}
              >
                <div className={`text-3xl sm:text-4xl font-extrabold font-display tracking-tight ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-slate-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FREQUENTLY ASKED QUESTIONS */}
        {/* ========================================================================= */}
        <section className="space-y-6 max-w-3xl mx-auto text-left">
          <div className="text-center space-y-1 max-w-md mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Clear Answers
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFAQ(openFaq === i ? null : i)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 transition cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                      openFaq === i ? "rotate-180 text-slate-900" : ""
                    }`}
                  />
                </button>
                
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden bg-slate-50/50"
                    >
                      <div className="p-4 sm:p-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. STRONG FINAL WARM CTA */}
        {/* ========================================================================= */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200/90 text-center space-y-6 max-w-4xl mx-auto">
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Lost something? Let&rsquo;s bring it back.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every minute counts. File a quick report to notify nearby finders and check existing logs.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToReport("Lost")}
              className="px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 active:scale-98 text-white text-sm font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer pointer-events-auto"
            >
              <Search size={16} />
              <span>Report Lost Item</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onNavigateToReport("Found")}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-98 text-slate-800 text-sm font-semibold border border-slate-300 shadow-2xs transition flex items-center gap-2 cursor-pointer pointer-events-auto"
            >
              <HeartHandshake size={16} className="text-indigo-600" />
              <span>I Found Something</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToFeed}
              className="px-5 py-3.5 rounded-2xl bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-sm font-medium transition cursor-pointer pointer-events-auto"
            >
              Browse Community Feed &rarr;
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. MINIMAL CONSUMER FOOTER */}
        {/* ========================================================================= */}
        <footer className="pt-8 pb-10 border-t border-slate-200 text-xs text-center space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <LincoLogo variant="full" size="sm" theme="light" />
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500 font-medium">
            <button type="button" onClick={() => onNavigateToReport("Lost")} className="hover:text-slate-900 transition cursor-pointer">
              Report Lost
            </button>
            <button type="button" onClick={() => onNavigateToReport("Found")} className="hover:text-slate-900 transition cursor-pointer">
              Report Found
            </button>
            <button type="button" onClick={onNavigateToFeed} className="hover:text-slate-900 transition cursor-pointer">
              Browse Feed
            </button>
            <button type="button" onClick={onNavigateToMatches} className="hover:text-slate-900 transition cursor-pointer">
              Smart Matches
            </button>
            <button type="button" onClick={onFocusAIAssistant} className="hover:text-slate-900 transition cursor-pointer">
              Linco Saathii Assistant
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} LINCO. Intelligent community lost and found network.
          </p>
        </footer>

      </div>
    </div>
  );
};
