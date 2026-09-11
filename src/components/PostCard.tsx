/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckCircle2, Trash2, MapPin, Calendar, ShieldCheck, Share2, Download, QrCode, Sparkles, ChevronRight, Eye, Phone, Award, Unlock } from "lucide-react";
import { motion } from "motion/react";
import { Post, AIMatch } from "../types";
import { CATEGORIES } from "../constants";
import { LiveMissingTimer } from "./LiveMissingTimer";
import { MiniMap } from "./LeafletMap";
import { ErrorBoundary } from "./ErrorBoundary";
import { formatKolkataTimestamp } from "../utils/date";
import { getWhatsAppLink } from "../utils/whatsapp";
import { useLanguage } from "../context/LanguageContext";

interface PostCardProps {
  post: Post;
  idx: number;
  unlockedPosts: string[];
  decryptedContacts: Record<string, string>;
  matches: Record<string, AIMatch[]>;
  onIncrementViews: (id: string) => void;
  onMarkResolved: (id: string, e: React.MouseEvent) => void;
  onDeletePost: (id: string, e: React.MouseEvent) => void;
  onStartClaim: (post: Post, e: React.MouseEvent) => void;
  onIHaveThisItem?: (post: Post, e: React.MouseEvent) => void;
  onSharePost: (post: Post, e: React.MouseEvent) => void;
  onShareAsImage: (post: Post, e: React.MouseEvent) => void;
  onShowQrCode: (post: Post, e: React.MouseEvent) => void;
  onManageClaims: (post: Post) => void;
  onUnlockPost?: (id: string, e: React.MouseEvent) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  idx,
  unlockedPosts,
  decryptedContacts,
  matches,
  onIncrementViews,
  onMarkResolved,
  onDeletePost,
  onStartClaim,
  onIHaveThisItem,
  onSharePost,
  onShareAsImage,
  onShowQrCode,
  onManageClaims,
  onUnlockPost,
}) => {
  const { t } = useLanguage();
  const isLost = post.type === "Lost";
  const itemCat = CATEGORIES.find((c) => c.id === post.category);
  const isResolved = post.status === "Resolved";
  const postMatches = matches[post.id] || [];
  const isUnlocked = unlockedPosts.includes(post.id);

  return (
    <motion.div
      id={`post-card-${post.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.2) }}
      onClick={() => onIncrementViews(post.id)}
      className={`bg-[#0c0c11] hover:bg-[#111118] border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer relative overflow-hidden group ${
        isResolved ? "opacity-60" : ""
      } ${postMatches.length > 0 ? "ring-1 ring-indigo-500/20" : ""}`}
    >
      {/* Top Metadata Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-[#14141e]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type badge */}
          <span className={`text-[9px] font-mono font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
            isLost ? "bg-rose-950/20 text-rose-300 border border-rose-500/20" : "bg-emerald-950/20 text-emerald-300 border border-emerald-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLost ? "bg-rose-400 shadow-[0_0_8px_#f43f5e]" : "bg-emerald-400 shadow-[0_0_8px_#10b981]"}`} />
            {isLost ? t("feed.lost", "Lost") : t("feed.found", "Found")}
          </span>
          {/* Category badge */}
          {itemCat && (
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-[#12121a] border border-[#1c1c26] text-slate-400 rounded-full">
              {itemCat.emoji} {t(`category.${itemCat.id.toLowerCase().replace(/[^a-z0-9]/g, "")}`, itemCat.id)}
            </span>
          )}
          {/* Urgency tag */}
          {post.urgency && post.urgency !== "Normal" && (
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full animate-pulse">
              ⚡ {t(`urgency.${post.urgency.toLowerCase()}`, post.urgency)}
            </span>
          )}
          {/* Live Missing Since Timer */}
          {isLost && !isResolved && (
            <LiveMissingTimer createdTime={post.created} />
          )}
          {/* Resolved badge */}
          {isResolved && (
            <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 bg-indigo-950/30 text-indigo-300 border border-indigo-500/20 rounded-full uppercase tracking-wider">
              ✓ {t("post.resolved", "Resolved")}
            </span>
          )}
        </div>

        {/* Post Actions for owners */}
        <div className="flex items-center gap-1.5">
          {!isResolved && (
            <button
              onClick={(e) => onMarkResolved(post.id, e)}
              title={t("postcard.markResolved", "Mark as Resolved")}
              className="p-1.5 rounded-xl bg-indigo-950/20 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-300 hover:text-white transition cursor-pointer active:scale-90"
            >
              <CheckCircle2 size={13} />
            </button>
          )}
          <button
            onClick={(e) => onDeletePost(post.id, e)}
            title={t("postcard.deleteListing", "Delete Listing")}
            className="p-1.5 rounded-xl bg-[#12121a] hover:bg-rose-600/10 border border-[#1c1c26] hover:border-rose-500/25 text-slate-500 hover:text-rose-400 transition cursor-pointer active:scale-90"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-display font-bold text-slate-100 group-hover:text-indigo-400 transition duration-200 mb-2 leading-snug">
        {post.item}
      </h3>

      {/* Optional Image */}
      {post.image && (
        <div className="my-3.5 rounded-2xl overflow-hidden max-h-48 border border-[#161621] bg-[#030304] relative">
          <img
            src={post.image}
            alt={post.item}
            loading="lazy"
            className="w-full h-48 object-cover hover:scale-[1.02] transition duration-500 referrer-policy-no-referrer"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Description Details */}
      <p className="text-[12px] text-slate-300 leading-relaxed mb-4 break-words">
        {post.details}
      </p>

      {/* Optional MiniMap Location Pin */}
      {post.latitude && post.longitude && (
        <div className="my-3.5 rounded-2xl overflow-hidden pointer-events-none select-none relative h-28 border border-[#161621] opacity-80">
          <ErrorBoundary fallbackTitle="Location MiniMap Error">
            <MiniMap lat={post.latitude} lng={post.longitude} />
          </ErrorBoundary>
        </div>
      )}

      {/* Spacers & Views Row */}
      <div className="flex flex-wrap items-center gap-3.5 text-[11px] font-mono text-slate-400 mb-4.5">
        <span className="flex items-center gap-1.5 text-slate-300"><MapPin size={11} className="text-indigo-400" /> {post.address}</span>
        <span className="flex items-center gap-1.5 text-slate-300"><Calendar size={11} className="text-indigo-400" /> {formatKolkataTimestamp(post.created || post.timestamp)}</span>
        <span className="flex items-center gap-1.5 text-slate-400"><Eye size={11} className="text-slate-600" /> {post.views || 0} views</span>
        {post.reward && (
          <span className="flex items-center gap-1 text-amber-400 font-extrabold bg-amber-500/5 border border-amber-500/15 px-2 py-0.5 rounded-md">
            <Award size={11} className="text-amber-500" /> Reward: ₹{post.reward}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Phone size={11} className="text-indigo-400" />
          {isUnlocked ? (
            <span className="text-emerald-400 font-bold bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/15 font-mono">
              +91 {decryptedContacts[post.id] || post.contact}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="bg-[#12121a] px-2 py-0.5 rounded border border-[#1c1c26] text-slate-400 font-mono">
                {post.maskedContact || "+91 ******" + (post.contact.startsWith("ENC:") ? "XX" : post.contact.slice(-2))}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlockPost?.(post.id, e);
                }}
                title={t("postcard.unlockWithPin", "Unlock connection with Security PIN")}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-400 font-bold text-[9px] uppercase tracking-wider transition-all duration-150 cursor-pointer active:scale-95"
              >
                <Unlock size={10} className="inline mr-1" /> {t("postcard.unlockConnection", "Unlock Connection")}
              </button>
            </span>
          )}
        </span>
      </div>

      {/* Action Buttons: WhatsApp and Claim / I Have This Item */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-[#14141e]/50">
        {!isResolved ? (
          <>
            {isLost && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onIHaveThisItem) {
                    onIHaveThisItem(post, e);
                  } else {
                    onStartClaim(post, e);
                  }
                }}
                className="flex-1 min-w-[130px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all duration-150 flex items-center justify-center gap-1.5 text-xs text-center cursor-pointer shadow-md shadow-emerald-950/30 active:scale-95"
              >
                <Sparkles size={13} /> {t("postcard.iHaveThisItem", "I Have This Item")}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartClaim(post, e);
              }}
              className={`flex-1 min-w-[120px] py-2.5 rounded-xl ${
                isLost
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/20"
              } font-bold transition-all duration-150 flex items-center justify-center gap-1.5 text-xs text-center cursor-pointer active:scale-95`}
            >
              <ShieldCheck size={14} /> {isLost ? t("matches.verifyOwnership", "Verify Ownership") : t("feed.claimButton", "Submit Claim")}
            </button>
          </>
        ) : (
          <div className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-bold text-xs text-center select-none flex items-center justify-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-400" /> {t("postcard.reclaimed", "Reclaimed & Handed Over")}
          </div>
        )}

        {/* Manage Claims button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManageClaims(post);
          }}
          title={t("postcard.manageClaims", "Manage Claims & Approve/Reject")}
          className="px-3.5 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all duration-150 flex items-center justify-center gap-1.5 text-center cursor-pointer active:scale-95"
        >
          <ShieldCheck size={14} className="text-indigo-400" /> {t("postcard.claims", "Claims")}
        </button>

        {/* Share button */}
        <button
          onClick={(e) => onSharePost(post, e)}
          title={t("postcard.shareTemplate", "Share/Copy Template Text")}
          className="p-2.5 bg-[#12121a] border border-[#1c1c26] hover:bg-[#1a1a26] rounded-xl text-slate-400 hover:text-slate-200 transition-all duration-150 flex items-center justify-center cursor-pointer active:scale-95"
        >
          <Share2 size={13} />
        </button>

        {/* Share as Image button */}
        <button
          type="button"
          onClick={(e) => onShareAsImage(post, e)}
          title={t("postcard.downloadCard", "Download Post as Image Card")}
          className="px-3 py-1 bg-[#12121a] border border-[#1c1c26] hover:border-indigo-500/30 hover:text-indigo-400 rounded-xl text-slate-400 transition-all duration-150 flex items-center justify-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider select-none cursor-pointer active:scale-95"
        >
          <Download size={11} className="text-indigo-400" /> {t("postcard.image", "Image")}
        </button>

        {/* QR Code button */}
        <button
          type="button"
          onClick={(e) => onShowQrCode(post, e)}
          title={t("postcard.qrSettings", "Interactive QR Code & Print Settings")}
          className="px-3 py-1 bg-[#12121a] border border-[#1c1c26] hover:border-indigo-500/30 hover:text-indigo-400 rounded-xl text-slate-400 transition-all duration-150 flex items-center justify-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider select-none cursor-pointer active:scale-95"
        >
          <QrCode size={11} className="text-indigo-400" /> {t("postcard.qr", "QR")}
        </button>
      </div>

      {/* ACTIVE SMART AI MATCH ALERTS (DISPLAYED INSIDE POST CARD) */}
      {postMatches.length > 0 && (
        isUnlocked ? (
          <div className="mt-4 p-4 rounded-xl border border-indigo-500/25 bg-indigo-950/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-indigo-500/20 text-[8px] font-mono font-bold tracking-wider text-indigo-300 rounded-bl-lg uppercase">
              {t("postcard.aiMatch", "SMART MATCH")}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 mb-3">
              <Sparkles size={12} className="text-indigo-400" /> {t("postcard.geminiMatches", "Smart similarity matches detected")}
            </div>
            
            <div className="space-y-2.5">
              {postMatches.map((match, mIdx) => (
                <div key={mIdx} className="p-3 bg-[#08080c] rounded-lg border border-slate-800 flex gap-3.5 items-start">
                  {/* Percentage Circle Ring */}
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#0e0e14] border border-indigo-500/20 rounded-full font-mono text-xs font-bold text-indigo-400">
                    {match.score}%
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-200 mb-0.5">{match.item}</h4>
                    <p className="text-[11px] text-slate-400 leading-normal mb-2">{match.reason}</p>
                    <a
                      href={getWhatsAppLink(match.contact, `Hi! LINCO automatically matched our posts. I believe your listing for '${match.item}' matches my post. Let's arrange a handover!`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition duration-150 cursor-pointer"
                    >
                      {t("postcard.contactOwner", "Contact Owner")} <ChevronRight size={10} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-[#08080c] text-center space-y-2.5">
            <div className="text-xs text-slate-300 font-semibold flex items-center justify-center gap-2">
              <Sparkles size={13} className="text-indigo-400" />
              {t("post.geminiPotentialMatches", `Detected ${postMatches.length} potential smart match${postMatches.length > 1 ? "es" : ""}!`)}
            </div>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-normal">
              {t("postcard.creatorNotice", "Only the verified creator of this listing can view similarity breakdowns and contact matching owners.")}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlockPost?.(post.id, e);
              }}
              className="mx-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              🔓 {t("post.unlockToViewMatches", "Unlock to View Matches")}
            </button>
          </div>
        )
      )}
    </motion.div>
  );
};
