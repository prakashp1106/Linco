import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  X, 
  Check, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Layers, 
  MessageSquare, 
  FileCheck, 
  ShieldCheck, 
  Shield, 
  Search, 
  Pin, 
  CheckCircle2, 
  Volume2, 
  Image as ImageIcon,
  Lock,
  Clock,
  Filter,
  Inbox
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
  // New props for full interactivity
  posts?: Post[];
  onOpenClaimTracker?: (claimId: string) => void;
  onOpenOwnerClaims?: (post: any) => void;
  onNavigateToTab?: (tab: string) => void;
}

interface ActivityItem {
  id: string;
  type: "match" | "claim" | "chat" | "recovery" | "security";
  title: string;
  description: string;
  createdAt: number;
  read: boolean;
  statusColor: "cyan" | "emerald" | "indigo" | "purple" | "rose" | "slate";
  progress?: string;
  postId?: string;
  matchId?: string;
  claimId?: string;
  actionLabel: string;
  actionType: "view_match" | "review_claim" | "open_chat" | "open_recovery_room" | "view_receipt" | "manage_security";
}

type TabType = "all" | "match" | "chat" | "claim" | "recovery" | "security";
type FilterType = "all" | "today" | "yesterday" | "7days" | "unread" | "completed";

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
  // State for search, filter and active tab
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  
  // Local state for pinned item IDs and read item IDs to allow fully offline-friendly state updates
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("linco_pinned_activities");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [localReadIds, setLocalReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("linco_read_activities");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist pinned and read IDs
  useEffect(() => {
    localStorage.setItem("linco_pinned_activities", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  useEffect(() => {
    localStorage.setItem("linco_read_activities", JSON.stringify(localReadIds));
  }, [localReadIds]);

  // Determine user's active posts
  const userPosts = useMemo(() => {
    return posts.filter(p => unlockedPosts.includes(p.id));
  }, [posts, unlockedPosts]);

  const firstUserPost = userPosts[0];
  const firstPostItem = firstUserPost ? firstUserPost.item : "Black Backpack";

  // Build the list of activity items dynamically by combining database notifications and high-fidelity custom activities
  const allActivities = useMemo(() => {
    const items: ActivityItem[] = [];

    // 1. Map real database notifications
    notifications.forEach((n) => {
      // Skip if post not unlocked by user (already aligned with user context)
      if (!unlockedPosts.includes(n.postId)) return;

      const isRead = n.read || localReadIds.includes(n.id);
      let itemType: ActivityItem["type"] = "match";
      let actionType: ActivityItem["actionType"] = "view_match";
      let actionLabel = "View Match";
      let statusColor: ActivityItem["statusColor"] = "cyan";

      if (n.type === "claim") {
        itemType = "claim";
        actionType = "review_claim";
        actionLabel = "Review Claim";
        statusColor = "indigo";
      } else if (n.type === "system") {
        itemType = "security";
        actionType = "manage_security";
        actionLabel = "Manage Security";
        statusColor = "rose";
      }

      items.push({
        id: n.id,
        type: itemType,
        title: n.type === "match" ? "Possible Match Found" : n.type === "claim" ? "Someone Claimed Your Item" : "System Notification",
        description: n.message,
        createdAt: n.createdAt,
        read: isRead,
        statusColor,
        postId: n.postId,
        matchId: n.matchId,
        claimId: n.claimId,
        actionLabel,
        actionType
      });
    });

    // 2. High-fidelity Seeded/Custom Interactive Activities to populate each requested tab elegantly
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const mockActivities: ActivityItem[] = [
      // MATCHES TAB
      {
        id: "seed_match_1",
        type: "match",
        title: "Possible Match Found",
        description: `Your ${firstPostItem} matches a newly reported counterpart with 94% confidence score.`,
        createdAt: now - 15 * 60 * 1000, // 15 mins ago
        read: localReadIds.includes("seed_match_1"),
        statusColor: "cyan",
        progress: "94% Match Score",
        actionLabel: "View Match",
        actionType: "view_match"
      },
      {
        id: "seed_match_2",
        type: "match",
        title: "Confidence Increased",
        description: `Refined neural network matching analysis for ${firstPostItem} has increased score accuracy to 98%.`,
        createdAt: now - 3 * oneHour,
        read: localReadIds.includes("seed_match_2") || true,
        statusColor: "cyan",
        progress: "98% Probability",
        actionLabel: "View Match",
        actionType: "view_match"
      },
      {
        id: "seed_match_3",
        type: "match",
        title: "New AI Match",
        description: `LINCO's smart geo-proximity matching system isolated a high probability claim near Central Station.`,
        createdAt: now - 12 * oneHour,
        read: localReadIds.includes("seed_match_3"),
        statusColor: "cyan",
        progress: "AI Automatic",
        actionLabel: "View Match",
        actionType: "view_match"
      },
      {
        id: "seed_match_4",
        type: "match",
        title: "Match Expired",
        description: `A historical counter-post matching your query was marked as solved and archived securely.`,
        createdAt: now - 2 * oneDay,
        read: localReadIds.includes("seed_match_4") || true,
        statusColor: "slate",
        progress: "Archived",
        actionLabel: "View Match",
        actionType: "view_match"
      },

      // CLAIMS TAB
      {
        id: "seed_claim_1",
        type: "claim",
        title: "Someone claimed your item",
        description: `A citizen filed a secure ownership verification response for your registered ${firstPostItem}.`,
        createdAt: now - 45 * 60 * 1000, // 45m ago
        read: localReadIds.includes("seed_claim_1"),
        statusColor: "indigo",
        progress: "Awaiting Review",
        actionLabel: "Review Claim",
        actionType: "review_claim"
      },
      {
        id: "seed_claim_2",
        type: "claim",
        title: "Claim approved",
        description: `The ownership questionnaire for ${firstPostItem} has been successfully validated. Handover chat is now active.`,
        createdAt: now - 4 * oneHour,
        read: localReadIds.includes("seed_claim_2") || true,
        statusColor: "emerald",
        progress: "Approved",
        actionLabel: "Review Claim",
        actionType: "review_claim"
      },
      {
        id: "seed_claim_3",
        type: "claim",
        title: "Claim rejected",
        description: `The submission was declined by the item finder due to insufficient security answers.`,
        createdAt: now - 18 * oneHour,
        read: localReadIds.includes("seed_claim_3") || true,
        statusColor: "rose",
        progress: "Declined",
        actionLabel: "Review Claim",
        actionType: "review_claim"
      },
      {
        id: "seed_claim_4",
        type: "claim",
        title: "Claim needs attention",
        description: `Please review security answers. Additional verification points requested for your ${firstPostItem}.`,
        createdAt: now - 1.5 * oneDay,
        read: localReadIds.includes("seed_claim_4"),
        statusColor: "rose",
        progress: "Action Required",
        actionLabel: "Review Claim",
        actionType: "review_claim"
      },

      // CHATS TAB
      {
        id: "seed_chat_1",
        type: "chat",
        title: "Unread messages",
        description: `\"I can meet you near the community library tomorrow at 3 PM to return your jacket.\"`,
        createdAt: now - 10 * 60 * 1000, // 10 mins ago
        read: localReadIds.includes("seed_chat_1"),
        statusColor: "emerald",
        progress: "Unread Msg",
        actionLabel: "Open Chat",
        actionType: "open_chat"
      },
      {
        id: "seed_chat_2",
        type: "chat",
        title: "Voice note received",
        description: `A verified voice description memo of the item brand marks was received. Transcription complete.`,
        createdAt: now - 2 * oneHour,
        read: localReadIds.includes("seed_chat_2") || true,
        statusColor: "emerald",
        progress: "Audio Voice",
        actionLabel: "Open Chat",
        actionType: "open_chat"
      },
      {
        id: "seed_chat_3",
        type: "chat",
        title: "Image received",
        description: `A security-focused, unblurred confirmation photograph of the inner lining tag was transmitted.`,
        createdAt: now - 6 * oneHour,
        read: localReadIds.includes("seed_chat_3") || true,
        statusColor: "emerald",
        progress: "Photo Sent",
        actionLabel: "Open Chat",
        actionType: "open_chat"
      },
      {
        id: "seed_chat_4",
        type: "chat",
        title: "Recovery Room active",
        description: `A military-grade double-key coordination workspace is active for resolving the matching sequence.`,
        createdAt: now - 1 * oneDay,
        read: localReadIds.includes("seed_chat_4"),
        statusColor: "emerald",
        progress: "Encrypted Room",
        actionLabel: "Open Chat",
        actionType: "open_chat"
      },

      // RECOVERY TAB
      {
        id: "seed_rec_1",
        type: "recovery",
        title: "Contact unlocked",
        description: `Both finder and claimant confirmed mutual trust. Citizen telephone coordinates decrypted successfully.`,
        createdAt: now - 35 * 60 * 1000,
        read: localReadIds.includes("seed_rec_1"),
        statusColor: "purple",
        progress: "Contacts Shared",
        actionLabel: "Open Recovery Room",
        actionType: "open_recovery_room"
      },
      {
        id: "seed_rec_2",
        type: "recovery",
        title: "Owner confirmed item received",
        description: `The claimant successfully checked and confirmed full physical receipt of ${firstPostItem}.`,
        createdAt: now - 5 * oneHour,
        read: localReadIds.includes("seed_rec_2") || true,
        statusColor: "purple",
        progress: "Received",
        actionLabel: "View Receipt",
        actionType: "view_receipt"
      },
      {
        id: "seed_rec_3",
        type: "recovery",
        title: "Finder confirmed item returned",
        description: `The finder logged successful local handover. Waiting for claimant's confirmation receipt.`,
        createdAt: now - 14 * oneHour,
        read: localReadIds.includes("seed_rec_3") || true,
        statusColor: "purple",
        progress: "Returned",
        actionLabel: "Open Recovery Room",
        actionType: "open_recovery_room"
      },
      {
        id: "seed_rec_4",
        type: "recovery",
        title: "Recovery completed",
        description: `Safe physical coordinate exchange verified. Secure transaction record archived. Zero-knowledge protocol finalized.`,
        createdAt: now - 22 * oneHour,
        read: localReadIds.includes("seed_rec_4") || true,
        statusColor: "purple",
        progress: "Completed",
        actionLabel: "View Receipt",
        actionType: "view_receipt"
      },
      {
        id: "seed_rec_5",
        type: "recovery",
        title: "Recovery receipt ready",
        description: `Official LINCO secure handover return certificate issued. Hash stored securely on citizen database.`,
        createdAt: now - 3 * oneDay,
        read: localReadIds.includes("seed_rec_5") || true,
        statusColor: "purple",
        progress: "Receipt Ready",
        actionLabel: "View Receipt",
        actionType: "view_receipt"
      },

      // SECURITY TAB
      {
        id: "seed_sec_1",
        type: "security",
        title: "Privacy settings updated",
        description: `Decentralized contact masking active. Your direct cell number is air-gapped and shielded.`,
        createdAt: now - 50 * 60 * 1000,
        read: localReadIds.includes("seed_sec_1"),
        statusColor: "rose",
        progress: "Air-Gapped",
        actionLabel: "Manage Security",
        actionType: "manage_security"
      },
      {
        id: "seed_sec_2",
        type: "security",
        title: "New login detected",
        description: `Device signature verified for active session in local Kolkata zone using browser biometric handshake.`,
        createdAt: now - 8 * oneHour,
        read: localReadIds.includes("seed_sec_2") || true,
        statusColor: "rose",
        progress: "Authorized",
        actionLabel: "Manage Security",
        actionType: "manage_security"
      },
      {
        id: "seed_sec_3",
        type: "security",
        title: "Profile verified",
        description: `Owner proof validated. Security authorization level upgraded to Citizen Level 1.`,
        createdAt: now - 20 * oneHour,
        read: localReadIds.includes("seed_sec_3") || true,
        statusColor: "rose",
        progress: "Verified",
        actionLabel: "Manage Security",
        actionType: "manage_security"
      },
      {
        id: "seed_sec_4",
        type: "security",
        title: "Password changed",
        description: `Security token keys for local encrypted indexing successfully changed and stored.`,
        createdAt: now - 1.2 * oneDay,
        read: localReadIds.includes("seed_sec_4") || true,
        statusColor: "rose",
        progress: "Success",
        actionLabel: "Manage Security",
        actionType: "manage_security"
      },
      {
        id: "seed_sec_5",
        type: "security",
        title: "Trust Center updates",
        description: `No storage of personal telemetry logs policy active. Auto-wipe timer confirmed at 90 days of inactivity.`,
        createdAt: now - 3.5 * oneDay,
        read: localReadIds.includes("seed_sec_5") || true,
        statusColor: "rose",
        progress: "Compliant",
        actionLabel: "Manage Security",
        actionType: "manage_security"
      }
    ];

    // Merge mock with actual notifications (avoid duplicate ideas)
    const combined = [...items, ...mockActivities];
    
    // Sort chronological: newest first
    return combined.sort((a, b) => b.createdAt - a.createdAt);
  }, [notifications, unlockedPosts, firstPostItem, localReadIds]);

  // Handle Mark Single Item as Read
  const handleToggleRead = async (activity: ActivityItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activity.read) return;

    // Add to local read list
    setLocalReadIds((prev) => [...prev, activity.id]);

    // If it's a real server notification, update it on server too
    if (!activity.id.startsWith("seed_")) {
      try {
        await apiService.markNotificationRead(activity.id);
        onRefreshNotifications();
      } catch (err) {
        console.error("Failed to mark notification read on backend:", err);
      }
    }
    
    addToast("Activity marked as read", "success");
  };

  // Mark all items on current tab/filter as read
  const handleMarkAllRead = async () => {
    const unreadFiltered = filteredActivities.filter(a => !a.read);
    if (unreadFiltered.length === 0) return;

    const unreadIds = unreadFiltered.map(a => a.id);
    setLocalReadIds(prev => [...prev, ...unreadIds]);

    // If there are backend notification IDs, mark them too
    const backendUnread = unreadFiltered.filter(a => !a.id.startsWith("seed_"));
    if (backendUnread.length > 0) {
      try {
        await Promise.all(backendUnread.map(a => apiService.markNotificationRead(a.id)));
        onRefreshNotifications();
      } catch (err) {
        console.error("Failed to mark all as read:", err);
      }
    }

    addToast(`All unread items marked as read`, "success");
  };

  // Toggle Pinned Status
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinnedIds.includes(id)) {
      setPinnedIds(pinnedIds.filter(item => item !== id));
      addToast("Activity unpinned from top", "info");
    } else {
      setPinnedIds([...pinnedIds, id]);
      addToast("Activity pinned to top", "success");
    }
  };

  // Search and Filter Logic
  const filteredActivities = useMemo(() => {
    return allActivities.filter((activity) => {
      // 1. Tab check
      if (activeTab !== "all" && activity.type !== activeTab) {
        return false;
      }

      // 2. Search check
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          activity.title.toLowerCase().includes(query) || 
          activity.description.toLowerCase().includes(query) ||
          activity.type.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // 3. Filter check
      const startOfToday = new Date().setHours(0, 0, 0, 0);
      const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
      const startOf7DaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;

      if (activeFilter === "today") {
        return activity.createdAt >= startOfToday;
      } else if (activeFilter === "yesterday") {
        return activity.createdAt >= startOfYesterday && activity.createdAt < startOfToday;
      } else if (activeFilter === "7days") {
        return activity.createdAt >= startOf7DaysAgo;
      } else if (activeFilter === "unread") {
        return !activity.read;
      } else if (activeFilter === "completed") {
        return (
          activity.progress === "Completed" || 
          activity.progress === "Approved" || 
          activity.progress === "Received" ||
          activity.title.includes("approved") ||
          activity.title.includes("completed")
        );
      }

      return true;
    });
  }, [allActivities, activeTab, searchQuery, activeFilter]);

  // Split into pinned and normal items within the filtered subset
  const pinnedSection = useMemo(() => {
    return filteredActivities.filter(a => pinnedIds.includes(a.id));
  }, [filteredActivities, pinnedIds]);

  const unpinnedSection = useMemo(() => {
    return filteredActivities.filter(a => !pinnedIds.includes(a.id));
  }, [filteredActivities, pinnedIds]);

  // Count unreads for tabs
  const tabCounts = useMemo(() => {
    const counts: Record<TabType, number> = {
      all: 0,
      match: 0,
      chat: 0,
      claim: 0,
      recovery: 0,
      security: 0
    };

    allActivities.forEach(a => {
      if (!a.read) {
        counts.all++;
        if (counts[a.type] !== undefined) {
          counts[a.type]++;
        }
      }
    });

    return counts;
  }, [allActivities]);

  // Smart action trigger routing
  const handleAction = (activity: ActivityItem) => {
    // Softly mark as read on action trigger
    if (!activity.read) {
      setLocalReadIds((prev) => [...prev, activity.id]);
      if (!activity.id.startsWith("seed_")) {
        apiService.markNotificationRead(activity.id).then(() => onRefreshNotifications()).catch(() => {});
      }
    }

    // Process actions
    if (activity.actionType === "view_match") {
      const matchId = activity.matchId || "match_1";
      onViewMatch(matchId);
      onClose();
    } else if (activity.actionType === "review_claim") {
      if (onOpenOwnerClaims && firstUserPost) {
        onOpenOwnerClaims(firstUserPost);
        onClose();
      } else {
        addToast("Please open claims tab from your post dashboard", "info");
      }
    } else if (activity.actionType === "open_chat" || activity.actionType === "open_recovery_room" || activity.actionType === "view_receipt") {
      const claimId = activity.claimId || "claim_1";
      if (onOpenClaimTracker) {
        onOpenClaimTracker(claimId);
        onClose();
      } else {
        addToast("Opening active secure recovery channel...", "success");
      }
    } else if (activity.actionType === "manage_security") {
      if (onNavigateToTab) {
        onNavigateToTab("privacy-trust");
        onClose();
      } else {
        addToast("Trust Center is active in privacy tab.", "success");
      }
    }
  };

  // Helpers for relative time
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const oneMin = 60 * 1000;
    const oneHour = 60 * oneMin;
    const oneDay = 24 * oneHour;

    if (diff < oneMin) return "Just now";
    if (diff < oneHour) {
      const mins = Math.floor(diff / oneMin);
      return `${mins}m ago`;
    }
    if (diff < oneDay) {
      const hours = Math.floor(diff / oneHour);
      if (new Date(timestamp).getDate() === new Date().getDate()) {
        return `${hours}h ago`;
      }
    }
    
    const date = new Date(timestamp);
    const isYesterday = new Date(now - oneDay).getDate() === date.getDate();
    if (isYesterday) {
      return "Yesterday";
    }
    
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Tab configurations
  const tabsConfig: { id: TabType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "all", label: "All", icon: <Layers size={13} />, color: "text-slate-400" },
    { id: "match", label: "Matches", icon: <Sparkles size={13} />, color: "text-cyan-400" },
    { id: "chat", label: "Chats", icon: <MessageSquare size={13} />, color: "text-emerald-400" },
    { id: "claim", label: "Claims", icon: <FileCheck size={13} />, color: "text-indigo-400" },
    { id: "recovery", label: "Recovery", icon: <ShieldCheck size={13} />, color: "text-purple-400" },
    { id: "security", label: "Security", icon: <Shield size={13} />, color: "text-rose-400" }
  ];

  // Colors dictionary mapping for borders and backgrounds
  const statusColors = {
    cyan: "border-cyan-500/20 bg-cyan-950/5 hover:border-cyan-400/40 text-cyan-400",
    emerald: "border-emerald-500/20 bg-emerald-950/5 hover:border-emerald-400/40 text-emerald-400",
    indigo: "border-indigo-500/20 bg-indigo-950/5 hover:border-indigo-400/40 text-indigo-400",
    purple: "border-purple-500/20 bg-purple-950/5 hover:border-purple-400/40 text-purple-400",
    rose: "border-rose-500/20 bg-rose-950/5 hover:border-rose-400/40 text-rose-400",
    slate: "border-slate-700/20 bg-slate-900/10 hover:border-slate-600/30 text-slate-400"
  };

  const statusIcons = {
    match: <Sparkles size={11} className="text-cyan-400" />,
    claim: <FileCheck size={11} className="text-indigo-400" />,
    chat: <MessageSquare size={11} className="text-emerald-400" />,
    recovery: <ShieldCheck size={11} className="text-purple-400" />,
    security: <Shield size={11} className="text-rose-400" />
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6" 
          id="activity-center-overlay"
        >
          {/* Backdrop with elegant blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Activity Center Core Workspace Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full sm:max-w-4xl h-full sm:h-[85vh] sm:max-h-[820px] bg-[#07070a] border-0 sm:border border-[#161621] sm:rounded-3xl flex flex-col shadow-2xl z-10 overflow-hidden"
          >
            {/* Ambient Background Accents */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* HEADER BLOCK */}
            <div className="relative p-5 sm:p-6 border-b border-[#161621]/80 bg-[#08080c]/60 backdrop-blur flex flex-col gap-4 select-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Bell size={15} />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-base text-slate-100 tracking-tight flex items-center gap-2">
                      Activity Center
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                      Unified Citizen Handover Pipeline
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {tabCounts.all > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-sans font-black text-indigo-400 hover:text-indigo-300 transition uppercase tracking-wider px-3 py-1.5 rounded-xl bg-indigo-950/20 border border-indigo-500/10 hover:border-indigo-500/30"
                    >
                      Mark All Read
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-xl bg-[#030304] border border-[#1c1c26] text-slate-400 hover:text-white hover:border-[#3c3c56] transition cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* SEARCH & FILTERS CONTROLS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Search */}
                <div className="md:col-span-6 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search coordinates, claim IDs, wallet, chat..."
                    className="w-full pl-9 pr-8 py-2 bg-[#040406]/90 border border-[#1c1c2b] focus:border-indigo-500 outline-none rounded-xl text-xs text-slate-200 transition font-sans placeholder-slate-600"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>

                {/* Filter pills */}
                <div className="md:col-span-6 flex flex-wrap gap-1.5 justify-start md:justify-end">
                  {(["all", "today", "yesterday", "7days", "unread", "completed"] as FilterType[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-2.5 py-1 text-[10px] font-sans font-bold rounded-lg uppercase tracking-wider border transition-all duration-150 ${
                        activeFilter === filter
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                          : "bg-transparent border-[#161622]/80 text-slate-500 hover:text-slate-300 hover:border-slate-800"
                      }`}
                    >
                      {filter === "7days" ? "Last 7 Days" : filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PRECISE TABS BAR (All, Matches, Chats, Claims, Recovery, Security) */}
            <div className="bg-[#040407]/40 border-b border-[#13131d] px-4 overflow-x-auto scrollbar-none select-none flex items-center">
              <div className="flex gap-1.5 py-2.5 min-w-max">
                {tabsConfig.map((tab) => {
                  const unread = tabCounts[tab.id];
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-sans font-bold transition-all duration-150 border cursor-pointer ${
                        isActive
                          ? "bg-[#09090e] border-[#222233] text-slate-100 shadow-md"
                          : "bg-transparent border-transparent text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <span className={`${isActive ? tab.color : "text-slate-500"}`}>
                        {tab.icon}
                      </span>
                      <span>{tab.label}</span>
                      {unread > 0 && (
                        <span className="h-4.5 min-w-4.5 px-1 rounded-full bg-indigo-500 text-[8px] font-black text-white flex items-center justify-center shadow-[0_0_8px_rgba(99,102,241,0.4)]">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TIMELINE LIST AREA */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              
              {/* IF PINNED ITEMS EXIST */}
              {pinnedSection.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono uppercase tracking-widest px-1">
                    <Pin size={10} className="text-amber-500 rotate-45" />
                    <span>Pinned Activities</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {pinnedSection.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        isPinned={true}
                        onTogglePin={(e) => handleTogglePin(activity.id, e)}
                        onToggleRead={(e) => handleToggleRead(activity, e)}
                        onAction={() => handleAction(activity)}
                        statusColors={statusColors}
                        statusIcons={statusIcons}
                        getRelativeTime={getRelativeTime}
                      />
                    ))}
                  </div>
                  <div className="border-b border-[#13131d] my-3 pt-1" />
                </div>
              )}

              {/* UNPINNED ACTIVE LIST */}
              {unpinnedSection.length > 0 ? (
                <div className="space-y-3">
                  {pinnedSection.length > 0 && (
                    <div className="text-slate-500 text-[10px] font-mono uppercase tracking-widest px-1 mb-1">
                      <span>Recent History</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3">
                    {unpinnedSection.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        isPinned={false}
                        onTogglePin={(e) => handleTogglePin(activity.id, e)}
                        onToggleRead={(e) => handleToggleRead(activity, e)}
                        onAction={() => handleAction(activity)}
                        statusColors={statusColors}
                        statusIcons={statusIcons}
                        getRelativeTime={getRelativeTime}
                      />
                    ))}
                  </div>
                </div>
              ) : pinnedSection.length === 0 ? (
                /* EMPTY STATE */
                <div className="py-24 text-center space-y-4 select-none">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900/40 border border-slate-800/40 flex items-center justify-center mx-auto text-slate-600 shadow-inner">
                    <Inbox size={26} />
                  </div>
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="text-sm font-sans font-black text-slate-300">You're all caught up.</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      No new activity found under current filters or tabs in your secure profile workspace.
                    </p>
                  </div>
                </div>
              ) : null}

            </div>

            {/* FOOTER */}
            <div className="p-4 bg-[#050508] border-t border-[#13131d] text-center">
              <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                LINCO Safe Handover Protocol • Shielded Citizen Ledger
              </span>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* EXTRACTED CARD COMPONENT TO ENFORCE CLEAN MODULARITY */
interface ActivityCardProps {
  activity: ActivityItem;
  isPinned: boolean;
  onTogglePin: (e: React.MouseEvent) => void;
  onToggleRead: (e: React.MouseEvent) => void;
  onAction: () => void;
  statusColors: Record<string, string>;
  statusIcons: Record<string, React.ReactNode>;
  getRelativeTime: (t: number) => string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isPinned,
  onTogglePin,
  onToggleRead,
  onAction,
  statusColors,
  statusIcons,
  getRelativeTime
}) => {
  return (
    <motion.div
      layoutId={activity.id}
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.15 }}
      className={`p-4 rounded-2xl text-left border relative overflow-hidden group select-none transition-all duration-200 ${
        activity.read
          ? "bg-[#030304]/40 border-[#15151f]/80 text-slate-400"
          : "bg-[#08080d]/80 border-[#1c1c2b] shadow-lg text-slate-200"
      }`}
    >
      {/* GLOW DECORATOR FOR UNREAD ACTIVITIES */}
      {!activity.read && (
        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_#6366f1] animate-pulse" />
      )}

      {/* HEADER SECTION (TYPE TAG & PIN CONTROLS) */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-1.5">
          <div className={`p-1.5 rounded-lg border flex items-center justify-center ${statusColors[activity.statusColor]}`}>
            {statusIcons[activity.type] || <AlertCircle size={11} />}
          </div>
          <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-slate-400">
            {activity.title}
          </span>
          <span className="text-[10px] font-sans text-slate-500">•</span>
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
            <Clock size={9} />
            <span>{getRelativeTime(activity.createdAt)}</span>
          </div>
        </div>

        {/* CONTROLS (PIN, READ SINGLE ACTION) */}
        <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {activity.progress && (
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${statusColors[activity.statusColor]}`}>
              {activity.progress}
            </span>
          )}
          
          {/* PIN BUTTON */}
          <button
            onClick={onTogglePin}
            className={`p-1.5 rounded-lg border transition ${
              isPinned 
                ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                : "bg-[#030304]/80 border-[#1c1c2b] text-slate-600 hover:text-slate-300 hover:border-slate-700"
            }`}
            title={isPinned ? "Unpin activity" : "Pin activity to top"}
          >
            <Pin size={10} className={isPinned ? "rotate-45" : ""} />
          </button>

          {/* READ CHANGER IF UNREAD */}
          {!activity.read && (
            <button
              onClick={onToggleRead}
              className="p-1.5 rounded-lg border bg-[#030304]/80 border-[#1c1c2b] text-slate-600 hover:text-slate-300 hover:border-slate-700 transition"
              title="Mark as read"
            >
              <Check size={10} />
            </button>
          )}
        </div>
      </div>

      {/* CARD BODY CONTENT */}
      <div className="mt-3">
        <p className={`text-xs leading-relaxed font-sans font-medium ${activity.read ? "text-slate-400/80" : "text-slate-300"}`}>
          {activity.description}
        </p>
      </div>

      {/* ACTION BLOCK - ONE EXPLICIT SMART ACTION BUTTON */}
      <div className="mt-4 pt-3 border-t border-[#13131d]/60 flex justify-between items-center">
        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">
          Transaction ID: {activity.id}
        </span>
        <button
          onClick={onAction}
          className={`px-3.5 py-1.5 text-[10px] font-sans font-black uppercase tracking-wider rounded-xl border transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
            activity.read
              ? "bg-[#09090f]/60 border-[#1c1c2b] text-slate-400 hover:text-white hover:border-[#3c3c56]"
              : "bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-400 text-indigo-400 hover:bg-indigo-500/25"
          }`}
        >
          <span>{activity.actionLabel}</span>
          <ArrowRight size={10} />
        </button>
      </div>

    </motion.div>
  );
};
