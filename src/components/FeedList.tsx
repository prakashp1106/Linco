/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  List, 
  Map as MapIcon, 
  SlidersHorizontal, 
  Sparkles, 
  Clock, 
  MapPin, 
  RotateCcw, 
  Bookmark, 
  BookmarkCheck, 
  Trash2, 
  Tag, 
  Calendar, 
  Palette, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  X, 
  TrendingUp, 
  Check, 
  Compass,
  ArrowUpDown
} from "lucide-react";
import { Post, AIMatch } from "../types";
import { CATEGORIES, CITIES } from "../constants";
import { PostCard } from "./PostCard";
import { FeedMap } from "./LeafletMap";
import { ErrorBoundary } from "./ErrorBoundary";
import { motion, AnimatePresence } from "motion/react";

interface FeedListProps {
  posts: Post[];
  matches: Record<string, AIMatch[]>;
  loadingPosts: boolean;
  unlockedPosts: string[];
  decryptedContacts: Record<string, string>;
  onIncrementViews: (id: string) => void;
  onMarkResolved: (id: string, e: React.MouseEvent) => void;
  onDeletePost: (id: string, e: React.MouseEvent) => void;
  onStartClaim: (post: Post, e: React.MouseEvent) => void;
  onSharePost: (post: Post, e: React.MouseEvent) => void;
  onShareAsImage: (post: Post, e: React.MouseEvent) => void;
  onShowQrCode: (post: Post, e: React.MouseEvent) => void;
  onManageClaims: (post: Post) => void;
  onUnlockPost?: (id: string, e: React.MouseEvent) => void;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    type: "All" | "Lost" | "Found";
    category: string;
    city: string;
    date: string;
    color: string;
    brand: string;
    distance: string;
  };
}

