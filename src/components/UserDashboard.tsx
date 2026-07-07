/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  CheckCircle, 
  Mail, 
  Smartphone, 
  Globe, 
  Sparkles, 
  Check, 
  Plus, 
  Clock, 
  ChevronRight, 
  Heart, 
  X, 
  Search, 
  Edit3, 
  Camera, 
  FileText, 
  AlertTriangle,
  Lock,
  ArrowUpRight,
  TrendingUp,
  Activity,
  MessageSquare,
  LifeBuoy,
  Star,
  History,
  Settings,
  MessageCircle,
  Bot,
  Trash2,
  Download,
  LockKeyhole,
  Volume2,
  Palette,
  Languages,
  Eye,
  ChevronLeft,
  Key,
  ShieldAlert as ShieldIcon,
  HelpCircle,
  Smartphone as PhoneIcon,
  Globe as GlobeIcon,
  CreditCard,
  UserCheck,
  CheckSquare,
  Map,
  Fingerprint
} from "lucide-react";

interface UserDashboardProps {
  addToast: (msg: string, type: "success" | "info" | "warn" | "error") => void;
  onNavigateToTab: (tab: any) => void;
  onOpenNotifications: () => void;
  stats?: {
    total: number;
    lost: number;
    found: number;
    resolved: number;
  };
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  addToast,
  onNavigateToTab,
  onOpenNotifications,
  stats = { total: 0, lost: 0, found: 0, resolved: 0 }
}) => {
  // References for scrolling to top of sections
  const dashboardTopRef = useRef<HTMLDivElement>(null);

  // Identity profile state loaded from localstorage with fallback
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("linco_profile_details");
      return saved ? JSON.parse(saved) : {
        fullName: "Rina Pathak",
        username: "rinapathak",
        bio: "AI Ethics Researcher & Dedicated Community Volunteer. Helping citizens coordinate lost device recovery and secure key handovers in local Kolkata.",
        city: "Kolkata, WB",
        memberSince: "July 2024",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        cover: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000",
        isVerified: true
      };
    } catch {
      return {
        fullName: "Rina Pathak",
        username: "rinapathak",
        bio: "AI Ethics Researcher & Dedicated Community Volunteer. Helping citizens coordinate lost device recovery and secure key handovers in local Kolkata.",
        city: "Kolkata, WB",
        memberSince: "July 2024",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        cover: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000",
        isVerified: true
      };
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });

  // Sub-settings screen state (null means overview, otherwise specific subpage name)
  const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null);

  // Modal view states
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showDownloadDataModal, setShowDownloadDataModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2 | 3>(0);
  const [deleteInput, setDeleteInput] = useState("");

  // Achievements sub-tab filter
  const [activeAchievementCategory, setActiveAchievementCategory] = useState<"achievements" | "history" | "reviews" | "contributions" | "badges">("achievements");

  // Active Recovery State
  const [activeRecovery, setActiveRecovery] = useState({
    item: "MacBook Pro 16\"",
    status: "Meeting Scheduled",
    location: "Quest Mall Gate 2, Kolkata",
    time: "Today, 5:30 PM",
    role: "Finder",
    active: true
  });

  const availableCovers = [
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000"
  ];

  const availableAvatars = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150"
  ];

  // Completions checkpoints for trust score
  const [completions, setCompletions] = useState(() => {
    try {
      const saved = localStorage.getItem("linco_profile_completions");
      return saved ? JSON.parse(saved) : {
        photo: true,
        email: true,
        phone: false,
        bio: true,
        report: false,
        review: false
      };
    } catch {
      return {
        photo: true,
        email: true,
        phone: false,
        bio: true,
        report: false,
        review: false
      };
    }
  });

  const completionPercentage = useMemo(() => {
    const keys = Object.keys(completions) as Array<keyof typeof completions>;
    const completedCount = keys.filter(k => completions[k]).length;
    return Math.round((completedCount / keys.length) * 100);
  }, [completions]);

  const toggleCompletion = (key: keyof typeof completions) => {
    const next = { ...completions, [key]: !completions[key] };
    setCompletions(next);
    localStorage.setItem("linco_profile_completions", JSON.stringify(next));
    if (!completions[key]) {
      addToast("Trust milestone successfully verified!", "success");
    } else {
      addToast("Verification check retracted.", "info");
    }
    // Synchronize globally
    window.dispatchEvent(new Event("storage"));
  };

  const nextStepInfo = useMemo(() => {
    if (!completions.phone) {
      return {
        key: "phone",
        label: "Verify Mobile Number",
        desc: "Strengthen citizen handshakes with verified cellular coordinates.",
        actionText: "Verify Mobile"
      };
    }
    if (!completions.photo) {
      return {
        key: "photo",
        label: "Upload Profile Photo",
        desc: "Help other members identify you easily at public meetups.",
        actionText: "Verify Photo"
      };
    }
    if (!completions.email) {
      return {
        key: "email",
        label: "Verify Personal Email Address",
        desc: "Connect your official secure institutional email handle.",
        actionText: "Verify Email"
      };
    }
    if (!completions.bio) {
      return {
        key: "bio",
        label: "Write Brief Passport Biography",
        desc: "Describe your local context to other network peers.",
        actionText: "Add Bio Details"
      };
    }
    if (!completions.report) {
      return {
        key: "report",
        label: "Log Your First Item Ledger Report",
        desc: "File a local lost or found device coordinates on feed.",
        actionText: "Log First Item"
      };
    }
    if (!completions.review) {
      return {
        key: "review",
        label: "Obtain First Peer Review",
        desc: "Receive validation stamp from another verified citizen.",
        actionText: "Obtain Review"
      };
    }
    return {
      key: "complete",
      label: "Passport Fully Authenticated",
      desc: "All identity checkpoints registered on the decentralized grid.",
      actionText: "Passport Active"
    };
  }, [completions]);

  const trustScore = useMemo(() => {
    let score = 350;
    if (completions.photo) score += 50;
    if (completions.email) score += 100;
    if (completions.phone) score += 100;
    if (completions.bio) score += 50;
    if (completions.report) score += 100;
    if (completions.review) score += 150;
    return Math.min(score, 900);
  }, [completions]);

  const trustLevelInfo = useMemo(() => {
    if (trustScore >= 800) {
      return { 
        name: "LINCO Ambassador", 
        badge: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/25", 
        desc: "Top 2% of network. Empowered with direct escrow coordinate locks.",
        nextTierPoints: 0,
        nextTierName: "Highest Rank Locked"
      };
    } else if (trustScore >= 650) {
      return { 
        name: "Platinum Guardian", 
        badge: "bg-slate-300/10 text-slate-300 border border-slate-300/25", 
        desc: "Highly reliable citizen. Granted enhanced matching prioritizations.",
        nextTierPoints: 800 - trustScore,
        nextTierName: "LINCO Ambassador"
      };
    } else if (trustScore >= 500) {
      return { 
        name: "Gold Guardian", 
        badge: "bg-amber-500/10 text-amber-300 border border-amber-500/25", 
        desc: "Excellent community contributor. Multi-return checkpoint validation.",
        nextTierPoints: 650 - trustScore,
        nextTierName: "Platinum Guardian"
      };
    } else if (trustScore >= 400) {
      return { 
        name: "Silver Guardian", 
        badge: "bg-slate-500/10 text-slate-400 border border-slate-500/20", 
        desc: "Validated grid participant. Normal matching pipeline authorized.",
        nextTierPoints: 500 - trustScore,
        nextTierName: "Gold Guardian"
      };
    } else {
      return { 
        name: "Bronze Guardian", 
        badge: "bg-amber-700/10 text-amber-600 border border-amber-700/20", 
        desc: "Standard tier member. Active secure digital credentials check.",
        nextTierPoints: 400 - trustScore,
        nextTierName: "Silver Guardian"
      };
    }
  }, [trustScore]);

  // Preseeded citizen peer reviews
  const reviewsList = [
    { author: "Sourav K.", rating: 5, date: "3 days ago", item: "Fossil Smartwatch", comment: "Rina returned my lost smartwatch in under 15 minutes! Absolutely incredible integrity and beautiful communication. A credit to Kolkata." },
    { author: "Paulami D.", rating: 5, date: "2 weeks ago", item: "Car Keys", comment: "Coordination was flawless and super secure near Gate 4. Highly trust this member with item handovers." },
    { author: "Vikram S.", rating: 5, date: "1 month ago", item: "University ID", comment: "Verified the security pin perfectly and met in public coordinate safely. Thank you so much!" }
  ];

  // Preseeded recovery timeline
  const recoveryHistory = [
    { item: "Fossil Gen 6 Smartwatch", role: "Finder", date: "June 2026", status: "Handed Over Successfully", type: "Found", code: "LNC-902-W" },
    { item: "Master Key Ring (5 Keys)", role: "Finder", date: "May 2026", status: "Resolved Securely", type: "Found", code: "LNC-183-K" },
    { item: "Kolkata University Wallet", role: "Owner", date: "January 2026", status: "Recovered Successfully", type: "Lost", code: "LNC-401-P" }
  ];

  // Achievements config
  const achievements = [
    { id: "honest_finder", title: "Honest Finder", desc: "Returned a lost high-value item without receiving finder fees.", emoji: "🏅", unlocked: true, color: "from-amber-500/10 to-yellow-500/5 border-amber-500/10" },
    { id: "trusted_member", title: "Trusted Citizen", desc: "Complete 100% of identity proof checkpoints.", emoji: "🤝", unlocked: trustScore >= 500, color: "from-indigo-500/10 to-cyan-500/5 border-indigo-500/10" },
    { id: "fast_responder", title: "Fast Responder", desc: "Replied inside secure room chat in under 5 minutes.", emoji: "⚡", unlocked: true, color: "from-emerald-500/10 to-teal-500/5 border-emerald-500/10" },
    { id: "safe_handover", title: "Safe Handover", desc: "Completed safe coordinate exchange receipt in crowded public zones.", emoji: "🛡️", unlocked: completions.review, color: "from-purple-500/10 to-pink-500/5 border-purple-500/10" },
    { id: "community_hero", title: "Community Hero", desc: "Successfully returned 5 lost items to different citizens.", emoji: "🏆", unlocked: false, color: "from-slate-800/10 to-slate-900/5 border-slate-700/10" },
    { id: "platinum_guardian", title: "Platinum Ambassador", desc: "Attain Trust Score > 800 and holds flawless reviews.", emoji: "💎", unlocked: trustScore >= 800, color: "from-cyan-500/10 to-violet-500/5 border-cyan-500/10" }
  ];

  // Event handlers for deep dashboard navigations
  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      const destination = customEvent.detail;
      if (destination === "settings") {
        setActiveSettingsPage("account");
        setTimeout(() => {
          document.getElementById("settings-section-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      } else if (destination === "profile") {
        setActiveSettingsPage(null);
        dashboardTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (destination === "reports" || destination === "recovery") {
        setActiveSettingsPage(null);
        setTimeout(() => {
          document.getElementById("recovery-coordination-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    };
    window.addEventListener("linco-navigate-dashboard", handleNav);
    return () => window.removeEventListener("linco-navigate-dashboard", handleNav);
  }, []);

  // Save profile edits
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editForm);
    localStorage.setItem("linco_profile_details", JSON.stringify(editForm));
    setIsEditing(false);
    addToast("Identity profile updated successfully.", "success");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("profile-updated"));
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      identity: profile,
      completions,
      trustScore,
      historyLog: recoveryHistory,
      timestamp: new Date().toISOString()
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `linco_passport_${profile.username}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast("Self-sovereign JSON passport file downloaded.", "success");
  };

  // Export PDF / Text
  const handleExportTXT = () => {
    const textContent = `
========================================
LINCO SECURE DIGITAL PASSPORT REPORT
========================================
Generated: ${new Date().toLocaleString()}
User: @${profile.username} (${profile.fullName})
City Coordinate: ${profile.city}
Trust Score: ${trustScore} / 900
Trust Level: ${trustLevelInfo.name}

----------------------------------------
VERIFIED RECOVERY HISTORY
----------------------------------------
${recoveryHistory.map((h, i) => `${i+1}. ${h.item} [${h.type}] - ${h.status} (${h.date})`).join("\n")}

----------------------------------------
AUTHENTICITY CHECKPOINTS STATUS
----------------------------------------
Photo Verified: ${completions.photo ? "YES" : "NO"}
Email Verified: ${completions.email ? "YES" : "NO"}
Phone Verified: ${completions.phone ? "YES" : "NO"}
Bio Description: ${completions.bio ? "YES" : "NO"}
First Ledger Report: ${completions.report ? "YES" : "NO"}
Trust Peer Review: ${completions.review ? "YES" : "NO"}

========================================
END OF REPORT - LINCO CRYPTOGRAPHIC ID
========================================
    `;
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(textContent.trim());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `linco_report_${profile.username}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast("Identity Text Ledger report exported.", "success");
  };

  // Delete account action
  const handleDeleteAccount = () => {
    localStorage.removeItem("linco_profile_details");
    localStorage.removeItem("linco_profile_completions");
    addToast("Your self-sovereign identity passport has been securely erased.", "success");
    setDeleteStep(0);
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  // SVG Gauge metrics
  const strokeDashoffset = 282.6 - (282.6 * (trustScore / 900));
  const ringDashoffset = 282.6 - (282.6 * (completionPercentage / 100));

  // Settings Pages items list
  const settingsCategories = [
    { id: "account", label: "Account Settings", icon: <User size={15} />, desc: "Modify cryptographic username and bio coordinates" },
    { id: "privacy", label: "Privacy & Ledger", icon: <LockKeyhole size={15} />, desc: "Adjust search maskings and network visibility" },
    { id: "notifications", label: "Notifications Alert", icon: <Volume2 size={15} />, desc: "Tune acoustic chimes and real-time alerts" },
    { id: "appearance", label: "Appearance Theme", icon: <Palette size={15} />, desc: "Toggle visual contrast levels and physics animations" },
    { id: "language", label: "System Language", icon: <Languages size={15} />, desc: "Select native dialect translations" },
    { id: "security", label: "Security & Sessions", icon: <Fingerprint size={15} />, desc: "Examine connected devices and login keys" },
    { id: "data", label: "My Data & Privacy", icon: <Download size={15} />, desc: "Export digital ledger coordinates or delete identity" },
    { id: "support", label: "Help & Support", icon: <LifeBuoy size={15} />, desc: "Consult support chatbots and community guidelines" },
  ];

  return (
    <div ref={dashboardTopRef} className="w-full text-slate-200 select-none max-w-4xl mx-auto px-4 py-12 space-y-16" id="linco-user-dashboard">
      
      {/* =========================================
          1. PROFILE HERO SECTION
          ========================================= */}
      <section 
        className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl"
        id="profile-hero-card"
      >
        {/* Cover Canvas Banner */}
        <div className="h-44 sm:h-52 w-full relative group overflow-hidden">
          <img 
            src={profile.cover} 
            alt="Profile Cover Canvas" 
            className="w-full h-full object-cover brightness-75 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
          
          <button 
            onClick={() => {
              setEditForm({ ...profile });
              setIsEditing(true);
              addToast("Select custom cover canvas in the edit menu below.", "info");
            }}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-2 text-[10px] font-sans font-semibold tracking-wider uppercase cursor-pointer shadow-lg"
          >
            <Camera size={12} className="text-indigo-400" /> Change Banner
          </button>
        </div>

        {/* Profile Details Area */}
        <div className="relative px-6 pb-8 -mt-12 sm:-mt-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar container with dynamic progress ring surrounding it */}
            <div className="relative shrink-0">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-slate-950 bg-slate-900 shadow-2xl">
                <img 
                  src={profile.avatar} 
                  alt={profile.fullName} 
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => {
                    setEditForm({ ...profile });
                    setIsEditing(true);
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-250 flex items-center justify-center text-white cursor-pointer"
                >
                  <Edit3 size={18} className="text-indigo-400" />
                </button>
              </div>

              {/* Verified Ribbon overlay */}
              {profile.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 border-2 border-slate-950 text-white rounded-xl p-1.5 shadow-xl">
                  <ShieldCheck size={14} className="text-white" />
                </div>
              )}
            </div>

            {/* Title Identity Info */}
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
                  {profile.fullName}
                </h1>
                <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-lg text-[9px] font-mono uppercase tracking-wider">
                  Verified Identity
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-mono uppercase tracking-wider ${trustLevelInfo.badge}`}>
                  {trustLevelInfo.name}
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-400 text-xs font-mono flex-wrap">
                <span className="text-indigo-400 font-semibold">@{profile.username}</span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1 text-slate-300"><MapPin size={12} className="text-slate-500" /> {profile.city}</span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1 text-slate-300"><Calendar size={12} className="text-slate-500" /> Member since {profile.memberSince}</span>
              </div>
            </div>
          </div>

          {/* Edit/Share Action buttons */}
          <div className="flex gap-2.5 self-start md:self-end mt-2 md:mt-0">
            <button
              onClick={() => {
                setEditForm({ ...profile });
                setIsEditing(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-sans font-semibold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/50"
            >
              <Edit3 size={13} /> Edit Profile
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://linco.network/passport/${profile.username}`);
                addToast("Profile path URL copied to clipboard!", "success");
              }}
              className="px-4 py-2.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[11px] font-sans font-semibold uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center gap-2 cursor-pointer"
            >
              <ArrowUpRight size={13} /> Share Profile
            </button>
          </div>
        </div>

        {/* Bio Text Frame */}
        <div className="mx-6 mb-6 pt-4 border-t border-slate-800/60 text-left">
          <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium max-w-3xl bg-slate-950/40 p-3.5 rounded-2xl border border-slate-900">
            {profile.bio}
          </p>
        </div>
      </section>

      {/* =========================================
          2. ACTIVE RECOVERY COORDINATION CARD
          ========================================= */}
      <section className="space-y-4 text-left" id="recovery-coordination-card">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-indigo-400 animate-pulse" />
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Active Recovery Coordination
            </h2>
          </div>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full font-mono uppercase">
            1 Active Handshake
          </span>
        </div>

        {activeRecovery.active ? (
          <motion.div 
            whileHover={{ y: -2 }}
            className="relative p-6 sm:p-8 bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-purple-950/20 border border-indigo-500/20 rounded-3xl overflow-hidden shadow-2xl text-left"
          >
            {/* Soft Ambient glow background */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 shadow-[0_0_8px_#6366f1]"></span>
                  </span>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-semibold">
                    Live Escrow Coordination Pipeline
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                    {activeRecovery.item}
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-medium">({activeRecovery.role})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Item Ref: LNC-902-W • Secure Pin Handover Escrow Enabled</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-900 p-3 rounded-2xl">
                    <Clock size={16} className="text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Coordination Status</p>
                      <p className="text-xs text-slate-200 font-semibold">{activeRecovery.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950/40 border border-slate-900 p-3 rounded-2xl">
                    <MapPin size={16} className="text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase">Meeting Point Coordinates</p>
                      <p className="text-xs text-slate-200 font-semibold">{activeRecovery.location}</p>
                    </div>
                  </div>
                </div>

                {/* AI Match Confidence level */}
                <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-2 rounded-2xl w-max">
                  <Sparkles size={13} className="text-cyan-400" />
                  <span className="text-xs text-cyan-300 font-medium">94% AI Match Confidence rating</span>
                </div>
              </div>

              <div className="flex sm:flex-row md:flex-col gap-2.5 shrink-0 self-stretch sm:self-auto justify-end">
                <button
                  onClick={() => {
                    addToast("Opening Secure Escrow Chat...", "success");
                    onNavigateToTab("home");
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("open-linco-chat", { detail: { openRoom: true } }));
                    }, 350);
                  }}
                  className="flex-1 sm:flex-none px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-950/40"
                >
                  <MessageCircle size={14} /> Continue Chat
                </button>
                <button
                  onClick={() => {
                    addToast("Retrieving meeting directions & security guidelines...", "info");
                  }}
                  className="flex-1 sm:flex-none px-5 py-3.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye size={14} /> View Details
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 bg-slate-900/20 border border-slate-800/80 rounded-3xl text-center">
            <p className="text-xs text-slate-500">No active recovery handovers in queue.</p>
          </div>
        )}
      </section>

      {/* =========================================
          3 & 4. TRUST SCORE & PASSPORT COMPLETION (SIDE-BY-SIDE GRID)
          ========================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        
        {/* TRUST SCORE DETAILS */}
        <section className="space-y-4" id="trust-score-panel">
          <div className="flex items-center gap-2 px-1">
            <Award size={15} className="text-amber-400" />
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Trust Score Rating
            </h2>
          </div>

          <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-xl flex flex-col justify-between h-[340px]">
            <div className="flex items-center gap-4">
              {/* Trust gauge circle */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-slate-950" strokeWidth="6" fill="transparent" />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-amber-400"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="213.6"
                    initial={{ strokeDashoffset: 213.6 }}
                    animate={{ strokeDashoffset: 213.6 - (213.6 * (trustScore / 900)) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-amber-400">{trustScore}</span>
                  <span className="text-[7px] font-mono text-slate-500 uppercase">Rating</span>
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-semibold ${trustLevelInfo.badge}`}>
                    {trustLevelInfo.name}
                  </span>
                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <TrendingUp size={10} /> +15
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  {trustLevelInfo.desc}
                </p>
              </div>
            </div>

            {/* Why this score checklist */}
            <div className="space-y-1 bg-slate-950/40 p-3 rounded-2xl border border-slate-900/60 font-sans text-[11px] text-slate-400">
              <p className="text-[9px] font-mono text-slate-500 uppercase mb-1 tracking-wider">Verification Breakdown</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={11} className={completions.phone ? "text-indigo-400" : "text-slate-600"} />
                  <span className={completions.phone ? "text-slate-200" : ""}>Verified Mobile</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={11} className={completions.email ? "text-indigo-400" : "text-slate-600"} />
                  <span className={completions.email ? "text-slate-200" : ""}>Verified Email</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={11} className="text-indigo-400" />
                  <span>Successful Return</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={11} className="text-indigo-400" />
                  <span>Fast Response Time</span>
                </div>
              </div>
            </div>

            {/* Milestone indicator */}
            <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-xs font-sans">
              <span className="text-slate-400">Next Milestone progress:</span>
              <span className="font-semibold text-slate-200 font-mono text-[11px]">
                {trustLevelInfo.nextTierPoints > 0 
                  ? `Only ${trustLevelInfo.nextTierPoints} points away from ${trustLevelInfo.nextTierName}` 
                  : "Maximum Grid Trust Attained!"}
              </span>
            </div>
          </div>
        </section>

        {/* PASSPORT COMPLETION CARD */}
        <section className="space-y-4" id="passport-completion-panel">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck size={15} className="text-indigo-400" />
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Passport Verification
            </h2>
          </div>

          <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-xl flex flex-col justify-between h-[340px]">
            <div className="flex items-center gap-4">
              {/* Progress Ring */}
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="34" className="stroke-slate-950" strokeWidth="6" fill="transparent" />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="stroke-indigo-500"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray="213.6"
                    initial={{ strokeDashoffset: 213.6 }}
                    animate={{ strokeDashoffset: 213.6 - (213.6 * (completionPercentage / 100)) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-indigo-400">{completionPercentage}%</span>
                  <span className="text-[7px] font-mono text-slate-500 uppercase">Complete</span>
                </div>
              </div>

              <div className="space-y-1 flex-1 text-left">
                <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                  Passport Checkpoints
                </span>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  Toggle your verification milestones manually to synchronize peer reputation certificates.
                </p>
              </div>
            </div>

            {/* Checklist toggle list */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 font-sans text-xs pt-1">
              {[
                { key: "email", label: "Email" },
                { key: "phone", label: "Mobile" },
                { key: "photo", label: "Profile Photo" },
                { key: "review", label: "Government ID (optional)" },
                { key: "bio", label: "Bio Description" },
                { key: "report", label: "Address Coordinate" },
              ].map((item) => {
                const isChecked = completions[item.key as keyof typeof completions];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleCompletion(item.key as any)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-950/40 border border-slate-900 rounded-xl hover:bg-slate-900 transition-colors text-left cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked 
                        ? "bg-indigo-600 border-indigo-500 text-white" 
                        : "border-slate-700 text-transparent"
                    }`}>
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <span className={`text-xs truncate ${isChecked ? "text-slate-200" : "text-slate-500"}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Continue Verification button */}
            <button
              onClick={() => {
                if (nextStepInfo.key !== "complete") {
                  toggleCompletion(nextStepInfo.key as any);
                } else {
                  addToast("All primary identity credentials verified!", "success");
                }
              }}
              className="w-full py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300 hover:text-white font-sans font-semibold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              {nextStepInfo.key !== "complete" ? `Continue Verification: ${nextStepInfo.actionText}` : "Passport Verification Complete"}
            </button>
          </div>
        </section>
      </div>

      {/* =========================================
          5. QUICK ACTIONS SECTION
          ========================================= */}
      <section className="space-y-4 text-left" id="quick-actions-panel">
        <div className="flex items-center gap-2 px-1">
          <Sparkles size={15} className="text-indigo-400" />
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            Sovereign Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Report Lost", icon: <ShieldAlert size={18} />, desc: "Index missing coordinates", action: () => { onNavigateToTab("report"); } },
            { label: "Report Found", icon: <Plus size={18} />, desc: "Register found discoveries", action: () => { onNavigateToTab("report"); } },
            { label: "Community Feed", icon: <Search size={18} />, desc: "Explore local missing boards", action: () => onNavigateToTab("feed") },
            { label: "Help Center", icon: <Bot size={18} />, desc: "Interactive support chatbot", action: () => {
              window.dispatchEvent(new CustomEvent("open-linco-chat"));
              addToast("LincoSaathii support chatbot initialized.", "info");
            }}
          ].map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="p-5 bg-slate-900/40 backdrop-blur-xl border border-slate-800/85 hover:border-indigo-500/30 rounded-2xl hover:bg-slate-950/60 transition-all duration-300 flex flex-col items-start text-left justify-between min-h-[128px] cursor-pointer group shadow-lg"
            >
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 group-hover:text-indigo-300 transition-colors">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">{item.label}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans font-medium">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* =========================================
          6. STATISTICS SECTION
          ========================================= */}
      <section className="space-y-4 text-left" id="statistics-panel">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp size={15} className="text-indigo-400" />
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            Grid Coordinate Statistics
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { label: "Lost Reports", value: stats.lost || 3, color: "text-rose-400", border: "border-rose-950/15" },
            { label: "Found Reports", value: stats.found || 5, color: "text-emerald-400", border: "border-emerald-950/15" },
            { label: "Resolved", value: stats.resolved || 2, color: "text-purple-400", border: "border-purple-950/15" },
            { label: "AI Matches", value: stats.total || 8, color: "text-cyan-400", border: "border-cyan-950/15" },
            { label: "Success Rate", value: "100%", color: "text-indigo-400", border: "border-indigo-950/15" },
            { label: "Community Rank", value: "Top 5%", color: "text-amber-400", border: "border-amber-950/15" }
          ].map((item, index) => (
            <div 
              key={index} 
              className={`p-4 bg-slate-900/40 backdrop-blur-xl border border-slate-800/85 ${item.border} rounded-2xl flex flex-col justify-between text-left space-y-1.5 shadow-md`}
            >
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-semibold block">
                {item.label}
              </span>
              <span className={`text-xl font-bold font-sans ${item.color} block`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================
          7. ACTIVITY TIMELINE SECTION
          ========================================= */}
      <section className="space-y-4 text-left" id="timeline-panel">
        <div className="flex items-center gap-2 px-1">
          <Activity size={15} className="text-indigo-400" />
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            Recent Security Ledger Logs
          </h2>
        </div>

        <div className="p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-xl">
          <div className="space-y-6 font-sans text-xs relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-slate-800/80">
            {[
              { label: "Escrow Pipeline Meeting Scheduled", detail: "Quest Mall Gate 2 coordinate verified with item owner.", time: "2 mins ago", type: "system" },
              { label: "Matched Potential Claim Request", detail: "MacBook Pro characteristics evaluated at 94% compatibility.", time: "Yesterday", type: "ai" },
              { label: "Feedback Rating Stamp Logged", detail: "Received 5★ star verification from Sourav K. for item handshake.", time: "Last week", type: "success" },
              { label: "Secure Identity Checkpoint Cleared", detail: "Cryptographic photo verification successfully validated.", time: "2 weeks ago", type: "auth" }
            ].map((act, index) => (
              <div 
                key={index} 
                onClick={() => addToast(`Ledger log details: ${act.label}`, "info")}
                className="flex gap-5 text-left items-start cursor-pointer hover:bg-slate-950/20 p-2 -m-2 rounded-xl transition-colors group"
              >
                {/* Timeline ball */}
                <div className="relative z-10 w-[24px] h-[24px] rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    act.type === "system" ? "bg-indigo-500" :
                    act.type === "ai" ? "bg-cyan-400 animate-pulse" :
                    act.type === "success" ? "bg-emerald-400" : "bg-slate-600"
                  }`} />
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="font-semibold text-slate-200 text-sm group-hover:text-indigo-400 transition-colors">{act.label}</p>
                    <span className="text-[10px] font-mono text-slate-500 font-medium">{act.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">{act.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          8. ACHIEVEMENTS & COMPANION CARDS (HORIZONTAL SCROLL)
          ========================================= */}
      <section className="space-y-4 text-left" id="achievements-slider">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Award size={15} className="text-indigo-400" />
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Citizen Registry Portfolios
            </h2>
          </div>
          <button 
            onClick={() => {
              setActiveAchievementCategory("achievements");
              setShowAchievementsModal(true);
            }}
            className="text-[11px] font-sans font-semibold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
          >
            View Full Portfolio
          </button>
        </div>

        {/* Category Toggles Slider bar */}
        <div className="flex gap-2.5 border-b border-slate-900 pb-2 overflow-x-auto scrollbar-hide">
          {[
            { id: "achievements", label: "Achievements", count: achievements.filter(a => a.unlocked).length },
            { id: "history", label: "Recovery History", count: recoveryHistory.length },
            { id: "reviews", label: "Citizen Reviews", count: reviewsList.length },
            { id: "contributions", label: "Contributions", count: 12 },
            { id: "badges", label: "Badges Unlocked", count: achievements.length }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveAchievementCategory(cat.id as any);
                setShowAchievementsModal(true);
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold whitespace-nowrap transition-all bg-slate-950/40 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5"
            >
              <span>{cat.label}</span>
              <span className="bg-slate-900 text-[10px] px-1.5 py-0.5 rounded-full text-slate-500 font-mono font-bold">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Horizontal scroll grid cards */}
        <div className="flex overflow-x-auto gap-4 pb-4 select-none scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {achievements.map((badge) => (
            <div 
              key={badge.id}
              onClick={() => {
                setActiveAchievementCategory("achievements");
                setShowAchievementsModal(true);
              }}
              className={`flex items-start gap-4 p-5 rounded-2xl border shrink-0 w-[240px] transition-all duration-300 hover:y-[-2px] cursor-pointer shadow-md text-left ${
                badge.unlocked 
                  ? "bg-slate-900/60 border-indigo-500/15 text-slate-200 hover:border-indigo-500/25" 
                  : "bg-slate-950/20 border-slate-900/40 text-slate-600 opacity-60"
              }`}
            >
              <div className="p-2.5 bg-slate-950 border border-slate-900 rounded-xl text-2xl shrink-0">
                {badge.emoji}
              </div>
              <div className="space-y-1 text-left min-w-0">
                <p className="text-xs font-bold text-slate-100 uppercase tracking-wide truncate">{badge.title}</p>
                <p className="text-[10px] text-slate-500 leading-normal line-clamp-2 font-sans font-medium">{badge.desc}</p>
                <span className="text-[8px] font-mono font-bold uppercase block mt-1 text-indigo-400">
                  {badge.unlocked ? "✓ Unlocked" : "🔒 Locked"}
                </span>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => {
              setActiveAchievementCategory("achievements");
              setShowAchievementsModal(true);
            }}
            className="flex items-center justify-center flex-col gap-2 px-6 rounded-2xl bg-slate-950/40 border border-slate-900 text-indigo-400 hover:text-indigo-300 font-sans font-semibold text-xs uppercase tracking-wider shrink-0 cursor-pointer min-w-[150px] shadow-sm hover:border-slate-800"
          >
            <ChevronRight size={16} />
            <span>View All</span>
          </button>
        </div>
      </section>

      {/* =========================================
          9 & 10. DEDICATED SETTINGS CARD & PAGES
          ========================================= */}
      <section 
        className="space-y-4 text-left" 
        id="settings-section-card"
      >
        <div className="flex items-center gap-2 px-1">
          <Settings size={15} className="text-indigo-400" />
          <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
            Passport Settings & Portability
          </h2>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl relative min-h-[420px]">
          <AnimatePresence mode="wait">
            
            {/* SCREEN 1: LIST OVERVIEW OF ALL SETTINGS CATEGORIES */}
            {activeSettingsPage === null ? (
              <motion.div 
                key="settings-list-grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-6 sm:p-8 space-y-6"
              >
                <div className="text-left space-y-1">
                  <h3 className="text-lg font-semibold text-slate-100">Sovereign Identity Settings Panel</h3>
                  <p className="text-xs text-slate-500">Configure your local district coordinates, security ledger visibility, and portable data.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {settingsCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveSettingsPage(cat.id)}
                      className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900/80 hover:border-indigo-500/20 hover:bg-slate-950/80 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                    >
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-900 text-indigo-400 group-hover:text-indigo-300 transition-colors shrink-0">
                        {cat.icon}
                      </div>
                      <div className="space-y-1 leading-normal text-left min-w-0">
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-all flex items-center gap-1">
                          {cat.label}
                          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                        </p>
                        <p className="text-[10px] text-slate-500 truncate font-sans font-medium">{cat.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Settings Quick Bar */}
                <div className="pt-4 border-t border-slate-900/80 flex flex-wrap gap-4 items-center justify-between text-[11px] font-mono text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-indigo-400" />
                    <span>Cryptographic digital keys signed and sealed.</span>
                  </div>
                  <button 
                    onClick={() => {
                      setShowDownloadDataModal(true);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-sans font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download size={12} /> Export Complete Identity
                  </button>
                </div>
              </motion.div>
            ) : (
              
              /* SCREEN 2: DEDICATED SETTINGS PAGE (SUB-PANEL VIEWS) */
              <motion.div 
                key={`settings-view-${activeSettingsPage}`}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="p-6 sm:p-8 space-y-6"
              >
                {/* Back Header Nav bar */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                  <button
                    onClick={() => setActiveSettingsPage(null)}
                    className="flex items-center gap-1.5 text-xs font-sans font-bold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    <ChevronLeft size={16} /> Back to Overview
                  </button>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                    Settings / {activeSettingsPage}
                  </span>
                </div>

                {/* 1. Account Settings view */}
                {activeSettingsPage === "account" && (
                  <div className="space-y-4">
                    <div className="text-left leading-normal">
                      <h4 className="text-base font-semibold text-slate-100">Account Identity Credentials</h4>
                      <p className="text-xs text-slate-500">Adjust your decentralized passport parameters on the local directory.</p>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4 font-sans text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Full Name</label>
                          <input
                            type="text"
                            required
                            value={editForm.fullName}
                            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Username Handle</label>
                          <input
                            type="text"
                            required
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-none transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Kolkata District Coordinates</label>
                          <input
                            type="text"
                            required
                            value={editForm.city}
                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Wallpaper Canvas Cover</label>
                          <select
                            value={editForm.cover}
                            onChange={(e) => setEditForm({ ...editForm, cover: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-none cursor-pointer transition"
                          >
                            <option value={availableCovers[0]}>Cosmic Slate (Purple-Slate Blur)</option>
                            <option value={availableCovers[1]}>Calm Twilight (Aura Dusk)</option>
                            <option value={availableCovers[2]}>Beach Coastline (Sandy Shore)</option>
                            <option value={availableCovers[3]}>Cyber Punk Grid (Techno lines)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Short Biography Description</label>
                        <textarea
                          rows={3}
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-none resize-none transition"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button 
                          type="button"
                          onClick={() => setActiveSettingsPage(null)}
                          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition"
                        >
                          Save Credentials
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 2. Privacy Settings view */}
                {activeSettingsPage === "privacy" && (
                  <div className="space-y-4">
                    <div className="text-left leading-normal">
                      <h4 className="text-base font-semibold text-slate-100">Privacy & Ledger visibility</h4>
                      <p className="text-xs text-slate-500">Configure cryptographic ledger visibility and masks on the public directory.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {[
                        { title: "Salt and Mask Serial Numbers", desc: "Encrypt device identifier hashes to prevent crawler scrapings.", defaultChecked: true },
                        { title: "Public Coordinate Masking", desc: "Only reveal coordinate details when a peer handshake matches.", defaultChecked: true },
                        { title: "Incognito Grid Mode", desc: "Suppress live availability badges and last-seen activity logs.", defaultChecked: false }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-900">
                          <div className="space-y-1 pr-6 text-left">
                            <p className="text-xs font-bold text-slate-200">{item.title}</p>
                            <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium">{item.desc}</p>
                          </div>
                          <input type="checkbox" defaultChecked={item.defaultChecked} className="accent-indigo-500 h-4 w-4 shrink-0 cursor-pointer mt-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Notification Settings view */}
                {activeSettingsPage === "notifications" && (
                  <div className="space-y-4">
                    <div className="text-left leading-normal">
                      <h4 className="text-base font-semibold text-slate-100">Notifications & Alert tones</h4>
                      <p className="text-xs text-slate-500">Tune sound effects and dispatch schedules for escrow events.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {[
                        { title: "Audio Feedback Chimes", desc: "Play responsive chime sounds on handshake progress logs.", defaultChecked: true },
                        { title: "Instant Match Alerts", desc: "Notify immediately when AI claims high coordinate compatibility.", defaultChecked: true },
                        { title: "Weekly Return Digest", desc: "Receive automated email summaries of successful neighborhood recoveries.", defaultChecked: false }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-900">
                          <div className="space-y-1 pr-6 text-left">
                            <p className="text-xs font-bold text-slate-200">{item.title}</p>
                            <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium">{item.desc}</p>
                          </div>
                          <input type="checkbox" defaultChecked={item.defaultChecked} className="accent-indigo-500 h-4 w-4 shrink-0 cursor-pointer mt-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Appearance Settings view */}
                {activeSettingsPage === "appearance" && (
                  <div className="space-y-4">
                    <div className="text-left leading-normal">
                      <h4 className="text-base font-semibold text-slate-100">Premium Appearance Theme</h4>
                      <p className="text-xs text-slate-500">Pick theme styles and toggle dynamic movement levels.</p>
                    </div>

                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900 flex justify-between items-center text-left">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200">Active Slate Theme (System Locked)</p>
                        <p className="text-[10px] text-slate-500">Optimized high-contrast deep palette for eye safety.</p>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-[9px] font-mono uppercase font-bold rounded-lg">
                        Active default
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-900 text-left">
                      <div>
                        <p className="text-xs font-bold text-slate-200">Motion Layout Physics</p>
                        <p className="text-[10px] text-slate-500">Play delicate floating micro-animations on interactive tiles.</p>
                      </div>
                      <input type="checkbox" defaultChecked className="accent-indigo-500 h-4 w-4 cursor-pointer shrink-0" />
                    </div>
                  </div>
                )}

                {/* 5. Language Settings view */}
                {activeSettingsPage === "language" && (
                  <div className="space-y-4">
                    <div className="text-left leading-normal">
                      <h4 className="text-base font-semibold text-slate-100">Translation & Language Coordinates</h4>
                      <p className="text-xs text-slate-500">Choose translation settings for local peer directories.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      {[
                        { code: "en", label: "English", native: "English", active: true },
                        { code: "bn", label: "Bengali", native: "বাংলা", active: false },
                        { code: "hi", label: "Hindi", native: "हिंदी", active: false }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => addToast(`Language swapped to ${lang.label}.`, "success")}
                          className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                            lang.active 
                              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300" 
                              : "bg-slate-950/40 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <span className="text-xs font-bold">{lang.native}</span>
                          <span className="text-[8px] font-mono mt-3 uppercase tracking-wider text-slate-500">{lang.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Security Settings view */}
                {activeSettingsPage === "security" && (
                  <div className="space-y-4">
                    <div className="text-left leading-normal">
                      <h4 className="text-base font-semibold text-slate-100">Security Audit logs</h4>
                      <p className="text-xs text-slate-500">Review active keys and coordinate devices registered on passport.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900 text-left space-y-2">
                        <p className="text-xs font-bold text-slate-200">Connected Devices</p>
                        <div className="space-y-1.5 font-mono text-[10px] text-slate-400">
                          <p className="flex items-center justify-between">
                            <span>📱 Apple iPhone 15 (Current)</span>
                            <span className="text-emerald-400 font-semibold">Active Coordinates</span>
                          </p>
                          <p className="flex items-center justify-between text-slate-500">
                            <span>💻 Apple MacBook Pro M3</span>
                            <span>Seen 3 days ago</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900 text-left space-y-2">
                        <p className="text-xs font-bold text-slate-200">Google Account Sync</p>
                        <div className="flex items-center justify-between text-xs font-sans">
                          <span className="text-slate-400">rinapathak470@gmail.com</span>
                          <span className="text-indigo-400 font-semibold">Linked Securely</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. Data Settings view (Download, Export, Delete) */}
                {activeSettingsPage === "data" && (
                  <div className="space-y-5">
                    <div className="text-left leading-normal">
                      <h4 className="text-base font-semibold text-slate-100">My Data & Privacy Preferences</h4>
                      <p className="text-xs text-slate-500">Export self-sovereign identity packages or deactivate coordinate registrations.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        onClick={handleExportJSON}
                        className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-indigo-500/20 text-left transition space-y-2 cursor-pointer group"
                      >
                        <Download size={16} className="text-indigo-400 group-hover:text-indigo-300" />
                        <div>
                          <p className="text-xs font-bold text-slate-200">Download JSON Passport</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-sans font-medium">Export standard self-sovereign digital identifier package.</p>
                        </div>
                      </button>

                      <button
                        onClick={handleExportTXT}
                        className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-indigo-500/20 text-left transition space-y-2 cursor-pointer group"
                      >
                        <FileText size={16} className="text-indigo-400 group-hover:text-indigo-300" />
                        <div>
                          <p className="text-xs font-bold text-slate-200">Export TXT Ledger</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-sans font-medium">Download complete readable text log of all peer returns.</p>
                        </div>
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 text-left space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-200">Consent & Cookies Preferences</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-sans font-medium">Customize your storage coordinates and analytic consent levels.</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => addToast("Essential cookies are permanently locked for safety.", "info")}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[10px] font-sans font-semibold rounded-xl"
                        >
                          Manage Consent
                        </button>
                        <button 
                          onClick={() => addToast("Analytic tracker coordinates cleared.", "success")}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[10px] font-sans font-semibold rounded-xl"
                        >
                          Clear Cookies
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-rose-950/40 text-left space-y-3">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-rose-400 flex items-center gap-1">
                          <AlertTriangle size={13} /> Dangerous coordinates
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium">Erase this self-sovereign digital ledger passport completely. Action is irreversible.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            addToast("Deactivating account profile temporarily...", "info");
                            setTimeout(() => {
                              addToast("Account profile deactivated. Click active in settings to resume.", "success");
                            }, 1000);
                          }}
                          className="px-3 py-2 bg-rose-950/10 hover:bg-rose-950/20 border border-rose-900/20 hover:border-rose-900/30 text-rose-400 text-[10px] font-sans font-semibold rounded-xl transition cursor-pointer"
                        >
                          Deactivate Account
                        </button>
                        <button
                          onClick={() => setDeleteStep(1)}
                          className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-sans font-semibold rounded-xl transition cursor-pointer"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. Help & Support view */}
                {activeSettingsPage === "support" && (
                  <div className="space-y-4">
                    <div className="text-left leading-normal">
                      <h4 className="text-base font-semibold text-slate-100">Help & Support terminal</h4>
                      <p className="text-xs text-slate-500">Consult support chatbot terminals and secure coordinate guidelines.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("open-linco-chat"));
                          addToast("Connecting you to LincoSaathii support terminal...", "info");
                        }}
                        className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-indigo-500/20 text-left transition space-y-2 cursor-pointer group"
                      >
                        <Bot size={16} className="text-indigo-400 group-hover:text-indigo-300" />
                        <div>
                          <p className="text-xs font-bold text-slate-200">Consult LincoSaathii Chatbot</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-sans font-medium">Our AI recovery specialist guides meeting coordinate safety.</p>
                        </div>
                      </button>

                      <a
                        href="https://linco.network/help-guidelines"
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => { e.preventDefault(); addToast("Opening security coordinate guide...", "info"); }}
                        className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-indigo-500/20 text-left transition space-y-2 cursor-pointer group"
                      >
                        <LifeBuoy size={16} className="text-indigo-400 group-hover:text-indigo-300" />
                        <div>
                          <p className="text-xs font-bold text-slate-200">Community Safety Guidelines</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-sans font-medium">Verify how to complete secure high-integrity returns in public.</p>
                        </div>
                      </a>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* =========================================
          11. MINIMALIST FOOTER
          ========================================= */}
      <footer className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-500 gap-4 select-none">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-indigo-500" />
          <span>Self-sovereign digital identity signed & verified on blockchain grid coordinates.</span>
        </div>
        <span>© 2026 LINCO. Designed for high-integrity citizens.</span>
      </footer>


      {/* =========================================
          COMPACT OVERLAYS & MODALS
          ========================================= */}
      <AnimatePresence>
        
        {/* EDIT PROFILE OVERLAY PANEL */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl relative max-h-[85vh] overflow-y-auto text-left"
            >
              <button 
                onClick={() => setIsEditing(false)}
                className="absolute top-4 right-4 p-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer transition-colors"
              >
                <X size={15} />
              </button>

              <div className="space-y-1 mb-6 text-left">
                <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest">Self-sovereign Identity Credentials</span>
                <h3 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                  <UserCheck size={18} className="text-indigo-400" /> Edit Passport Credentials
                </h3>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 font-sans text-xs">
                {/* Covers grid selections */}
                <div className="space-y-2 text-left">
                  <label className="block text-[9px] font-mono text-slate-500 uppercase">Select Wall Cover Canvas</label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableCovers.map((cov, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, cover: cov })}
                        className={`h-14 rounded-xl overflow-hidden border-2 transition-all relative ${
                          editForm.cover === cov ? "border-indigo-500 scale-98" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={cov} alt="Cover Preview" className="w-full h-full object-cover" />
                        {editForm.cover === cov && (
                          <div className="absolute inset-0 bg-indigo-500/25 flex items-center justify-center text-white font-bold">
                            <Check size={16} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Avatars grid selections */}
                <div className="space-y-2 text-left">
                  <label className="block text-[9px] font-mono text-slate-500 uppercase">Select Passport Avatar Image</label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableAvatars.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, avatar: av })}
                        className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all relative ${
                          editForm.avatar === av ? "border-indigo-500 scale-98" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={av} alt="Avatar Preview" className="w-full h-full object-cover" />
                        {editForm.avatar === av && (
                          <div className="absolute inset-0 bg-indigo-500/25 flex items-center justify-center text-white font-bold">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Username Handle</label>
                    <input
                      type="text"
                      required
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">District coordinates</label>
                    <input
                      type="text"
                      required
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Member Since Coordinates</label>
                    <input
                      type="text"
                      required
                      value={editForm.memberSince}
                      onChange={(e) => setEditForm({ ...editForm, memberSince: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-slate-500 uppercase mb-1">Short Biography Description</label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-slate-200 outline-none resize-none transition"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-900">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl cursor-pointer transition shadow-lg shadow-indigo-950/50"
                  >
                    Save Credentials
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* DETAILS & PORTFOLIOS REGISTRY MODAL */}
        {showAchievementsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl relative max-h-[85vh] overflow-y-auto text-left"
            >
              <button 
                onClick={() => setShowAchievementsModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
              >
                <X size={15} />
              </button>

              <h3 className="text-sm font-mono font-bold tracking-widest text-slate-400 uppercase mb-5 text-left flex items-center gap-2">
                <Award size={18} className="text-indigo-400" /> Complete Passport Registry Portfolio
              </h3>

              {/* Sub tabs in Modal */}
              <div className="flex gap-2.5 mb-6 border-b border-slate-900 pb-2.5 overflow-x-auto">
                {[
                  { id: "achievements", label: "Achievements" },
                  { id: "history", label: "History Log" },
                  { id: "reviews", label: "Reviews" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveAchievementCategory(tab.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer ${
                      activeAchievementCategory === tab.id 
                        ? "bg-indigo-600 text-white" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* View categories list */}
              <AnimatePresence mode="wait">
                {activeAchievementCategory === "achievements" && (
                  <motion.div 
                    key="modal-achievements"
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left"
                  >
                    {achievements.map((badge) => (
                      <div 
                        key={badge.id}
                        className={`p-4 rounded-2xl border text-left relative overflow-hidden flex items-start gap-3.5 ${
                          badge.unlocked 
                            ? `bg-gradient-to-br ${badge.color} border-indigo-500/15 text-slate-200` 
                            : "bg-slate-900/10 border-slate-900/40 text-slate-600 opacity-60"
                        }`}
                      >
                        <span className="text-2xl mt-0.5">{badge.emoji}</span>
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold uppercase tracking-wider">{badge.title}</h4>
                          <p className="text-[10px] font-sans font-medium text-slate-400 leading-normal">{badge.desc}</p>
                          {badge.unlocked ? (
                            <span className="text-[8px] font-mono text-indigo-400 font-bold uppercase tracking-widest block pt-1">
                              ✓ Verified Active
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-widest block pt-1 flex items-center gap-0.5">
                              <Lock size={8} /> Locked Badge
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeAchievementCategory === "history" && (
                  <motion.div 
                    key="modal-history"
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-3"
                  >
                    {recoveryHistory.map((h, idx) => (
                      <div key={idx} className="p-4 bg-slate-950 border border-slate-900 rounded-2xl flex justify-between items-center text-left font-sans text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-200">{h.item}</p>
                          <p className="text-[10px] font-mono text-slate-500">Code ID: {h.code} • Role: {h.role} • {h.date}</p>
                        </div>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono uppercase">
                          {h.status}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeAchievementCategory === "reviews" && (
                  <motion.div 
                    key="modal-reviews"
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-3"
                  >
                    {reviewsList.map((rev, idx) => (
                      <div key={idx} className="p-4 bg-slate-950 border border-slate-900 rounded-2xl text-left space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="font-bold text-slate-200">{rev.author}</div>
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                            <span className="text-amber-400 flex items-center">{"★".repeat(rev.rating)}</span>
                            <span>•</span>
                            <span>{rev.date}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-normal font-sans font-medium">{rev.comment}</p>
                        <p className="text-[9px] font-mono text-indigo-400">Verified transaction: {rev.item}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {/* DOWNLOAD MY PORTABLE DATA MODAL SCREEN */}
        {showDownloadDataModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setShowDownloadDataModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer transition-colors"
              >
                <X size={15} />
              </button>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase tracking-widest block">Digital Coordinate Autonomy</span>
                  <h3 className="text-lg font-semibold text-slate-100 uppercase">
                    Download My Passport Data
                  </h3>
                  <p className="text-xs text-slate-400">
                    Export a portable encrypted ledger of your self-sovereign digital credentials. This packet includes:
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-1 font-sans text-xs">
                  {[
                    { label: "Reports Ledger", desc: "Coordinates and serial reports." },
                    { label: "Escrow Handshakes", desc: "Matched tracking keys." },
                    { label: "Messages Hash", desc: "Vouched communication logs." },
                    { label: "Recovery History", desc: "Successful return certificates." },
                    { label: "Identity Keys", desc: "Credentials and signatures." },
                    { label: "Security Logs", desc: "Connected session histories." }
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl">
                      <p className="font-bold text-slate-200">{item.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-normal font-sans font-medium">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-900">
                  <button 
                    onClick={handleExportJSON}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/30"
                  >
                    <Download size={13} /> Export JSON
                  </button>
                  <button 
                    onClick={handleExportTXT}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText size={13} /> Export Text Ledger
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* DELETE ACCOUNT IRREVERSIBLE MULTI-STEP FLOW */}
        {deleteStep > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-slate-950 border border-rose-500/20 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative text-left"
            >
              <button 
                onClick={() => { setDeleteStep(0); setDeleteInput(""); }}
                className="absolute top-4 right-4 p-2 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer transition-colors"
              >
                <X size={15} />
              </button>

              {deleteStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-rose-400">
                    <AlertTriangle size={20} className="animate-pulse" />
                    <h3 className="text-base font-semibold uppercase tracking-wider">Danger Zone: Irreversible Erase</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You are initiating the protocol to permanently erase your LINCO Self-Sovereign passport index. This action is **irreversible** and results in immediate:
                  </p>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-1 font-sans font-medium">
                    <li>Destruction of your verified trust rating ({trustScore}).</li>
                    <li>Erase of active coordination keys and recovery rooms.</li>
                    <li>Wiping out of all earned Achievements and Peer Reviews.</li>
                  </ul>
                  <div className="flex justify-end gap-2.5 pt-4">
                    <button 
                      onClick={() => setDeleteStep(0)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Keep My Account
                    </button>
                    <button 
                      onClick={() => setDeleteStep(2)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Proceed to Verify
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Lock size={18} />
                    <h3 className="text-base font-semibold uppercase tracking-wider">Step 2: Security Verification</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    To authorize deletion of your decentralized digital coordinates, type <span className="font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-bold">DELETE</span> below.
                  </p>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="w-full px-4 py-3 bg-slate-900 border border-rose-500/20 focus:border-rose-500 rounded-xl text-xs text-slate-200 outline-none transition"
                  />
                  <div className="flex justify-end gap-2.5 pt-2">
                    <button 
                      onClick={() => { setDeleteStep(0); setDeleteInput(""); }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={deleteInput !== "DELETE"}
                      onClick={() => setDeleteStep(3)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Verify Deletion
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 3 && (
                <div className="space-y-4 border border-rose-500/30 p-5 rounded-3xl bg-rose-950/10">
                  <div className="flex items-center gap-2 text-rose-400">
                    <Trash2 size={20} className="animate-bounce" />
                    <h3 className="text-base font-semibold uppercase tracking-wider">Final Step: Absolute Confirmation</h3>
                  </div>
                  <p className="text-xs text-rose-300 leading-relaxed font-semibold">
                    Are you 100% sure you want to permanently delete your identity @{profile.username}?
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
                    This will permanently clear your cache database, wipe verified logs, and revoke public certificate signatures.
                  </p>
                  <div className="flex justify-end gap-2.5 pt-4">
                    <button 
                      onClick={() => { setDeleteStep(0); setDeleteInput(""); }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      No, Keep @{profile.username}
                    </button>
                    <button 
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Yes, Erase Permanently
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
};
