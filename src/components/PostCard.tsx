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
import { formatLocalTimestamp } from "../utils/date";
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
      className={`bg-white hover:bg-slate-50/40 border border-slate-200 hover:border-slate-300 rounded-2xl p-5 sm:p-6 transition-all duration-200 cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md ${
        isResolved ? "opacity-75 bg-slate-50/50" : ""
      } ${postMatches.length > 0 ? "ring-1 ring-indigo-500/20" : ""}`}
    >
      {/* Top Metadata Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type badge */}
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
            isLost ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLost ? "bg-rose-500" : "bg-emerald-500"}`} />
            {isLost ? t("feed.lost", "Lost") : t("feed.found", "Found")}
          </span>

          {/* Category badge */}
          {itemCat && (
            <span className="text-[11px] font-medium px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-full">
              {itemCat.emoji} {t(`category.${itemCat.id.toLowerCase().replace(/[^a-z0-9]/g, "")}`, itemCat.id)}
            </span>
          )}

          {/* Urgency tag */}
          {post.urgency && post.urgency !== "Normal" && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full">
              ⚡ {t(`urgency.${post.urgency.toLowerCase()}`, post.urgency)}
            </span>
          )}

          {/* Live Missing Since Timer */}
          {isLost && !isResolved && (
            <LiveMissingTimer createdTime={post.created} />
          )}

          {/* Resolved badge */}
          {isResolved && (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
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
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white border border-slate-200 text-slate-600 transition cursor-pointer active:scale-90"
            >
              <CheckCircle2 size={14} />
            </button>
          )}
          <button
            onClick={(e) => onDeletePost(post.id, e)}
            title={t("postcard.deleteListing", "Delete Listing")}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 border border-slate-200 transition cursor-pointer active:scale-90"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition duration-150 mb-1.5 leading-snug break-words">
        {post.item}
      </h3>

      {/* Optional Image */}
      {post.image && (
        <div className="my-3 rounded-xl overflow-hidden max-h-52 border border-slate-200 bg-slate-50 relative">
          <img
            src={post.image}
            alt={post.item}
            loading="lazy"
            className="w-full h-52 object-cover hover:scale-[1.01] transition duration-300"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Description Details */}
      <p className="text-xs text-slate-600 leading-relaxed mb-3.5 break-words">
        {post.details}
      </p>

      {/* Optional MiniMap Location Pin */}
      {post.latitude && post.longitude && (
        <div className="my-3 rounded-xl overflow-hidden pointer-events-none select-none relative h-28 border border-slate-200">
          <ErrorBoundary fallbackTitle="Location MiniMap Error">
            <MiniMap lat={post.latitude} lng={post.longitude} />
          </ErrorBoundary>
        </div>
      )}

      {/* Spacers & Location/Date Row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4 min-w-0">
        <span className="flex items-center gap-1.5 font-medium text-slate-700 min-w-0 max-w-full">
          <MapPin size={13} className="text-indigo-600 shrink-0" /> 
          <span className="truncate">{post.address}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={13} className="text-slate-400" /> {formatLocalTimestamp(post.created || post.timestamp)}
        </span>
        <span className="flex items-center gap-1.5">
          <Eye size={13} className="text-slate-400" /> {post.views || 0} views
        </span>
        {post.reward && (
          <span className="flex items-center gap-1 text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
            <Award size={13} className="text-amber-600" /> Reward: ₹{post.reward}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Phone size={13} className="text-slate-400" />
          {isUnlocked ? (
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              +91 {decryptedContacts[post.id] || post.contact}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-medium">
                {post.maskedContact || "+91 ******" + (post.contact.startsWith("ENC:") ? "XX" : post.contact.slice(-2))}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlockPost?.(post.id, e);
                }}
                title={t("postcard.unlockWithPin", "Unlock connection with Security PIN")}
                className="px-2.5 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-[10px] transition-all cursor-pointer active:scale-95"
              >
                <Unlock size={10} className="inline mr-1" /> {t("postcard.unlockConnection", "Unlock")}
              </button>
            </span>
          )}
        </span>
      </div>

      {/* Action Buttons: Primary + Secondary Options */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
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
                className="flex-1 min-w-[130px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all flex items-center justify-center gap-1.5 text-xs text-center cursor-pointer shadow-xs active:scale-95"
              >
                <Sparkles size={14} /> {t("postcard.iHaveThisItem", "I Have This Item")}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartClaim(post, e);
              }}
              className={`flex-1 min-w-[120px] py-2.5 rounded-xl ${
                isLost
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              } font-semibold transition-all flex items-center justify-center gap-1.5 text-xs text-center cursor-pointer active:scale-95`}
            >
              <ShieldCheck size={14} /> {isLost ? t("matches.verifyOwnership", "Verify Ownership") : t("feed.claimButton", "Submit Claim")}
            </button>
          </>
        ) : (
          <div className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs text-center select-none flex items-center justify-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600" /> {t("postcard.reclaimed", "Reclaimed & Handed Over")}
          </div>
        )}

        {/* Manage Claims button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManageClaims(post);
          }}
          title={t("postcard.manageClaims", "Manage Claims & Approve/Reject")}
          className="px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-all flex items-center justify-center gap-1.5 text-center cursor-pointer active:scale-95"
        >
          <ShieldCheck size={14} className="text-indigo-600" /> {t("postcard.claims", "Claims")}
        </button>

        {/* Share button */}
        <button
          onClick={(e) => onSharePost(post, e)}
          title={t("postcard.shareTemplate", "Share/Copy Template Text")}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer active:scale-95"
        >
          <Share2 size={14} />
        </button>

        {/* Share as Image button */}
        <button
          type="button"
          onClick={(e) => onShareAsImage(post, e)}
          title={t("postcard.downloadCard", "Download Post as Image Card")}
          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-1 text-[11px] font-medium select-none cursor-pointer active:scale-95"
        >
          <Download size={13} className="text-slate-500" /> {t("postcard.image", "Card")}
        </button>

        {/* QR Code button */}
        <button
          type="button"
          onClick={(e) => onShowQrCode(post, e)}
          title={t("postcard.qrSettings", "Interactive QR Code & Print Settings")}
          className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center gap-1 text-[11px] font-medium select-none cursor-pointer active:scale-95"
        >
          <QrCode size={13} className="text-slate-500" /> {t("postcard.qr", "QR")}
        </button>
      </div>

      {/* ACTIVE SMART SIMILARITY MATCH ALERTS */}
      {postMatches.length > 0 && (
        isUnlocked ? (
          <div className="mt-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 relative overflow-hidden text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 mb-2.5">
              <Sparkles size={13} className="text-indigo-600" /> {t("postcard.geminiMatches", "Potential community matches detected")}
            </div>
            
            <div className="space-y-2">
              {postMatches.map((match, mIdx) => (
                <div key={mIdx} className="p-3 bg-white rounded-lg border border-slate-200 flex gap-3 items-center justify-between shadow-2xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{match.item}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {match.score}% match
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal line-clamp-1 mt-0.5">{match.reason}</p>
                  </div>
                  
                  <a
                    href={getWhatsAppLink(match.contact, `Hi! LINCO automatically matched our posts. I believe your listing for '${match.item}' matches my post. Let's arrange a handover!`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    {t("postcard.contactOwner", "Connect")} <ChevronRight size={12} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2">
            <div className="text-xs text-slate-800 font-semibold flex items-center justify-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600" />
              {t("post.geminiPotentialMatches", `Detected ${postMatches.length} potential match${postMatches.length > 1 ? "es" : ""}`)}
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
              {t("postcard.creatorNotice", "Only the verified creator can view similarity details and contact matching owners.")}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlockPost?.(post.id, e);
              }}
              className="mx-auto px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Unlock size={12} /> {t("post.unlockToViewMatches", "Unlock Matches")}
            </button>
          </div>
        )
      )}
    </motion.div>
  );
};
