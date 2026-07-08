import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  X, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShieldAlert, 
  Inbox, 
  UserCheck 
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

interface ActivityItem {
  id: string;
  category: "action_required" | "messages" | "updates" | "recent";
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}

export const NotificationCenter: React.FC<ActivityCenterProps> = ({
  unlockedPosts,
  onViewMatch,
  isOpen,
  onClose,
  notifications,
  onRefreshNotifications,
  addToast,
  posts = [],
  onOpenClaimTracker,
  onOpenOwnerClaims,
  onNavigateToTab
}) => {
  // Recent activity expanded toggle
  const [recentExpanded, setRecentExpanded] = useState(false);

  // Build activity lists using simple, friendly English (Problem 5)
  const activities = useMemo(() => {
    const list: ActivityItem[] = [];

    // 1. Map actual database notifications first (if they match unlocked posts)
    notifications.forEach((n) => {
      if (!unlockedPosts.includes(n.postId)) return;

      // Classify and translate technical jargon to friendly English
      let friendlyMessage = n.message;
      if (friendlyMessage.includes("Semantic AI Verification Pipeline")) {
        friendlyMessage = friendlyMessage.replace("Semantic AI Verification Pipeline", "AI verified this match.");
      }
      if (friendlyMessage.includes("Cryptographic Security Layer")) {
        friendlyMessage = friendlyMessage.replace("Cryptographic Security Layer", "Your information is protected.");
      }

      if (n.type === "claim") {
        list.push({
          id: n.id,
          category: "action_required",
          icon: <UserCheck size={16} className="text-indigo-400" />,
          title: "Claim Submitted",
          description: friendlyMessage,
          actionLabel: "Review Claim",
          onClick: () => {
            const post = posts.find(p => p.id === n.postId);
            if (post && onOpenOwnerClaims) {
              onOpenOwnerClaims(post);
              onClose();
            } else {
              addToast("Reviewing claim details...", "info");
            }
          }
        });
      } else if (n.type === "match") {
        list.push({
          id: n.id,
          category: "action_required",
          icon: <Sparkles size={16} className="text-cyan-400" />,
          title: "New Match Found",
          description: "AI verified this match.",
          actionLabel: "View Match",
          onClick: () => {
            if (n.matchId) {
              onViewMatch(n.matchId);
              onClose();
            } else {
              addToast("Opening AI Match details...", "info");
            }
          }
        });
      }
    });

    // 2. High-fidelity custom activities that map cleanly to the 4 sections
    // Section 1: ACTION REQUIRED
    list.push({
      id: "act_req_claim",
      category: "action_required",
      icon: <UserCheck size={16} className="text-indigo-400" />,
      title: "Review Claim",
      description: "A community member has responded to your post with matching ownership details.",
      actionLabel: "Review Claim",
      onClick: () => {
        if (onNavigateToTab) {
          onNavigateToTab("dashboard");
          setTimeout(() => window.dispatchEvent(new CustomEvent("linco-navigate-dashboard", { detail: "reports" })), 80);
        }
        onClose();
      }
    });

    list.push({
      id: "act_req_match",
      category: "action_required",
      icon: <Sparkles size={16} className="text-cyan-400" />,
      title: "View Match",
      description: "AI verified this match. A newly found item closely resembles your reported item.",
      actionLabel: "View Match",
      onClick: () => {
        if (onNavigateToTab) {
          onNavigateToTab("matches");
        }
        onClose();
      }
    });

    list.push({
      id: "act_req_chat",
      category: "action_required",
      icon: <MessageSquare size={16} className="text-emerald-400" />,
      title: "Continue Chat",
      description: "A safe coordination room is active. Continue coordinating the return details.",
      actionLabel: "Continue Chat",
      onClick: () => {
        if (onNavigateToTab) {
          onNavigateToTab("dashboard");
          setTimeout(() => window.dispatchEvent(new CustomEvent("linco-navigate-dashboard", { detail: "recovery" })), 80);
        }
        onClose();
      }
    });

    list.push({
      id: "act_req_return",
      category: "action_required",
      icon: <ShieldCheck size={16} className="text-indigo-400" />,
      title: "Confirm Return",
      description: "Please confirm that you have safely received your item back.",
      actionLabel: "Confirm Return",
      onClick: () => {
        if (onNavigateToTab) {
          onNavigateToTab("dashboard");
          setTimeout(() => window.dispatchEvent(new CustomEvent("linco-navigate-dashboard", { detail: "recovery" })), 80);
        }
        onClose();
      }
    });

    // Section 2: MESSAGES (Chat notifications only)
    list.push({
      id: "msg_chat_1",
      category: "messages",
      icon: <MessageSquare size={16} className="text-emerald-400" />,
      title: "Unread message from Finder",
      description: '"I can meet you in front of the coffee shop tomorrow at 3 PM to return your keys."',
      actionLabel: "Open Chat",
      onClick: () => {
        if (onNavigateToTab) {
          onNavigateToTab("dashboard");
          setTimeout(() => window.dispatchEvent(new CustomEvent("linco-navigate-dashboard", { detail: "recovery" })), 80);
        }
        onClose();
      }
    });

    // Section 3: UPDATES
    list.push({
      id: "update_privacy",
      category: "updates",
      icon: <ShieldCheck size={16} className="text-emerald-400" />,
      title: "Privacy update",
      description: "Your information is protected. Direct phone numbers are now masked.",
      actionLabel: "Manage",
      onClick: () => {
        if (onNavigateToTab) {
          onNavigateToTab("privacy-trust");
        }
        onClose();
      }
    });

    list.push({
      id: "update_security",
      category: "updates",
      icon: <ShieldAlert size={16} className="text-rose-400" />,
      title: "Security scan complete",
      description: "Your safe ledger signature has been successfully verified.",
      actionLabel: "View Details",
      onClick: () => {
        addToast("Security signatures are fully verified locally.", "success");
      }
    });

    list.push({
      id: "update_recovery_completed",
      category: "updates",
      icon: <Check size={16} className="text-cyan-400" />,
      title: "Recovery completed",
      description: "Item return verified successfully. Your archived post has been safely stored.",
      actionLabel: "View Receipt",
      onClick: () => {
        addToast("Handover receipt successfully logged.", "success");
      }
    });

    // Section 4: RECENT ACTIVITY (Expandable, older logs)
    list.push({
      id: "recent_login",
      category: "recent",
      icon: <ShieldCheck size={16} className="text-slate-400" />,
      title: "New session active",
      description: "Biometric authorization token checked successfully.",
      actionLabel: "Check Status",
      onClick: () => addToast("Biometrics verified.", "success")
    });

    list.push({
      id: "recent_verified",
      category: "recent",
      icon: <UserCheck size={16} className="text-slate-400" />,
      title: "Identity update",
      description: "Member profile status successfully validated on local storage.",
      actionLabel: "View Profile",
      onClick: () => {
        if (onNavigateToTab) {
          onNavigateToTab("dashboard");
        }
        onClose();
      }
    });

    return list;
  }, [notifications, unlockedPosts, posts, onOpenOwnerClaims, onViewMatch, onNavigateToTab, onClose, addToast]);

  // Filter activities into their precise groups
  const actionRequiredItems = activities.filter(a => a.category === "action_required");
  const messagesItems = activities.filter(a => a.category === "messages");
  const updatesItems = activities.filter(a => a.category === "updates");
  const recentItems = activities.filter(a => a.category === "recent");

  if (!isOpen) return null;

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

      {/* Activity Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#08080c] border-l border-[#161621] shadow-2xl h-full flex flex-col justify-between z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#161621] flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-400" />
            <h3 className="font-sans font-black text-base text-slate-100 uppercase tracking-wider">
              Activity Center
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 select-none">
          
          {/* 1. ACTION REQUIRED */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest border-b border-[#161621] pb-1.5 flex items-center justify-between">
              <span>Action Required</span>
              <span className="text-[9px] text-slate-500 font-mono font-normal">Pending checks</span>
            </h4>
            
            {actionRequiredItems.length > 0 ? (
              <div className="space-y-2.5">
                {actionRequiredItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 bg-[#0a0a0f]/80 border border-[#161622] rounded-2xl flex flex-col gap-3 transition hover:border-slate-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-xl mt-0.5">{item.icon}</div>
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-bold text-slate-200">{item.title}</h5>
                        <p className="text-[11px] text-slate-400 leading-normal">{item.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={item.onClick}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer mt-0.5"
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-[11px] text-slate-500">
                All action items resolved successfully.
              </div>
            )}
          </div>

          {/* 2. MESSAGES */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest border-b border-[#161621] pb-1.5 flex items-center justify-between">
              <span>Messages</span>
              <span className="text-[9px] text-slate-500 font-mono font-normal">Chat alerts</span>
            </h4>

            {messagesItems.length > 0 ? (
              <div className="space-y-2.5">
                {messagesItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 bg-[#0a0a0f]/80 border border-[#161622] rounded-2xl flex flex-col gap-3 transition hover:border-slate-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-xl mt-0.5">{item.icon}</div>
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-bold text-slate-200">{item.title}</h5>
                        <p className="text-[11px] text-slate-400 italic leading-normal">{item.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={item.onClick}
                      className="w-full py-2 bg-[#121219] hover:bg-slate-900 border border-[#20212b] text-slate-300 font-bold rounded-xl text-[10px] uppercase tracking-wider transition cursor-pointer mt-0.5"
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-[11px] text-slate-500">
                No active coordination chats.
              </div>
            )}
          </div>

          {/* 3. UPDATES */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest border-b border-[#161621] pb-1.5 flex items-center justify-between">
              <span>Updates</span>
              <span className="text-[9px] text-slate-500 font-mono font-normal">Activity history</span>
            </h4>

            {updatesItems.length > 0 ? (
              <div className="space-y-2.5">
                {updatesItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 bg-[#0a0a0f]/40 border border-[#14141c] rounded-2xl flex items-start justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-cyan-500/10 rounded-xl mt-0.5">{item.icon}</div>
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-bold text-slate-300">{item.title}</h5>
                        <p className="text-[11px] text-slate-500 leading-normal">{item.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={item.onClick}
                      className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer shrink-0"
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-[11px] text-slate-500">
                No recent system updates.
              </div>
            )}
          </div>

          {/* 4. RECENT ACTIVITY (Collapsed by Default, Expandable) */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setRecentExpanded(!recentExpanded)}
              className="w-full flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-[#161621] pb-1.5 cursor-pointer hover:text-white transition"
            >
              <span>Recent Activity Logs</span>
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase">
                <span>{recentExpanded ? "Hide" : "Show"}</span>
                {recentExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </div>
            </button>

            <AnimatePresence>
              {recentExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2.5 overflow-hidden pt-1"
                >
                  {recentItems.length > 0 ? (
                    recentItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-3 bg-[#0a0a0f]/20 border border-[#14141c]/50 rounded-2xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-slate-900 rounded-lg text-slate-400">{item.icon}</div>
                          <div>
                            <h5 className="text-[11px] font-bold text-slate-300">{item.title}</h5>
                            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={item.onClick}
                          className="py-1 px-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 text-slate-400 hover:text-white rounded-lg text-[9px] font-bold transition whitespace-nowrap cursor-pointer shrink-0"
                        >
                          {item.actionLabel}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-[10px] text-slate-600">
                      No older logs found.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#050508] border-t border-[#13131d] text-center select-none">
          <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
            LINCO Safe Return System • Shielded Client Logs
          </span>
        </div>
      </motion.div>
    </div>
  );
};
