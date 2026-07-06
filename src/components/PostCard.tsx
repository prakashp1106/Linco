/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckCircle2, Trash2, MapPin, Calendar, ShieldCheck, Share2, Download, QrCode, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Post, AIMatch } from "../types";
import { CATEGORIES } from "../constants";
import { LiveMissingTimer } from "./LiveMissingTimer";
import { MiniMap } from "./LeafletMap";
import { ErrorBoundary } from "./ErrorBoundary";
import { formatKolkataTimestamp } from "../utils/date";

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
  onSharePost,
  onShareAsImage,
  onShowQrCode,
  onManageClaims,
  onUnlockPost,
}) => {
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
      className={`bg-slate-950/40 hover:bg-slate-950/60 border rounded-3xl p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/5 hover:border-slate-800/85 cursor-pointer relative overflow-hidden group ${
        isLost ? "border-l-4 border-l-rose-500 border-slate-900/80" : "border-l-4 border-l-emerald-500 border-slate-900/80"
      } ${isResolved ? "opacity-70 border-l-slate-600" : ""} ${postMatches.length > 0 ? "border-r border-r-violet-500/25 shadow-lg shadow-violet-950/10" : ""}`}
    >
      {/* Top Metadata Row */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-slate-900">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Type badge */}
          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 ${
            isLost ? "bg-rose-950/40 text-rose-300 border border-rose-500/20" : "bg-emerald-950/40 text-emerald-300 border border-emerald-500/20"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLost ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"}`} />
            {isLost ? "Lost" : "Found"}
          </span>
          {/* Category badge */}
          {itemCat && (
            <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-800/80 text-slate-400 rounded-full">
              {itemCat.emoji} {itemCat.id}
            </span>
          )}
          {/* Urgency tag */}
          {post.urgency && post.urgency !== "Normal" && (
            <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-800/80 text-rose-400 rounded-full animate-pulse">
              ⚡ {post.urgency}
            </span>
          )}
          {/* Live Missing Since Timer */}
          {isLost && !isResolved && (
            <LiveMissingTimer createdTime={post.created} />
          )}
          {/* Resolved badge */}
          {isResolved && (
            <span className="text-[9px] font-extrabold px-2 py-0.5 bg-violet-950/40 text-violet-300 border border-violet-500/20 rounded-full uppercase tracking-wider">
              ✅ Resolved
            </span>
          )}
        </div>

        {/* Post Actions for owners */}
        <div className="flex items-center gap-1">
          {!isResolved && (
            <button
              onClick={(e) => onMarkResolved(post.id, e)}
              title="Mark as Resolved"
              className="p-1 rounded bg-violet-950/40 hover:bg-violet-950/80 border border-violet-500/20 text-violet-300 hover:text-white transition duration-150 cursor-pointer"
            >
              <CheckCircle2 size={12} />
            </button>
          )}
          <button
            onClick={(e) => onDeletePost(post.id, e)}
            title="Delete Listing"
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-rose-400 transition duration-150 cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-display font-bold text-slate-100 group-hover:text-cyan-300 transition duration-150 mb-1.5 leading-snug">
        {post.item}
      </h3>

      {/* Optional Image */}
      {post.image && (
        <div className="my-3 rounded-xl overflow-hidden max-h-44 border border-slate-900 bg-slate-950">
          <img
            src={post.image}
            alt={post.item}
            loading="lazy"
            className="w-full h-44 object-cover hover:scale-102 transition duration-300 referrer-policy-no-referrer"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Description Details */}
      <p className="text-xs text-slate-400 leading-relaxed mb-3 break-words">
        {post.details}
      </p>

      {/* Optional MiniMap Location Pin */}
      {post.latitude && post.longitude && (
        <div className="my-3 rounded-xl overflow-hidden pointer-events-none select-none relative h-28 border border-slate-900/50">
          <ErrorBoundary fallbackTitle="Location MiniMap Error">
            <MiniMap lat={post.latitude} lng={post.longitude} />
          </ErrorBoundary>
        </div>
      )}

      {/* Spacers & Views Row */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500 mb-4 font-mono">
        <span className="flex items-center gap-1"><MapPin size={11} className="text-slate-600" /> {post.address}</span>
        <span className="flex items-center gap-1"><Calendar size={11} className="text-slate-600" /> {formatKolkataTimestamp(post.created || post.timestamp)}</span>
        <span>👀 {post.views || 0} views</span>
        {post.reward && <span className="text-amber-400 font-bold">💰 Reward Offered: ₹{post.reward}</span>}
        <span className="flex items-center gap-1">
          <span>📞</span>
          {isUnlocked ? (
            <span className="text-emerald-400 font-bold bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/10">
              +91 {decryptedContacts[post.id] || post.contact}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                {post.maskedContact || "+91 ******" + (post.contact.startsWith("ENC:") ? "XX" : post.contact.slice(-2))}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlockPost?.(post.id, e);
                }}
                title="Unlock connection with Security PIN"
                className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-bold text-[9px] uppercase tracking-wider transition cursor-pointer"
              >
                🔓 Unlock Connection
              </button>
            </span>
          )}
        </span>
      </div>

      {/* Action Buttons: WhatsApp and Claim */}
      <div className="flex gap-2">
        {!isResolved ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartClaim(post, e);
            }}
            className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-slate-950 font-extrabold hover:text-black transition duration-150 flex items-center justify-center gap-1.5 text-xs text-center cursor-pointer shadow-lg shadow-violet-950/20"
          >
            🔒 {isLost ? "Verify Ownership" : "Submit Claim"}
          </button>
        ) : (
          <div className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-xs text-center select-none flex items-center justify-center gap-1.5">
            🎉 Reclaimed &amp; Resolved
          </div>
        )}

        {/* Manage Claims button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManageClaims(post);
          }}
          title="Manage Claims &amp; Approve/Reject"
          className="px-3 py-2 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-500/20 text-xs font-bold text-cyan-300 hover:text-cyan-100 transition duration-150 flex items-center justify-center gap-1.5 text-center cursor-pointer"
        >
          <ShieldCheck size={14} /> Claims
        </button>

        {/* Share button */}
        <button
          onClick={(e) => onSharePost(post, e)}
          title="Share/Copy Template Text"
          className="p-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition duration-150 flex items-center justify-center cursor-pointer"
        >
          <Share2 size={13} />
        </button>

        {/* Share as Image button */}
        <button
          type="button"
          onClick={(e) => onShareAsImage(post, e)}
          title="Download Post as Image Card"
          className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/30 hover:text-cyan-400 rounded-xl text-slate-400 transition duration-150 flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-wider font-sans select-none cursor-pointer"
        >
          <Download size={11} className="text-cyan-400" /> Image
        </button>

        {/* QR Code button */}
        <button
          type="button"
          onClick={(e) => onShowQrCode(post, e)}
          title="Interactive QR Code &amp; Print Settings"
          className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-violet-500/30 hover:text-violet-400 rounded-xl text-slate-400 transition duration-150 flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-wider font-sans select-none cursor-pointer"
        >
          <QrCode size={11} className="text-violet-400" /> QR Code
        </button>
      </div>

      {/* ACTIVE GOOGLE GEMINI AI MATCH ALERTS (DISPLAYED INSIDE POST CARD) */}
      {postMatches.length > 0 && (
        isUnlocked ? (
          <div className="mt-4 p-3.5 rounded-xl border border-violet-500/30 bg-violet-950/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-2 py-0.5 bg-violet-500/20 text-[7px] font-bold tracking-widest text-violet-300 rounded-bl-lg uppercase">
              AI Match
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-violet-300 uppercase tracking-wider mb-2">
              <Sparkles size={11} className="text-violet-400" /> Gemini matched this listing!
            </div>
            
            <div className="space-y-2.5">
              {postMatches.map((match, mIdx) => (
                <div key={mIdx} className="p-2.5 bg-[#020817]/60 rounded-lg border border-slate-900/80 flex gap-3 items-start">
                  {/* Percentage Circle Ring */}
                  <div className="flex-shrink-0 relative w-11 h-11 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-full font-mono text-[10px] font-extrabold text-violet-400 shadow-inner">
                    {match.score}%
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-200 mb-0.5">{match.item}</h4>
                    <p className="text-[10px] text-slate-400 leading-normal mb-1.5">{match.reason}</p>
                    <a
                      href={`https://wa.me/91${match.contact}?text=Hi! LINCO AI automatically matched our posts. I believe your listing for '${match.item}' matches my post. Let's arrange a handover!`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold rounded-md bg-violet-600 hover:bg-violet-500 text-slate-950 hover:text-black transition duration-150"
                    >
                      Contact Match Owner <ChevronRight size={10} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3.5 rounded-xl border border-slate-900/80 bg-slate-950/40 text-center space-y-2.5">
            <div className="text-xs text-slate-300 font-bold flex items-center justify-center gap-1.5">
              <Sparkles size={13} className="text-violet-400 animate-pulse" />
              Gemini AI detected {postMatches.length} potential smart match{postMatches.length > 1 ? "es" : ""}!
            </div>
            <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
              Only the verified creator of this listing can view similarity breakdowns and contact matching owners.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlockPost?.(post.id, e);
              }}
              className="mx-auto px-3.5 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider hover:bg-cyan-300 transition duration-150 shadow-md flex items-center gap-1 cursor-pointer"
            >
              🔓 Unlock to View matches
            </button>
          </div>
        )
      )}
    </motion.div>
  );
};
