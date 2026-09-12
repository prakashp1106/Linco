import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Wallet, Smartphone, Key, Briefcase } from "lucide-react";
import { Linco3DHeroObject, HeroObjectType } from "./Linco3DHeroObject";

interface LincoInteractiveDiscoveryProps {
  onSelectCategory: (category: string) => void;
}

interface DiscoveryItem {
  type: HeroObjectType;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
}

const ITEMS: DiscoveryItem[] = [
  {
    type: "wallet",
    name: "Wallet & Purse",
    category: "Wallet",
    description: "Cards, cash, ID cards, and transit passes",
    icon: Wallet
  },
  {
    type: "phone",
    name: "Phone & Electronics",
    category: "Electronics",
    description: "Smartphones, earphones, and accessories",
    icon: Smartphone
  },
  {
    type: "keys",
    name: "Keys & Keychains",
    category: "Keys",
    description: "Home keys, vehicle keys, and office fobs",
    icon: Key
  },
  {
    type: "bag",
    name: "Bag & Backpack",
    category: "Bag",
    description: "College bags, handbags, totes, and luggage",
    icon: Briefcase
  }
];

export const LincoInteractiveDiscovery: React.FC<LincoInteractiveDiscoveryProps> = ({
  onSelectCategory
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeItem, setActiveItem] = useState<HeroObjectType>("wallet");

  return (
    <section className="py-14 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8 select-none">
      
      {/* Title & Subtext - Exactly per requirement 13 */}
      <div className="space-y-2 max-w-lg mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          Everyday Essentials
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
          What&rsquo;s missing?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Whatever you lost, there&rsquo;s still a chance.
        </p>
      </div>

      {/* 4 Clean, recognizable item cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {ITEMS.map((item) => {
          const isSelected = activeItem === item.type;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.type}
              onClick={() => setActiveItem(item.type)}
              whileHover={prefersReducedMotion ? {} : { y: -4 }}
              className={`relative p-5 rounded-3xl border transition-all duration-200 flex flex-col items-center justify-between text-left cursor-pointer ${
                isSelected
                  ? "bg-slate-50 border-slate-900 shadow-sm ring-1 ring-slate-900/10"
                  : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
              }`}
            >
              {/* Item Header */}
              <div className="w-full flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}>
                  <Icon size={16} />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 capitalize">
                  {item.category}
                </span>
              </div>

              {/* Realistic tactile visual miniature */}
              <div className="h-44 sm:h-48 flex items-center justify-center my-2 pointer-events-none">
                <Linco3DHeroObject 
                  type={item.type} 
                  scale={0.62} 
                  interactive={false} 
                  subtleFloating={isSelected} 
                />
              </div>

              {/* Name & Direct Report Action */}
              <div className="w-full space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCategory(item.category);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer pointer-events-auto ${
                    isSelected
                      ? "bg-slate-900 hover:bg-slate-800 text-white shadow-2xs active:scale-98"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 active:scale-98"
                  }`}
                >
                  <span>Report this item</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

    </section>
  );
};
