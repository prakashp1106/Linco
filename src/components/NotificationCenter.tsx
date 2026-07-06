import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, BellOff, X, Check, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
import { LincoNotification } from "../types";
import { apiService } from "../services/api";

interface NotificationCenterProps {
  unlockedPosts: string[];
  onViewMatch: (matchId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  notifications: LincoNotification[];
  onRefreshNotifications: () => void;
  addToast: (msg: string, type?: "success" | "warn" | "error" | "info") => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  unlockedPosts,
  onViewMatch,
  isOpen,
  onClose,
  notifications,
  onRefreshNotifications,
  addToast
}) => {
  const [markingId, setMarkingId] = useState<string | null>(null);

  // Filter notifications only relevant to user's created/unlocked posts
  const userNotifications = notifications.filter((n) => {
    return unlockedPosts.includes(n.postId);
  });

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkingId(id);
    try {
      const res = await apiService.markNotificationRead(id);
      if (res.success) {
        onRefreshNotifications();
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = userNotifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map((n) => apiService.markNotificationRead(n.id)));
      onRefreshNotifications();
      addToast("All alerts marked as read.", "success");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-50 flex justify-end" id="notification-center-overlay">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-md bg-slate-950 border-l border-slate-900 h-full flex flex-col shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-900">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className="text-cyan-400" size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-400 text-[8px] font-black text-slate-950">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-extrabold text-sm text-slate-100 uppercase tracking-wider">
                  Notification Center
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[9px] font-mono font-black text-cyan-400 hover:text-cyan-300 transition uppercase tracking-widest px-2 py-1 rounded border border-cyan-500/10 hover:border-cyan-500/30"
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* List area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {userNotifications.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <BellOff className="text-slate-700 mx-auto" size={32} />
                  <p className="text-xs text-slate-500 font-mono">No active alerts for your reported items.</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto font-mono">
                    When you create a Lost or Found post, LINCO AI's smart engine runs in the background and posts alerts directly to your inbox here.
                  </p>
                </div>
              ) : (
                userNotifications.map((n) => {
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.type === "match" && n.matchId) {
                          onViewMatch(n.matchId);
                          onClose();
                        }
                      }}
                      className={`p-4 rounded-xl border text-left space-y-2 transition cursor-pointer relative overflow-hidden ${
                        n.read
                          ? "bg-slate-950/40 border-slate-900/60 text-slate-400 hover:border-slate-900"
                          : "bg-slate-950 border-slate-900 hover:border-slate-800 text-slate-200"
                      }`}
                    >
                      {/* Unread Indicator dot */}
                      {!n.read && (
                        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                      )}

                      {/* Title row */}
                      <div className="flex items-center gap-1.5">
                        {n.type === "match" ? (
                          <>
                            <Sparkles size={11} className="text-cyan-400" />
                            <span className="text-[9px] font-mono font-bold uppercase text-cyan-400">
                              Smart AI Match Alert
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={11} className="text-slate-400" />
                            <span className="text-[9px] font-mono font-bold uppercase text-slate-400">
                              System Message
                            </span>
                          </>
                        )}
                        <span className="text-[8px] font-mono text-slate-600">
                          • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Message details */}
                      <p className="text-xs leading-relaxed font-mono">
                        {n.message}
                      </p>

                      {/* Bottom action bar */}
                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                        {n.type === "match" ? (
                          <span className="text-cyan-400 flex items-center gap-1 font-bold group-hover:translate-x-1 transition">
                            Review Match Details <ArrowRight size={10} />
                          </span>
                        ) : (
                          <span />
                        )}

                        {!n.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            disabled={markingId === n.id}
                            className="p-1 px-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition disabled:opacity-50 flex items-center gap-1 hover:border-cyan-500/20"
                          >
                            <Check size={10} />
                            <span>Mark Read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
