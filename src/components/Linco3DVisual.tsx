import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { 
  Wallet, 
  Smartphone, 
  Key, 
  CreditCard, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  ArrowRight
} from "lucide-react";

interface ItemModel {
  id: string;
  name: string;
  icon: React.ElementType;
  tag: string;
  location: string;
  matchTime: string;
  gradient: string;
  accentColor: string;
  bgLight: string;
}

const DEMO_ITEMS: ItemModel[] = [
  {
    id: "wallet",
    name: "Leather Bifold Wallet",
    icon: Wallet,
    tag: "Personal Essentials",
    location: "Metro Line 2 / Rajiv Chowk",
    matchTime: "12 mins ago",
    gradient: "from-amber-600 to-amber-800",
    accentColor: "text-amber-700",
    bgLight: "bg-amber-50"
  },
  {
    id: "phone",
    name: "Smartphone (Midnight Navy)",
    icon: Smartphone,
    tag: "Electronics",
    location: "University Library, Level 2",
    matchTime: "5 mins ago",
    gradient: "from-indigo-600 to-indigo-800",
    accentColor: "text-indigo-700",
    bgLight: "bg-indigo-50"
  },
  {
    id: "keys",
    name: "Apartment Keychain",
    icon: Key,
    tag: "Keys & Access",
    location: "Green Glen Society Park",
    matchTime: "24 mins ago",
    gradient: "from-emerald-600 to-emerald-800",
    accentColor: "text-emerald-700",
    bgLight: "bg-emerald-50"
  },
  {
    id: "idcard",
    name: "Student ID & Transit Pass",
    icon: CreditCard,
    tag: "Official Documents",
    location: "Campus Cafeteria Counter",
    matchTime: "18 mins ago",
    gradient: "from-sky-600 to-sky-800",
    accentColor: "text-sky-700",
    bgLight: "bg-sky-50"
  },
  {
    id: "bag",
    name: "Canvas Commute Backpack",
    icon: Briefcase,
    tag: "Luggage & Bags",
    location: "Platform 4 Waiting Lounge",
    matchTime: "30 mins ago",
    gradient: "from-purple-600 to-purple-800",
    accentColor: "text-purple-700",
    bgLight: "bg-purple-50"
  }
];

export const Linco3DVisual: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<ItemModel>(DEMO_ITEMS[0]);
  const [activeStep, setActiveStep] = useState<number>(2); // Default to Match
  const prefersReducedMotion = useReducedMotion();

  const ItemIcon = selectedItem.icon;

  const journeySteps = [
    { num: 1, label: "Lost", sub: "Reported privately", icon: MapPin },
    { num: 2, label: "Match", sub: "Deep similarity found", icon: Sparkles },
    { num: 3, label: "Verify", sub: "Proof confirmed", icon: ShieldCheck },
    { num: 4, label: "Reunite", sub: "Safe return complete", icon: CheckCircle2 }
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto select-none">
      {/* Soft ambient blur backdrop */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-50/70 via-slate-50 to-purple-50/50 rounded-3xl blur-2xl -z-10 pointer-events-none" />

      {/* Item Switcher Pill Navigation */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 p-1 mb-4 bg-slate-100/90 border border-slate-200/80 rounded-2xl backdrop-blur-md max-w-sm mx-auto shadow-xs">
        {DEMO_ITEMS.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedItem.id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              aria-label={`Select ${item.name}`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
              }`}
            >
              <Icon size={13} className={isSelected ? "text-indigo-600" : "text-slate-400"} />
              <span className="hidden sm:inline capitalize">{item.id}</span>
            </button>
          );
        })}
      </div>

      {/* Main 3D Floating Stage Container */}
      <div className="relative perspective-1000 p-2 sm:p-4">
        <motion.div
          key={selectedItem.id}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12, rotateX: 4 }}
          animate={
            prefersReducedMotion
              ? { opacity: 1, y: 0 }
              : { 
                  opacity: 1, 
                  y: [0, -6, 0],
                  rotateX: [0, 1.5, 0],
                  rotateY: [0, -1.5, 0]
                }
          }
          transition={{
            y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            rotateX: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotateY: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 0.3 }
          }}
          className="relative bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-[0_12px_40px_rgba(15,23,42,0.06),0_1px_3px_rgba(15,23,42,0.04)]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Top Status Header */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold tracking-wide text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                Active Match Detected
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {selectedItem.matchTime}
            </span>
          </div>

          {/* Central 3D Object Render */}
          <div className="py-6 flex items-center gap-5">
            <div className="relative shrink-0">
              {/* Soft shadow beneath icon plate */}
              <div className="absolute inset-0 bg-indigo-500/15 rounded-2xl blur-md transform translate-y-2 scale-90" />
              
              <div className={`relative w-20 h-20 rounded-2xl ${selectedItem.bgLight} border border-slate-200/80 flex items-center justify-center transition-all duration-300 shadow-inner`}>
                <ItemIcon size={38} className={selectedItem.accentColor} />
              </div>
            </div>

            <div className="space-y-1.5 text-left min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {selectedItem.tag}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {selectedItem.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{selectedItem.location}</span>
              </p>
            </div>
          </div>

          {/* Connection Journey Map (Lost → Match → Verify → Reunite) */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-left mb-2">
              <span className="text-[11px] font-semibold text-slate-700">
                Reunion Progress
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                Step 3 of 4 <ArrowRight size={11} />
              </span>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {journeySteps.map((step) => {
                const isPassed = step.num <= activeStep;
                const isCurrent = step.num === activeStep;
                return (
                  <button
                    key={step.num}
                    onClick={() => setActiveStep(step.num)}
                    className={`text-left p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isCurrent
                        ? "bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-xs"
                        : isPassed
                        ? "bg-slate-50/60 border-slate-200/80 text-slate-700"
                        : "bg-white border-slate-100 text-slate-400 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        isCurrent
                          ? "bg-indigo-600 text-white"
                          : isPassed
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}>
                        {isPassed && !isCurrent ? "✓" : step.num}
                      </span>
                    </div>
                    <p className="text-xs font-bold leading-tight truncate">{step.label}</p>
                    <p className="text-[9px] text-slate-500 leading-tight hidden sm:block truncate mt-0.5">
                      {step.sub}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtle reassuring trust footer */}
          <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-50">
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              Contact details hidden until mutual trust
            </span>
            <span className="font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer">
              Safe Handover →
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
