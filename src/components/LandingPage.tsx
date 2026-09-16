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
  HeartHandshake,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  MessageSquare,
  Key,
  Smartphone,
  Wallet,
  Briefcase
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LincoLogo } from "./LincoLogo";
import { LincoInteractiveDiscovery } from "./LincoInteractiveDiscovery";
import { Linco3DHeroObject, HeroObjectType } from "./Linco3DHeroObject";
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
  const prefersReducedMotion = useReducedMotion();
  const [selectedHeroType, setSelectedHeroType] = useState<HeroObjectType>("wallet");
  const [openFaq, setOpenFAQ] = useState<number | null>(null);

  // 8-step visual privacy pipeline states (PART K)
  const privacyPipelineSteps = [
    { num: "01", label: t("home.stepLostFound", "Lost / Found"), state: "completed" },
    { num: "02", label: t("home.stepMatch", "AI Match"), state: "completed" },
    { num: "03", label: t("home.stepOwnerVerified", "Owner Verified"), state: "active" },
    { num: "04", label: t("home.stepFinderVerified", "Finder Verified"), state: "pending" },
    { num: "05", label: t("home.stepHidden", "Contact Shielded"), state: "locked" },
    { num: "06", label: t("home.stepBothAgree", "Both Agree"), state: "pending" },
    { num: "07", label: t("home.stepRevealed", "Contact Revealed"), state: "unlocked" },
    { num: "08", label: t("home.stepHandover", "Safe Handover"), state: "final" }
  ];

  const faqs = [
    {
      q: t("home.faq1Q", "How does LINCO protect my private contact details?"),
      a: t("home.faq1A", "Your personal phone number and exact address stay completely private. When you report an item, your contact info is hidden from the public feed. It is only shared when both finder and owner mutually verify and agree to connect.")
    },
    {
      q: t("home.faq2Q", "How does LINCO ensure items go to their genuine owners?"),
      a: t("home.faq2A", "LINCO prepares non-revealing verification questions based on unique details of the item (such as a hidden engraving, interior photo, or wallpaper). Claimants confirm these details before contact details are exchanged.")
    },
    {
      q: t("home.faq3Q", "What should I do if I find someone's belongings?"),
      a: t("home.faq3A", "Click 'I Found Something', upload a quick photo or description, and tell us where it is safely kept. LINCO immediately notifies matching owners so they can verify their property safely.")
    },
    {
      q: t("home.faq4Q", "Is LINCO free to use for communities?"),
      a: t("home.faq4A", "Yes. LINCO is free for students, transit commuters, housing societies, and neighborhood hubs to make lost property recovery simple, dignified, and fast.")
    }
  ];

  return (
    <div className="w-full select-none pb-24 md:pb-12 text-slate-900 font-sans">
      
      {/* ========================================================================= */}
      {/* 1. HERO — EMOTIONAL PROMISE & DIRECT CALLS TO ACTION */}
      {/* ========================================================================= */}
      <section className="relative pt-8 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 rounded-full bg-indigo-50/60 blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-center">
          
          {/* LEFT: Emotional promise & direct actions (7 cols) */}
          <div className="lg:col-span-7 text-left space-y-6 z-20">
            
            {/* Reassuring badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t("home.heroBadge", "Community Recovery Network")}</span>
            </div>

            {/* Clear, direct, human headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.08]">
                {t("home.heroTitleMain", "Every lost thing has a story.")}
                <br />
                <span className="text-slate-900">{t("home.heroTitleSub", "LINCO helps it find its way home.")}</span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl pt-1">
                {t("home.heroEmotionalDesc", "An AI-powered, privacy-first recovery network connecting lost belongings with honest finders across India.")}
              </p>
            </div>

            {/* PRIMARY USER ACTIONS */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-30">
              <button
                type="button"
                onClick={() => onNavigateToReport("Lost")}
                className="px-6 py-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <Search size={16} />
                <span>{t("home.heroLostBtn", "I Lost Something")}</span>
                <ArrowRight size={15} className="text-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToReport("Found")}
                className="px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 hover:border-slate-400 shadow-xs transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer active:scale-98"
              >
                <HeartHandshake size={16} className="text-indigo-600" />
                <span>{t("home.heroFoundBtn", "I Found Something")}</span>
              </button>
            </div>

            {/* Quick item switcher — helps user relate immediately */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="text-xs font-medium text-slate-400 block">
                {t("home.heroLookingFor", "What are you looking for?")}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "wallet", label: t("discovery.walletTitle", "Wallet & Purse"), icon: Wallet },
                  { id: "phone", label: t("discovery.phoneTitle", "Phone & Electronics"), icon: Smartphone },
                  { id: "keys", label: t("discovery.keysTitle", "Keys & Remotes"), icon: Key },
                  { id: "bag", label: t("discovery.bagTitle", "Bag & Backpack"), icon: Briefcase }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedHeroType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedHeroType(item.id as HeroObjectType)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected 
                          ? "bg-slate-900 text-white shadow-xs" 
                          : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                      }`}
                    >
                      <Icon size={13} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT: Recognizable Physical Item Presentation (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-4 lg:py-0">
            <div className="relative w-full max-w-sm flex items-center justify-center">
              <Linco3DHeroObject 
                type={selectedHeroType}
                scale={1}
                interactive={true}
                storyState="match"
                className="z-10"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-4 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              {t("home.heroObjectTag", "Recognizable everyday lost belongings")}
            </span>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PROBLEM — WHY RECOVERY BREAKS DOWN IN THE REAL WORLD */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200/90 text-left space-y-8">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              {t("home.problemBadge", "The Real Problem")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {t("home.problemTitle", "Why recovery breaks down in the real world")}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("home.problemSubtitle", "Most lost items aren't stolen. They sit unclaimed because everyday recovery is fragmented and stressful.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {t("home.problem1Title", "Chaotic Social Groups")}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("home.problem1Desc", "Lost posts get buried in WhatsApp chats and social feeds within hours with no search, index, or matching.")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {t("home.problem2Title", "Fear of Scams & Harassment")}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("home.problem2Desc", "Posting personal phone numbers on public posters invites scam callers, pranksters, and unwanted extortion.")}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {t("home.problem3Title", "Disconnected Desks")}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t("home.problem3Desc", "Metros, colleges, cafes, and residential security booths operate in total isolation from one another.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LINCO METHOD — "WHAT ARE YOU TRYING TO BRING HOME?" + REAL-WORLD WEB */}
      {/* ========================================================================= */}
      <LincoInteractiveDiscovery 
        onSelectCategory={(cat) => onNavigateToReport("Lost", cat)}
      />

      {/* ========================================================================= */}
      {/* 4. MATCH — INTELLIGENT CONNECTION WITH TRANSPARENT EVIDENCE */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto text-left">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-8">
          
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              {t("home.matchBadge", "Intelligent Connection")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {t("home.matchTitle", "LINCO connects the clues.")}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("home.matchSubtitle", "Clear, transparent evidence points connect what was lost with what was found—across languages and locations.")}
            </p>
          </div>

          {/* Evidence Card: Transparent signals */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-900">
                  {t("matches.confidence", "Forensic Signal Correlation")}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {t("matches.mutualApprovals", "Transparent Verification")}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-semibold">{t("home.matchEvidenceItem", "Item attributes match")}: </strong>
                  <span>{t("home.matchEvidenceItemDesc", "Both reports identify the same model, color, and unique exterior stickers or markings.")}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <MapPin size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-semibold">{t("home.matchEvidenceLocation", "Location corridor aligns")}: </strong>
                  <span>{t("home.matchEvidenceLocationDesc", "Spatial proximity confirms both occurrences took place along the same transit route.")}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 font-semibold">{t("home.matchEvidenceTime", "Timeline sequence aligns")}: </strong>
                  <span>{t("home.matchEvidenceTimeDesc", "Reported lost at ~2:15 PM, safely recovered and reported at ~2:30 PM.")}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {t("matches.subtitle", "AI compares visual attributes, spatio-temporal waypoints, and descriptions.")}
              </span>

              <button
                type="button"
                onClick={onNavigateToMatches}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
              >
                <span>{t("home.matchCheckBtn", "Check AI Matches")}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TRUST — THE VERIFIED PRIVACY PIPELINE (PART K) */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto text-left">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-950 text-white space-y-8 shadow-sm">
          
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              {t("home.trustBadge", "Privacy & Verification")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("home.trustPipelineTitle", "The Verified Privacy Pipeline")}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t("home.trustPipelineSubtitle", "Your contact details remain shielded until both parties verify ownership and agree to connect.")}
            </p>
          </div>

          {/* 8-Step Visual Pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
            {privacyPipelineSteps.map((step, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between min-h-[90px] relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {step.num}
                  </span>
                  {step.state === "completed" && <CheckCircle2 size={12} className="text-emerald-400" />}
                  {step.state === "active" && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                  {step.state === "locked" && <Lock size={12} className="text-amber-400" />}
                </div>

                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* 3 Reassuring Truths */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-slate-800/80">
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lock size={14} className="text-emerald-400" />
                <span>{t("home.trustPoint1Title", "Phone numbers hidden")}</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("home.trustPoint1Desc", "Nobody sees your telephone number or home address on the public feed.")}
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>{t("home.trustPoint2Title", "Proof before contact")}</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("home.trustPoint2Desc", "Owner-specific secret questions ensure items go only to their rightful owners.")}
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <HeartHandshake size={14} className="text-emerald-400" />
                <span>{t("home.trustPoint3Title", "Mutual double consent")}</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("home.trustPoint3Desc", "Contact details and meeting locations are unlocked only when both sides explicitly agree.")}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. RECOVERY — LIVE COMMUNITY RECOVERY NETWORK + CLEAR ANSWERS */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-16">
        
        {/* Real Community Activity Counters */}
        <div className="space-y-8 text-center">
          <div className="space-y-1.5 max-w-md mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              {t("home.statsBadge", "Community Activity")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {t("home.statsTitle", "Live Recovery Network")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {t("home.statsSubtitle", "Real reports registered in our community database.")}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                value: stats.total,
                label: t("home.statsTotalLabel", "Total Reports"),
                color: "text-slate-950",
                bg: "bg-slate-50"
              },
              {
                value: stats.lost,
                label: t("home.statsLostLabel", "Active Searches"),
                color: "text-rose-600",
                bg: "bg-rose-50/50"
              },
              {
                value: stats.found,
                label: t("home.statsFoundLabel", "Safely Found"),
                color: "text-emerald-700",
                bg: "bg-emerald-50/50"
              },
              {
                value: stats.resolved,
                label: t("home.statsResolvedLabel", "Reunited Cases"),
                color: "text-indigo-600",
                bg: "bg-indigo-50/50"
              }
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-5 rounded-3xl border border-slate-200/80 ${stat.bg} text-center space-y-1`}
              >
                <div className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-xs text-slate-600 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Clear Answers / FAQ Accordion */}
        <div className="space-y-6 max-w-3xl mx-auto text-left pt-6">
          <div className="text-center space-y-1 max-w-md mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("home.faqBadge", "Clear Answers")}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t("home.faqTitle", "Frequently Asked Questions")}
            </h2>
            <p className="text-xs text-slate-500">
              {t("home.faqSubtitle", "Everything you need to know about how LINCO works.")}
            </p>
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
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 7. FINAL CTA & MINIMAL CONSUMER FOOTER */}
      {/* ========================================================================= */}
      <section className="pt-8 pb-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-16">
        
        {/* Warm, Focused CTA */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200/90 text-center space-y-6 max-w-4xl mx-auto">
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              {t("home.finalCtaTitle", "Lost something? Let's bring it back.")}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t("home.finalCtaSubtitle", "Report in under two minutes or browse active community listings.")}
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToReport("Lost")}
              className="px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 active:scale-98 text-white text-sm font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer pointer-events-auto"
            >
              <Search size={16} />
              <span>{t("home.heroLostBtn", "I Lost Something")}</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onNavigateToReport("Found")}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 active:scale-98 text-slate-800 text-sm font-semibold border border-slate-300 shadow-2xs transition flex items-center gap-2 cursor-pointer pointer-events-auto"
            >
              <HeartHandshake size={16} className="text-indigo-600" />
              <span>{t("home.heroFoundBtn", "I Found Something")}</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToFeed}
              className="px-5 py-3.5 rounded-2xl bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-sm font-medium transition cursor-pointer pointer-events-auto"
            >
              <span>{t("home.heroBrowseBtn", "Browse Community Feed")} &rarr;</span>
            </button>
          </div>
        </div>

        {/* Minimal Consumer Footer */}
        <footer className="pt-8 border-t border-slate-200 text-xs text-center space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2">
            <LincoLogo variant="full" size="sm" theme="light" />
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500 font-medium">
            <button type="button" onClick={() => onNavigateToReport("Lost")} className="hover:text-slate-900 transition cursor-pointer">
              {t("home.heroLostBtn", "Report Lost")}
            </button>
            <button type="button" onClick={() => onNavigateToReport("Found")} className="hover:text-slate-900 transition cursor-pointer">
              {t("home.heroFoundBtn", "Report Found")}
            </button>
            <button type="button" onClick={onNavigateToFeed} className="hover:text-slate-900 transition cursor-pointer">
              {t("nav.feed", "Browse Feed")}
            </button>
            <button type="button" onClick={onNavigateToMatches} className="hover:text-slate-900 transition cursor-pointer">
              {t("nav.matches", "Smart Matches")}
            </button>
            <button type="button" onClick={onFocusAIAssistant} className="hover:text-slate-900 transition cursor-pointer">
              {t("chat.title", "Linco Saathii")}
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            {t("home.footerCopyright", "© 2026 LINCO India. All rights reserved.")}
          </p>
        </footer>

      </section>

    </div>
  );
};