// Center coordinates for cities in our system to calculate simulated distances
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Pune: { lat: 18.5204, lng: 73.8567 },
  Mumbai: { lat: 19.0760, lng: 72.8777 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Hyderabad: { lat: 17.3850, lng: 78.4867 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Noida: { lat: 28.5355, lng: 77.3910 },
  Gurgaon: { lat: 28.4595, lng: 77.0266 },
};

const POPULAR_COLORS = [
  { name: "Black", bg: "bg-black", border: "border-slate-800" },
  { name: "White", bg: "bg-white", border: "border-slate-300 text-slate-900" },
  { name: "Blue", bg: "bg-blue-600", border: "border-blue-500" },
  { name: "Red", bg: "bg-red-600", border: "border-red-500" },
  { name: "Brown", bg: "bg-[#7c2d12]", border: "border-orange-800" },
  { name: "Silver", bg: "bg-slate-400", border: "border-slate-300" },
  { name: "Gold", bg: "bg-amber-500", border: "border-amber-400" },
  { name: "Pink", bg: "bg-pink-500", border: "border-pink-400" },
  { name: "Green", bg: "bg-emerald-600", border: "border-emerald-500" },
];

const POPULAR_BRANDS = ["Apple", "Samsung", "Sony", "Nike", "Adidas", "Gucci", "HP", "Dell", "Seiko", "Tommy"];

// Haversine distance helper (in km)
const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// NLP Parser helper
const parseNaturalLanguage = (query: string) => {
  const q = query.toLowerCase();
  let city: string | undefined = undefined;
  let category: string | undefined = undefined;
  let type: "Lost" | "Found" | undefined = undefined;
  let color: string | undefined = undefined;
  let brand: string | undefined = undefined;

  // 1. Parse type
  if (q.includes("lost")) type = "Lost";
  else if (q.includes("found")) type = "Found";

  // 2. Parse city
  for (const c of CITIES) {
    if (q.includes(c.toLowerCase())) {
      city = c;
      break;
    }
  }

  // 3. Parse category keywords
  const catKeywords: Record<string, string[]> = {
    "Electronics": ["phone", "iphone", "samsung", "ipad", "laptop", "macbook", "charger", "earbuds", "airpods", "headphone", "headphones", "tablet", "camera", "electronics", "gadget", "watch", "smartwatch"],
    "Documents": ["passport", "document", "documents", "paper", "license", "certificate", "marksheet", "aadhaar", "pan", "visa"],
    "Wallet / Purse": ["wallet", "purse", "handbag", "clutch", "billfold", "money", "cash"],
    "Keys": ["key", "keys", "keychain", "fob"],
    "Pet": ["dog", "cat", "puppy", "kitten", "pet", "collar", "leash", "bird"],
    "Bag / Luggage": ["bag", "backpack", "suitcase", "luggage", "briefcase", "duffel"],
    "Jewelry": ["ring", "necklace", "jewelry", "jewel", "earring", "bracelet", "gold", "silver", "diamond"],
    "ID / Card": ["id", "card", "cards", "credit", "debit", "membership", "license", "pan", "aadhaar"],
    "Vehicle": ["car", "bike", "cycle", "scooter", "motorcycle", "vehicle", "helmet"],
    "Clothing": ["shirt", "jacket", "hoodie", "cap", "hat", "shoes", "sneakers", "pant", "jeans", "clothing", "dress", "sweater"],
  };

  for (const [catId, keywords] of Object.entries(catKeywords)) {
    if (keywords.some(kw => q.includes(kw)) || q.includes(catId.toLowerCase())) {
      category = catId;
      break;
    }
  }

  // 4. Parse colors
  const colors = ["black", "white", "blue", "red", "brown", "silver", "gold", "pink", "green", "yellow", "grey"];
  for (const col of colors) {
    if (q.includes(col)) {
      color = col.charAt(0).toUpperCase() + col.slice(1);
      break;
    }
  }

  // 5. Parse brands
  const brands = ["apple", "samsung", "sony", "nike", "hp", "dell", "adidas", "seiko", "gucci", "tommy", "casio"];
  for (const br of brands) {
    if (q.includes(br)) {
      brand = br.charAt(0).toUpperCase() + br.slice(1);
      break;
    }
  }

  return { type, city, category, color, brand };
};

export const FeedList: React.FC<FeedListProps> = ({
  posts,
  matches,
  loadingPosts,
  unlockedPosts,
  decryptedContacts,
  onIncrementViews,
  onMarkResolved,
  onDeletePost,
  onStartClaim,
  onSharePost,
  onShareAsImage,
  onShowQrCode,
  onManageClaims,
  onUnlockPost,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [feedTypeFilter, setFeedTypeFilter] = useState<"All" | "Lost" | "Found">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  
  // High fidelity new filter attributes
  const [dateFilter, setDateFilter] = useState<"All" | "24h" | "7d" | "30d">("All");
  const [colorFilter, setColorFilter] = useState<string>("All");
  const [brandFilter, setBrandFilter] = useState<string>("All");
  const [distanceFilter, setDistanceFilter] = useState<"All" | "5km" | "15km" | "30km" | "50km">("All");
  const [sortBy, setSortBy] = useState<"best" | "new" | "nearest" | "views">("new");
  
  const [feedViewMode, setFeedViewMode] = useState<"list" | "map">("list");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Saved & Recent searches
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isRecentFocused, setIsRecentFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved & recent searches from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("linco-saved-searches");
      if (saved) setSavedSearches(JSON.parse(saved));

      const recent = localStorage.getItem("linco-recent-searches");
      if (recent) setRecentSearches(JSON.parse(recent));
    } catch (e) {
      console.error("Error loading searches from storage", e);
    }
  }, []);

  // Keyboard shortcut listener: Cmd/Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Soft skeleton loader animation on input change
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery, feedTypeFilter, categoryFilter, cityFilter, dateFilter, colorFilter, brandFilter, distanceFilter, sortBy]);

  // NLP Parse attributes in current typed query
  const nlpParsed = parseNaturalLanguage(searchQuery);
  const hasNlpDetections = !!(
    nlpParsed.type ||
    nlpParsed.city ||
    nlpParsed.category ||
    nlpParsed.color ||
    nlpParsed.brand
  );

  const applyNlpFiltersAsHardFilters = () => {
    if (nlpParsed.type) setFeedTypeFilter(nlpParsed.type);
    if (nlpParsed.city) setCityFilter(nlpParsed.city);
    if (nlpParsed.category) setCategoryFilter(nlpParsed.category);
    if (nlpParsed.color) setColorFilter(nlpParsed.color);
    if (nlpParsed.brand) setBrandFilter(nlpParsed.brand);
    
    // Trim query to remove words that were mapped to make query cleaner or leave it
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const clean = searchQuery.trim();
      const updated = [clean, ...recentSearches.filter((q) => q !== clean)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("linco-recent-searches", JSON.stringify(updated));
    }
  };

  const handleSaveSearch = () => {
    const title = searchQuery
      ? `"${searchQuery}" in ${cityFilter === "All" ? "Anywhere" : cityFilter}`
      : `${feedTypeFilter === "All" ? "Items" : feedTypeFilter} in ${cityFilter === "All" ? "Anywhere" : cityFilter}`;
    
    const newSaved: SavedSearch = {
      id: Math.random().toString(36).substring(2, 9),
      name: title,
      query: searchQuery,
      filters: {
        type: feedTypeFilter,
        category: categoryFilter,
        city: cityFilter,
        date: dateFilter,
        color: colorFilter,
        brand: brandFilter,
        distance: distanceFilter,
      },
    };

    const updated = [...savedSearches, newSaved];
    setSavedSearches(updated);
    localStorage.setItem("linco-saved-searches", JSON.stringify(updated));
  };

  const handleDeleteSavedSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem("linco-saved-searches", JSON.stringify(updated));
  };

  const applySavedSearch = (saved: SavedSearch) => {
    setSearchQuery(saved.query);
    setFeedTypeFilter(saved.filters.type);
    setCategoryFilter(saved.filters.category);
    setCityFilter(saved.filters.city);
    setDateFilter(saved.filters.date as any);
    setColorFilter(saved.filters.color);
    setBrandFilter(saved.filters.brand);
    setDistanceFilter(saved.filters.distance as any);
    setIsAdvancedOpen(true);
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setFeedTypeFilter("All");
    setCategoryFilter("All");
    setCityFilter("All");
    setDateFilter("All");
    setColorFilter("All");
    setBrandFilter("All");
    setDistanceFilter("All");
    setSortBy("new");
  };

  // Filter calculations & distance metrics
  const processedPosts = posts.map((post) => {
    let distance = 0;
    
    // If a city center is selected, or if we want to calculate distance
    const centerCity = cityFilter !== "All" ? cityFilter : "Pune";
    const center = CITY_COORDS[centerCity] || CITY_COORDS.Pune;

    if (post.latitude && post.longitude) {
      distance = getDistanceInKm(center.lat, center.lng, post.latitude, post.longitude);
    } else {
      // Create a deterministic mock coordinate nearby based on ID to maintain realistic filter
      const offsetHash = post.id.charCodeAt(0) % 10;
      const mockLat = center.lat + (offsetHash - 5) * 0.012;
      const mockLng = center.lng + ((post.id.charCodeAt(1) || 0) % 10 - 5) * 0.012;
      distance = getDistanceInKm(center.lat, center.lng, mockLat, mockLng);
    }

    // Similarity score calculations for Best Match
    let relevanceScore = 0;
    const qLower = searchQuery.toLowerCase().trim();
    if (qLower) {
      const words = qLower.split(/\s+/);
      const targetText = `${post.item} ${post.details} ${post.address} ${post.category}`.toLowerCase();
      
      // Points for whole words matched
      words.forEach((word) => {
        if (targetText.includes(word)) relevanceScore += 15;
        // Exact title match bonus
        if (post.item.toLowerCase().includes(word)) relevanceScore += 20;
      });

      // NLP attribute boosts
      if (nlpParsed.category && post.category === nlpParsed.category) relevanceScore += 25;
      if (nlpParsed.city && post.address.toLowerCase().includes(nlpParsed.city.toLowerCase())) relevanceScore += 25;
      if (nlpParsed.color && (post.item.toLowerCase().includes(nlpParsed.color.toLowerCase()) || post.details.toLowerCase().includes(nlpParsed.color.toLowerCase()))) relevanceScore += 20;
      if (nlpParsed.brand && (post.item.toLowerCase().includes(nlpParsed.brand.toLowerCase()) || post.details.toLowerCase().includes(nlpParsed.brand.toLowerCase()))) relevanceScore += 20;
    }

    return { ...post, calculatedDistance: distance, relevanceScore };
  });

  // Perform multi-dimensional filtering
  const filteredPosts = processedPosts.filter((p) => {
    // 1. Text Search
    const q = searchQuery.toLowerCase().trim();
    let matchesSearch = true;
    if (q) {
      const words = q.split(/\s+/);
      matchesSearch = words.every(
        (word) =>
          p.item.toLowerCase().includes(word) ||
          p.details.toLowerCase().includes(word) ||
          p.address.toLowerCase().includes(word) ||
          p.category.toLowerCase().includes(word)
      );
    }

    // 2. Type Filter
    const matchesType = feedTypeFilter === "All" || p.type === feedTypeFilter;

    // 3. Category Filter
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;

    // 4. City Filter
    const matchesCity = cityFilter === "All" || p.address.toLowerCase().includes(cityFilter.toLowerCase());

    // 5. Date Range Filter
    let matchesDate = true;
    if (dateFilter !== "All") {
      const now = Date.now();
      const ageMs = now - p.created;
      if (dateFilter === "24h") matchesDate = ageMs <= 24 * 60 * 60 * 1000;
      else if (dateFilter === "7d") matchesDate = ageMs <= 7 * 24 * 60 * 60 * 1000;
      else if (dateFilter === "30d") matchesDate = ageMs <= 30 * 24 * 60 * 60 * 1000;
    }

    // 6. Color Filter
    let matchesColor = true;
    if (colorFilter !== "All") {
      const col = colorFilter.toLowerCase();
      matchesColor = p.item.toLowerCase().includes(col) || p.details.toLowerCase().includes(col);
    }

    // 7. Brand Filter
    let matchesBrand = true;
    if (brandFilter !== "All") {
      const br = brandFilter.toLowerCase();
      matchesBrand = p.item.toLowerCase().includes(br) || p.details.toLowerCase().includes(br);
    }

    // 8. Distance Filter
    let matchesDistance = true;
    if (distanceFilter !== "All" && cityFilter !== "All") {
      const maxDistance = parseInt(distanceFilter); // extract 5, 15, 30, 50
      matchesDistance = p.calculatedDistance <= maxDistance;
    }

    return (
      matchesSearch &&
      matchesType &&
      matchesCategory &&
      matchesCity &&
      matchesDate &&
      matchesColor &&
      matchesBrand &&
      matchesDistance
    );
  });

  // Sorting
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === "best") {
      return b.relevanceScore - a.relevanceScore || b.created - a.created;
    }
    if (sortBy === "nearest") {
      return a.calculatedDistance - b.calculatedDistance;
    }
    if (sortBy === "views") {
      return (b.views || 0) - (a.views || 0);
    }
    return b.created - a.created; // default: Newest first
  });

  return (
    <div className="space-y-5" id="global-search-discovery-hub">
      {/* Search Header Container */}
      <div className="backdrop-blur-xl bg-slate-950/80 border border-slate-800/60 p-5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.7)] space-y-4">
        
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search matching items, tags, colors, brand names, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsRecentFocused(true)}
              onBlur={() => setTimeout(() => setIsRecentFocused(false), 200)}
              className="w-full pl-12 pr-12 md:pr-24 py-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-semibold text-white transition-all placeholder:text-slate-500"
              aria-label="Universal Search Bar"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 md:right-14 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full transition"
                aria-label="Clear Search Input"
              >
                <X size={14} />
              </button>
            )}
            <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-1 text-[9px] font-mono font-bold text-slate-500 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
              ⌘K
            </div>
          </div>

          {/* Save Search Button */}
          <button
            type="button"
            onClick={handleSaveSearch}
            className={`p-3.5 rounded-2xl border transition duration-200 cursor-pointer flex items-center justify-center shrink-0 ${
              searchQuery
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                : "bg-slate-900/60 border-slate-800/80 text-slate-500 hover:text-slate-300"
            }`}
            title="Save Search Parameters"
            aria-label="Save Search Configuration"
          >
            <Bookmark size={16} />
          </button>

          {/* Advanced Filter Panel Toggle */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`px-4 py-3 rounded-2xl border font-sans font-bold text-xs flex items-center gap-2 cursor-pointer transition ${
              isAdvancedOpen || categoryFilter !== "All" || cityFilter !== "All" || dateFilter !== "All" || colorFilter !== "All" || brandFilter !== "All" || distanceFilter !== "All"
                ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/60 text-indigo-300 shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
                : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
            aria-label="Toggle Advanced Filters"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
            {isAdvancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </form>

        {/* NLP Extraction Smart Insights */}
        <AnimatePresence>
          {searchQuery && hasNlpDetections && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-950 to-indigo-950/40 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-[11px]"
            >
              <div className="flex items-center gap-2 text-indigo-300 font-medium">
                <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                <span>
                  Detected traits:
                  {nlpParsed.type && <span className="ml-1 text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">{nlpParsed.type}</span>}
                  {nlpParsed.city && <span className="ml-1 text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">📍 {nlpParsed.city}</span>}
                  {nlpParsed.category && <span className="ml-1 text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">🏷️ {nlpParsed.category}</span>}
                  {nlpParsed.color && <span className="ml-1 text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">🎨 {nlpParsed.color}</span>}
                  {nlpParsed.brand && <span className="ml-1 text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">✨ {nlpParsed.brand}</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={applyNlpFiltersAsHardFilters}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider cursor-pointer transition focus:outline-none focus:underline"
              >
                Apply As Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved & Recent Searches Inline Drawer */}
        <AnimatePresence>
          {((isRecentFocused && recentSearches.length > 0) || savedSearches.length > 0) && !searchQuery && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden pt-2 border-t border-slate-900 space-y-3"
            >
              {/* Recent queries */}
              {recentSearches.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 block">
                    Recent Searches
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((recent, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSearchQuery(recent)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Clock size={11} className="text-slate-500" />
                        <span>{recent}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem("linco-recent-searches");
                      }}
                      className="px-2.5 py-1.5 text-[10px] text-slate-500 hover:text-red-400 font-bold transition uppercase cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Search Configurations */}
              {savedSearches.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 block">
                    Saved Search Configurations
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {savedSearches.map((saved) => (
                      <div
                        key={saved.id}
                        onClick={() => applySavedSearch(saved)}
                        className="p-2.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/60 text-xs flex items-center justify-between cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2">
                          <BookmarkCheck size={14} className="text-indigo-400 shrink-0" />
                          <span className="font-semibold text-slate-200 truncate max-w-[150px]">{saved.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedSearch(saved.id, e)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-950 rounded-lg transition"
                          title="Delete Saved Search"
                          aria-label="Delete Saved Search"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Expandable Filter Panel */}
        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-900/60 pt-4 space-y-4"
              id="advanced-filters-drawer"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Section A: Core Type & Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Layers size={10} /> Listing Registry
                  </label>
                  <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800/60">
                    {["All", "Lost", "Found"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFeedTypeFilter(type as any)}
                        className={`flex-1 text-[10px] font-sans font-bold py-2 rounded-xl uppercase transition tracking-wider cursor-pointer active:scale-95 ${
                          feedTypeFilter === type
                            ? "bg-slate-800 text-indigo-400 font-extrabold border border-slate-700/80 shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section B: Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Tag size={10} /> Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-900 border border-slate-800/80 rounded-2xl text-slate-300 outline-none cursor-pointer focus:border-indigo-500 transition"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.id}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section C: City Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <MapPin size={10} /> Geographical City
                  </label>
                  <select
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      if (e.target.value === "All") setDistanceFilter("All");
                    }}
                    className="w-full text-xs font-semibold px-4 py-3 bg-slate-900 border border-slate-800/80 rounded-2xl text-slate-300 outline-none cursor-pointer focus:border-indigo-500 transition"
                  >
                    <option value="All">All Cities</option>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>
                        📍 {city}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Advanced Filtering Layer: Dates, Color Palette, Distance Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                
                {/* Date range filter */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Calendar size={10} /> Date Range
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800/60">
                    {[
                      { id: "All", label: "Anytime" },
                      { id: "24h", label: "24 Hrs" },
                      { id: "7d", label: "7 Days" },
                      { id: "30d", label: "30 Days" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDateFilter(opt.id as any)}
                        className={`text-[9px] font-bold py-1.5 rounded-xl transition cursor-pointer active:scale-95 ${
                          dateFilter === opt.id
                            ? "bg-slate-800 text-indigo-400 font-extrabold border border-slate-700/80 shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance Filter (only valid if a city is active to center reference) */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <Compass size={10} /> Proximity Boundary
                  </label>
                  <select
                    value={distanceFilter}
                    onChange={(e) => setDistanceFilter(e.target.value as any)}
                    disabled={cityFilter === "All"}
                    className={`w-full text-xs font-semibold px-4 py-3 bg-slate-900 border rounded-2xl outline-none cursor-pointer focus:border-indigo-500 transition ${
                      cityFilter === "All"
                        ? "border-slate-900 text-slate-600 cursor-not-allowed opacity-50"
                        : "border-slate-800/80 text-slate-300"
                    }`}
                  >
                    <option value="All">All Proximities (Any Distance)</option>
                    <option value="5km">Within 5 Kilometers</option>
                    <option value="15km">Within 15 Kilometers</option>
                    <option value="30km">Within 30 Kilometers</option>
                    <option value="50km">Within 50 Kilometers</option>
                  </select>
                </div>

                {/* Sorting options */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <ArrowUpDown size={10} /> Sort Catalog
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800/60">
                    {[
                      { id: "new", label: "Newest" },
                      { id: "best", label: "Best Match" },
                      { id: "nearest", label: "Nearest" },
                      { id: "views", label: "Views" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSortBy(opt.id as any)}
                        className={`text-[9px] font-bold py-1.5 rounded-xl transition cursor-pointer active:scale-95 ${
                          sortBy === opt.id
                            ? "bg-slate-800 text-indigo-400 font-extrabold border border-slate-700/80 shadow"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Advanced Color Palette Swatches */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Palette size={10} /> Color Chromatic Swatch
                </span>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setColorFilter("All")}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      colorFilter === "All"
                        ? "bg-slate-800 border-slate-700 text-indigo-400"
                        : "bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All Colors
                  </button>
                  {POPULAR_COLORS.map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => setColorFilter(col.name)}
                      className={`w-6 h-6 rounded-full ${col.bg} border-2 transition relative flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 ${
                        colorFilter === col.name ? "ring-2 ring-indigo-500 border-transparent" : col.border
                      }`}
                      title={col.name}
                      aria-label={`Filter by color: ${col.name}`}
                    >
                      {colorFilter === col.name && (
                        <Check size={10} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Brand filters */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <TrendingUp size={10} /> Hardware Brand Manufacturer
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBrandFilter("All")}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      brandFilter === "All"
                        ? "bg-slate-800 border-slate-700 text-indigo-400"
                        : "bg-slate-900 border-[#1c1c26] text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All Brands
                  </button>
                  {POPULAR_BRANDS.map((br) => (
                    <button
                      key={br}
                      type="button"
                      onClick={() => setBrandFilter(br)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        brandFilter === br
                          ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-300"
                          : "bg-slate-950 border-[#1c1c26] text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      {br}
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Control reset */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="px-4 py-2 bg-slate-950 border border-[#1c1c26] hover:border-red-500/40 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <RotateCcw size={11} /> Reset Filter Suite
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* List / Map View Toggles */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-900/60">
          <div className="text-[10px] font-mono font-bold text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{sortedPosts.length} Items Indexed</span>
          </div>

          <div className="flex bg-[#030304] p-1 rounded-2xl border border-[#161621] shadow-md">
            <button
              type="button"
              onClick={() => setFeedViewMode("list")}
              className={`text-[9px] font-sans font-extrabold px-3 py-2 rounded-xl transition flex items-center gap-1.5 uppercase tracking-wider cursor-pointer active:scale-95 ${
                feedViewMode === "list"
                  ? "bg-slate-900 text-indigo-400 font-black border border-slate-800"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <List size={12} /> List
            </button>
            <button
              type="button"
              onClick={() => setFeedViewMode("map")}
              className={`text-[9px] font-sans font-extrabold px-3 py-2 rounded-xl transition flex items-center gap-1.5 uppercase tracking-wider cursor-pointer active:scale-95 ${
                feedViewMode === "map"
                  ? "bg-slate-900 text-indigo-400 font-black border border-slate-800"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <MapIcon size={12} /> Map
            </button>
          </div>
        </div>

      </div>

      {/* Feed Layout Rendering */}
      {isSearching || loadingPosts ? (
        /* Shimmer Loading Skeleton */
        <div className="space-y-4" id="search-loading-skeleton">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-[#07070a]/60 border border-[#161621] rounded-3xl p-6 relative overflow-hidden space-y-4 shadow-sm animate-pulse"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#14141e]">
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-[#12121a]" />
                  <div className="h-5 w-24 rounded-full bg-[#12121a]" />
                </div>
                <div className="h-6 w-16 rounded-lg bg-[#12121a]" />
              </div>
              <div className="h-6 w-1/3 rounded-lg bg-[#12121a]" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded-lg bg-[#12121a]" />
                <div className="h-4 w-5/6 rounded-lg bg-[#12121a]" />
              </div>
              <div className="flex gap-4">
                <div className="h-4 w-24 rounded-lg bg-[#12121a]" />
                <div className="h-4 w-24 rounded-lg bg-[#12121a]" />
              </div>
              <div className="flex gap-2.5 pt-1">
                <div className="h-10 rounded-xl bg-[#12121a] flex-1" />
                <div className="h-10 rounded-xl bg-[#12121a] w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        /* Premium Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#07070a]/40 border border-slate-800/80 rounded-3xl p-16 text-center shadow-lg relative overflow-hidden space-y-6 max-w-lg mx-auto"
          id="search-empty-state"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full" />
          <div className="relative space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
              <Search size={28} className="animate-bounce" />
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-bold text-white tracking-tight">No match found in indexing tables</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                We scanned our secure databases but didn't find any lost or found items fitting these exact filters. Try broadening your keywords or resetting selected swatches.
              </p>
            </div>
          </div>
          
          <div className="relative pt-2 flex flex-col sm:flex-row gap-2 justify-center items-center">
            <button
              onClick={handleClearAllFilters}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer active:scale-95"
            >
              Reset Filter Suite
            </button>
            <button
              onClick={() => {
                const triggerTab = new CustomEvent("change-tab", { detail: "report" });
                window.dispatchEvent(triggerTab);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-slate-950 text-xs font-black uppercase tracking-wider transition cursor-pointer active:scale-95"
            >
              Report Lost/Found Item
            </button>
          </div>
        </motion.div>
      ) : feedViewMode === "map" ? (
        /* Map View Integrations */
        <ErrorBoundary fallbackTitle="Feed Map Rendering Error">
          <FeedMap
            posts={sortedPosts}
            onPinClick={(post) => {
              setFeedViewMode("list");
              setTimeout(() => {
                const el = document.getElementById(`post-card-${post.id}`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  el.classList.add("ring-2", "ring-cyan-500/40", "scale-[1.01]");
                  setTimeout(() => {
                    el.classList.remove("ring-2", "ring-cyan-500/40", "scale-[1.01]");
                  }, 2000);
                }
              }, 200);
            }}
          />
        </ErrorBoundary>
      ) : (
        /* Post cards list */
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {sortedPosts.map((p, idx) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22, delay: Math.min(idx * 0.03, 0.15) }}
              >
                <PostCard
                  post={p}
                  idx={idx}
                  unlockedPosts={unlockedPosts}
                  decryptedContacts={decryptedContacts}
                  matches={matches}
                  onIncrementViews={onIncrementViews}
                  onMarkResolved={onMarkResolved}
                  onDeletePost={onDeletePost}
                  onStartClaim={onStartClaim}
                  onSharePost={onSharePost}
                  onShareAsImage={onShareAsImage}
                  onShowQrCode={onShowQrCode}
                  onManageClaims={onManageClaims}
                  onUnlockPost={onUnlockPost}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
