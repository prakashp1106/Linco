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

  // Safe resolver for posts, creating graceful fallback if post record is not yet in state
  const resolvePost = (postId: string, fallbackType: "Lost" | "Found", matchObj?: PotentialMatch | null): Post => {
    const existing = getPostById(postId);
    if (existing) return existing;
    const anyMatch = matchObj as any;
    return {
      id: postId,
      type: fallbackType,
      item: fallbackType === "Lost" ? (anyMatch?.lostItemName || "Lost Item") : (anyMatch?.foundItemName || "Found Item"),
      category: (fallbackType === "Lost" ? anyMatch?.lostCategory : anyMatch?.foundCategory) || "General",
      details: fallbackType === "Lost" ? (anyMatch?.lostItemName || "") : (anyMatch?.foundItemName || ""),
      location: (fallbackType === "Lost" ? anyMatch?.lostLocation : anyMatch?.foundLocation) || "Reported Location",
      date: (fallbackType === "Lost" ? anyMatch?.lostDate : anyMatch?.foundDate) || "Recently",
      time: "",
      status: "Active",
      resolved: false,
      securityPin: "",
      image: (fallbackType === "Lost" ? anyMatch?.lostPhoto : anyMatch?.foundPhoto) || "",
      contact: "",
      created: Date.now(),
      createdAt: Date.now()
    } as any;
  };

  // Dynamic feature extraction helper for side-by-side comparison
  const extractFeatures = (post?: Post | null) => {
    if (!post) {
      return { brand: "Not specified", color: "Not specified", material: "Not specified", size: "Medium", shape: "Standard" };
    }
    const text = `${post.item || ""} ${post.details || ""}`.toLowerCase();
    
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

  const getDistanceText = (lost?: Post | null, found?: Post | null) => {
    if (!lost || !found || !lost.latitude || !lost.longitude || !found.latitude || !found.longitude) {
      return { text: "Location matched", km: null };
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

  const getTimelineText = (lost?: Post | null, found?: Post | null) => {
    if (!lost || !found) return "Timeline matched";
    const lostCreated = (lost as any).created || (lost as any).createdAt || Date.now();
    const foundCreated = (found as any).created || (found as any).createdAt || Date.now();
    const diff = Math.abs(foundCreated - lostCreated);
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

  const getHoursDaysProximityText = (lost?: Post | null, found?: Post | null) => {
    if (!lost || !found) return "Recent report";
    const lostCreated = (lost as any).created || (lost as any).createdAt || Date.now();
    const foundCreated = (found as any).created || (found as any).createdAt || Date.now();
    const diff = Math.abs(foundCreated - lostCreated);
    const hours = Math.round(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h apart`;
    return `${hours} hours apart`;
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) {
      return {
        label: "Very High",
        badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
        barColor: "bg-emerald-500"
      };
    }
    if (score >= 80) {
      return {
        label: "High",
        badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200",
        barColor: "bg-indigo-600"
      };
    }
    if (score >= 70) {
      return {
        label: "Moderate",
        badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
        barColor: "bg-amber-500"
      };
    }
    return {
      label: "Low",
      badgeStyle: "bg-slate-100 text-slate-600 border-slate-200",
      barColor: "bg-slate-400"
    };
  };

  const getMatchIndicator = (val1: string, val2: string) => {
    const isSpecified = val1 !== "Not specified" && val2 !== "Not specified";
    const isMatch = isSpecified && val1.toLowerCase() === val2.toLowerCase();
    
    if (isMatch) {
      return {
        style: "bg-emerald-50 border-emerald-200 text-emerald-700",
        text: "Match",
        match: true
      };
    }
    if (isSpecified && !isMatch) {
      return {
        style: "bg-rose-50 border-rose-200 text-rose-700",
        text: "Variation",
        match: false
      };
    }
    return {
      style: "bg-slate-100 border-slate-200 text-slate-500",
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
        label: "Reunited & Resolved",
        style: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
        icon: <CheckCircle2 size={12} className="text-emerald-600" />
      };
    }
    if (status === "OWNER_RECEIVED_CONFIRMED") {
      return {
        label: "Owner Confirmed Return • Awaiting Finder",
        style: "bg-teal-50 text-teal-700 border-teal-200 font-medium",
        icon: <CheckCheck size={12} className="text-teal-600" />
      };
    }
    if (status === "FINDER_HANDOVER_CONFIRMED") {
      return {
        label: "Finder Confirmed Handover • Awaiting Owner",
        style: "bg-teal-50 text-teal-700 border-teal-200 font-medium",
        icon: <CheckCheck size={12} className="text-teal-600" />
      };
    }
    if (status === "HANDOVER_PENDING") {
      return {
        label: "Safe Handover In Progress",
        style: "bg-indigo-50 text-indigo-700 border-indigo-200 font-medium",
        icon: <MapPin size={12} className="text-indigo-600" />
      };
    }
    if (ownerApproved && finderApproved && ownerTrusted && finderTrusted) {
      return {
        label: "Mutual Trust Confirmed • Contact Unlocked",
        style: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium",
        icon: <ShieldCheck size={12} className="text-emerald-600" />
      };
    }
    if (status === "VERIFIED_CONNECTION" || (ownerApproved && finderApproved)) {
      return {
        label: "Verified Match • Secure Chat Ready",
        style: "bg-indigo-50 text-indigo-700 border-indigo-200 font-medium",
        icon: <ShieldCheck size={12} className="text-indigo-600" />
      };
    }
    if (status === "MUTUAL_TRUST_PENDING" || (ownerApproved && finderApproved)) {
      return {
        label: "Mutual Trust Pending Confirmation",
        style: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
        icon: <Clock size={12} className="text-amber-600" />
      };
    }
    if (status === "OWNER_REVIEW_PENDING") {
      return {
        label: "Found Report Received • Review Pending",
        style: "bg-purple-50 text-purple-700 border-purple-200 font-medium",
        icon: <Sparkles size={12} className="text-purple-600" />
      };
    }
    if (status === "OWNER_APPROVED") {
      return {
        label: "Owner Approved • Awaiting Finder",
        style: "bg-blue-50 text-blue-700 border-blue-200 font-medium",
        icon: <CheckCircle2 size={12} className="text-blue-600" />
      };
    }
    if (status === "FINDER_APPROVED") {
      return {
        label: "Finder Approved • Awaiting Owner",
        style: "bg-blue-50 text-blue-700 border-blue-200 font-medium",
        icon: <CheckCircle2 size={12} className="text-blue-600" />
      };
    }
    if (status === "REJECTED") {
      return {
        label: "Connection Closed",
        style: "bg-rose-50 text-rose-700 border-rose-200 font-medium",
        icon: <XCircle size={12} className="text-rose-600" />
      };
    }
    return {
      label: "Potential Match",
      style: "bg-indigo-50 text-indigo-700 border-indigo-200 font-medium",
      icon: <Sparkles size={12} className="text-indigo-600" />
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
        const isBothTrusted = Boolean((res.match.ownerTrusted || (res.match as any).ownerTrustConfirmed) && (res.match.finderTrusted || (res.match as any).finderTrustConfirmed));
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
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles size={16} />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Potential Matches
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Automated comparisons between lost and found listings. Contact details remain protected until mutual verification is complete.
            </p>
          </div>

          {/* View Filter Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-stretch sm:self-auto">
            <button
              onClick={() => setViewFilter("my")}
              className={`flex-1 sm:flex-initial text-xs font-semibold px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                viewFilter === "my"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield size={13} />
              <span>My Listings</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                {filteredMatches.length}
              </span>
            </button>
            <button
              onClick={() => setViewFilter("all")}
              className={`flex-1 sm:flex-initial text-xs font-semibold px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                viewFilter === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Compass size={13} />
              <span>All Matches</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                {matches.filter((m) => m.status !== "Dismissed").length}
              </span>
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5 shrink-0">
              <Sliders size={13} className="text-slate-500" />
              <span>Similarity threshold:</span>
              <span className="text-slate-900 font-bold">{threshold}%</span>
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={handleThresholdChange}
              className="w-full sm:w-40 accent-indigo-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
            />
            <button
              onClick={handleSaveThreshold}
              disabled={savingThreshold}
              className="w-full sm:w-auto px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              {savingThreshold ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between sm:justify-end gap-2">
            <span>Mutual verification required</span>
            <button
              onClick={loadData}
              title="Refresh Matches"
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-center gap-3 text-slate-600 text-xs shadow-xs">
            <Sparkles size={14} className="text-indigo-600 animate-spin" />
            <span>{loadingMessage}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 animate-pulse relative overflow-hidden flex flex-col justify-between h-[300px] shadow-sm"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                  <div className="p-2.5 rounded-xl border border-slate-100 space-y-2.5 bg-slate-50">
                    <div className="h-3 w-10 bg-slate-200 rounded" />
                    <div className="h-16 bg-slate-200 rounded-lg" />
                    <div className="h-3 w-16 bg-slate-200 rounded" />
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-100 space-y-2.5 bg-slate-50">
                    <div className="h-3 w-10 bg-slate-200 rounded" />
                    <div className="h-16 bg-slate-200 rounded-lg" />
                    <div className="h-3 w-16 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                  <div className="h-8 w-24 bg-slate-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredMatches.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <Sparkles size={20} />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-semibold text-sm text-slate-900">
              No Potential Matches Found
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              {viewFilter === "my"
                ? "None of your reported items have triggered match alerts exceeding your confidence setting. Add details or adjust the match threshold."
                : "No active cross-listings meet or exceed the AI forensic match criteria. When a matching item is reported, LINCO will present it here."}
            </p>
          </div>
          <button
            onClick={handleImproveReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
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
              const lostPost = resolvePost(m.lostPostId, "Lost", m);
              const foundPost = resolvePost(m.foundPostId, "Found", m);
              const isExpanded = expandedMatchId === m.matchId;
              const isSaved = savedMatches.includes(m.matchId);

              // Extract Features for dynamic checklist preview on card
              const lostF = extractFeatures(lostPost);
              const foundF = extractFeatures(foundPost);

              const sameBrand = lostF.brand !== "Not specified" && foundF.brand !== "Not specified" && lostF.brand.toLowerCase() === foundF.brand.toLowerCase();
              const sameColor = lostF.color !== "Not specified" && foundF.color !== "Not specified" && lostF.color.toLowerCase() === foundF.color.toLowerCase();
              const sameCategory = (lostPost.category || "").toLowerCase() === (foundPost.category || "").toLowerCase();

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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-5 space-y-4 transition duration-200 shadow-sm hover:shadow-md flex flex-col justify-between group"
                >
                  {/* Top Bar: Confidence and Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 ${statusBadge.style}`}>
                      {statusBadge.icon}
                      <span>{statusBadge.label}</span>
                    </span>
                    
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg border ${confidence.badgeStyle}`}>
                      {m.matchScore}% match
                    </span>
                  </div>

                  {/* Side-by-Side Images Panel */}
                  <div className="grid grid-cols-2 gap-3 pb-1">
                    {/* Lost side */}
                    <div className="space-y-2 text-left bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          Lost
                        </span>
                      </div>
                      
                      {lostPost.image ? (
                        <div className="h-28 sm:h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                          <img
                            src={lostPost.image}
                            alt="Lost item"
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-28 sm:h-32 rounded-lg border border-dashed border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-xs text-slate-400 font-medium">
                          <span>No photo</span>
                        </div>
                      )}
                      
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 truncate">
                          {lostPost.item}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <MapPin size={11} className="shrink-0 text-slate-400" /> {lostPost.address}
                        </p>
                      </div>
                    </div>

                    {/* Found side */}
                    <div className="space-y-2 text-left bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Found
                        </span>
                      </div>

                      {foundPost.image ? (
                        <div className="h-28 sm:h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                          <img
                            src={foundPost.image}
                            alt="Found item"
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-28 sm:h-32 rounded-lg border border-dashed border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-xs text-slate-400 font-medium">
                          <span>No photo</span>
                        </div>
                      )}

                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 truncate">
                          {foundPost.item}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <MapPin size={11} className="shrink-0 text-slate-400" /> {foundPost.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mutual Approval Steps Progress */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${m.ownerApproved ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className={m.ownerApproved ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                        Owner: {m.ownerApproved ? "Verified" : "Pending"}
                      </span>
                    </div>
                    <span className="text-slate-300">·</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${m.finderApproved ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className={m.finderApproved ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                        Finder: {m.finderApproved ? "Verified" : "Pending"}
                      </span>
                    </div>
                    <span className="text-slate-300">·</span>
                    <div className="flex items-center gap-1">
                      {(m.ownerApproved && m.finderApproved) || m.matchStatus === "VERIFIED_CONNECTION" ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Unlock size={11} /> Chat Active
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Lock size={11} /> Chat Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Group */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 mt-auto">
                    <button
                      onClick={() => handleDismissMatch(m.matchId)}
                      className="px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition cursor-pointer flex items-center justify-center shrink-0"
                      title="Dismiss Match"
                    >
                      <Trash2 size={13} />
                    </button>

                    <button
                      onClick={(e) => toggleSaveMatch(m.matchId, e)}
                      className={`px-2.5 py-2 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${
                        isSaved
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:text-rose-600"
                      }`}
                      title={isSaved ? "Saved" : "Save Match"}
                    >
                      <Heart size={13} className={isSaved ? "fill-rose-500" : ""} />
                    </button>

                    <button
                      onClick={(e) => handleShareMatch(m, e)}
                      className="px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center shrink-0"
                      title="Share Match"
                    >
                      <Share2 size={13} />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMatch(m);
                        setActiveModalTab("compare");
                      }}
                      className="flex-1 min-w-[100px] py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold"
                    >
                      <Eye size={13} />
                      Review
                    </button>

                    <button
                      onClick={() => {
                        setSelectedMatch(m);
                        const isMutuallyApproved = (m.ownerApproved && m.finderApproved) || m.matchStatus === "VERIFIED_CONNECTION";
                        setActiveModalTab(isMutuallyApproved ? "chat" : "verification");
                      }}
                      className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold"
                    >
                      {(m.ownerApproved && m.finderApproved) || m.matchStatus === "VERIFIED_CONNECTION" ? (
                        <>
                          <MessageSquare size={13} />
                          Open Chat
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={13} />
                          Verify &amp; Approve
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
          const lostPost = resolvePost(selectedMatch.lostPostId, "Lost", selectedMatch);
          const foundPost = resolvePost(selectedMatch.foundPostId, "Found", selectedMatch);
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200/90 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col my-4 max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedMatch(null)}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Back to matches list"
                    >
                      <span>← Back</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-indigo-600" size={16} />
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
                        Forensic Audit & Mutual Approval ({selectedMatch.matchScore}% Confidence)
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer transition shadow-2xs"
                    aria-label="Close modal"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Status Bar */}
                <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${statusBadge.style}`}>
                      {statusBadge.icon}
                      <span>{statusBadge.label}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      Both Owner and Finder must approve verification before Chat unlocks.
                    </span>
                  </div>

                  {/* Navigation Tabs inside Modal */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
                    <button
                      onClick={() => setActiveModalTab("compare")}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer whitespace-nowrap ${
                        activeModalTab === "compare"
                          ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Comparison
                    </button>
                    <button
                      onClick={() => setActiveModalTab("verification")}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        activeModalTab === "verification"
                          ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <ShieldCheck size={11} /> Verification
                    </button>
                    <button
                      onClick={() => setActiveModalTab("trust")}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        activeModalTab === "trust"
                          ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Handshake size={11} /> Trust & Contact
                    </button>
                    <button
                      onClick={() => setActiveModalTab("handover")}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        activeModalTab === "handover"
                          ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <MapPin size={11} /> Handover
                    </button>
                    <button
                      onClick={() => setActiveModalTab("chat")}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                        activeModalTab === "chat"
                          ? "bg-white text-slate-900 shadow-2xs border border-slate-200/80"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {isMutuallyApproved ? <Unlock size={11} className="text-emerald-600" /> : <Lock size={11} />}
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
                        <div className="space-y-4 text-left p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Lost Report
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{lostPost.timestamp}</span>
                          </div>

                          {lostPost.image ? (
                            <div className="rounded-xl overflow-hidden border border-slate-200 max-h-44 bg-slate-100">
                              <img
                                src={lostPost.image}
                                alt="Lost item illustration"
                                className="w-full h-40 object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="h-40 rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-xs text-slate-400">
                              <span>No Image Provided</span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-medium block">Item Name</span>
                            <h4 className="text-sm font-semibold text-slate-900">{lostPost.item}</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-medium block">Category</span>
                              <span className="text-slate-700 font-medium">{lostPost.category}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-medium block">Reward</span>
                              <span className="text-emerald-600 font-mono font-bold">
                                {lostPost.reward ? `₹${lostPost.reward}` : "No Reward"}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-medium block">Location & Address</span>
                            <p className="text-xs text-slate-700">{lostPost.address}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-medium block">Details Description</span>
                            <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                              {lostPost.details}
                            </p>
                          </div>
                        </div>

                        {/* Found Report Card */}
                        <div className="space-y-4 text-left p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Found Report
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{foundPost.timestamp}</span>
                          </div>

                          {foundPost.image ? (
                            <div className="rounded-xl overflow-hidden border border-slate-200 max-h-44 bg-slate-100">
                              <img
                                src={foundPost.image}
                                alt="Found item illustration"
                                className="w-full h-40 object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="h-40 rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-xs text-slate-400">
                              <span>No Image Provided</span>
                            </div>
                          )}

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-medium block">Item Name</span>
                            <h4 className="text-sm font-semibold text-slate-900">{foundPost.item}</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-medium block">Category</span>
                              <span className="text-slate-700 font-medium">{foundPost.category}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-medium block">Finder Contact</span>
                              <span className="text-slate-700 font-mono font-medium">{foundPost.maskedContact || "Verified Finder"}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-medium block">Location & Address</span>
                            <p className="text-xs text-slate-700">{foundPost.address}</p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 uppercase font-medium block">Details Description</span>
                            <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                              {foundPost.details}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Distance & Forensic Analytics */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                            Spatial Distance
                          </span>
                          <p className="text-sm font-bold text-slate-900">{distance.text}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {distance.km !== null && distance.km <= 5
                              ? "✓ Exceptional spatial alignment! Reported within close geographic radius."
                              : "Items reported further apart. Check transit or commuting route alignment."}
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                            AI Forensic Reason
                          </span>
                          <p className="text-xs text-slate-700 italic leading-relaxed">
                            "{selectedMatch.reason}"
                          </p>
                        </div>
                      </div>

                      {/* Quick Mutual Approval Decision Strip */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-indigo-600" />
                            <span className="text-xs font-bold text-slate-900">
                              Mutual Approval Review — {userRole} Perspective
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500">Match Status:</span>
                            <span className="text-indigo-700 font-semibold">{selectedMatch.matchStatus}</span>
                          </div>
                        </div>

                        {selectedMatch.ownerApproved && selectedMatch.finderApproved ? (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                            <span className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                              <CheckCircle size={14} className="text-emerald-600" /> Mutual approval confirmed. Both parties have verified.
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveModalTab("chat")}
                              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer transition shrink-0"
                            >
                              Open Secure Chat →
                            </button>
                          </div>
                        ) : (userRole === "Owner" && selectedMatch.ownerApproved) ? (
                          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs text-indigo-800 font-medium">
                            <span>✓ You marked: <strong>"This looks like my item"</strong>. Waiting for finder's confirmation.</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold">1/2 Approved</span>
                          </div>
                        ) : (userRole === "Finder" && selectedMatch.finderApproved) ? (
                          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3 text-xs text-indigo-800 font-medium">
                            <span>✓ You confirmed: <strong>"Yes, this is the owner"</strong>. Waiting for owner's confirmation.</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold">1/2 Approved</span>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <p className="text-xs text-slate-500">
                              {userRole === "Finder"
                                ? "Does this lost report match the item you found? Confirm to proceed toward Secure Chat."
                                : "Does this found report match your lost item? Confirm to notify the finder."}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleApproveMatch(userRole)}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer transition flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCircle size={13} />
                                {actionLoading
                                  ? "Saving..."
                                  : userRole === "Finder"
                                  ? "Yes, this is the owner"
                                  : "This looks like my item"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectMatch(userRole)}
                                disabled={actionLoading}
                                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs cursor-pointer transition disabled:opacity-50"
                              >
                                <XCircle size={13} />
                                {userRole === "Finder" ? "No, details do not match" : "Not my item"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeModalTab === "verification" && (
                    <div className="space-y-6 text-left">
                      {/* Mutual Verification Overview Banner */}
                      <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200/80 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 uppercase tracking-wider">
                          <ShieldCheck size={15} className="text-indigo-600" />
                          <span>Mutual Verification Protocol</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          To maintain zero-trust security and prevent fraudulent handovers, both the Owner and Finder submit verification details. Chat stays strictly locked until both parties approve each other's answers.
                        </p>
                      </div>

                      {/* Approval Tracker Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Owner Verification Status */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500" /> Owner Status
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              selectedMatch.ownerApproved
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : selectedMatch.ownerVerification
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-slate-200/80 text-slate-600 border-slate-300"
                            }`}>
                              {selectedMatch.ownerApproved ? "Approved ✓" : selectedMatch.ownerVerification ? "Submitted (Review Pending)" : "Not Submitted"}
                            </span>
                          </div>

                          {selectedMatch.ownerVerification ? (
                            <div className="space-y-2 text-xs">
                              <p className="text-slate-600">
                                Submitted By: <strong className="text-slate-900">{selectedMatch.ownerVerification.respondentName}</strong>
                              </p>
                              <p className="text-slate-600">
                                AI Verification Score: <strong className="text-indigo-600">{selectedMatch.ownerVerification.aiScore}%</strong>
                              </p>
                              <div className="space-y-1.5 pt-1">
                                {selectedMatch.ownerVerification.questions?.map((q, idx) => (
                                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-500 block font-semibold">Q: {q}</span>
                                    <span className="text-xs text-slate-800 block mt-0.5">
                                      A: {selectedMatch.ownerVerification?.answers?.[idx] || "N/A"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">
                              The item owner has not submitted verification answers yet.
                            </p>
                          )}
                        </div>

                        {/* Finder Verification Status */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Finder Status
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              selectedMatch.finderApproved
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : selectedMatch.finderVerification
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-slate-200/80 text-slate-600 border-slate-300"
                            }`}>
                              {selectedMatch.finderApproved ? "Approved ✓" : selectedMatch.finderVerification ? "Submitted (Review Pending)" : "Not Submitted"}
                            </span>
                          </div>

                          {selectedMatch.finderVerification ? (
                            <div className="space-y-2 text-xs">
                              <p className="text-slate-600">
                                Submitted By: <strong className="text-slate-900">{selectedMatch.finderVerification.respondentName}</strong>
                              </p>
                              <p className="text-slate-600">
                                AI Verification Score: <strong className="text-indigo-600">{selectedMatch.finderVerification.aiScore}%</strong>
                              </p>
                              <div className="space-y-1.5 pt-1">
                                {selectedMatch.finderVerification.questions?.map((q, idx) => (
                                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <span className="text-[10px] text-slate-500 block font-semibold">Q: {q}</span>
                                    <span className="text-xs text-slate-800 block mt-0.5">
                                      A: {selectedMatch.finderVerification?.answers?.[idx] || "N/A"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">
                              The item finder has not submitted verification answers yet.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Form: Submit My Verification OR Review & Approve Counterparty */}
                      <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              Participant Action Controls
                            </h4>
                            <p className="text-xs text-slate-500">
                              Select your role to submit details or review and verify this connection.
                            </p>
                          </div>

                          {/* Role Selector */}
                          <div className="flex bg-slate-200/80 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setUserRole("Owner")}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                userRole === "Owner"
                                  ? "bg-white text-rose-700 shadow-2xs border border-slate-200/80"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              I am the Owner
                            </button>
                            <button
                              type="button"
                              onClick={() => setUserRole("Finder")}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                                userRole === "Finder"
                                  ? "bg-white text-emerald-700 shadow-2xs border border-slate-200/80"
                                  : "text-slate-600 hover:text-slate-900"
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
                                <label className="text-[10px] font-bold text-slate-600 uppercase">Your Name</label>
                                <input
                                  type="text"
                                  placeholder="Full Name"
                                  value={respondentName}
                                  onChange={(e) => setRespondentName(e.target.value)}
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 uppercase">WhatsApp / Contact</label>
                                <input
                                  type="text"
                                  placeholder="+91 98765 43210"
                                  value={respondentContact}
                                  onChange={(e) => setRespondentContact(e.target.value)}
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] font-bold text-slate-600 uppercase block">
                                Forensic Verification Questions
                              </label>

                              <div className="space-y-1">
                                <span className="text-[11px] text-slate-600 font-medium">1. What are the secret markings, serial codes, or inner engravings?</span>
                                <input
                                  type="text"
                                  placeholder="e.g., small scratch on bottom left, serial ending in 492"
                                  value={verificationAnswers[0]}
                                  onChange={(e) => {
                                    const next = [...verificationAnswers];
                                    next[0] = e.target.value;
                                    setVerificationAnswers(next);
                                  }}
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[11px] text-slate-600 font-medium">2. What specific accessories, cards, or contents were inside/attached?</span>
                                <input
                                  type="text"
                                  placeholder="e.g., metro card in sleeve, blue charging cable"
                                  value={verificationAnswers[1]}
                                  onChange={(e) => {
                                    const next = [...verificationAnswers];
                                    next[1] = e.target.value;
                                    setVerificationAnswers(next);
                                  }}
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[11px] text-slate-600 font-medium">3. Where precisely was the item lost or found at the exact location?</span>
                                <input
                                  type="text"
                                  placeholder="e.g., near bench #3 at gate 2"
                                  value={verificationAnswers[2]}
                                  onChange={(e) => {
                                    const next = [...verificationAnswers];
                                    next[2] = e.target.value;
                                    setVerificationAnswers(next);
                                  }}
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                disabled={submittingVerification}
                                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-2xs"
                              >
                                {submittingVerification ? "Submitting..." : "Submit Verification Answers"}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Approval / Rejection Controls for Pending Submissions */}
                        <div className="pt-3 border-t border-slate-200 space-y-3">
                          {selectedMatch.ownerApproved && selectedMatch.finderApproved ? (
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-emerald-800 text-xs font-medium">
                                <CheckCircle size={15} className="text-emerald-600" />
                                <span>Mutual Approval Complete! Connection verified. Secure Chat is unlocked.</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveModalTab("chat")}
                                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                              >
                                <MessageSquare size={13} />
                                Open Secure Chat →
                              </button>
                            </div>
                          ) : (userRole === "Owner" && selectedMatch.ownerApproved) ? (
                            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-indigo-800 text-xs font-medium">
                                <Clock size={15} className="animate-spin text-indigo-600" />
                                <span>✓ You marked: <strong>"This looks like my item"</strong>. Waiting for finder's confirmation to unlock Secure Chat.</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold">1/2 Approvals</span>
                            </div>
                          ) : (userRole === "Finder" && selectedMatch.finderApproved) ? (
                            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-indigo-800 text-xs font-medium">
                                <Clock size={15} className="animate-spin text-indigo-600" />
                                <span>✓ You confirmed: <strong>"Yes, this is the owner"</strong>. Waiting for owner's confirmation to unlock Secure Chat.</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold">1/2 Approvals</span>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                              <div className="text-xs text-slate-600">
                                {userRole === "Finder"
                                  ? "Review the owner's evidence and answers. Does this match what you found?"
                                  : "Review the found item details and AI analysis. Does this look like your item?"}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApproveMatch(userRole)}
                                  disabled={actionLoading}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-2xs"
                                >
                                  <CheckCircle size={13} />
                                  {actionLoading
                                    ? "Processing..."
                                    : userRole === "Finder"
                                    ? "Yes, this is the owner"
                                    : "This looks like my item"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRejectMatch(userRole)}
                                  disabled={actionLoading}
                                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                  <XCircle size={13} />
                                  {userRole === "Finder" ? "No, details do not match" : "Not my item"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModalTab === "trust" && (() => {
                    const viewerRoleKey = userRole.toLowerCase() as "owner" | "finder";
                    const revealed = getMatchRevealedContact(selectedMatch, viewerRoleKey);
                    const isOwnerTrustedConfirmed = Boolean(selectedMatch.ownerTrusted || (selectedMatch as any).ownerTrustConfirmed);
                    const isFinderTrustedConfirmed = Boolean(selectedMatch.finderTrusted || (selectedMatch as any).finderTrustConfirmed);
                    const waMessage = `Hi! Reaching out via LINCO regarding the matched ${lostPost.item} report. Let's coordinate safe handover.`;
                    const waLink = revealed.whatsappUrl || (revealed.isEligible ? getWhatsAppLink(revealed.contact, waMessage) : "");

                    return (
                      <div className="space-y-6 text-left">
                        {/* Explainer Banner */}
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-800">
                            <ShieldCheck size={16} className="text-emerald-600" />
                            <h4 className="text-xs font-bold uppercase tracking-wider">
                              Mutual Trust & Protected WhatsApp Contact
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            To ensure safety and privacy across the community, direct WhatsApp and contact numbers are revealed as soon as <strong>BOTH parties click "I Trust This Person"</strong>.
                          </p>
                        </div>

                        {/* Mutual Trust Status Checklist */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-xl border ${isOwnerTrustedConfirmed ? "bg-emerald-50/80 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">Owner Trust</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isOwnerTrustedConfirmed ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-200/80 text-slate-600"}`}>
                                {isOwnerTrustedConfirmed ? "Confirmed ✓" : "Pending Confirmation"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              {isOwnerTrustedConfirmed
                                ? "Owner has confirmed trust."
                                : "Awaiting owner trust confirmation."}
                            </p>
                          </div>

                          <div className={`p-4 rounded-xl border ${isFinderTrustedConfirmed ? "bg-emerald-50/80 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">Finder Trust</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isFinderTrustedConfirmed ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-200/80 text-slate-600"}`}>
                                {isFinderTrustedConfirmed ? "Confirmed ✓" : "Pending Confirmation"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                              {isFinderTrustedConfirmed
                                ? "Finder has confirmed trust."
                                : "Awaiting finder trust confirmation."}
                            </p>
                          </div>
                        </div>

                        {/* Contact Card (Revealed if eligible, masked if not) */}
                        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-indigo-600" />
                              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                {userRole === "Owner" ? "Finder's Verified Contact" : "Owner's Verified Contact"}
                              </span>
                            </div>
                            {revealed.isEligible ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                <Unlock size={10} /> Unlocked
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                <Lock size={10} /> Masked & Protected
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-slate-200">
                              <div>
                                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Contact Name / Alias</span>
                                <span className="text-xs font-semibold text-slate-900">{revealed.name}</span>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Phone / WhatsApp</span>
                                <span className="text-xs font-mono font-bold text-slate-900">
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
                                    className="flex-1 min-w-[160px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                                  >
                                    <Phone size={13} />
                                    <span>Open WhatsApp Chat</span>
                                    <ExternalLink size={11} />
                                  </a>
                                )}
                                <a
                                  href={`tel:${revealed.contact}`}
                                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs"
                                >
                                  <Phone size={13} /> Direct Call
                                </a>
                              </div>
                            ) : (
                              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                                <Lock size={13} className="text-amber-600 shrink-0" />
                                <span>Both users must click "I Trust This Person" below to reveal active WhatsApp link and phone number.</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Confirm Trust Action */}
                        {((userRole === "Owner" && !isOwnerTrustedConfirmed) || (userRole === "Finder" && !isFinderTrustedConfirmed)) && (
                          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Confirm Trust as {userRole}
                            </h5>
                            <p className="text-xs text-slate-500">
                              By clicking trust, you authorize exchanging direct WhatsApp contact for safe item handover.
                            </p>

                            <button
                              type="button"
                              onClick={() => handleConfirmTrust(userRole)}
                              disabled={submittingTrust}
                              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xs"
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
                          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-700 font-bold text-lg">
                              ✓
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-slate-900">
                                Item Successfully Reunited & Resolved!
                              </h4>
                              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                                Both owner and finder have confirmed the safe handover. Case resolved!
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              Celebrate Reunion ✨
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-800">
                              <MapPin size={16} className="text-indigo-600" />
                              <h4 className="text-xs font-bold uppercase tracking-wider">
                                Safe Handover Protocol
                              </h4>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Coordinate a public meetup location (e.g. Metro Station, Police Helpdesk, or campus security). Once physically handed over, both parties confirm below to resolve the case.
                            </p>
                          </div>
                        )}

                        {/* Handover Details Form */}
                        {!isResolved && (
                          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Handover Location & Schedule
                            </h5>

                            <div className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 uppercase">Public Meeting Spot</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Kolkata Metro Station Gate #2 Concourse"
                                  value={handoverMeetingPlace}
                                  onChange={(e) => setHandoverMeetingPlace(e.target.value)}
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 uppercase">Scheduled Date / Time</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Today at 4:00 PM"
                                  value={handoverScheduledTime}
                                  onChange={(e) => setHandoverScheduledTime(e.target.value)}
                                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                                />
                              </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={handleStartHandover}
                                disabled={startingHandover}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-2xs"
                              >
                                <MapPin size={13} />
                                {startingHandover ? "Scheduling..." : "Schedule Safe Handover"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Handover Completion Confirmation Buttons */}
                        {!isResolved && (
                          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Confirm Handover & Resolve Case
                            </h5>
                            <p className="text-xs text-slate-500">
                              Once physically handed over at the meetup spot, confirm to finalize the return.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={() => handleConfirmHandover("Finder")}
                                disabled={confirmingHandover}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                <CheckCheck size={14} />
                                I handed over this item
                              </button>

                              <button
                                type="button"
                                onClick={() => handleConfirmHandover("Owner")}
                                disabled={confirmingHandover}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
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
                        <div className="p-6 sm:p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-700">
                            <Lock size={20} />
                          </div>
                          <div className="space-y-1 max-w-md mx-auto">
                            <h4 className="text-sm font-bold text-slate-900">
                              Secure Chat Unlocks After Verification
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Once the claim is verified, end-to-end Secure Chat automatically opens between both parties.
                            </p>
                          </div>

                          <div className="flex justify-center gap-4 text-xs pt-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${selectedMatch.ownerApproved ? "bg-emerald-500" : "bg-slate-300"}`} />
                              <span className={selectedMatch.ownerApproved ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                                Owner: {selectedMatch.ownerApproved ? "Verified ✓" : "Pending"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${selectedMatch.finderApproved ? "bg-emerald-500" : "bg-slate-300"}`} />
                              <span className={selectedMatch.finderApproved ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                                Finder: {selectedMatch.finderApproved ? "Verified ✓" : "Pending"}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveModalTab("verification")}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
                          >
                            Go to Verification Tab
                          </button>
                        </div>
                      ) : (
                        /* Mutually Approved Secure Handover Chat */
                        <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-[400px] overflow-hidden shadow-2xs">
                          {/* Chat Header */}
                          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-xs font-bold text-slate-800">
                                End-to-End Secure Handover Chat
                              </span>
                            </div>
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                              ✓ Verified Connection
                            </span>
                          </div>

                          {/* Chat Messages */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 text-left">
                            {(!selectedMatch.messages || selectedMatch.messages.length === 0) ? (
                              <div className="text-center py-12 text-slate-400 text-xs">
                                Connection verified! Send a message to coordinate safe handover.
                              </div>
                            ) : (
                              selectedMatch.messages.map((msg) => {
                                const isSystem = msg.sender === "System";
                                const isMe = msg.sender === userRole;

                                if (isSystem) {
                                  return (
                                    <div key={msg.id} className="text-center my-2">
                                      <span className="inline-block px-3 py-1 rounded-full bg-white border border-slate-200 text-indigo-700 text-[10px] font-medium shadow-2xs">
                                        {msg.text}
                                      </span>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div
                                      className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs ${
                                        isMe
                                          ? "bg-indigo-600 text-white rounded-tr-xs shadow-2xs"
                                          : "bg-white border border-slate-200 text-slate-900 rounded-tl-xs shadow-2xs"
                                      }`}
                                    >
                                      <span className="block text-[9px] opacity-75 mb-0.5 font-semibold">
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
                          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Type a message to coordinate handover..."
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              required
                            />

                            <button
                              type="submit"
                              disabled={sendingChat || !chatMessage.trim()}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1 shrink-0 disabled:opacity-50 shadow-2xs"
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
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-3 justify-between items-center">
                  <button
                    onClick={() => handleDismissMatch(selectedMatch.matchId)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Trash2 size={13} />
                    Dismiss Match
                  </button>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={(e) => toggleSaveMatch(selectedMatch.matchId, e)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        savedMatches.includes(selectedMatch.matchId)
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      <Heart size={13} className={savedMatches.includes(selectedMatch.matchId) ? "fill-rose-500 text-rose-500" : ""} />
                      {savedMatches.includes(selectedMatch.matchId) ? "Saved" : "Save Match"}
                    </button>

                    <button
                      onClick={(e) => handleShareMatch(selectedMatch, e)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
