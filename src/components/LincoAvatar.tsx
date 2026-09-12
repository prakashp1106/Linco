/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useId } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

interface LincoAvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
  showBadge?: boolean;
  badgeContent?: React.ReactNode;
  onClick?: () => void;
  alt?: string;
}

const SIZE_MAP: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: "w-6 h-6", text: "text-[10px]" },
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-14 h-14", text: "text-base" },
  xl: { container: "w-20 h-20", text: "text-2xl" },
  hero: { container: "w-24 h-24 sm:w-28 sm:h-28", text: "text-3xl" },
};

// Global cache for verified working image URLs to prevent re-flashing
const verifiedImageUrls = new Set<string>();

export const LincoAvatar: React.FC<LincoAvatarProps> = ({
  src,
  name = "User",
  size = "md",
  className = "",
  showBadge = false,
  badgeContent,
  onClick,
  alt,
}) => {
  const isGradient = typeof src === "string" && src.startsWith("linear-gradient");
  const isPotentiallyValidUrl = typeof src === "string" && !isGradient && src.trim().length > 0;
  
  const [imgLoaded, setImgLoaded] = useState<boolean>(() => {
    if (!isPotentiallyValidUrl || !src) return false;
    return verifiedImageUrls.has(src);
  });
  const [imgError, setImgError] = useState<boolean>(false);
  const avatarId = useId();

  useEffect(() => {
    if (!isPotentiallyValidUrl || !src) {
      setImgLoaded(false);
      setImgError(false);
      return;
    }

    if (verifiedImageUrls.has(src)) {
      setImgLoaded(true);
      setImgError(false);
      return;
    }

    let active = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    
    img.onload = () => {
      if (active) {
        verifiedImageUrls.add(src);
        setImgLoaded(true);
        setImgError(false);
      }
    };

    img.onerror = () => {
      if (active) {
        setImgError(true);
        setImgLoaded(false);
      }
    };

    img.src = src;

    return () => {
      active = false;
    };
  }, [src, isPotentiallyValidUrl]);

  const initialLetter = (name.trim().charAt(0) || "U").toUpperCase();
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  // Fallback gradient styles for initial letter display
  const fallbackGradient = isGradient 
    ? (src as string) 
    : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)";

  return (
    <div
      id={`avatar-${avatarId}`}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${sizeConfig.container} ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      role={onClick ? "button" : "img"}
      aria-label={alt || `${name}'s profile avatar`}
    >
      {/* Background/fallback letter element */}
      <div
        className={`w-full h-full rounded-full flex items-center justify-center font-bold text-white tracking-wide shadow-2xs ${sizeConfig.text}`}
        style={{ background: fallbackGradient }}
      >
        {initialLetter}
      </div>

      {/* Real image overlay when successfully loaded */}
      {isPotentiallyValidUrl && !imgError && (
        <img
          src={src as string}
          alt={alt || name}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          className={`absolute inset-0 w-full h-full rounded-full object-cover transition-opacity duration-200 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
          onError={() => setImgError(true)}
        />
      )}

      {/* Optional Badge Indicator */}
      {showBadge && (
        <div className="absolute -bottom-0.5 -right-0.5 pointer-events-none">
          {badgeContent || (
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </div>
      )}
    </div>
  );
};
