import React from "react";
import { motion } from "motion/react";
import { 
  Bell, 
  X, 
  MessageSquare, 
  Sparkles, 
  CheckCircle, 
  UserCheck, 
  ArrowRight,
  Inbox
} from "lucide-react";
import { LincoNotification, Post } from "../types";

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
  posts = [],
  onOpenClaimTracker,
  onOpenOwnerClaims,
  onNavigateToTab
}) => {
  if (!isOpen) return null;

  // Filter ONLY real user notifications matching user's unlocked posts
  const realNotifications = notifications.filter((n) => unlockedPosts.includes(n.postId));

  const handleNotificationClick = (n: LincoNotification) => {
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

  const getNotificationIcon = (type: string, message: string) => {
    const lower = message.toLowerCase();
    if (lower.includes("chat") || lower.includes("message")) {
      return <MessageSquare size={16} className="text-emerald-400" />;
    }
    if (lower.includes("claim") || type === "claim") {
      return <UserCheck size={16} className="text-indigo-400" />;
    }
    if (lower.includes("resolved") || lower.includes("handover")) {
      return <CheckCircle size={16} className="text-cyan-400" />;
    }
    return <Sparkles size={16} className="text-amber-400" />;
  };

  const getActionLabel = (n: LincoNotification) => {
    if (n.matchId) return "View Match";
    if (n.claimId) return "Track Claim";
    if (n.type === "claim") return "Review Claim";
    return "Open";
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Activity Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#08080c] border-l border-[#161621] shadow-2xl h-full flex flex-col justify-between z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#161621] flex items-center justify-between select-none bg-[#050508]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Bell size={16} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-slate-100 uppercase tracking-wider">
                Activity Center
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Real-time alerts for your listings</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close activity center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 select-none">
          {realNotifications.length > 0 ? (
            <div className="space-y-3">
              {realNotifications.map((notif) => {
                const targetPost = posts.find((p) => p.id === notif.postId);
                const actionLabel = getActionLabel(notif);
                
                return (
                  <div 
                    key={notif.id}
                    className="p-4 bg-[#0a0a0f] border border-[#161622] hover:border-slate-700 rounded-2xl flex flex-col gap-3 transition shadow-lg shadow-black/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl mt-0.5 shrink-0">
                        {getNotificationIcon(notif.type, notif.message)}
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider">
                            {targetPost ? `${targetPost.type}: ${targetPost.item}` : "Item Alert"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNotificationClick(notif)}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/40 mt-1"
                    >
                      <span>{actionLabel}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Inbox size={22} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">No Pending Notifications</h4>
                <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto leading-relaxed">
                  When someone finds or claims an item matching your post, notifications will appear here.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#050508] border-t border-[#13131d] text-center select-none">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">
            LINCO AI Match & Return Notifications
          </span>
        </div>
      </motion.div>
    </div>
  );
};
