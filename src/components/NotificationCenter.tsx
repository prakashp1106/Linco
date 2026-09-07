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
  Shield,
  CheckCheck
} from "lucide-react";
import { LincoNotification, Post } from "../types";
import { apiService } from "../services/api";

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

  if (!isOpen) return null;

  // Filter ONLY real user notifications matching user's unlocked posts
  const realNotifications = notifications.filter((n) => unlockedPosts.includes(n.postId));
  const unreadCount = realNotifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (n: LincoNotification) => {
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

    // 1. If notification has a matchId -> Route directly to the Match details
    if (n.matchId) {
      onViewMatch(n.matchId);
      return;
    }

    // 2. If notification has a claimId -> Open the Claim Tracker modal
    if (n.claimId && onOpenClaimTracker) {
      onOpenClaimTracker(n.claimId);
      return;
    }

    // 3. If notification is for a claim on user's post -> Open Owner Claims Review
    if (n.type === "claim" && n.postId) {
      const targetPost = posts.find((p) => p.id === n.postId);
      if (targetPost && onOpenOwnerClaims) {
        onOpenOwnerClaims(targetPost);
        return;
      }
    }

    // 4. If notification is a match type -> Go to matches tab
    if (n.type === "match") {
      if (onNavigateToTab) {
        onNavigateToTab("matches");
      }
      return;
    }

    // Default fallback: Go to feed to see post updates
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
      addToast("All notifications marked as read", "success");
    } catch (err) {
      console.error("Mark all read failed:", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: string, message: string) => {
    const lower = (message || "").toLowerCase();
    const t = (type || "").toLowerCase();
    if (lower.includes("chat") || lower.includes("message") || t === "chat") {
      return <MessageSquare size={15} className="text-emerald-400" />;
    }
    if (lower.includes("claim") || t === "claim") {
      return <UserCheck size={15} className="text-indigo-400" />;
    }
    if (lower.includes("trust") || t === "trust") {
      return <Shield size={15} className="text-amber-400" />;
    }
    if (lower.includes("resolved") || lower.includes("handover") || t === "handover") {
      return <CheckCircle size={15} className="text-cyan-400" />;
    }
    return <Sparkles size={15} className="text-indigo-400" />;
  };

  const getActionLabel = (n: LincoNotification) => {
    const t = (n.type || "").toLowerCase();
    if (t === "chat" || t === "chat_message") return "Open Chat";
    if (t === "handover" || t === "handover_updated") return "Confirm Handover";
    if (t === "resolved" || t === "case_resolved" || t === "item_received") return "View Case";
    if (t === "verification") return "Verify Answer";
    if (t === "claim" || t === "claim_received" || t === "claim_approved" || t === "claim_rejected" || n.claimId) return "Review Claim";
    if (t === "trust" || t === "trust_updated") return "Confirm Trust";
    if (n.matchId || t === "match") return "View Match";
    return "View Details";
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
        className="relative w-full max-w-md bg-[#090b10] border-l border-[#1a1d2d] shadow-2xl h-full flex flex-col justify-between z-10"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#181b2a] flex items-center justify-between select-none bg-[#0a0d14]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bell size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-sm text-slate-100 uppercase tracking-wider">
                  Activity Center
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Real-time alerts for your listings</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-[11px] font-medium text-slate-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg hover:bg-slate-800/60 transition flex items-center gap-1 cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck size={13} />
                <span>Read all</span>
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
                const actionLabel = getActionLabel(notif);
                
                return (
                  <div 
                    key={notif.id}
                    className={`p-4 rounded-2xl flex flex-col gap-3 transition border ${
                      !notif.read 
                        ? "bg-[#0f1320] border-indigo-500/30 shadow-[0_4px_20px_-4px_rgba(79,70,229,0.15)]" 
                        : "bg-[#0a0c13] border-[#161826] hover:border-slate-800 opacity-90"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${
                        !notif.read ? "bg-indigo-950/60 border-indigo-500/30" : "bg-slate-900/60 border-slate-800"
                      }`}>
                        {getNotificationIcon(notif.type, notif.message)}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                            )}
                            <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider truncate">
                              {targetPost ? `${targetPost.type}: ${targetPost.item}` : "Listing Alert"}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed">
                          {notif.message}
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
                      <span>{actionLabel}</span>
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
                <h4 className="text-sm font-bold text-slate-200">You're all caught up.</h4>
                <p className="text-xs text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                  We will notify you when someone reports an item that matches yours.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#07080d] border-t border-[#141624] text-center select-none">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            Verified Community Network • LINCO India
          </span>
        </div>
      </motion.div>
    </div>
  );
};
