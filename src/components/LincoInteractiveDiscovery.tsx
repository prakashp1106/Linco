/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  Wallet, 
  Smartphone, 
  Key, 
  Briefcase, 
  GraduationCap, 
  Train, 
  Coffee, 
  Building2, 
  MapPin, 
  CheckCircle2 
} from "lucide-react";
import { Linco3DHeroObject, HeroObjectType } from "./Linco3DHeroObject";
import { useLanguage } from "../context/LanguageContext";

interface LincoInteractiveDiscoveryProps {
  onSelectCategory: (category: string) => void;
}

interface DiscoveryItem {
  type: HeroObjectType;
  nameKey: string;
  defaultName: string;
  category: string;
  descKey: string;
  defaultDesc: string;
  icon: React.ElementType;
  contents: string[];
}

const ITEMS: DiscoveryItem[] = [
  {
    type: "wallet",
    nameKey: "discovery.walletTitle",
    defaultName: "Wallet & Purse",
    category: "Wallet / Purse",
    descKey: "discovery.walletDesc",
    defaultDesc: "Cards, cash, ID cards, and transit passes",
    icon: Wallet,
    contents: ["Government / Student ID", "Metro / Transit pass", "Bank cards & cash"]
  },
  {
    type: "phone",
    nameKey: "discovery.phoneTitle",
    defaultName: "Phone & Electronics",
    category: "Electronics",
    descKey: "discovery.phoneDesc",
    defaultDesc: "Smartphones, earphones, and accessories",
    icon: Smartphone,
    contents: ["Device lockscreen photo", "Protective case & stickers", "Earphones & cables"]
  },
  {
    type: "keys",
    nameKey: "discovery.keysTitle",
    defaultName: "Keys & Keychains",
    category: "Keys",
    descKey: "discovery.keysDesc",
    defaultDesc: "Home keys, vehicle keys, and office fobs",
    icon: Key,
    contents: ["Bike / Car remote keys", "Society / Flat main key", "Personal keychain charm"]
  },
  {
    type: "bag",
    nameKey: "discovery.bagTitle",
    defaultName: "Bag & Backpack",
    category: "Bag",
    descKey: "discovery.bagDesc",
    defaultDesc: "College bags, backpacks, and luggage",
    icon: Briefcase,
    contents: ["Laptop & study material", "Work documents & charger", "Gym or sports kit"]
  }
];

export const LincoInteractiveDiscovery: React.FC<LincoInteractiveDiscoveryProps> = ({
  onSelectCategory
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [selectedType, setSelectedType] = useState<HeroObjectType>("wallet");
  const { t } = useLanguage();

  const selectedItem = ITEMS.find((i) => i.type === selectedType) || ITEMS[0];

  return (
    <section className="py-16 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6 select-none">
      
      {/* Chapter 3 Header — Editorial & Human */}
      <div className="text-center space-y-2 max-w-xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          {t("home.discoveryBadge", "Everyday Essentials")}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
          {t("home.discoveryTitle", "What are you trying to bring home?")}
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {t("home.discoverySubtitle", "Select an item to begin a safe, two-minute search across your local community.")}
        </p>
      </div>

      {/* Editorial Object Composition (Non-SaaS Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT / CENTER STAGE: Editorial Physical Object Presentation (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between relative overflow-hidden shadow-2xs">
          {/* Subtle warm ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none" />

          {/* Top Stage Bar */}
          <div className="flex items-center justify-between z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>{t(selectedItem.nameKey, selectedItem.defaultName)}</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {t("home.heroObjectTag", "Recognizable everyday lost belongings")}
            </span>
          </div>

          {/* 3D Physical Object Stage */}
          <div className="my-8 sm:my-10 w-full min-h-[220px] flex items-center justify-center relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedType}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-center justify-center"
              >
                <Linco3DHeroObject 
                  type={selectedType}
                  scale={0.8}
                  interactive={true}
                  subtleFloating={true}
                  storyState="match"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Stage Details & Action */}
          <div className="z-10 pt-4 border-t border-slate-200/70 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {selectedItem.contents.map((detail, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200/80 text-[11px] font-medium text-slate-600 shadow-2xs"
                >
                  <CheckCircle2 size={11} className="text-emerald-600 shrink-0" />
                  <span>{detail}</span>
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                {t(selectedItem.descKey, selectedItem.defaultDesc)}
              </p>

              <button
                type="button"
                onClick={() => onSelectCategory(selectedItem.category)}
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-98"
              >
                <span>{t("discovery.reportItem", "Report this item")}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT / SELECTION STRIP: Curated Everyday Belongings (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          {ITEMS.map((item) => {
            const isSelected = selectedType === item.type;
            const Icon = item.icon;

            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setSelectedType(item.type)}
                className={`w-full p-4 sm:p-5 rounded-2xl text-left border transition-all duration-150 flex items-start gap-4 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? "bg-white border-slate-900 shadow-sm ring-1 ring-slate-900/10"
                    : "bg-white/70 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <div className={`p-3 rounded-xl transition-colors shrink-0 ${
                  isSelected ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
                }`}>
                  <Icon size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {t(item.nameKey, item.defaultName)}
                    </h3>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {t(item.descKey, item.defaultDesc)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* PART L: REAL-WORLD CONTEXT — LINCO RECOVERY WEB */}
      <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-slate-50/70 border border-slate-200/80 text-center space-y-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {t("home.networkTitle", "The LINCO Recovery Network")}
          </span>
          <p className="text-xs sm:text-sm text-slate-600">
            {t("home.networkDesc", "Connecting Campus • Metro • Cafe • Society • Neighborhood into one unified recovery web.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {[
            { icon: GraduationCap, label: "Colleges & Campus" },
            { icon: Train, label: "Metro & Transit" },
            { icon: Coffee, label: "Cafes & Workspaces" },
            { icon: Building2, label: "Societies & Flats" },
            { icon: MapPin, label: "Neighborhood Hubs" }
          ].map((env, i) => {
            const Icon = env.icon;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <Icon size={13} className="text-indigo-600" />
                <span>{env.label}</span>
              </span>
            );
          })}
        </div>
      </div>

    </section>
  );
};
