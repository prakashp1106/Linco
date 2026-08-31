import React from "react";

export interface LincoLogoProps {
  variant?: "icon" | "full" | "wordmark" | "stacked";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero" | number;
  className?: string;
  animated?: boolean;
  monochrome?: boolean;
  showTagline?: boolean;
  taglineText?: string;
  onClick?: () => void;
}

export const LincoLogo: React.FC<LincoLogoProps> = ({
  variant = "full",
  size = "md",
  className = "",
  animated = false,
  monochrome = false,
  showTagline = false,
  taglineText = "Locate • Verify • Reunite",
  onClick
}) => {
  // Resolve pixel sizes for standard variants
  let pixelSize = 36;
  if (typeof size === "number") {
    pixelSize = size;
  } else {
    switch (size) {
      case "xs":
        pixelSize = 20;
        break;
      case "sm":
        pixelSize = 28;
        break;
      case "md":
        pixelSize = 36;
        break;
      case "lg":
        pixelSize = 48;
        break;
      case "xl":
        pixelSize = 64;
        break;
      case "hero":
        pixelSize = 88;
        break;
    }
  }

  // Generate unique IDs for SVG gradients so multiple instances don't clash
  const uniqueId = React.useId().replace(/:/g, "_");
  const leftGradId = `linco-left-grad-${uniqueId}`;
  const rightGradId = `linco-right-grad-${uniqueId}`;
  const coreGradId = `linco-core-grad-${uniqueId}`;

  const renderIcon = () => (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="LINCO Brand Emblem"
      role="img"
      className={`shrink-0 transition-transform duration-300 ${animated ? "animate-pulse" : ""} ${
        onClick ? "cursor-pointer hover:scale-105" : ""
      }`}
    >
      <defs>
        {/* Left Path: The Lost Item / Owner Journey (Deep Violet to Electric Indigo) */}
        <linearGradient id={leftGradId} x1="6" y1="38" x2="30" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={monochrome ? "currentColor" : "#4f46e5"} />
          <stop offset="100%" stopColor={monochrome ? "currentColor" : "#818cf8"} />
        </linearGradient>

        {/* Right Path: The Finder / Community Return Journey (Electric Indigo to Sky Cyan) */}
        <linearGradient id={rightGradId} x1="42" y1="38" x2="18" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={monochrome ? "currentColor" : "#0284c7"} />
          <stop offset="60%" stopColor={monochrome ? "currentColor" : "#38bdf8"} />
          <stop offset="100%" stopColor={monochrome ? "currentColor" : "#a5b4fc"} />
        </linearGradient>

        {/* Central Reunion Core Glow */}
        <radialGradient id={coreGradId} cx="24" cy="20" r="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={monochrome ? "currentColor" : "#ffffff"} />
          <stop offset="45%" stopColor={monochrome ? "currentColor" : "#a5b4fc"} stopOpacity="0.9" />
          <stop offset="100%" stopColor={monochrome ? "currentColor" : "#6366f1"} stopOpacity="0" />
        </radialGradient>

        {/* Subtle Ambient Filter */}
        <filter id={`linco-glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ambient background illumination */}
      {!monochrome && (
        <circle cx="24" cy="22" r="14" fill={`url(#${coreGradId})`} opacity="0.18" />
      )}

      {/* 
        THE LINCO REUNION EMBLEM:
        Two interlocking converging paths forming a location-pin silhouette
        and central verified connection node (LOST -> FOUND -> REUNITED).
      */}

      {/* Path 1: Left Arc (Owner / Lost Object Path) */}
      <path
        d="M 16 38 C 10 32 8 22 13 14 C 17 8 24 6 24 13 C 24 19 18 24 18 28 C 18 32 21 35 24 38"
        stroke={`url(#${leftGradId})`}
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-500"
      />

      {/* Path 2: Right Arc (Finder / Community Path) */}
      <path
        d="M 32 38 C 38 32 40 22 35 14 C 31 8 24 6 24 13 C 24 19 30 24 30 28 C 30 32 27 35 24 38"
        stroke={`url(#${rightGradId})`}
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-500"
      />

      {/* Central Verified Match Aperture / Reunion Beacon */}
      <circle
        cx="24"
        cy="19"
        r="4.25"
        stroke={monochrome ? "currentColor" : "#ffffff"}
        strokeWidth="2.2"
        fill={monochrome ? "none" : "#0c0d19"}
        filter={!monochrome ? `url(#linco-glow-${uniqueId})` : undefined}
      />

      {/* Inner Core Pulse Dot */}
      <circle
        cx="24"
        cy="19"
        r="1.75"
        fill={monochrome ? "currentColor" : "#38bdf8"}
      />

      {/* Converged Anchor Base Point */}
      <circle
        cx="24"
        cy="38"
        r="2"
        fill={monochrome ? "currentColor" : "#818cf8"}
      />
    </svg>
  );

  if (variant === "icon") {
    return (
      <div 
        className={`inline-flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        {renderIcon()}
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <div 
        className={`inline-flex flex-col items-start ${className}`}
        onClick={onClick}
      >
        <span className="font-sans font-black text-xl tracking-tight text-white select-none">
          LINCO
        </span>
        {showTagline && (
          <span className="font-mono text-[9px] font-semibold text-indigo-400/90 tracking-widest uppercase mt-0.5">
            {taglineText}
          </span>
        )}
      </div>
    );
  }

  if (variant === "stacked") {
    return (
      <div 
        className={`inline-flex flex-col items-center text-center gap-3 ${className}`}
        onClick={onClick}
      >
        {renderIcon()}
        <div className="flex flex-col items-center">
          <span className="font-sans font-extrabold tracking-tight text-white text-2xl sm:text-3xl select-none">
            LINCO
          </span>
          <span className="font-mono text-[10px] sm:text-xs font-semibold text-indigo-400 tracking-[0.2em] uppercase mt-1">
            AI Lost & Found India
          </span>
          {showTagline && (
            <span className="font-sans text-xs text-slate-400 font-medium tracking-wide mt-1.5 max-w-xs">
              {taglineText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default: "full" (Horizontal lockup with Icon + Text)
  const textSizeClass =
    pixelSize <= 24
      ? "text-base"
      : pixelSize <= 32
      ? "text-lg"
      : pixelSize <= 48
      ? "text-xl"
      : "text-2xl";

  return (
    <div 
      className={`inline-flex items-center gap-2.5 ${onClick ? "cursor-pointer group" : ""} ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {renderIcon()}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-sans font-black tracking-tight text-white select-none ${textSizeClass} group-hover:text-indigo-200 transition-colors`}>
            LINCO
          </span>
        </div>
        {showTagline && (
          <span className="font-mono text-[9px] font-semibold text-indigo-400/90 tracking-wider uppercase mt-1">
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};
