import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  BadgeCheck
} from "lucide-react";
import { Post, PotentialMatch } from "../types";
import { apiService } from "../services/api";

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

  // Accordion list for detail breakdowns
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

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
    if (initialSelectedMatchId && matches.length > 0) {
      const match = matches.find((m) => m.matchId === initialSelectedMatchId);
      if (match) {
        setSelectedMatch(match);
        if (onClearSelectedMatchId) {
          onClearSelectedMatchId();
        }
      }
    }
  }, [initialSelectedMatchId, matches, onClearSelectedMatchId]);

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

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThreshold(parseInt(e.target.value));
  };

  const handleSaveThreshold = async () => {
    setSavingThreshold(true);
    try {
      const res = await apiService.updateConfig(threshold);
      if (res.success) {
        addToast(`Baseline match threshold updated to ${threshold}%!`, "success");
        // Reload matches with new filter
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

  const handleMarkReviewed = async (matchId: string) => {
    try {
      const res = await apiService.reviewMatch(matchId, true, "Active");
      if (res.success) {
        setMatches((prev) =>
          prev.map((m) => (m.matchId === matchId ? { ...m, reviewed: true } : m))
        );
        addToast("Match flagged as manually audited.", "success");
        if (selectedMatch?.matchId === matchId) {
          setSelectedMatch(null);
        }
      }
    } catch (err) {
      addToast("Could not audit match.", "error");
    }
  };

  // Saved toggle
  const toggleSaveMatch = (matchId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedMatches((prev) => {
      const isSaved = prev.includes(matchId);
      const next = isSaved ? prev.filter(id => id !== matchId) : [...prev, matchId];
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
    navigator.clipboard.writeText(text)
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

  // Quick Action: click Report tab programmatically for Empty State
  const handleImproveReport = () => {
    const navButtons = Array.from(document.querySelectorAll("nav button, button"));
    const reportBtn = navButtons.find(btn => btn.textContent?.includes("Report"));
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
    const brands = ["apple", "iphone", "samsung", "galaxy", "oneplus", "google", "pixel", "redmi", "realme", "vivo", "oppo", "xiaomi", "dell", "hp", "lenovo", "asus", "acer", "sony", "casio", "titan", "wildhorn", "gucci", "nike", "adidas", "puma", "fossil", "fastrack"];
    let brand = "Not specified";
    for (const b of brands) {
      if (text.includes(b)) {
        brand = b.charAt(0).toUpperCase() + b.slice(1);
        break;
      }
    }
    if (brand === "Iphone") brand = "Apple";

    // Color list
    const colors = ["black", "brown", "blue", "red", "green", "white", "gray", "grey", "silver", "gold", "yellow", "pink", "purple", "orange", "maroon", "navy"];
    let color = "Not specified";
    for (const c of colors) {
      if (text.includes(c)) {
        color = c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }

    // Material list
    const materials = ["leather", "metal", "silicone", "plastic", "fabric", "canvas", "denim", "gold", "silver", "glass", "rubber", "polyester", "cotton"];
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

  // Helper to compare attributes and output matching indicator
  const getMatchIndicator = (val1: string, val2: string) => {
    const v1 = val1.toLowerCase().trim();
    const v2 = val2.toLowerCase().trim();
    if (v1 === "not specified" || v2 === "not specified") {
      return { match: false, text: "Incomplete details", style: "text-slate-500 bg-slate-950/20 border-slate-800" };
    }
    if (v1 === v2) {
      return { match: true, text: "Exact Match", style: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20" };
    }
    // Substring or fuzzy matching
    if (v1.includes(v2) || v2.includes(v1)) {
      return { match: true, text: "High Similarity", style: "text-teal-400 bg-teal-500/5 border-teal-500/20" };
    }
    return { match: false, text: "Discrepancy Check", style: "text-amber-400 bg-amber-500/5 border-amber-500/15" };
  };

  const getConfidenceLevel = (score: number) => {
    if (score >= 90) {
      return {
        label: "High Confidence",
        badgeStyle: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
        color: "text-emerald-400",
        barColor: "bg-emerald-400"
      };
    } else if (score >= 75) {
      return {
        label: "Medium Confidence",
        badgeStyle: "bg-amber-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.1)]",
        color: "text-amber-400",
        barColor: "bg-amber-400"
      };
    } else {
      return {
        label: "Baseline Match",
        badgeStyle: "bg-slate-800/80 border-slate-700 text-slate-300",
        color: "text-cyan-400",
        barColor: "bg-cyan-400"
      };
    }
  };

  const getDistanceText = (lost: Post, found: Post) => {
    const lostLat = lost.latitude;
    const lostLng = lost.longitude;
    const foundLat = found.latitude;
    const foundLng = found.longitude;
    
    if (lostLat !== undefined && lostLng !== undefined && foundLat !== undefined && foundLng !== undefined) {
      const R = 6371; // km
      const dLat = (foundLat - lostLat) * Math.PI / 180;
      const dLon = (foundLng - lostLng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lostLat * Math.PI / 180) * Math.cos(foundLat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c;
      return {
        text: `${d.toFixed(1)} km distance`,
        km: d
      };
    }
    return {
      text: "Region Boundary Match",
      km: null
    };
  };

  const getTimelineText = (lost: Post, found: Post) => {
    const diffMs = Math.abs(lost.created - found.created);
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return "Minutes interval comparison";
    } else if (diffHours < 24) {
      return `${diffHours} hr gap`;
    } else {
      return `${diffDays} days interval`;
    }
  };

  const getHoursDaysProximityText = (lost: Post, found: Post) => {
    const diffMs = Math.abs(lost.created - found.created);
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return "Reported almost simultaneously in identical shift";
    } else if (diffHours < 24) {
      return `Discovered within ${diffHours} ${diffHours === 1 ? "hour" : "hours"} of reported loss`;
    } else {
      return `Found roughly ${diffDays} ${diffDays === 1 ? "day" : "days"} after incident timeline`;
    }
  };

  return (
    <div className="space-y-6" id="potential-matches-view">
      {/* Configuration Panel */}
      <div className="bg-[#07070a]/90 p-5 rounded-2xl border border-[#161621] shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="text-indigo-400" size={18} />
            <h3 className="font-display font-extrabold text-sm text-slate-100 uppercase tracking-wider">
              Smart Match Settings
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-indigo-500/10 px-2.5 py-1 rounded-md text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            Engine Active
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-mono">
          LINCO uses a high-performance Multimodal Similarity scoring engine to pair Active posts. 
          Adjust the baseline match confidence score required to generate alerts.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
          <div className="flex-1 flex items-center gap-4 bg-[#030304]/60 p-3 rounded-xl border border-[#12121a]">
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={handleThresholdChange}
              className="flex-1 accent-indigo-400 cursor-pointer h-1.5 bg-[#12121a] rounded-lg appearance-none"
            />
            <span className="font-mono text-sm font-black text-indigo-400 w-12 text-right">
              {threshold}%
            </span>
          </div>
          <button
            onClick={handleSaveThreshold}
            disabled={savingThreshold}
            className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-extrabold tracking-wider uppercase transition disabled:opacity-50 cursor-pointer shadow-md shrink-0"
          >
            {savingThreshold ? "Updating..." : "Apply Threshold"}
          </button>
        </div>
      </div>

      {/* Toggles & Actions Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex bg-[#07070a]/90 p-1 rounded-xl border border-[#161621] shadow-inner max-w-xs">
          <button
            onClick={() => setViewFilter("my")}
            className={`flex-1 py-2 px-4 rounded-lg font-sans text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
              viewFilter === "my"
                ? "bg-[#161622] text-white border border-[#232332]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            My Alerts ({matches.filter(m => {
              const userOwnsLost = unlockedPosts.includes(m.lostPostId);
              const userOwnsFound = unlockedPosts.includes(m.foundPostId);
              return (userOwnsLost || userOwnsFound) && m.status === "Active" && getPostById(m.lostPostId)?.status === "Active" && getPostById(m.foundPostId)?.status === "Active";
            }).length})
          </button>
          <button
            onClick={() => setViewFilter("all")}
            className={`flex-1 py-2 px-4 rounded-lg font-sans text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
              viewFilter === "all"
                ? "bg-[#161622] text-white border border-[#232332]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Matches ({filteredMatches.length})
          </button>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-xl bg-[#07070a]/80 border border-[#161621] hover:border-slate-800 text-[10px] text-slate-400 hover:text-white font-bold transition flex items-center justify-center gap-1.5 cursor-pointer uppercase font-mono"
        >
          🔄 Reload Engine
        </button>
      </div>

      {/* Loading experience with high-fidelity shimmering skeleton cards */}
      {loading ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
            <span className="text-xs font-mono text-indigo-300 font-bold animate-pulse">
              {loadingMessage}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div 
                key={n} 
                className="bg-[#07070a]/90 rounded-2xl border border-[#161621] p-5 space-y-4 animate-pulse relative overflow-hidden flex flex-col justify-between h-[300px]"
              >
                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-slate-800" />
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
          <div className="absolute inset-0 -top-12 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
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
        /* Premium Match Card Grid */
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
              const dateGap = getTimelineText(lostPost, foundPost);
              const confidence = getConfidenceLevel(m.matchScore);

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

                  {/* Top Bar: Confidence and AI Verified Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-mono font-bold uppercase px-2.5 py-1 rounded-md bg-[#030304]/60 border border-[#12121a] text-slate-400 flex items-center gap-1">
                      <Sparkles size={11} className="text-indigo-400 animate-pulse" />
                      LINCO FORENSIC
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black font-mono px-2.5 py-1 rounded-lg border ${confidence.badgeStyle}`}>
                        {m.matchScore}% Match ({confidence.label})
                      </span>
                    </div>
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
                            alt="Lost item image attachment"
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
                            alt="Found item image attachment"
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

                  {/* Elegant Spatio-Temporal distance & timeline chips */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 bg-[#030304]/40 p-2 rounded-xl border border-[#12121a]">
                    <div className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-950/30 border border-cyan-500/10 px-2.5 py-1 rounded-md">
                      <MapPin size={10} />
                      <span>{distance.text}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 text-indigo-300 bg-indigo-950/30 border border-indigo-500/10 px-2.5 py-1 rounded-md">
                      <Clock size={10} />
                      <span>{dateGap} Interval</span>
                    </div>
                    
                    {m.matchScore >= 90 && (
                      <div className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-md ml-auto">
                        <BadgeCheck size={10} />
                        <span>AI Verified Match</span>
                      </div>
                    )}
                  </div>

                  {/* "Why AI Thinks This Is A Match" - Micro Checklist */}
                  <div className="p-3 bg-[#030304]/50 rounded-xl border border-[#12121a] text-left space-y-1.5">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                      ✔ Match Alignment Indicators
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border ${sameCategory ? "text-emerald-400 bg-emerald-950/35 border-emerald-500/10" : "text-slate-500 bg-slate-950 border-transparent"}`}>
                        {sameCategory ? "✓ Same Category" : "📂 Category Review"}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border ${sameBrand ? "text-emerald-400 bg-emerald-950/35 border-emerald-500/10" : "text-slate-500 bg-slate-950 border-transparent"}`}>
                        {sameBrand ? `✓ Same Brand (${lostF.brand})` : "🏷 Brand Check"}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border ${sameColor ? "text-emerald-400 bg-emerald-950/35 border-emerald-500/10" : "text-slate-500 bg-slate-950 border-transparent"}`}>
                        {sameColor ? `✓ Similar Color (${lostF.color})` : "🎨 Color Check"}
                      </span>
                      {distance.km !== null && distance.km <= 5 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border text-emerald-400 bg-emerald-950/35 border-emerald-500/10">
                          ✓ Proximity (≤5km)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-mono italic pl-2 border-l-2 border-indigo-500/40 truncate">
                      "{m.reason}"
                    </p>
                  </div>

                  {/* Accordion Toggle for Similarity metrics */}
                  <div className="border-t border-[#12121a] pt-2 text-left">
                    <button
                      onClick={() => setExpandedMatchId(isExpanded ? null : m.matchId)}
                      className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 hover:text-slate-300 py-1.5 cursor-pointer transition"
                    >
                      <span>{isExpanded ? "Hide Forensic Similarity Index" : "Inspect Similarity Breakdown"}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pt-2.5 space-y-2 text-[10px] font-mono bg-[#030304]/30 p-2.5 rounded-lg border border-[#12121a] mt-1.5"
                        >
                          {[
                            { label: "Category classification alignment", val: m.matchBreakdown.category },
                            { label: "Item physical details", val: m.matchBreakdown.item },
                            { label: "Brand matching profile", val: m.matchBreakdown.brand },
                            { label: "Colors index matching", val: m.matchBreakdown.colors },
                            { label: "Description similarity", val: m.matchBreakdown.description },
                            { label: "AI Image features", val: m.matchBreakdown.image },
                            { label: "Material properties match", val: m.matchBreakdown.material },
                            { label: "Size similarity", val: m.matchBreakdown.size },
                            { label: "Shape alignment profile", val: m.matchBreakdown.shape },
                            { label: "GPS location alignment", val: m.matchBreakdown.location },
                            { label: "Temporal Date proximity", val: m.matchBreakdown.dateProximity },
                            { label: "Time of Day logical path", val: m.matchBreakdown.timeline },
                            { label: "Serial/ID alignment index", val: m.matchBreakdown.identifiers },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4">
                              <span className="text-slate-500 truncate">{item.label}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-500"
                                    style={{ width: `${item.val}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-black w-8 text-right text-indigo-400">
                                  {item.val}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Buttons Action Group with Premium CTAs */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-[#12121a] mt-auto">
                    <button
                      onClick={() => handleDismissMatch(m.matchId)}
                      className="px-3 py-2.5 rounded-xl bg-[#030304] border border-[#1c1c26] hover:border-red-500/30 text-slate-500 hover:text-red-400 transition cursor-pointer flex items-center justify-center shrink-0"
                      title="Report Incorrect / Dismiss Match"
                    >
                      <Trash2 size={13} />
                    </button>

                    <button
                      onClick={(e) => toggleSaveMatch(m.matchId, e)}
                      className={`px-3 py-2.5 rounded-xl border transition cursor-pointer flex items-center justify-center shrink-0 ${isSaved ? "bg-pink-500/15 border-pink-500/40 text-pink-400" : "bg-[#030304] border-[#1c1c26] text-slate-500 hover:text-pink-400 hover:border-pink-500/20"}`}
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
                      onClick={() => setSelectedMatch(m)}
                      className="flex-1 min-w-[110px] py-2.5 rounded-xl bg-[#161622] hover:bg-[#20202e] border border-[#2c2c3e] text-indigo-300 hover:text-indigo-200 transition cursor-pointer flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase tracking-wider"
                    >
                      <Eye size={12} />
                      View Details
                    </button>

                    <button
                      onClick={() => {
                        // Start claim on the found post if user owns lost post, or vice versa
                        const userOwnsLost = unlockedPosts.includes(m.lostPostId);
                        const targetPostToClaim = userOwnsLost ? foundPost : lostPost;
                        const oppositePostId = targetPostToClaim.id === lostPost.id ? foundPost.id : lostPost.id;
                        onStartClaim(targetPostToClaim, oppositePostId);
                      }}
                      className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white transition cursor-pointer flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-950/50"
                    >
                      <CheckCircle size={12} />
                      Verify Ownership
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Side-by-Side Review Modal */}
      <AnimatePresence>
        {selectedMatch && (() => {
          const lostPost = getPostById(selectedMatch.lostPostId)!;
          const foundPost = getPostById(selectedMatch.foundPostId)!;
          const userOwnsLost = unlockedPosts.includes(selectedMatch.lostPostId);
          const userOwnsFound = unlockedPosts.includes(selectedMatch.foundPostId);

          const lostF = extractFeatures(lostPost);
          const foundF = extractFeatures(foundPost);

          const distance = getDistanceText(lostPost, foundPost);
          const dateGap = getTimelineText(lostPost, foundPost);
          const confidence = getConfidenceLevel(selectedMatch.matchScore);

          const brandMatch = getMatchIndicator(lostF.brand, foundF.brand);
          const colorMatch = getMatchIndicator(lostF.color, foundF.color);
          const materialMatch = getMatchIndicator(lostF.material, foundF.material);
          const sizeMatch = getMatchIndicator(lostF.size, foundF.size);
          const shapeMatch = getMatchIndicator(lostF.shape, foundF.shape);
          const categoryMatch = getMatchIndicator(lostPost.category, foundPost.category);

          const isSaved = savedMatches.includes(selectedMatch.matchId);

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
                    <Sparkles className="text-indigo-400 animate-bounce" size={18} />
                    <h3 className="font-display font-extrabold text-xs sm:text-sm text-slate-100 uppercase tracking-wider">
                      Forensic Match Audit: {selectedMatch.matchScore}% Confidence
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="p-1.5 rounded-lg bg-[#12121a] border border-[#1c1c26] text-slate-400 hover:text-white cursor-pointer transition"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Secure lock warning bar */}
                <div className="bg-indigo-500/5 border-b border-indigo-500/10 px-4 sm:p-3 py-3 flex items-start gap-2.5 text-indigo-300 text-[10px] leading-relaxed font-medium">
                  <ShieldAlert size={14} className="shrink-0 text-indigo-400 mt-0.5" />
                  <p className="text-left">
                    <strong>LINCO Safety Guard:</strong> Decrypted WhatsApp contact info is never displayed directly on comparison panels to prevent identity theft. To securely connect, please invoke the <strong>Verify Ownership</strong> workflow below. Claim verification requires dynamic verification of secret markings.
                  </p>
                </div>

                {/* Scrollable Comparison Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                  
                  {/* Side-by-Side Images & Info Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    
                    {/* Lost Post Column */}
                    <div className="space-y-4 text-left p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                      <div className="flex justify-between items-center pb-2 border-b border-rose-500/15">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          🚨 Lost Report
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{lostPost.timestamp}</span>
                      </div>

                      {lostPost.image ? (
                        <div className="rounded-xl overflow-hidden border border-[#161621] max-h-48">
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
                          <span className="text-[8px] text-slate-500 uppercase font-black block">Reward Offered</span>
                          <span className="text-emerald-400 font-mono font-black">
                            {lostPost.reward ? `₹${lostPost.reward}` : "No Reward"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-500 uppercase font-black block">Reported Location</span>
                        <p className="text-xs text-slate-300 font-bold flex items-center gap-1">📍 {lostPost.address}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-500 uppercase font-black block">Incident Timeline</span>
                        <p className="text-xs text-slate-400 font-mono">{lostPost.timeline || "Not Specified"}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-500 uppercase font-black block">Description details</span>
                        <p className="text-xs text-slate-400 font-mono leading-relaxed bg-[#030304]/70 p-3 rounded-xl border border-slate-900 whitespace-pre-wrap max-h-36 overflow-y-auto">
                          {lostPost.details}
                        </p>
                      </div>
                    </div>

                    {/* Found Post Column */}
                    <div className="space-y-4 text-left p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex justify-between items-center pb-2 border-b border-emerald-500/15">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          ✅ Found Report
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{foundPost.timestamp}</span>
                      </div>

                      {foundPost.image ? (
                        <div className="rounded-xl overflow-hidden border border-[#161621] max-h-48">
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
                          <span className="text-[8px] text-slate-500 uppercase font-black block">Urgency Status</span>
                          <span className="text-slate-300 font-bold">{foundPost.urgency}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-500 uppercase font-black block">Reported Location</span>
                        <p className="text-xs text-slate-300 font-bold flex items-center gap-1">📍 {foundPost.address}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-500 uppercase font-black block">Found Timeline</span>
                        <p className="text-xs text-slate-400 font-mono">{foundPost.timeline || "Not Specified"}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] text-slate-500 uppercase font-black block">Description details</span>
                        <p className="text-xs text-slate-400 font-mono leading-relaxed bg-[#030304]/70 p-3 rounded-xl border border-slate-900 whitespace-pre-wrap max-h-36 overflow-y-auto">
                          {foundPost.details}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attribute-by-Attribute Grid Comparison (Differences highlighted!) */}
                  <div className="bg-[#030304]/80 rounded-2xl border border-[#161621] p-4 text-left space-y-3 shadow-inner">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                      <ArrowLeftRight size={12} />
                      Attribute Alignment Audit
                    </span>
                    
                    <div className="space-y-2.5">
                      {/* Brand compare */}
                      <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${brandMatch.style}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono w-24 block">Brand</span>
                          <span className="text-xs font-mono font-semibold">Lost: {lostF.brand}</span>
                          <span className="text-slate-500 text-[10px]">↔</span>
                          <span className="text-xs font-mono font-semibold">Found: {foundF.brand}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider">{brandMatch.text}</span>
                      </div>

                      {/* Color compare */}
                      <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${colorMatch.style}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono w-24 block">Color</span>
                          <span className="text-xs font-mono font-semibold">Lost: {lostF.color}</span>
                          <span className="text-slate-500 text-[10px]">↔</span>
                          <span className="text-xs font-mono font-semibold">Found: {foundF.color}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider">{colorMatch.text}</span>
                      </div>

                      {/* Category compare */}
                      <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${categoryMatch.style}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono w-24 block">Category</span>
                          <span className="text-xs font-mono font-semibold">Lost: {lostPost.category}</span>
                          <span className="text-slate-500 text-[10px]">↔</span>
                          <span className="text-xs font-mono font-semibold">Found: {foundPost.category}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider">{categoryMatch.text}</span>
                      </div>

                      {/* Shape compare */}
                      <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${shapeMatch.style}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono w-24 block">Shape</span>
                          <span className="text-xs font-mono font-semibold">Lost: {lostF.shape}</span>
                          <span className="text-slate-500 text-[10px]">↔</span>
                          <span className="text-xs font-mono font-semibold">Found: {foundF.shape}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider">{shapeMatch.text}</span>
                      </div>

                      {/* Material compare */}
                      <div className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${materialMatch.style}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono w-24 block">Material</span>
                          <span className="text-xs font-mono font-semibold">Lost: {lostF.material}</span>
                          <span className="text-slate-500 text-[10px]">↔</span>
                          <span className="text-xs font-mono font-semibold">Found: {foundF.material}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider">{materialMatch.text}</span>
                      </div>
                    </div>
                  </div>

                  {/* Distance & Timeline Analytics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Spatial Analysis Card */}
                    <div className="p-4 rounded-xl bg-[#030304]/60 border border-[#161621] text-left space-y-2">
                      <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">📍 Spatial Correlation Analysis</span>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-200">Distance: {distance.text}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {distance.km !== null && distance.km <= 5 
                            ? "✓ Exceptional spatial alignment! The locations are near enough to suggests logical transit path loss." 
                            : "⚠ Items were reported further apart. Verify if item was lost during transit or active vehicle commute."}
                        </p>
                      </div>
                    </div>

                    {/* Temporal Proximity Card */}
                    <div className="p-4 rounded-xl bg-[#030304]/60 border border-[#161621] text-left space-y-2">
                      <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">🕒 Temporal Proximity Analysis</span>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-200">Timeline: {getHoursDaysProximityText(lostPost, foundPost)}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          The chronological sequence indicates the item was reported found after the loss timestamp, supporting sequence order accuracy.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Why AI Thinks This is a Match Block */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/20 to-slate-950/40 border border-[#161621] text-left space-y-3">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={12} className="text-indigo-400 animate-pulse" />
                      Forensic Match Synthesis
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${categoryMatch.match ? "text-emerald-400 bg-emerald-950/10 border-emerald-500/20" : "text-slate-500 bg-slate-950/20 border-slate-900"}`}>
                        <Check size={14} className={categoryMatch.match ? "text-emerald-400" : "text-slate-600"} />
                        <span>{categoryMatch.match ? "Same Category Verified" : "Review Categories"}</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${brandMatch.match ? "text-emerald-400 bg-emerald-950/10 border-emerald-500/20" : "text-slate-500 bg-slate-950/20 border-slate-900"}`}>
                        <Check size={14} className={brandMatch.match ? "text-emerald-400" : "text-slate-600"} />
                        <span>{brandMatch.match ? `Same Brand (${lostF.brand})` : "Different Brand detail"}</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${colorMatch.match ? "text-emerald-400 bg-emerald-950/10 border-emerald-500/20" : "text-slate-500 bg-slate-950/20 border-slate-900"}`}>
                        <Check size={14} className={colorMatch.match ? "text-emerald-400" : "text-slate-600"} />
                        <span>{colorMatch.match ? `Similar Color (${lostF.color})` : "Color shades review"}</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${distance.km !== null && distance.km <= 5 ? "text-emerald-400 bg-emerald-950/10 border-emerald-500/20" : "text-slate-500 bg-slate-950/20 border-slate-900"}`}>
                        <Check size={14} className={distance.km !== null && distance.km <= 5 ? "text-emerald-400" : "text-slate-600"} />
                        <span>{distance.km !== null && distance.km <= 5 ? "Similar Location Anchor" : "Location gap review"}</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${selectedMatch.matchScore >= 80 ? "text-emerald-400 bg-emerald-950/10 border-emerald-500/20" : "text-slate-500 bg-slate-950/20 border-slate-900"}`}>
                        <Check size={14} className={selectedMatch.matchScore >= 80 ? "text-emerald-400" : "text-slate-600"} />
                        <span>Matching Keywords (AI)</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${shapeMatch.match ? "text-emerald-400 bg-emerald-950/10 border-emerald-500/20" : "text-slate-500 bg-slate-950/20 border-slate-900"}`}>
                        <Check size={14} className={shapeMatch.match ? "text-emerald-400" : "text-slate-600"} />
                        <span>{shapeMatch.match ? "Similar Shape Profile" : "Shape variation"}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-mono bg-[#030304]/40 p-3 rounded-xl border border-[#12121a]">
                      💡 <strong>Forensic Summary:</strong> The matching engine calculated a high correlation across visual descriptions. Submitting claim verification will unlock communication safely.
                    </p>
                  </div>
                </div>

                {/* Footer Controls with premium CTAs */}
                <div className="p-4 border-t border-[#12121a] bg-[#030304]/90 flex flex-wrap gap-3 justify-between items-center">
                  <button
                    onClick={() => handleDismissMatch(selectedMatch.matchId)}
                    className="px-4 py-2.5 rounded-xl bg-[#030304] hover:bg-[#12121a] text-slate-400 hover:text-red-400 border border-[#1c1c26] text-xs font-bold transition flex items-center gap-1 uppercase cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Report Incorrect Match
                  </button>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={(e) => toggleSaveMatch(selectedMatch.matchId, e)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold uppercase transition cursor-pointer flex items-center gap-1.5 ${isSaved ? "bg-pink-500/15 border-pink-500/40 text-pink-400" : "bg-[#030304] border-[#1c1c26] text-slate-400 hover:text-white"}`}
                    >
                      <Heart size={13} className={isSaved ? "fill-pink-500" : ""} />
                      {isSaved ? "Saved" : "Save Match"}
                    </button>

                    <button
                      onClick={(e) => handleShareMatch(selectedMatch, e)}
                      className="px-4 py-2.5 rounded-xl bg-[#030304] hover:bg-[#12121a] text-slate-400 hover:text-white border border-[#1c1c26] text-xs font-extrabold uppercase transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 size={13} />
                      Share Match
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedMatch(null);
                        // Start claim on the found post if user owns lost post, or vice versa
                        const targetPostToClaim = userOwnsLost ? foundPost : lostPost;
                        const oppositePostId = targetPostToClaim.id === lostPost.id ? foundPost.id : lostPost.id;
                        onStartClaim(targetPostToClaim, oppositePostId);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-black tracking-wider uppercase transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/40"
                    >
                      🚀 Verify Ownership
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
