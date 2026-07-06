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
  ChevronUp
} from "lucide-react";
import { Post, PotentialMatch } from "../types";
import { apiService } from "../services/api";

interface PotentialMatchesProps {
  posts: Post[];
  unlockedPosts: string[];
  onStartClaim: (p: Post) => void;
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
  
  // Modal State
  const [selectedMatch, setSelectedMatch] = useState<PotentialMatch | null>(null);
  const [reviewing, setReviewing] = useState(false);

  // Accordion list for detail breakdowns
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

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

  const handleThresholdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setThreshold(val);
  };

  const handleSaveThreshold = async () => {
    setSavingThreshold(true);
    try {
      const res = await apiService.updateConfig(threshold);
      if (res.success) {
        addToast(`Match threshold successfully updated to ${threshold}%!`, "success");
        // Reload matches with new filter
        const matchesRes = await apiService.getMatches();
        if (matchesRes.success) {
          setMatches(matchesRes.matches);
        }
      }
    } catch (err: any) {
      addToast("Failed to update config threshold.", "error");
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleDismissMatch = async (matchId: string) => {
    try {
      const res = await apiService.reviewMatch(matchId, true, "Dismissed");
      if (res.success) {
        setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
        addToast("Match dismissed successfully.", "success");
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
        addToast("Match marked as reviewed.", "success");
        if (selectedMatch?.matchId === matchId) {
          setSelectedMatch(null);
        }
      }
    } catch (err) {
      addToast("Could not review match.", "error");
    }
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

  return (
    <div className="space-y-6" id="potential-matches-view">
      {/* Configuration Panel */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-900 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="text-cyan-400" size={18} />
            <h3 className="font-display font-extrabold text-sm text-slate-100 uppercase tracking-wider">
              Smart Match Settings
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase bg-cyan-500/10 px-2 py-1 rounded-md text-cyan-400 border border-cyan-500/20">
            Engine Active
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
          LINCO uses a high-performance Multimodal Similarity scoring engine to pair Active posts. 
          Adjust the baseline match confidence score required to generate alerts.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
          <div className="flex-1 flex items-center gap-4">
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={handleThresholdChange}
              className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none"
            />
            <span className="font-mono text-sm font-black text-cyan-400 w-12 text-right">
              {threshold}%
            </span>
          </div>
          <button
            onClick={handleSaveThreshold}
            disabled={savingThreshold}
            className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold tracking-wider uppercase transition disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-950/40 shrink-0"
          >
            {savingThreshold ? "Updating..." : "Apply Threshold"}
          </button>
        </div>
      </div>

      {/* Toggles & Actions Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex bg-slate-950/90 p-1 rounded-xl border border-slate-900 shadow-inner max-w-xs">
          <button
            onClick={() => setViewFilter("my")}
            className={`flex-1 py-1.5 px-4 rounded-lg font-sans text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
              viewFilter === "my"
                ? "bg-slate-900 text-white border border-slate-800"
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
            className={`flex-1 py-1.5 px-4 rounded-lg font-sans text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
              viewFilter === "all"
                ? "bg-slate-900 text-white border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Matches ({filteredMatches.length})
          </button>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-900 hover:border-slate-800 text-[10px] text-slate-400 hover:text-white font-bold transition flex items-center justify-center gap-1.5 cursor-pointer uppercase font-mono"
        >
          🔄 Reload Engine
        </button>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Running forensic comparison loops...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-slate-950/30 border border-slate-900/60 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="text-4xl">✨</div>
          <h4 className="font-display font-extrabold text-sm text-slate-300 uppercase tracking-wider">
            No Potential Matches Found
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-mono">
            {viewFilter === "my"
              ? "None of your reported items have triggered opposite-type match alerts exceeding the threshold yet. Create more posts or lower your threshold in settings!"
              : "No active cross-listings meet or exceed the AI forensic match criteria. When a matching item is reported, LINCO will analyze and present it here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredMatches.map((m) => {
              const lostPost = getPostById(m.lostPostId)!;
              const foundPost = getPostById(m.foundPostId)!;
              const isExpanded = expandedMatchId === m.matchId;

              // Compute physical distance if available
              const lostLat = lostPost.latitude;
              const lostLng = lostPost.longitude;
              const foundLat = foundPost.latitude;
              const foundLng = foundPost.longitude;
              
              let distanceText = "Distance unknown";
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
                distanceText = `📍 ${d.toFixed(1)} km away`;
              } else {
                distanceText = "📍 Region Match";
              }

              // Compute Date gap
              const diffMs = Math.abs(lostPost.created - foundPost.created);
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              const dateGapText = `⏱️ ${diffDays === 1 ? "1 day gap" : `${diffDays} days gap`}`;

              // Masked contact display for safety
              const userOwnsLost = unlockedPosts.includes(m.lostPostId);
              const userOwnsFound = unlockedPosts.includes(m.foundPostId);

              return (
                <motion.div
                  key={m.matchId}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-950/80 rounded-2xl border border-slate-900 p-5 space-y-4 hover:border-slate-800 transition shadow-lg relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Decorative glowing gradient border */}
                  <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 opacity-80" />

                  {/* Header Row: Score Badge & Title */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                      Alert Level
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={11} className="text-cyan-400 animate-pulse" />
                      <span className="text-xs font-black font-mono text-cyan-400">
                        {m.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  {/* Side-by-Side Images & Info */}
                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-900/60">
                    {/* Lost Info Block */}
                    <div className="space-y-1.5 text-left bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                      <span className="text-[8px] tracking-widest uppercase font-black text-rose-400">
                        🚨 Lost Item
                      </span>
                      {lostPost.image ? (
                        <div className="h-16 rounded-lg overflow-hidden border border-slate-900 shadow shadow-rose-950/10">
                          <img
                            src={lostPost.image}
                            alt="Lost attachment"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-16 rounded-lg border border-dashed border-slate-900 bg-slate-950/40 flex items-center justify-center text-xs text-slate-600 font-mono font-bold">
                          No Image
                        </div>
                      )}
                      <h4 className="text-[11px] font-extrabold text-slate-200 truncate">
                        {lostPost.item}
                      </h4>
                      <p className="text-[9px] text-slate-500 truncate">{lostPost.address}</p>
                    </div>

                    {/* Found Info Block */}
                    <div className="space-y-1.5 text-left bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">
                      <span className="text-[8px] tracking-widest uppercase font-black text-emerald-400">
                        ✅ Found Item
                      </span>
                      {foundPost.image ? (
                        <div className="h-16 rounded-lg overflow-hidden border border-slate-900 shadow shadow-emerald-950/10">
                          <img
                            src={foundPost.image}
                            alt="Found attachment"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-16 rounded-lg border border-dashed border-slate-900 bg-slate-950/40 flex items-center justify-center text-xs text-slate-600 font-mono font-bold">
                          No Image
                        </div>
                      )}
                      <h4 className="text-[11px] font-extrabold text-slate-200 truncate">
                        {foundPost.item}
                      </h4>
                      <p className="text-[9px] text-slate-500 truncate">{foundPost.address}</p>
                    </div>
                  </div>

                  {/* Distance & Time Proximity Stats */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/30 px-3 py-1.5 rounded-lg border border-slate-900/40">
                    <span className="flex items-center gap-1">
                      {distanceText}
                    </span>
                    <span>{dateGapText}</span>
                  </div>

                  {/* Owner Masked Display */}
                  <div className="text-left text-[10px] font-mono flex items-center justify-between text-slate-400 bg-slate-950/10 px-3 py-1 rounded-lg">
                    <span>📱 Contact Verification:</span>
                    <span className="text-slate-300 font-extrabold">
                      {userOwnsLost || userOwnsFound ? (
                        <span className="text-cyan-400">🚨 Your Post (Locked PIN Security)</span>
                      ) : (
                        <span>Masked: +91 ******XX</span>
                      )}
                    </span>
                  </div>

                  {/* AI Match Reason Text */}
                  <p className="text-[11px] text-slate-400 leading-relaxed font-mono italic text-left pl-2 border-l border-cyan-500/30">
                    "{m.reason}"
                  </p>

                  {/* Accordion Toggle for Score Breakdown */}
                  <div className="border-t border-slate-900/60 pt-2 text-left">
                    <button
                      onClick={() => setExpandedMatchId(isExpanded ? null : m.matchId)}
                      className="w-full flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 hover:text-slate-300 py-1 cursor-pointer transition"
                    >
                      <span>{isExpanded ? "Hide Similarity Breakdown" : "View Similarity Breakdown"}</span>
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pt-2.5 space-y-1.5 text-[10px] font-mono"
                        >
                          {[
                            { label: "Category similarity", val: m.matchBreakdown.category },
                            { label: "Item details similarity", val: m.matchBreakdown.item },
                            { label: "Brand alignment", val: m.matchBreakdown.brand },
                            { label: "Colors matching score", val: m.matchBreakdown.colors },
                            { label: "Description matches", val: m.matchBreakdown.description },
                            { label: "AI image recognition", val: m.matchBreakdown.image },
                            { label: "Material matching", val: m.matchBreakdown.material },
                            { label: "Size similarity", val: m.matchBreakdown.size },
                            { label: "Shape matches", val: m.matchBreakdown.shape },
                            { label: "Distance proximity", val: m.matchBreakdown.location },
                            { label: "Date & Time gap", val: m.matchBreakdown.dateProximity },
                            { label: "Timeline logical path", val: m.matchBreakdown.timeline },
                            { label: "Unique identifiers/accessories", val: m.matchBreakdown.identifiers },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-4">
                              <span className="text-slate-500 truncate">{item.label}</span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-cyan-400"
                                    style={{ width: `${item.val}%` }}
                                  />
                                </div>
                                <span className="text-[9px] font-black w-8 text-right text-cyan-300">
                                  {item.val}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Buttons Action Group */}
                  <div className="flex gap-2 pt-2 mt-auto">
                    <button
                      onClick={() => handleDismissMatch(m.matchId)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 hover:border-red-500/30 text-slate-500 hover:text-red-400 transition cursor-pointer flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase shrink-0"
                      title="Dismiss Match"
                    >
                      <Trash2 size={13} />
                    </button>
                    
                    {!m.reviewed && (
                      <button
                        onClick={() => handleMarkReviewed(m.matchId)}
                        className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase shrink-0"
                        title="Mark Reviewed"
                      >
                        <CheckCircle size={13} />
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedMatch(m)}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-950 to-violet-950 hover:from-cyan-900 hover:to-violet-900 border border-cyan-500/20 text-cyan-300 hover:text-cyan-200 transition cursor-pointer flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider"
                    >
                      <Eye size={12} />
                      Review Forensic Match
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

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-950 border border-slate-900 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-cyan-400 animate-bounce" size={18} />
                    <h3 className="font-display font-extrabold text-sm text-slate-100 uppercase tracking-wider">
                      Forensic Match Audit: {selectedMatch.matchScore}% Score
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Audit warning / privacy indicator */}
                <div className="bg-cyan-500/5 border-b border-cyan-500/10 px-5 py-3 flex items-start gap-2.5 text-cyan-300 text-[10px] leading-relaxed font-medium">
                  <ShieldAlert size={14} className="shrink-0 text-cyan-400" />
                  <p className="text-left">
                    <strong>LINCO Safety Guard:</strong> Decrypted WhatsApp contacts are never revealed directly in AI Match listings. To securely connect with the finder or lost owner, please trigger the ownership verification claim workflow. All claims require the opposite party to answer dynamic questions about the item's hidden details.
                  </p>
                </div>

                {/* Scrollable Comparison Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {/* Side-by-side post display */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lost Post Column */}
                    <div className="space-y-4 text-left p-4 rounded-2xl bg-slate-900/20 border border-rose-500/10">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
                          🚨 Lost Report
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{lostPost.timestamp}</span>
                      </div>

                      {lostPost.image && (
                        <div className="rounded-xl overflow-hidden border border-slate-900 max-h-40">
                          <img
                            src={lostPost.image}
                            alt="Lost item"
                            className="w-full h-40 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <span className="text-[9px] text-slate-500 uppercase font-black">Item title</span>
                        <h4 className="text-sm font-extrabold text-slate-100">{lostPost.item}</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-black block">Category</span>
                          <span className="text-slate-300 font-bold">📂 {lostPost.category}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-black block">Reward offered</span>
                          <span className="text-emerald-400 font-mono font-black">
                            {lostPost.reward ? `₹${lostPost.reward}` : "No Reward"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase font-black">Address location</span>
                        <p className="text-xs text-slate-300 font-bold flex items-center gap-1">📍 {lostPost.address}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase font-black">Item description details</span>
                        <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-900 whitespace-pre-wrap">
                          {lostPost.details}
                        </p>
                      </div>
                    </div>

                    {/* Found Post Column */}
                    <div className="space-y-4 text-left p-4 rounded-2xl bg-slate-900/20 border border-emerald-500/10">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                          ✅ Found Report
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{foundPost.timestamp}</span>
                      </div>

                      {foundPost.image && (
                        <div className="rounded-xl overflow-hidden border border-slate-900 max-h-40">
                          <img
                            src={foundPost.image}
                            alt="Found item"
                            className="w-full h-40 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <span className="text-[9px] text-slate-500 uppercase font-black">Item title</span>
                        <h4 className="text-sm font-extrabold text-slate-100">{foundPost.item}</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-black block">Category</span>
                          <span className="text-slate-300 font-bold">📂 {foundPost.category}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase font-black block">Urgency level</span>
                          <span className="text-slate-300 font-bold">{foundPost.urgency}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase font-black">Address location</span>
                        <p className="text-xs text-slate-300 font-bold flex items-center gap-1">📍 {foundPost.address}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase font-black">Item description details</span>
                        <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-900 whitespace-pre-wrap">
                          {foundPost.details}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* AI Evaluation Reason */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 text-left space-y-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles size={11} />
                      AI Forensic Reasoning &amp; Commonalities
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {selectedMatch.reason}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-slate-900 bg-slate-950 flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={() => handleDismissMatch(selectedMatch.matchId)}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-red-400 border border-slate-900 text-xs font-bold transition flex items-center gap-1 uppercase cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Dismiss Match Alert
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedMatch(null);
                      // Start claim on the found post if user owns lost post, or vice versa
                      const targetPostToClaim = unlockedPosts.includes(selectedMatch.lostPostId) ? foundPost : lostPost;
                      onStartClaim(targetPostToClaim);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black tracking-wider uppercase transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/40"
                  >
                    🚀 Safe Connection &amp; Start Claims
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
