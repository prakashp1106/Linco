import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { 
  Sliders, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Info, 
  Eye, 
  Trash2, 
  CheckCircle, 
  ArrowRight, 
  X, 
  AlertCircle, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Heart,
  Share2,
  Clock,
  Check,
  Compass,
  ArrowLeftRight,
  Bookmark,
  BadgeCheck,
  Lock,
  Unlock,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  UserCheck,
  RefreshCw,
  KeyRound,
  Shield,
  Phone,
  ExternalLink,
  Handshake,
  CheckCheck
} from "lucide-react";
import { Post, PotentialMatch, MatchStatus } from "../types";
import { apiService } from "../services/api";
import { getWhatsAppLink, maskPhoneNumber, getMatchRevealedContact } from "../utils/whatsapp";

interface PotentialMatchesProps {
  posts: Post[];
  unlockedPosts: string[];
  onStartClaim: (p: Post, matchedPostId?: string) => void;
  addToast: (msg: string, type?: "success" | "warn" | "error" | "info") => void;
  initialSelectedMatchId?: string | null;
  onClearSelectedMatchId?: () => void;
}

export const PotentialMatches: React.FC<PotentialMatchesProps> = ({
  posts,
  unlockedPosts,
  onStartClaim,
  addToast,
  initialSelectedMatchId,
  onClearSelectedMatchId,
}) => {
  const [matches, setMatches] = useState<PotentialMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(80);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [viewFilter, setViewFilter] = useState<"my" | "all">("my");
  
  // Rotating search messages for the loading state
  const [loadingMessage, setLoadingMessage] = useState("AI is comparing thousands of reports...");

  // Modal State
  const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"compare" | "verification" | "trust" | "handover" | "chat">("compare");

  // Accordion list for detail breakdowns
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Verification & Approval Form States
  const [userRole, setUserRole] = useState<"Owner" | "Finder">("Owner");
  const [respondentName, setRespondentName] = useState("");
  const [respondentContact, setRespondentContact] = useState("");
  const [verificationAnswers, setVerificationAnswers] = useState<string[]>(["", "", ""]);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Approval / Reject Action States
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Trust Confirmation State
  const [submittingTrust, setSubmittingTrust] = useState(false);

  // Safe Handover State
  const [handoverMeetingPlace, setHandoverMeetingPlace] = useState("Kolkata Metro Station Public Concourse");
  const [handoverScheduledTime, setHandoverScheduledTime] = useState("Today at 4:00 PM");
  const [startingHandover, setStartingHandover] = useState(false);
  const [confirmingHandover, setConfirmingHandover] = useState(false);

  // Secure Chat States
  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Local saved watchlist persistence
  const [savedMatches, setSavedMatches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("linco_saved_matches");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Effect to handle deep linked match selections from notification clicks
  useEffect(() => {
    if (initialSelectedMatchId) {
      const match = matches.find((m) => m.matchId === initialSelectedMatchId);
      if (match) {
        setSelectedMatch(match);
        if (onClearSelectedMatchId) {
          onClearSelectedMatchId();
        }
      } else if (!loading) {
        apiService.getMatchById(initialSelectedMatchId).then((res) => {
          if (res.success && res.match) {
            setSelectedMatch(res.match);
            if (onClearSelectedMatchId) {
              onClearSelectedMatchId();
            }
          }
        }).catch((err) => {
          console.error("Failed to fetch initial match by ID:", err);
        });
      }
    }
  }, [initialSelectedMatchId, matches, loading, onClearSelectedMatchId]);

  // Loading message rotation loop
  useEffect(() => {
    if (loading) {
      const messages = [
        "AI is comparing thousands of reports...",
        "Scanning forensic visual attachments...",
        "Measuring spatial vector distances...",
        "Analyzing description timelines & category patterns...",
        "Calculating comparative confidence thresholds..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  useEffect(() => {
    loadData();
  }, []);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (activeModalTab === "chat" && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedMatch?.messages, activeModalTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Configuration Threshold
      const configRes = await apiService.getConfig();
      if (configRes.success) {
        setThreshold(configRes.matchThreshold);
      }

      // Load Potential Matches
      const matchesRes = await apiService.getMatches();
      if (matchesRes.success) {
        setMatches(matchesRes.matches);
      }
    } catch (err: any) {
      console.error("Failed to load potential matches:", err);
      addToast("Failed to retrieve matching listings.", "error");
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedMatch = async (matchId: string) => {
    try {
      const res = await apiService.getMatchById(matchId);
      if (res.success && res.match) {
        setSelectedMatch(res.match);
        setMatches((prev) => prev.map((m) => (m.matchId === matchId ? res.match : m)));
      }
    } catch (err) {
      console.error("Failed to refresh match details:", err);
    }
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThreshold(parseInt(e.target.value));
  };

  const handleSaveThreshold = async () => {
    setSavingThreshold(true);
    try {
      const res = await apiService.updateConfig(threshold);
      if (res.success) {
        addToast(`Baseline match threshold updated to ${threshold}%!`, "success");
        const matchesRes = await apiService.getMatches();
        if (matchesRes.success) {
          setMatches(matchesRes.matches);
        }
      }
    } catch (err: any) {
      addToast("Failed to update threshold.", "error");
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleDismissMatch = async (matchId: string) => {
    try {
      const res = await apiService.reviewMatch(matchId, true, "Dismissed");
      if (res.success) {
        setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
        addToast("Match report ignored & dismissed.", "success");
        if (selectedMatch?.matchId === matchId) {
          setSelectedMatch(null);
        }
      }
    } catch (err) {
      addToast("Could not dismiss match.", "error");
    }
  };

  // Saved toggle
  const toggleSaveMatch = (matchId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedMatches((prev) => {
      const isSaved = prev.includes(matchId);
      const next = isSaved ? prev.filter((id) => id !== matchId) : [...prev, matchId];
      try {
        localStorage.setItem("linco_saved_matches", JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      addToast(isSaved ? "Removed from saved matches." : "Match saved to your watch list!", "success");
      return next;
    });
  };

  // Share Match Details
  const handleShareMatch = (m: PotentialMatch, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const lostPost = getPostById(m.lostPostId);
    const foundPost = getPostById(m.foundPostId);
    if (!lostPost || !foundPost) return;

    const text = `🔍 LINCO AI Forensic Match [${m.matchScore}% Score] 🔍\n\n🚨 Lost: ${lostPost.item} (${lostPost.address})\n✅ Found: ${foundPost.item} (${foundPost.address})\n\n🤖 AI Reason: "${m.reason}"\n\nCheck your LINCO matches to verify ownership.`;
    navigator.clipboard
      .writeText(text)
      .then(() => addToast("Match overview copied to clipboard!", "success"))
      .catch(() => addToast("Copy failed, please retry.", "error"));
  };

  // Helper to resolve lost/found post associations
  const getPostById = (id: string): Post | undefined => {
    return posts.find((p) => p.id === id);
  };

  // Filter matches based on view toggle
  const filteredMatches = matches.filter((m) => {
    if (m.status === "Dismissed") return false;

    const lostPost = getPostById(m.lostPostId);
    const foundPost = getPostById(m.foundPostId);

    // Filter out matches referencing deleted or non-existent posts
    if (!lostPost || !foundPost) return false;

    // Filter active posts only
    if (lostPost.status !== "Active" || foundPost.status !== "Active") return false;

    if (viewFilter === "my") {
      const userOwnsLost = unlockedPosts.includes(m.lostPostId);
      const userOwnsFound = unlockedPosts.includes(m.foundPostId);
      return userOwnsLost || userOwnsFound;
    }

    return true;
  });

  const handleImproveReport = () => {
    const navButtons = Array.from(document.querySelectorAll("nav button, button"));
    const reportBtn = navButtons.find((btn) => btn.textContent?.includes("Report"));
    if (reportBtn) {
      (reportBtn as HTMLButtonElement).click();
      addToast("Navigated to Report! Refine or expand your description.", "info");
    } else {
      addToast("Please switch to the 'Report' tab to submit more detailed listings.", "info");
    }
  };

  // Dynamic feature extraction helper for side-by-side comparison
  const extractFeatures = (post: Post) => {
    const text = `${post.item} ${post.details}`.toLowerCase();
    
    // Brand list
    const brands = [
      "apple", "iphone", "samsung", "galaxy", "oneplus", "google", "pixel",
      "redmi", "realme", "vivo", "oppo", "xiaomi", "dell", "hp", "lenovo",
      "asus", "acer", "sony", "casio", "titan", "wildhorn", "gucci", "nike",
      "adidas", "puma", "fossil", "fastrack"
    ];
    let brand = "Not specified";
    for (const b of brands) {
      if (text.includes(b)) {
        brand = b.charAt(0).toUpperCase() + b.slice(1);
        break;
      }
    }
    if (brand === "Iphone") brand = "Apple";

    // Color list
    const colors = [
      "black", "brown", "blue", "red", "green", "white", "gray", "grey",
      "silver", "gold", "yellow", "pink", "purple", "orange", "maroon", "navy"
    ];
    let color = "Not specified";
    for (const c of colors) {
      if (text.includes(c)) {
        color = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }

    // Material list
    const materials = [
      "leather", "metal", "silicone", "plastic", "fabric", "canvas", "denim",
      "gold", "silver", "glass", "rubber", "polyester", "cotton"
    ];
    let material = "Not specified";
    for (const m of materials) {
      if (text.includes(m)) {
        material = m.charAt(0).toUpperCase() + m.slice(1);
        break;
      }
    }

    // Size list
    const sizes = ["small", "medium", "large", "xl", "tiny", "huge", "mini", "max", "pro", "plus"];
    let size = "Standard";
    for (const s of sizes) {
      if (text.includes(s)) {
        size = s.charAt(0).toUpperCase() + s.slice(1);
        break;
      }
    }

    // Shape list
    const shapes = ["rectangular", "square", "round", "oval", "circular", "flat", "curved", "cylindrical"];
    let shape = "Standard";
    for (const sh of shapes) {
      if (text.includes(sh)) {
        shape = sh.charAt(0).toUpperCase() + sh.slice(1);
        break;
      }
    }

    return { brand, color, material, size, shape };
  };

  const getDistanceText = (lost: Post, found: Post) => {
    if (!lost.latitude || !lost.longitude || !found.latitude || !found.longitude) {
      return { text: "No GPS Anchor", km: null };
    }
    const R = 6371; // km
    const dLat = (found.latitude - lost.latitude) * (Math.PI / 180);
    const dLon = (found.longitude - lost.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lost.latitude * (Math.PI / 180)) *
        Math.cos(found.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    if (d < 1) {
      return { text: `${Math.round(d * 1000)} meters away`, km: d };
    }
    return { text: `${d.toFixed(1)} km away`, km: d };
  };

  const getTimelineText = (lost: Post, found: Post) => {
    const diff = Math.abs(found.created - lost.created);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} apart`;
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} apart`;
    }
    return "Reported almost simultaneously";
  };

  const getHoursDaysProximityText = (lost: Post, found: Post) => {
    const diff = Math.abs(found.created - lost.created);
    const hours = Math.round(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h apart`;
    return `${hours} hours apart`;
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) {
      return {
        label: "Very High",
        badgeStyle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        barColor: "bg-emerald-500"
      };
    }
    if (score >= 80) {
      return {
        label: "High",
        badgeStyle: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        barColor: "bg-indigo-500"
      };
    }
    if (score >= 70) {
      return {
        label: "Moderate",
        badgeStyle: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        barColor: "bg-amber-500"
      };
    }
    return {
      label: "Low",
      badgeStyle: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      barColor: "bg-slate-500"
    };
  };

  const getMatchIndicator = (val1: string, val2: string) => {
    const isSpecified = val1 !== "Not specified" && val2 !== "Not specified";
    const isMatch = isSpecified && val1.toLowerCase() === val2.toLowerCase();
    
    if (isMatch) {
      return {
        style: "bg-emerald-950/20 border-emerald-500/30 text-emerald-400",
        text: "Match",
        match: true
      };
    }
    if (isSpecified && !isMatch) {
      return {
        style: "bg-rose-950/20 border-rose-500/30 text-rose-400",
        text: "Variation",
        match: false
      };
    }
    return {
      style: "bg-slate-900/30 border-slate-800 text-slate-400",
      text: "Unspecified",
      match: false
    };
  };

  const getStatusBadge = (
    status?: MatchStatus | string,
    ownerApproved?: boolean,
    finderApproved?: boolean,
    ownerTrusted?: boolean,
    finderTrusted?: boolean
  ) => {
    if (status === "RESOLVED") {
      return {
        label: "🎉 Reunited & Resolved",
        style: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold",
        icon: <CheckCircle2 size={12} className="text-emerald-400" />
      };
    }
    if (status === "OWNER_RECEIVED_CONFIRMED") {
      return {
        label: "Owner Confirmed Item Received (1/2 Handover Confirmations)",
        style: "bg-teal-500/15 text-teal-300 border-teal-500/30",
        icon: <CheckCheck size={12} className="text-teal-400" />
      };
    }
    if (status === "FINDER_HANDOVER_CONFIRMED") {
      return {
        label: "Finder Confirmed Handover Complete (1/2 Handover Confirmations)",
        style: "bg-teal-500/15 text-teal-300 border-teal-500/30",
        icon: <CheckCheck size={12} className="text-teal-400" />
      };
    }
    if (status === "HANDOVER_PENDING") {
      return {
        label: "Safe Handover In Progress",
        style: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
        icon: <MapPin size={12} className="text-cyan-400 animate-bounce" />
      };
    }
    if (status === "VERIFIED_CONNECTION" || (ownerApproved && finderApproved && ownerTrusted && finderTrusted)) {
      return {
        label: "Verified Connection (WhatsApp & Direct Handover Unlocked)",
        style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        icon: <ShieldCheck size={12} className="text-emerald-400" />
      };
    }
    if (status === "MUTUAL_TRUST_PENDING" || (ownerApproved && finderApproved)) {
      return {
        label: "Mutual Trust Pending (Owner/Finder confirmation required)",
        style: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        icon: <Clock size={12} className="text-amber-400 animate-pulse" />
      };
    }
    if (status === "OWNER_REVIEW_PENDING") {
      return {
        label: "Community Finding Reported (Owner Review Pending)",
        style: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        icon: <Sparkles size={12} className="text-purple-400 animate-pulse" />
      };
    }
    if (status === "OWNER_APPROVED") {
      return {
        label: "Owner Approved (1/2 Approvals)",
        style: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        icon: <CheckCircle2 size={12} className="text-blue-400" />
      };
    }
    if (status === "FINDER_APPROVED") {
      return {
        label: "Finder Approved (1/2 Approvals)",
        style: "bg-blue-500/15 text-blue-300 border-blue-500/30",
        icon: <CheckCircle2 size={12} className="text-blue-400" />
      };
    }
    if (status === "REJECTED") {
      return {
        label: "Connection Rejected",
        style: "bg-rose-500/15 text-rose-300 border-rose-500/30",
        icon: <XCircle size={12} className="text-rose-400" />
      };
    }
    return {
      label: "AI Forensic Match",
      style: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      icon: <Sparkles size={12} className="text-indigo-400" />
    };
  };

  // Submit Verification Form
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    if (!respondentName.trim() || !respondentContact.trim()) {
      addToast("Please fill in your name and contact details.", "warn");
      return;
    }

    setSubmittingVerification(true);
    try {
      const targetPostId = userRole === "Owner" ? selectedMatch.lostPostId : selectedMatch.foundPostId;
      const questions = [
        "What are the distinct secret markings, serial codes, or inner engravings?",
        "What specific accessories, cards, or contents were inside/attached?",
        "Where precisely was the item lost or found at the exact location?"
      ];

      const res = await apiService.verifyMatch(selectedMatch.matchId, {
        role: userRole,
        respondentName,
        contact: respondentContact,
        questions,
        answers: verificationAnswers,
        postId: targetPostId
      });

      if (res.success && res.match) {
        setSelectedMatch(res.match);
        setMatches((prev) => prev.map((m) => (m.matchId === selectedMatch.matchId ? res.match : m)));
        addToast("Claim submitted! The finder has been notified to review and verify.", "success");
        setActiveModalTab("verification");
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to submit verification.", "error");
    } finally {
      setSubmittingVerification(false);
    }
  };

  // Handle Approve Match (e.g. Finder clicks "Yes, I believe this is the owner")
  const handleApproveMatch = async (roleToApprove: "Owner" | "Finder") => {
    if (!selectedMatch) return;

    setActionLoading(true);
    try {
      const postId = roleToApprove === "Owner" ? selectedMatch.lostPostId : selectedMatch.foundPostId;
      const res = await apiService.approveMatch(selectedMatch.matchId, {
        role: roleToApprove,
        postId
      });

      if (res.success && res.match) {
        setSelectedMatch(res.match);
        setMatches((prev) => prev.map((m) => (m.matchId === selectedMatch.matchId ? res.match : m)));
        const isNowMutuallyApproved = (res.match.ownerApproved && res.match.finderApproved) || res.match.matchStatus === "VERIFIED_CONNECTION";
        if (isNowMutuallyApproved) {
          addToast("🎉 Connection Verified! Secure Chat is now unlocked.", "success");
          setActiveModalTab("chat");
        } else {
          addToast("Approval registered! Waiting for counterparty's approval.", "info");
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Approval failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Match
  const handleRejectMatch = async (roleToReject: "Owner" | "Finder") => {
    if (!selectedMatch) return;

    setActionLoading(true);
    try {
      const postId = roleToReject === "Owner" ? selectedMatch.lostPostId : selectedMatch.foundPostId;
      const res = await apiService.rejectMatch(selectedMatch.matchId, {
        role: roleToReject,
        postId,
        reason: rejectReason.trim() || "Item details do not match upon review."
      });

      if (res.success && res.match) {
        setSelectedMatch(res.match);
        setMatches((prev) => prev.map((m) => (m.matchId === selectedMatch.matchId ? res.match : m)));
        setRejectReason("");
        addToast("Match connection rejected and logged.", "info");
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Rejection failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Send Chat in Mutually Approved Connection
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !chatMessage.trim()) return;

    setSendingChat(true);
    try {
      const postId = userRole === "Owner" ? selectedMatch.lostPostId : selectedMatch.foundPostId;
      const res = await apiService.sendMatchChat(selectedMatch.matchId, {
        sender: userRole,
        text: chatMessage.trim(),
        postId
      });

      if (res.success && res.match) {
        setSelectedMatch(res.match);
        setMatches((prev) => prev.map((m) => (m.matchId === selectedMatch.matchId ? res.match : m)));
        setChatMessage("");
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to post chat message.", "error");
    } finally {
      setSendingChat(false);
    }
  };

  // Handle Confirm Trust (Both click "I Trust This Person" -> WhatsApp Unlocked)
  const handleConfirmTrust = async (roleToTrust: "Owner" | "Finder") => {
    if (!selectedMatch) return;

    setSubmittingTrust(true);
    try {
      const postId = roleToTrust === "Owner" ? selectedMatch.lostPostId : selectedMatch.foundPostId;
      const res = await apiService.submitMatchTrust(selectedMatch.matchId, {
        role: roleToTrust,
        postId
      });

      if (res.success && res.match) {
        setSelectedMatch(res.match);
        setMatches((prev) => prev.map((m) => (m.matchId === selectedMatch.matchId ? res.match : m)));
        const isBothTrusted = (res.match.ownerTrusted || (res.match as any).ownerTrustConfirmed) && (res.match.finderTrusted || (res.match as any).finderTrustConfirmed) || res.match.matchStatus === "VERIFIED_CONNECTION";
        if (isBothTrusted) {
          addToast("🎉 Mutual Trust Confirmed! Direct WhatsApp & phone number are now revealed!", "success");
        } else {
          addToast(`Trust confirmed! Waiting for the other person to click "I Trust This Person".`, "info");
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to confirm trust.", "error");
    } finally {
      setSubmittingTrust(false);
    }
  };

  // Handle Start Handover (Handover Phase)
  const handleStartHandover = async () => {
    if (!selectedMatch) return;

    setStartingHandover(true);
    try {
      const postId = userRole === "Owner" ? selectedMatch.lostPostId : selectedMatch.foundPostId;
      const res = await apiService.startMatchHandover(selectedMatch.matchId, {
        role: userRole,
        postId,
        location: handoverMeetingPlace.trim(),
        meetingTime: handoverScheduledTime.trim()
      });

      if (res.success && res.match) {
        setSelectedMatch(res.match);
        setMatches((prev) => prev.map((m) => (m.matchId === selectedMatch.matchId ? res.match : m)));
        addToast("Safe handover scheduled!", "success");
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to start handover.", "error");
    } finally {
      setStartingHandover(false);
    }
  };

  // Handle Confirm Handover (Handover Resolution)
  const handleConfirmHandover = async (roleToConfirm: "Owner" | "Finder") => {
    if (!selectedMatch) return;

    setConfirmingHandover(true);
    try {
      const postId = roleToConfirm === "Owner" ? selectedMatch.lostPostId : selectedMatch.foundPostId;
      const res = await apiService.confirmMatchHandover(selectedMatch.matchId, {
        role: roleToConfirm,
        postId
      });

      if (res.success && res.match) {
        setSelectedMatch(res.match);
        setMatches((prev) => prev.map((m) => (m.matchId === selectedMatch.matchId ? res.match : m)));
        if (res.match.matchStatus === "RESOLVED") {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
          addToast("🎉 Handover confirmed! Item successfully reunited & marked RESOLVED!", "success");
        } else {
          addToast(`Confirmed as ${roleToConfirm}! Waiting for the other party to confirm.`, "info");
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to confirm handover.", "error");
    } finally {
      setConfirmingHandover(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-[#07070a]/80 backdrop-blur-md rounded-3xl border border-[#161621] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="text-left space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles size={16} />
              </span>
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-white tracking-tight">
                AI Smart Matches & Mutual Verification
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-xl font-mono leading-relaxed">
              Gemini continuously compares Lost and Found listings. Connections follow strict mutual verification before Secure Chat coordinates item handover.
            </p>
          </div>

          {/* View Filter Pill Switcher */}
          <div className="flex bg-[#030304] p-1 rounded-2xl border border-[#161621] shrink-0 self-stretch sm:self-auto">
            <button
              onClick={() => setViewFilter("my")}
              className={`flex-1 sm:flex-initial text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                viewFilter === "my"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Shield size={12} />
              <span>My Matches</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/80 border border-slate-700">
                {filteredMatches.length}
              </span>
            </button>
            <button
              onClick={() => setViewFilter("all")}
              className={`flex-1 sm:flex-initial text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                viewFilter === "all"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Compass size={12} />
              <span>Public Matches</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/80 border border-slate-700">
                {matches.filter((m) => m.status !== "Dismissed").length}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Controls Bar */}
        <div className="mt-6 pt-5 border-t border-[#12121a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <label className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1.5 shrink-0">
              <Sliders size={13} className="text-indigo-400" />
              <span>Threshold:</span>
              <span className="text-indigo-400 font-extrabold text-sm">{threshold}%</span>
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={handleThresholdChange}
              className="w-full sm:w-44 accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <button
              onClick={handleSaveThreshold}
              disabled={savingThreshold}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-[11px] font-mono font-bold text-slate-300 hover:text-indigo-300 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {savingThreshold ? "Updating..." : "Save Baseline"}
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono flex items-center justify-between sm:justify-end gap-2">
            <span>Security: <strong>Mutual Approval Required</strong></span>
            <button
              onClick={loadData}
              title="Refresh Matches"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          <div className="bg-[#07070a]/60 border border-[#161621] rounded-2xl p-4 flex items-center justify-center gap-3 text-slate-400 font-mono text-xs animate-pulse">
            <Sparkles size={14} className="text-indigo-400 animate-spin" />
            <span>{loadingMessage}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-[#07070a]/90 rounded-2xl border border-[#161621] p-5 space-y-4 animate-pulse relative overflow-hidden flex flex-col justify-between h-[300px]"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-900/40">
                  <div className="h-4 w-16 bg-slate-900 rounded" />
                  <div className="h-4 w-20 bg-slate-900 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#12121a]">
                  <div className="p-2.5 rounded-xl border border-slate-900/60 space-y-2.5">
                    <div className="h-3 w-10 bg-slate-900 rounded" />
                    <div className="h-16 bg-slate-900 rounded-lg" />
                    <div className="h-3 w-16 bg-slate-900 rounded" />
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-900/60 space-y-2.5">
                    <div className="h-3 w-10 bg-slate-900 rounded" />
                    <div className="h-16 bg-slate-900 rounded-lg" />
                    <div className="h-3 w-16 bg-slate-900 rounded" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 w-24 bg-slate-900 rounded" />
                  <div className="h-8 w-24 bg-slate-900 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredMatches.length === 0 ? (
        /* Empty State */
        <div className="bg-[#07070a]/30 border border-[#161621] rounded-3xl p-12 text-center max-w-xl mx-auto space-y-5 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-3xl shadow-inner">
            ✨
          </div>
          <div className="space-y-2">
            <h4 className="font-display font-extrabold text-sm text-slate-200 uppercase tracking-wider">
              No Potential Matches Found
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto font-mono">
              {viewFilter === "my"
                ? "None of your reported items have triggered opposite-type match alerts exceeding your confidence setting. Create details or decrease the Smart Match threshold!"
                : "No active cross-listings meet or exceed the AI forensic match criteria. When a matching item is reported, LINCO will present it here."}
            </p>
          </div>
          <button
            onClick={handleImproveReport}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black uppercase tracking-wider transition shadow-lg cursor-pointer"
          >
            <span>Improve Your Report</span>
            <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        /* Match Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredMatches.map((m) => {
              const lostPost = getPostById(m.lostPostId)!;
              const foundPost = getPostById(m.foundPostId)!;
              const isExpanded = expandedMatchId === m.matchId;
              const isSaved = savedMatches.includes(m.matchId);

              // Extract Features for dynamic checklist preview on card
              const lostF = extractFeatures(lostPost);
              const foundF = extractFeatures(foundPost);

              const sameBrand = lostF.brand !== "Not specified" && foundF.brand !== "Not specified" && lostF.brand.toLowerCase() === foundF.brand.toLowerCase();
              const sameColor = lostF.color !== "Not specified" && foundF.color !== "Not specified" && lostF.color.toLowerCase() === foundF.color.toLowerCase();
              const sameCategory = lostPost.category.toLowerCase() === foundPost.category.toLowerCase();

              // Distance & Proximity values
              const distance = getDistanceText(lostPost, foundPost);
              const confidence = getConfidenceLevel(m.matchScore);
              const statusBadge = getStatusBadge(
                m.matchStatus,
                m.ownerApproved,
                m.finderApproved,
                Boolean(m.ownerTrusted || (m as any).ownerTrustConfirmed),
                Boolean(m.finderTrusted || (m as any).finderTrustConfirmed)
              );

              return (
                <motion.div
                  key={m.matchId}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#07070a]/95 rounded-2xl border border-[#161621] p-5 space-y-4 hover:border-slate-800 transition-all duration-300 shadow-xl relative overflow-hidden flex flex-col justify-between group"
                >
                  {/* Glowing decorative indicator */}
                  <div className={`absolute top-0 left-0 w-full h-[2px] ${confidence.barColor} opacity-80`} />

                  {/* Top Bar: Confidence and AI Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${statusBadge.style}`}>
                      {statusBadge.icon}
                      <span>{statusBadge.label}</span>
                    </span>
                    
                    <span className={`text-[10px] font-black font-mono px-2.5 py-1 rounded-lg border ${confidence.badgeStyle}`}>
                      {m.matchScore}% Match
                    </span>
                  </div>

                  {/* Side-by-Side Images Panel */}
                  <div className="grid grid-cols-2 gap-3.5 pb-2">
                    {/* Lost side */}
                    <div className="space-y-2 text-left bg-[#030304]/30 p-2.5 rounded-xl border border-rose-500/10 relative overflow-hidden">
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <span className="text-[8px] tracking-wider uppercase font-black px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/20">
                          🚨 Lost
                        </span>
                      </div>
                      
                      {lostPost.image ? (
                        <div className="h-28 sm:h-32 rounded-lg overflow-hidden border border-[#161621] bg-slate-900/10">
                          <img
                            src={lostPost.image}
                            alt="Lost item illustration"
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-28 sm:h-32 rounded-lg border border-dashed border-slate-800 bg-[#030304]/50 flex flex-col items-center justify-center text-xs text-slate-600 font-mono font-bold">
                          <span>No Photo</span>
                        </div>
                      )}
                      
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-[11px] font-extrabold text-slate-100 truncate">
                          {lostPost.item}
                        </h4>
                        <p className="text-[9px] text-slate-500 truncate flex items-center gap-0.5">
                          <MapPin size={9} className="shrink-0" /> {lostPost.address}
                        </p>
                      </div>
                    </div>

                    {/* Found side */}
                    <div className="space-y-2 text-left bg-[#030304]/30 p-2.5 rounded-xl border border-emerald-500/10 relative overflow-hidden">
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <span className="text-[8px] tracking-wider uppercase font-black px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/20">
                          ✅ Found
                        </span>
                      </div>

                      {foundPost.image ? (
                        <div className="h-28 sm:h-32 rounded-lg overflow-hidden border border-[#161621] bg-slate-900/10">
                          <img
                            src={foundPost.image}
                            alt="Found item illustration"
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-28 sm:h-32 rounded-lg border border-dashed border-slate-800 bg-[#030304]/50 flex flex-col items-center justify-center text-xs text-slate-600 font-mono font-bold">
                          <span>No Photo</span>
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-[11px] font-extrabold text-slate-100 truncate">
                          {foundPost.item}
                        </h4>
                        <p className="text-[9px] text-slate-500 truncate flex items-center gap-0.5">
                          <MapPin size={9} className="shrink-0" /> {foundPost.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mutual Approval Steps Mini Progress */}
                  <div className="bg-[#030304]/60 p-2.5 rounded-xl border border-[#12121a] flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${m.ownerApproved ? "bg-emerald-400" : "bg-slate-600"}`} />
                      <span className={m.ownerApproved ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        Owner: {m.ownerApproved ? "Approved ✓" : "Pending"}
                      </span>
                    </div>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${m.finderApproved ? "bg-emerald-400" : "bg-slate-600"}`} />
                      <span className={m.finderApproved ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        Finder: {m.finderApproved ? "Approved ✓" : "Pending"}
                      </span>
                    </div>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center gap-1">
                      {(m.ownerApproved && m.finderApproved) || m.matchStatus === "VERIFIED_CONNECTION" ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <Unlock size={10} /> Chat Live
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-0.5">
                          <Lock size={10} /> Chat Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Group */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-[#12121a] mt-auto">
                    <button
                      onClick={() => handleDismissMatch(m.matchId)}
                      className="px-3 py-2.5 rounded-xl bg-[#030304] border border-[#1c1c26] hover:border-red-500/30 text-slate-500 hover:text-red-400 transition cursor-pointer flex items-center justify-center shrink-0"
                      title="Dismiss Match"
                    >
                      <Trash2 size={13} />
                    </button>

                    <button
                      onClick={(e) => toggleSaveMatch(m.matchId, e)}
                      className={`px-3 py-2.5 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                        isSaved
                          ? "bg-pink-500/15 border-pink-500/40 text-pink-400"
                          : "bg-[#030304] border-[#1c1c26] text-slate-500 hover:text-pink-400 hover:border-pink-500/20"
                      }`}
                      title={isSaved ? "Saved to Watchlist" : "Save Match"}
                    >
                      <Heart size={13} className={isSaved ? "fill-pink-500" : ""} />
                    </button>

                    <button
                      onClick={(e) => handleShareMatch(m, e)}
                      className="px-3 py-2.5 rounded-xl bg-[#030304] border border-[#1c1c26] text-slate-500 hover:text-slate-300 transition cursor-pointer flex items-center justify-center shrink-0"
                      title="Share Match Link"
                    >
                      <Share2 size={13} />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMatch(m);
                        setActiveModalTab("compare");
                      }}
                      className="flex-1 min-w-[110px] py-2.5 rounded-xl bg-[#161622] hover:bg-[#20202e] border border-[#2c2c3e] text-indigo-300 hover:text-indigo-200 transition cursor-pointer flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase tracking-wider"
                    >
                      <Eye size={12} />
                      Inspect & Review
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMatch(m);
                        const isMutuallyApproved = (m.ownerApproved && m.finderApproved) || m.matchStatus === "VERIFIED_CONNECTION";
                        setActiveModalTab(isMutuallyApproved ? "chat" : "verification");
                      }}
                      className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white transition cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-950/50"
                    >
                      {(m.ownerApproved && m.finderApproved) || m.matchStatus === "VERIFIED_CONNECTION" ? (
                        <>
                          <MessageSquare size={12} />
                          Open Chat (Live)
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={12} />
                          Verify & Approve
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Side-by-Side Review & Mutual Approval Modal */}
      <AnimatePresence>
        {selectedMatch && (() => {
          const lostPost = getPostById(selectedMatch.lostPostId)!;
          const foundPost = getPostById(selectedMatch.foundPostId)!;
          const userOwnsLost = unlockedPosts.includes(selectedMatch.lostPostId);
          const userOwnsFound = unlockedPosts.includes(selectedMatch.foundPostId);

          const lostF = extractFeatures(lostPost);
          const foundF = extractFeatures(foundPost);

          const distance = getDistanceText(lostPost, foundPost);
          const confidence = getConfidenceLevel(selectedMatch.matchScore);
          const statusBadge = getStatusBadge(
            selectedMatch.matchStatus,
            selectedMatch.ownerApproved,
            selectedMatch.finderApproved,
            Boolean(selectedMatch.ownerTrusted || (selectedMatch as any).ownerTrustConfirmed),
            Boolean(selectedMatch.finderTrusted || (selectedMatch as any).finderTrustConfirmed)
          );
          const isMutuallyApproved = (selectedMatch.ownerApproved && selectedMatch.finderApproved) || selectedMatch.matchStatus === "VERIFIED_CONNECTION";

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#07070a] border border-[#161621] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col my-4 max-h-[92vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#12121a] bg-[#030304]/80 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-indigo-400" size={18} />
                    <h3 className="font-display font-extrabold text-xs sm:text-sm text-slate-100 uppercase tracking-wider">
                      Forensic Audit & Mutual Approval ({selectedMatch.matchScore}% Confidence)
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="p-1.5 rounded-lg bg-[#12121a] border border-[#1c1c26] text-slate-400 hover:text-white cursor-pointer transition"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Status Bar */}
                <div className="px-4 py-2.5 bg-[#0a0a10] border-b border-[#141420] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded border flex items-center gap-1 ${statusBadge.style}`}>
                      {statusBadge.icon}
                      <span>{statusBadge.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                      Both Owner and Finder must approve verification before Chat unlocks.
                    </span>
                  </div>

                  {/* Navigation Tabs inside Modal */}
                  <div className="flex bg-[#030304] p-0.5 rounded-xl border border-[#1a1a26] overflow-x-auto max-w-full">
                    <button
                      onClick={() => setActiveModalTab("compare")}
                      className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer whitespace-nowrap ${
                        activeModalTab === "compare"
                          ? "bg-slate-800 text-indigo-400 border border-slate-700"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Comparison
                    </button>
                    <button
                      onClick={() => setActiveModalTab("verification")}
                      className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        activeModalTab === "verification"
                          ? "bg-slate-800 text-indigo-400 border border-slate-700"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <ShieldCheck size={11} /> Verification
                    </button>
                    <button
                      onClick={() => setActiveModalTab("trust")}
                      className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        activeModalTab === "trust"
                          ? "bg-slate-800 text-emerald-400 border border-slate-700"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Handshake size={11} /> Trust & WhatsApp
                    </button>
                    <button
                      onClick={() => setActiveModalTab("handover")}
                      className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        activeModalTab === "handover"
                          ? "bg-slate-800 text-cyan-400 border border-slate-700"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <MapPin size={11} /> Handover
                    </button>
                    <button
                      onClick={() => setActiveModalTab("chat")}
                      className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        activeModalTab === "chat"
                          ? "bg-slate-800 text-indigo-400 border border-slate-700"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {isMutuallyApproved ? <Unlock size={11} className="text-emerald-400" /> : <Lock size={11} />}
                      Secure Chat
                    </button>
                  </div>
                </div>

                {/* Modal Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                  {activeModalTab === "compare" && (
                    <div className="space-y-5">
                      {/* Side-by-Side Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        {/* Lost Report Card */}
                        <div className="space-y-4 text-left p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                          <div className="flex justify-between items-center pb-2 border-b border-rose-500/15">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              🚨 Lost Report
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{lostPost.timestamp}</span>
                          </div>

                          {lostPost.image ? (
                            <div className="rounded-xl overflow-hidden border border-[#161621] max-h-44">
                              <img
                                src={lostPost.image}
                                alt="Lost item illustration"
                                className="w-full h-40 object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="h-40 rounded-xl border border-dashed border-slate-800 bg-[#030304]/60 flex flex-col items-center justify-center text-xs text-slate-600 font-mono font-bold">
                              <span>No Image Provided</span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black block">Item Name</span>
                            <h4 className="text-sm font-extrabold text-slate-100">{lostPost.item}</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5 text-xs">
                            <div>
                              <span className="text-[8px] text-slate-500 uppercase font-black block">Category</span>
                              <span className="text-slate-300 font-bold">📂 {lostPost.category}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-500 uppercase font-black block">Reward</span>
                              <span className="text-emerald-400 font-mono font-black">
                                {lostPost.reward ? `₹${lostPost.reward}` : "No Reward"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black block">Location & Address</span>
                            <p className="text-xs text-slate-300 font-mono">{lostPost.address}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black block">Details Description</span>
                            <p className="text-xs text-slate-300 leading-relaxed bg-[#030304]/40 p-2.5 rounded-xl border border-[#12121a]">
                              {lostPost.details}
                            </p>
                          </div>
                        </div>

                        {/* Found Report Card */}
                        <div className="space-y-4 text-left p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                          <div className="flex justify-between items-center pb-2 border-b border-emerald-500/15">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              ✅ Found Report
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{foundPost.timestamp}</span>
                          </div>

                          {foundPost.image ? (
                            <div className="rounded-xl overflow-hidden border border-[#161621] max-h-44">
                              <img
                                src={foundPost.image}
                                alt="Found item illustration"
                                className="w-full h-40 object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="h-40 rounded-xl border border-dashed border-slate-800 bg-[#030304]/60 flex flex-col items-center justify-center text-xs text-slate-600 font-mono font-bold">
                              <span>No Image Provided</span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black block">Item Name</span>
                            <h4 className="text-sm font-extrabold text-slate-100">{foundPost.item}</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5 text-xs">
                            <div>
                              <span className="text-[8px] text-slate-500 uppercase font-black block">Category</span>
                              <span className="text-slate-300 font-bold">📂 {foundPost.category}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-500 uppercase font-black block">Finder Contact</span>
                              <span className="text-slate-300 font-mono font-bold">{foundPost.maskedContact || "Verified Finder"}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black block">Location & Address</span>
                            <p className="text-xs text-slate-300 font-mono">{foundPost.address}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[8px] text-slate-500 uppercase font-black block">Details Description</span>
                            <p className="text-xs text-slate-300 leading-relaxed bg-[#030304]/40 p-2.5 rounded-xl border border-[#12121a]">
                              {foundPost.details}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Distance & Forensic Analytics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-[#030304]/60 border border-[#161621] text-left space-y-2">
                          <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                            📍 Spatial Distance
                          </span>
                          <p className="text-sm font-black text-slate-200">{distance.text}</p>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                            {distance.km !== null && distance.km <= 5
                              ? "✓ Exceptional spatial alignment! Reported within close geographic radius."
                              : "Items reported further apart. Check transit or commuting route alignment."}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-[#030304]/60 border border-[#161621] text-left space-y-2">
                          <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                            🕒 AI Forensic Reason
                          </span>
                          <p className="text-xs text-slate-300 font-mono italic leading-relaxed">
                            "{selectedMatch.reason}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModalTab === "verification" && (
                    <div className="space-y-6 text-left">
                      {/* Mutual Verification Overview Banner */}
                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-indigo-300 uppercase tracking-wider">
                          <ShieldCheck size={15} className="text-indigo-400" />
                          <span>Mutual Verification Protocol</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono">
                          To maintain zero-trust security and prevent fraudulent handovers, both the Owner and Finder submit verification details. Chat stays strictly locked until both parties approve each other's answers.
                        </p>
                      </div>

                      {/* Approval Tracker Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Owner Verification Status */}
                        <div className="p-4 rounded-2xl bg-[#030304]/80 border border-[#161621] space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-[#12121a]">
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-400" /> Owner Status
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              selectedMatch.ownerApproved
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : selectedMatch.ownerVerification
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}>
                              {selectedMatch.ownerApproved ? "Approved ✓" : selectedMatch.ownerVerification ? "Submitted (Review Pending)" : "Not Submitted"}
                            </span>
                          </div>

                          {selectedMatch.ownerVerification ? (
                            <div className="space-y-2 text-xs font-mono">
                              <p className="text-slate-400">
                                Submitted By: <strong className="text-slate-200">{selectedMatch.ownerVerification.respondentName}</strong>
                              </p>
                              <p className="text-slate-400">
                                AI Verification Score: <strong className="text-indigo-400">{selectedMatch.ownerVerification.aiScore}%</strong>
                              </p>
                              <div className="space-y-1.5 pt-1">
                                {selectedMatch.ownerVerification.questions?.map((q, idx) => (
                                  <div key={idx} className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">
                                    <span className="text-[9px] text-slate-500 block font-bold">Q: {q}</span>
                                    <span className="text-[11px] text-slate-300 font-sans block mt-0.5">
                                      A: {selectedMatch.ownerVerification?.answers?.[idx] || "N/A"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 font-mono">
                              The item owner has not submitted verification answers yet.
                            </p>
                          )}
                        </div>

                        {/* Finder Verification Status */}
                        <div className="p-4 rounded-2xl bg-[#030304]/80 border border-[#161621] space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-[#12121a]">
                            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Finder Status
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              selectedMatch.finderApproved
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : selectedMatch.finderVerification
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}>
                              {selectedMatch.finderApproved ? "Approved ✓" : selectedMatch.finderVerification ? "Submitted (Review Pending)" : "Not Submitted"}
                            </span>
                          </div>

                          {selectedMatch.finderVerification ? (
                            <div className="space-y-2 text-xs font-mono">
                              <p className="text-slate-400">
                                Submitted By: <strong className="text-slate-200">{selectedMatch.finderVerification.respondentName}</strong>
                              </p>
                              <p className="text-slate-400">
                                AI Verification Score: <strong className="text-indigo-400">{selectedMatch.finderVerification.aiScore}%</strong>
                              </p>
                              <div className="space-y-1.5 pt-1">
                                {selectedMatch.finderVerification.questions?.map((q, idx) => (
                                  <div key={idx} className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80">
                                    <span className="text-[9px] text-slate-500 block font-bold">Q: {q}</span>
                                    <span className="text-[11px] text-slate-300 font-sans block mt-0.5">
                                      A: {selectedMatch.finderVerification?.answers?.[idx] || "N/A"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 font-mono">
                              The item finder has not submitted verification answers yet.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Form: Submit My Verification OR Review & Approve Counterparty */}
                      <div className="p-5 rounded-2xl bg-[#030304]/90 border border-[#161621] space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#12121a]">
                          <div>
                            <h4 className="text-sm font-display font-extrabold text-slate-100 uppercase tracking-wider">
                              Participant Action Controls
                            </h4>
                            <p className="text-xs text-slate-400 font-mono">
                              Select your role to submit details or review and verify this connection.
                            </p>
                          </div>

                          {/* Role Selector */}
                          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setUserRole("Owner")}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                                userRole === "Owner"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              I am the Owner
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserRole("Finder")}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                                userRole === "Finder"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              I am the Finder
                            </button>
                          </div>
                        </div>

                        {/* Submit Verification Form */}
                        {((userRole === "Owner" && !selectedMatch.ownerVerification) ||
                          (userRole === "Finder" && !selectedMatch.finderVerification)) && (
                          <form onSubmit={handleSubmitVerification} className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Your Name</label>
                                <input
                                  type="text"
                                  placeholder="Full Name"
                                  value={respondentName}
                                  onChange={(e) => setRespondentName(e.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">WhatsApp / Contact</label>
                                <input
                                  type="text"
                                  placeholder="+91 98765 43210"
                                  value={respondentContact}
                                  onChange={(e) => setRespondentContact(e.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                                Forensic Verification Questions
                              </label>

                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-mono">1. What are the secret markings, serial codes, or inner engravings?</span>
                                <input
                                  type="text"
                                  placeholder="e.g., small scratch on bottom left, serial ending in 492"
                                  value={verificationAnswers[0]}
                                  onChange={(e) => {
                                    const next = [...verificationAnswers];
                                    next[0] = e.target.value;
                                    setVerificationAnswers(next);
                                  }}
                                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-mono">2. What specific accessories, cards, or contents were inside/attached?</span>
                                <input
                                  type="text"
                                  placeholder="e.g., metro card in sleeve, blue charging cable"
                                  value={verificationAnswers[1]}
                                  onChange={(e) => {
                                    const next = [...verificationAnswers];
                                    next[1] = e.target.value;
                                    setVerificationAnswers(next);
                                  }}
                                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-mono">3. Where precisely was the item lost or found at the exact location?</span>
                                <input
                                  type="text"
                                  placeholder="e.g., near bench #3 at gate 2"
                                  value={verificationAnswers[2]}
                                  onChange={(e) => {
                                    const next = [...verificationAnswers];
                                    next[2] = e.target.value;
                                    setVerificationAnswers(next);
                                  }}
                                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                disabled={submittingVerification}
                                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-lg shadow-indigo-950/50 disabled:opacity-50"
                              >
                                {submittingVerification ? "Submitting..." : "Submit Verification Answers"}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Approval / Rejection Controls for Pending Submissions */}
                        <div className="pt-3 border-t border-[#12121a] space-y-3">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="text-xs text-slate-400 font-mono">
                              {userRole === "Finder"
                                ? "Review the owner's details. If they match the found item, confirm to unlock Secure Chat."
                                : "Review the finder's details. Confirm to unlock Secure Chat."}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleApproveMatch(userRole)}
                                disabled={actionLoading}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg shadow-emerald-950/50"
                              >
                                <CheckCircle size={13} />
                                {actionLoading ? "Processing..." : userRole === "Finder" ? "Yes, I believe this is the owner" : "Approve Verification"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectMatch(userRole)}
                                disabled={actionLoading}
                                className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <XCircle size={13} />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModalTab === "trust" && (() => {
                    const viewerRoleKey = userRole.toLowerCase() as "owner" | "finder";
                    const revealed = getMatchRevealedContact(selectedMatch, viewerRoleKey);
                    const isOwnerTrustedConfirmed = Boolean(selectedMatch.ownerTrusted || (selectedMatch as any).ownerTrustConfirmed);
                    const isFinderTrustedConfirmed = Boolean(selectedMatch.finderTrusted || (selectedMatch as any).finderTrustConfirmed);
                    const isBothTrusted = (isOwnerTrustedConfirmed && isFinderTrustedConfirmed) || selectedMatch.matchStatus === "VERIFIED_CONNECTION";
                    const waMessage = `Hi! Reaching out via LINCO regarding the matched ${lostPost.item} report. Let's coordinate safe handover.`;
                    const waLink = revealed.whatsappUrl || (revealed.isEligible ? getWhatsAppLink(revealed.contact, waMessage) : "");

                    return (
                      <div className="space-y-6 text-left">
                        {/* Explainer Banner */}
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <ShieldCheck size={16} />
                            <h4 className="text-xs font-display font-extrabold uppercase tracking-wider">
                              Mutual Trust & Protected WhatsApp Contact
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 font-mono leading-relaxed">
                            To ensure safety and privacy across the community, direct WhatsApp and contact numbers are revealed as soon as <strong>BOTH parties click "I Trust This Person"</strong>.
                          </p>
                        </div>

                        {/* Mutual Trust Status Checklist */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-2xl border ${isOwnerTrustedConfirmed ? "bg-emerald-950/20 border-emerald-500/30" : "bg-[#030304]/60 border-[#161621]"}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200">Owner Trust</span>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isOwnerTrustedConfirmed ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                                {isOwnerTrustedConfirmed ? "Confirmed ✓" : "Pending Confirmation"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono mt-2">
                              {isOwnerTrustedConfirmed
                                ? "Owner has confirmed trust."
                                : "Awaiting owner trust confirmation."}
                            </p>
                          </div>

                          <div className={`p-4 rounded-2xl border ${isFinderTrustedConfirmed ? "bg-emerald-950/20 border-emerald-500/30" : "bg-[#030304]/60 border-[#161621]"}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200">Finder Trust</span>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isFinderTrustedConfirmed ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                                {isFinderTrustedConfirmed ? "Confirmed ✓" : "Pending Confirmation"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono mt-2">
                              {isFinderTrustedConfirmed
                                ? "Finder has confirmed trust."
                                : "Awaiting finder trust confirmation."}
                            </p>
                          </div>
                        </div>

                        {/* Contact Card (Revealed if eligible, masked if not) */}
                        <div className="p-5 rounded-2xl bg-[#030304] border border-[#161621] space-y-4">
                          <div className="flex items-center justify-between border-b border-[#12121a] pb-3">
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-indigo-400" />
                              <span className="text-xs font-display font-bold text-slate-200 uppercase tracking-wider">
                                {userRole === "Owner" ? "Finder's Verified Contact" : "Owner's Verified Contact"}
                              </span>
                            </div>
                            {revealed.isEligible ? (
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                <Unlock size={10} /> Unlocked
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                                <Lock size={10} /> Masked & Protected
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#07070d] border border-[#141420]">
                              <div>
                                <span className="text-[10px] font-mono text-slate-500 uppercase block">Contact Name / Alias</span>
                                <span className="text-xs font-bold text-slate-200">{revealed.name}</span>
                              </div>

                              <div>
                                <span className="text-[10px] font-mono text-slate-500 uppercase block">Phone / WhatsApp</span>
                                <span className="text-xs font-mono font-extrabold text-white">
                                  {revealed.isEligible ? revealed.contact : revealed.maskedContact}
                                </span>
                              </div>
                            </div>

                            {revealed.isEligible ? (
                              <div className="flex flex-wrap gap-2.5 pt-2">
                                {waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 min-w-[160px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
                                  >
                                    <Phone size={13} />
                                    <span>Open WhatsApp Chat</span>
                                    <ExternalLink size={11} />
                                  </a>
                                )}
                                <a
                                  href={`tel:${revealed.contact}`}
                                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Phone size={13} /> Direct Call
                                </a>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 font-mono flex items-center gap-2">
                                <Lock size={13} className="text-amber-400 shrink-0" />
                                <span>Both users must click "I Trust This Person" below to reveal active WhatsApp link and phone number.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Confirm Trust Action */}
                        {((userRole === "Owner" && !isOwnerTrustedConfirmed) || (userRole === "Finder" && !isFinderTrustedConfirmed)) && (
                          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#0c0c16] to-[#06060c] border border-indigo-500/20 space-y-4">
                            <h5 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-display">
                              Confirm Trust as {userRole}
                            </h5>
                            <p className="text-xs text-slate-400 font-mono">
                              By clicking trust, you authorize exchanging direct WhatsApp contact for safe item handover.
                            </p>

                            <button
                              type="button"
                              onClick={() => handleConfirmTrust(userRole)}
                              disabled={submittingTrust}
                              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-950/50"
                            >
                              <Handshake size={15} />
                              {submittingTrust ? "Confirming..." : "I Trust This Person"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {activeModalTab === "handover" && (() => {
                    const isResolved = selectedMatch.matchStatus === "RESOLVED";

                    return (
                      <div className="space-y-6 text-left">
                        {/* Handover Status Banner */}
                        {isResolved ? (
                          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-emerald-950/40 border border-emerald-500/40 text-center space-y-3 shadow-2xl">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-xl">
                              🎉
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-display font-extrabold text-white uppercase tracking-wider">
                                Item Successfully Reunited & Resolved!
                              </h4>
                              <p className="text-xs text-slate-300 font-mono max-w-md mx-auto leading-relaxed">
                                Both owner and finder have confirmed the safe handover. Case resolved!
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })}
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
                            >
                              Celebrate Reunion ✨
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
                            <div className="flex items-center gap-2 text-cyan-400">
                              <MapPin size={16} />
                              <h4 className="text-xs font-display font-extrabold uppercase tracking-wider">
                                Safe Handover Protocol
                              </h4>
                            </div>
                            <p className="text-xs text-slate-300 font-mono leading-relaxed">
                              Coordinate a public meetup location (e.g. Metro Station, Police Helpdesk, or campus security). Once physically handed over, both parties confirm below to resolve the case.
                            </p>
                          </div>
                        )}

                        {/* Handover Details Form */}
                        {!isResolved && (
                          <div className="p-5 rounded-2xl bg-[#030304] border border-[#161621] space-y-4">
                            <h5 className="text-xs font-display font-bold text-slate-200 uppercase tracking-wider">
                              Handover Location & Schedule
                            </h5>

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Public Meeting Spot</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Kolkata Metro Station Gate #2 Concourse"
                                  value={handoverMeetingPlace}
                                  onChange={(e) => setHandoverMeetingPlace(e.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Scheduled Date / Time</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Today at 4:00 PM"
                                  value={handoverScheduledTime}
                                  onChange={(e) => setHandoverScheduledTime(e.target.value)}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white outline-none focus:border-cyan-500"
                                />
                              </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={handleStartHandover}
                                disabled={startingHandover}
                                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg shadow-cyan-950/50"
                              >
                                <MapPin size={13} />
                                {startingHandover ? "Scheduling..." : "Schedule Safe Handover"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Handover Completion Confirmation Buttons */}
                        {!isResolved && (
                          <div className="p-5 rounded-2xl bg-[#06060c] border border-[#161621] space-y-4">
                            <h5 className="text-xs font-display font-bold text-slate-200 uppercase tracking-wider">
                              Confirm Handover & Resolve Case
                            </h5>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Once physically handed over at the meetup spot, confirm to finalize the return.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={() => handleConfirmHandover("Finder")}
                                disabled={confirmingHandover}
                                className="flex-1 px-4 py-3 rounded-xl bg-teal-600/20 hover:bg-teal-600 border border-teal-500/30 text-teal-300 hover:text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCheck size={14} />
                                I handed over this item
                              </button>

                              <button
                                type="button"
                                onClick={() => handleConfirmHandover("Owner")}
                                disabled={confirmingHandover}
                                className="flex-1 px-4 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCheck size={14} />
                                I received my item
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {activeModalTab === "chat" && (
                    <div className="space-y-4">
                      {/* Check if Mutually Approved */}
                      {!isMutuallyApproved ? (
                        <div className="p-8 rounded-3xl bg-[#030304]/80 border border-[#161621] text-center space-y-4">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                            <Lock size={24} />
                          </div>
                          <div className="space-y-1 max-w-md mx-auto">
                            <h4 className="text-sm font-display font-extrabold text-slate-100 uppercase tracking-wider">
                              Secure Chat Unlocks After Verification
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed font-mono">
                              Once the claim is verified, end-to-end Secure Chat automatically opens between both parties.
                            </p>
                          </div>

                          <div className="flex justify-center gap-4 text-xs font-mono pt-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${selectedMatch.ownerApproved ? "bg-emerald-400" : "bg-slate-600"}`} />
                              <span className={selectedMatch.ownerApproved ? "text-emerald-400 font-bold" : "text-slate-500"}>
                                Owner: {selectedMatch.ownerApproved ? "Verified ✓" : "Pending"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${selectedMatch.finderApproved ? "bg-emerald-400" : "bg-slate-600"}`} />
                              <span className={selectedMatch.finderApproved ? "text-emerald-400 font-bold" : "text-slate-500"}>
                                Finder: {selectedMatch.finderApproved ? "Verified ✓" : "Pending"}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveModalTab("verification")}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-lg shadow-indigo-950/50"
                          >
                            Go to Verification Tab
                          </button>
                        </div>
                      ) : (
                        /* Mutually Approved Secure Handover Chat */
                        <div className="bg-[#030304] border border-[#161621] rounded-2xl flex flex-col h-[400px] overflow-hidden">
                          {/* Chat Header */}
                          <div className="px-4 py-3 border-b border-[#12121a] bg-[#07070d] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-xs font-mono font-bold text-slate-200">
                                End-to-End Secure Handover Chat
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                              ✓ Verified Connection
                            </span>
                          </div>

                          {/* Chat Messages */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#030305]/40 text-left">
                            {(!selectedMatch.messages || selectedMatch.messages.length === 0) ? (
                              <div className="text-center py-12 text-slate-500 text-xs font-mono">
                                Connection verified! Send a message to coordinate safe handover.
                              </div>
                            ) : (
                              selectedMatch.messages.map((msg) => {
                                const isSystem = msg.sender === "System";
                                const isMe = msg.sender === userRole;

                                if (isSystem) {
                                  return (
                                    <div key={msg.id} className="text-center my-2">
                                      <span className="inline-block px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                                        {msg.text}
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div
                                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs ${
                                        isMe
                                          ? "bg-indigo-600 text-white rounded-tr-none"
                                          : "bg-[#0c0c14] border border-[#1e1e2d] text-slate-200 rounded-tl-none"
                                      }`}
                                    >
                                      <span className="block text-[8px] opacity-70 font-mono mb-0.5 font-bold">
                                        {msg.sender}
                                      </span>
                                      <p className="break-words leading-relaxed font-sans">{msg.text}</p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                            <div ref={chatBottomRef} />
                          </div>

                          {/* Chat Input Bar */}
                          <form onSubmit={handleSendChat} className="p-3 border-t border-[#12121a] bg-[#07070d] flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Type a message to coordinate handover..."
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-indigo-500"
                              required
                            />

                            <button
                              type="submit"
                              disabled={sendingChat || !chatMessage.trim()}
                              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 shrink-0 disabled:opacity-50 shadow-lg shadow-indigo-950/50"
                            >
                              <Send size={12} />
                              <span>{sendingChat ? "Sending..." : "Send"}</span>
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-[#12121a] bg-[#030304]/90 flex flex-wrap gap-3 justify-between items-center">
                  <button
                    onClick={() => handleDismissMatch(selectedMatch.matchId)}
                    className="px-4 py-2.5 rounded-xl bg-[#030304] hover:bg-[#12121a] text-slate-400 hover:text-red-400 border border-[#1c1c26] text-xs font-bold transition flex items-center gap-1 uppercase cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Dismiss Match
                  </button>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={(e) => toggleSaveMatch(selectedMatch.matchId, e)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold uppercase transition cursor-pointer flex items-center gap-1.5 ${
                        savedMatches.includes(selectedMatch.matchId)
                          ? "bg-pink-500/15 border-pink-500/40 text-pink-400"
                          : "bg-[#030304] border-[#1c1c26] text-slate-400 hover:text-white"
                      }`}
                    >
                      <Heart size={13} className={savedMatches.includes(selectedMatch.matchId) ? "fill-pink-500" : ""} />
                      {savedMatches.includes(selectedMatch.matchId) ? "Saved" : "Save Match"}
                    </button>

                    <button
                      onClick={(e) => handleShareMatch(selectedMatch, e)}
                      className="px-4 py-2.5 rounded-xl bg-[#030304] hover:bg-[#12121a] text-slate-400 hover:text-white border border-[#1c1c26] text-xs font-extrabold uppercase transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 size={13} />
                      Share
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMatch(null);
                        const targetPostToClaim = userOwnsLost ? foundPost : lostPost;
                        const oppositePostId = targetPostToClaim.id === lostPost.id ? foundPost.id : lostPost.id;
                        onStartClaim(targetPostToClaim, oppositePostId);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-black tracking-wider uppercase transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/40"
                    >
                      <ShieldCheck size={14} /> Direct Claim
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
