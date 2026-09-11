import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Bell, 
  X, 
  MessageSquare, 
  Sparkles, 
  CheckCircle, 
  UserCheck, 
  ArrowRight, 
  Inbox, 
  ShieldCheck, 
  CheckCheck,
  ClipboardList,
  HeartHandshake,
  Package,
  Award
} from "lucide-react";
import { LincoNotification, Post } from "../types";
import { apiService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { getNotificationTaxonomy, getLocalizedNotificationMessage } from "../services/i18n";

interface ActivityCenterProps {
  unlockedPosts: string[];
  onViewMatch: (matchId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  notifications: LincoNotification[];
  onRefreshNotifications: () => void;
  addToast: (msg: string, type?: "success" | "warn" | "error" | "info") => void;
  posts?: Post[];
  onOpenClaimTracker?: (claimId: string) => void;
  onOpenOwnerClaims?: (post: any) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationCenter: React.FC<ActivityCenterProps> = ({
  unlockedPosts,
  onViewMatch,
  isOpen,
  onClose,
  notifications,
  onRefreshNotifications,
  posts = [],
  onOpenClaimTracker,
  onOpenOwnerClaims,
  onNavigateToTab,
  addToast
}) => {
  const [markingAll, setMarkingAll] = useState(false);
  const { t } = useLanguage();

  if (!isOpen) return null;

  // Filter ONLY real user notifications matching user's unlocked posts
  // Strict event deduplication: 1 match event = 1 card (never duplicate cards for the same match)
  const uniqueNotificationsMap = new Map<string, LincoNotification>();
  notifications
    .filter((n) => unlockedPosts.includes(n.postId))
    .forEach((n) => {
      const dedupeKey = n.matchId ? `match_${n.matchId}` : (n.claimId ? `claim_${n.claimId}` : n.id);
      if (!uniqueNotificationsMap.has(dedupeKey)) {
        uniqueNotificationsMap.set(dedupeKey, n);
      } else {
        const existing = uniqueNotificationsMap.get(dedupeKey)!;
        if (existing.read && !n.read) {
          uniqueNotificationsMap.set(dedupeKey, n);
        }
      }
    });

  const realNotifications = Array.from(uniqueNotificationsMap.values());
  const unreadCount = realNotifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (n: LincoNotification) => {
    const taxonomy = getNotificationTaxonomy(n, t);

    // Mark as read immediately
    if (!n.read) {
      try {
        await apiService.markNotificationRead(n.id);
        onRefreshNotifications();
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    onClose();

    // 1. Taxonomy Route Target: Chat
    if (taxonomy.routeTarget === "chat" && n.matchId) {
      onViewMatch(n.matchId);
      return;
    }

    // 2. Taxonomy Route Target: Claims
    if (taxonomy.routeTarget === "claims") {
      if (n.claimId && onOpenClaimTracker) {
        onOpenClaimTracker(n.claimId);
        return;
      }
      if (n.postId) {
        const targetPost = posts.find((p) => p.id === n.postId);
        if (targetPost && onOpenOwnerClaims) {
          onOpenOwnerClaims(targetPost);
          return;
        }
      }
    }

    // 3. Direct match routing
    if (n.matchId) {
      onViewMatch(n.matchId);
      return;
    }

    // 4. Direct claimId routing
    if (n.claimId && onOpenClaimTracker) {
      onOpenClaimTracker(n.claimId);
      return;
    }

    // 5. Direct claim on user's post
    if (n.type === "claim" && n.postId) {
      const targetPost = posts.find((p) => p.id === n.postId);
      if (targetPost && onOpenOwnerClaims) {
        onOpenOwnerClaims(targetPost);
        return;
      }
    }

    // 6. Match category
    if (n.type === "match") {
      if (onNavigateToTab) {
        onNavigateToTab("matches");
      }
      return;
    }

    // Default fallback: Go to feed
    if (onNavigateToTab) {
      onNavigateToTab("feed");
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await apiService.markAllNotificationsRead();
      onRefreshNotifications();
      addToast(t("notifications.readAllSuccess", "All notifications marked as read"), "success");
    } catch (err) {
      console.error("Mark all read failed:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const renderNotificationIcon = (iconType: string) => {
    switch (iconType) {
      case "messageSquare":
        return <MessageSquare size={15} className="text-emerald-400" />;
      case "award":
        return <Award size={15} className="text-emerald-400" />;
      case "checkCircle":
        return <CheckCircle size={15} className="text-teal-400" />;
      case "package":
        return <Package size={15} className="text-amber-400" />;
      case "heartHandshake":
        return <HeartHandshake size={15} className="text-cyan-400" />;
      case "shieldCheck":
        return <ShieldCheck size={15} className="text-violet-400" />;
      case "userCheck":
        return <UserCheck size={15} className="text-blue-400" />;
      case "clipboard":
        return <ClipboardList size={15} className="text-yellow-400" />;
      case "sparkles":
        return <Sparkles size={15} className="text-indigo-400" />;
      default:
        return <Bell size={15} className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Activity Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#0c0e16] border-l border-slate-800 shadow-2xl h-full flex flex-col justify-between z-10"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between select-none bg-[#121520]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-sm text-slate-100 uppercase tracking-wider">
                  {t("notifications.centerTitle", "Activity Center")}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {unreadCount} {t("notifications.unread", "unread")}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {t("notifications.centerSubtitle", "Real-time alerts for your listings")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-[11px] font-medium text-slate-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg hover:bg-slate-800/60 transition flex items-center gap-1 cursor-pointer"
                title={t("notifications.readAll", "Mark all as read")}
              >
                <CheckCheck size={13} />
                <span>{t("notifications.readAll", "Read all")}</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Close activity center"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 select-none">
          {realNotifications.length > 0 ? (
            <div className="space-y-2.5">
              {realNotifications.map((notif) => {
                const targetPost = posts.find((p) => p.id === notif.postId);
                const taxonomy = getNotificationTaxonomy(notif, t);
                const localizedMsg = getLocalizedNotificationMessage(notif, t);
                
                return (
                  <div 
                    key={notif.id}
                    className={`p-4 rounded-2xl flex flex-col gap-3 transition border ${
                      !notif.read 
                        ? `bg-[#121520] ${taxonomy.cardBorder} shadow-lg` 
                        : "bg-[#0c0e16] border-slate-800/80 hover:border-slate-700 opacity-90"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                        !notif.read ? `${taxonomy.badgeBg} ${taxonomy.badgeBorder}` : "bg-slate-900/60 border-slate-800"
                      }`}>
                        {renderNotificationIcon(taxonomy.iconType)}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            )}
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider border ${taxonomy.badgeBg} ${taxonomy.badgeText} ${taxonomy.badgeBorder}`}>
                              {taxonomy.categoryTitle}
                            </span>
                            {targetPost && (
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                                • {targetPost.item}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                          {localizedMsg}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 mt-0.5 ${
                        !notif.read
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/50"
                          : "bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800"
                      }`}
                    >
                      <span>{taxonomy.actionTitle}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
                <Inbox size={26} />
              </div>
              <div className="space-y-1.5 px-4">
                <h4 className="text-sm font-bold text-slate-200">
                  {t("notifications.emptyTitle", "You're all caught up.")}
                </h4>
                <p className="text-xs text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                  {t("notifications.emptySubtitle", "We will notify you when someone reports an item that matches yours.")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0c0e16] border-t border-slate-800 text-center select-none">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            {t("notifications.networkFooter", "Verified Community Network • LINCO India")}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
