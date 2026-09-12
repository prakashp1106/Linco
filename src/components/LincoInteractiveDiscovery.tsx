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
    name: "Wallet & Cards",
    category: "Wallet",
    description: "Credit cards, transit passes, cash & driver's licenses",
    icon: Wallet
  },
  {
    type: "phone",
    name: "Smartphone & Devices",
    category: "Electronics",
    description: "Smartphones, earphones, chargers & tablets",
    icon: Smartphone
  },
  {
    type: "keys",
    name: "Keys & Access Rings",
    category: "Keys",
    description: "House keys, car fobs, smart tags & locker keys",
    icon: Key
  },
  {
    type: "bag",
    name: "Bags & Luggage",
    category: "Bag",
    description: "Backpacks, laptop sleeves, totes & umbrellas",
    icon: Briefcase
  }
];

export const LincoInteractiveDiscovery: React.FC<LincoInteractiveDiscoveryProps> = ({
  onSelectCategory
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeItem, setActiveItem] = useState<HeroObjectType>("wallet");
  const [hoveredItem, setHoveredItem] = useState<HeroObjectType | null>(null);

  const current = hoveredItem || activeItem;

  return (
    <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-10 select-none">
      <div className="space-y-3 max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
          Targeted Search
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          What&apos;s missing?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Select what you misplaced. LINCO activates customized recovery safeguards for each type of personal essential.
        </p>
      </div>

      {/* 4 Items Showcase Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {ITEMS.map((item) => {
          const isSelected = current === item.type;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.type}
              onClick={() => {
                setActiveItem(item.type);
                onSelectCategory(item.category);
              }}
              onMouseEnter={() => setHoveredItem(item.type)}
              onMouseLeave={() => setHoveredItem(null)}
              whileHover={prefersReducedMotion ? {} : { y: -4 }}
              className={`relative p-5 sm:p-6 rounded-3xl border transition-all duration-300 flex flex-col items-center justify-between cursor-pointer ${
                isSelected
                  ? "bg-slate-50 border-slate-900 shadow-md ring-1 ring-slate-900/10"
                  : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
              }`}
            >
              {/* Top Item Badge */}
              <div className="w-full flex items-center justify-between mb-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  <Icon size={16} />
                </div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                  {item.type}
                </span>
              </div>

              {/* 3D Mini Render */}
              <div className="h-44 sm:h-52 flex items-center justify-center my-2">
                <Linco3DHeroObject 
                  type={item.type} 
                  scale={0.65} 
                  interactive={false} 
                  subtleFloating={isSelected} 
                />
              </div>

              {/* Name and Direct CTA */}
              <div className="w-full text-center space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCategory(item.category);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
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
