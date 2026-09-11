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
import { useLanguage } from "../context/LanguageContext";

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
  onIHaveThisItem?: (post: Post, e: React.MouseEvent) => void;
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
  onIHaveThisItem,
  onSharePost,
  onShareAsImage,
  onShowQrCode,
  onManageClaims,
  onUnlockPost,
}) => {
  const { t } = useLanguage();
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
      <div className="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-2xl shadow-xs space-y-4">
        
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <input
              ref={inputRef}
              type="text"
              placeholder={t("feed.searchPlaceholder", "Search items, keywords, colors, brands, cities...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsRecentFocused(true)}
              onBlur={() => setTimeout(() => setIsRecentFocused(false), 200)}
              className="w-full pl-10 pr-14 md:pr-24 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none text-xs sm:text-sm font-normal text-slate-900 transition placeholder:text-slate-400"
              aria-label={t("feed.universalSearchBar", "Universal Search Bar")}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
                  aria-label={t("feed.clearSearch", "Clear Search Input")}
                >
                  <X size={14} />
                </button>
              )}
              <div className="hidden md:flex items-center gap-1 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 pointer-events-none select-none">
                ⌘K
              </div>
            </div>
          </div>

          {/* Save Search Button */}
          <button
            type="button"
            onClick={handleSaveSearch}
            className={`p-3 rounded-xl border transition duration-150 cursor-pointer flex items-center justify-center shrink-0 ${
              searchQuery
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
            title={t("feed.saveParameters", "Save Search Parameters")}
            aria-label={t("feed.saveParameters", "Save Search Parameters")}
          >
            <Bookmark size={15} />
          </button>

          {/* Advanced Filter Panel Toggle */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`px-3.5 py-3 rounded-xl border font-sans font-medium text-xs flex items-center gap-2 cursor-pointer transition ${
              isAdvancedOpen || categoryFilter !== "All" || cityFilter !== "All" || dateFilter !== "All" || colorFilter !== "All" || brandFilter !== "All" || distanceFilter !== "All"
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            }`}
            aria-label={t("feed.toggleFilters", "Toggle Advanced Filters")}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">{t("feed.filters", "Filters")}</span>
            {isAdvancedOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </form>

        {/* NLP Extraction Smart Insights */}
        <AnimatePresence>
          {searchQuery && hasNlpDetections && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 text-indigo-900">
                <Sparkles size={13} className="text-indigo-600" />
                <span>
                  Detected traits:
                  {nlpParsed.type && <span className="ml-1.5 text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200 text-[11px] font-medium">{nlpParsed.type}</span>}
                  {nlpParsed.city && <span className="ml-1.5 text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200 text-[11px] font-medium">📍 {nlpParsed.city}</span>}
                  {nlpParsed.category && <span className="ml-1.5 text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200 text-[11px] font-medium">🏷️ {nlpParsed.category}</span>}
                  {nlpParsed.color && <span className="ml-1.5 text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200 text-[11px] font-medium">🎨 {nlpParsed.color}</span>}
                  {nlpParsed.brand && <span className="ml-1.5 text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200 text-[11px] font-medium">{nlpParsed.brand}</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={applyNlpFiltersAsHardFilters}
                className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold cursor-pointer transition focus:outline-none"
              >
                Apply as filters
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
              className="overflow-hidden pt-2 border-t border-slate-100 space-y-3"
            >
              {/* Recent queries */}
              {recentSearches.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 block">
                    {t("feed.recentSearches", "Recent Searches")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((recent, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSearchQuery(recent)}
                        className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Clock size={11} className="text-slate-400" />
                        <span>{recent}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem("linco-recent-searches");
                      }}
                      className="px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-rose-600 font-semibold transition uppercase cursor-pointer"
                    >
                      {t("common.clear", "Clear")}
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Search Configurations */}
              {savedSearches.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 block">
                    {t("feed.savedSearches", "Saved Search Configurations")}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {savedSearches.map((saved) => (
                      <div
                        key={saved.id}
                        onClick={() => applySavedSearch(saved)}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-white text-xs flex items-center justify-between cursor-pointer transition shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <BookmarkCheck size={14} className="text-indigo-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate max-w-[150px]">{saved.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedSearch(saved.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title={t("feed.deleteSavedSearch", "Delete Saved Search")}
                          aria-label={t("feed.deleteSavedSearch", "Delete Saved Search")}
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
              className="overflow-hidden border-t border-slate-100 pt-4 space-y-4"
              id="advanced-filters-drawer"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Section A: Core Type & Status */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers size={11} className="text-slate-400" /> {t("feed.listingRegistry", "Listing Type")}
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {[
                      { key: "All", label: t("feed.all", "All") },
                      { key: "Lost", label: t("feed.lost", "Lost") },
                      { key: "Found", label: t("feed.found", "Found") },
                    ].map((type) => (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setFeedTypeFilter(type.key as any)}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition cursor-pointer ${
                          feedTypeFilter === type.key
                            ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section B: Category */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Tag size={11} className="text-slate-400" /> {t("feed.category", "Category")}
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none cursor-pointer focus:border-indigo-500 focus:bg-white transition"
                  >
                    <option value="All">{t("feed.allCategories", "All Categories")}</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {t(`category.${c.id.toLowerCase().replace(/[^a-z0-9]/g, "")}`, c.id)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section C: City Selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin size={11} className="text-slate-400" /> {t("feed.city", "City")}
                  </label>
                  <select
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      if (e.target.value === "All") setDistanceFilter("All");
                    }}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none cursor-pointer focus:border-indigo-500 focus:bg-white transition"
                  >
                    <option value="All">{t("feed.allCities", "All Cities")}</option>
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
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar size={11} className="text-slate-400" /> {t("feed.dateRange", "Date Range")}
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {[
                      { id: "All", label: t("common.all", "Anytime") },
                      { id: "24h", label: "24h" },
                      { id: "7d", label: "7d" },
                      { id: "30d", label: "30d" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDateFilter(opt.id as any)}
                        className={`text-[11px] font-medium py-1.5 rounded-lg transition cursor-pointer ${
                          dateFilter === opt.id
                            ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance Filter (only valid if a city is active to center reference) */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Compass size={11} className="text-slate-400" /> {t("feed.proximity", "Proximity")}
                  </label>
                  <select
                    value={distanceFilter}
                    onChange={(e) => setDistanceFilter(e.target.value as any)}
                    disabled={cityFilter === "All"}
                    className={`w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border rounded-xl outline-none cursor-pointer focus:border-indigo-500 transition ${
                      cityFilter === "All"
                        ? "border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                        : "border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="All">{t("feed.allProximities", "Any Distance")}</option>
                    <option value="5km">{t("feed.within5km", "Within 5 km")}</option>
                    <option value="15km">{t("feed.within15km", "Within 15 km")}</option>
                    <option value="30km">{t("feed.within30km", "Within 30 km")}</option>
                    <option value="50km">{t("feed.within50km", "Within 50 km")}</option>
                  </select>
                </div>

                {/* Sorting options */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ArrowUpDown size={11} className="text-slate-400" /> {t("feed.sortCatalog", "Sort")}
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    {[
                      { id: "new", label: t("feed.newestFirst", "Newest") },
                      { id: "best", label: t("feed.bestMatch", "Best") },
                      { id: "nearest", label: t("feed.closestDistance", "Nearest") },
                      { id: "views", label: t("feed.views", "Views") },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSortBy(opt.id as any)}
                        className={`text-[11px] font-medium py-1.5 rounded-lg transition cursor-pointer ${
                          sortBy === opt.id
                            ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Advanced Color Palette Swatches */}
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Palette size={11} className="text-slate-400" /> {t("feed.colorSwatch", "Color")}
                </span>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setColorFilter("All")}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      colorFilter === "All"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t("feed.allColors", "All Colors")}
                  </button>
                  {POPULAR_COLORS.map((col) => (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => setColorFilter(col.name)}
                      className={`w-5 h-5 rounded-full ${col.bg} border transition relative flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 ${
                        colorFilter === col.name ? "ring-2 ring-indigo-500 border-white" : col.border
                      }`}
                      title={col.name}
                      aria-label={`Filter by color: ${col.name}`}
                    >
                      {colorFilter === col.name && (
                        <Check size={10} className="text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Brand filters */}
              <div className="space-y-1.5 text-left">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-slate-400" /> {t("feed.hardwareBrand", "Brand")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBrandFilter("All")}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      brandFilter === "All"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t("feed.allBrands", "All Brands")}
                  </button>
                  {POPULAR_BRANDS.map((br) => (
                    <button
                      key={br}
                      type="button"
                      onClick={() => setBrandFilter(br)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        brandFilter === br
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
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
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw size={12} /> {t("feed.resetFilters", "Reset filters")}
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

        {/* List / Map View Toggles */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{sortedPosts.length} listings</span>
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setFeedViewMode("list")}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                feedViewMode === "list"
                  ? "bg-white text-indigo-700 font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List size={13} /> {t("feed.viewList", "List")}
            </button>
            <button
              type="button"
              onClick={() => setFeedViewMode("map")}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
                feedViewMode === "map"
                  ? "bg-white text-indigo-700 font-semibold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapIcon size={13} /> {t("feed.viewMap", "Map")}
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
              className="bg-white border border-slate-200/90 rounded-2xl p-6 relative overflow-hidden space-y-4 shadow-xs animate-pulse"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-slate-100" />
                  <div className="h-5 w-24 rounded-full bg-slate-100" />
                </div>
                <div className="h-6 w-16 rounded-lg bg-slate-100" />
              </div>
              <div className="h-6 w-1/3 rounded-lg bg-slate-100" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded-lg bg-slate-100" />
                <div className="h-4 w-5/6 rounded-lg bg-slate-100" />
              </div>
              <div className="flex gap-4">
                <div className="h-4 w-24 rounded-lg bg-slate-100" />
                <div className="h-4 w-24 rounded-lg bg-slate-100" />
              </div>
              <div className="flex gap-2.5 pt-1">
                <div className="h-10 rounded-xl bg-slate-100 flex-1" />
                <div className="h-10 rounded-xl bg-slate-100 w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedPosts.length === 0 ? (
        /* Clean Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center space-y-5 max-w-md mx-auto shadow-xs"
          id="search-empty-state"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
            <Search size={22} />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
              {t("feed.noMatchesFound", "No listings match your filters")}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {t("feed.noMatchesDesc", "Try adjusting your search terms, expanding your radius, or resetting filters to see all reported items.")}
            </p>
          </div>
          
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center items-center">
            <button
              onClick={handleClearAllFilters}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-medium transition cursor-pointer"
            >
              {t("feed.resetFilters", "Reset filters")}
            </button>
            <button
              onClick={() => {
                const triggerTab = new CustomEvent("change-tab", { detail: "report" });
                window.dispatchEvent(triggerTab);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
            >
              {t("feed.reportItem", "Report an item")}
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
                  el.classList.add("ring-2", "ring-indigo-500/40", "scale-[1.01]");
                  setTimeout(() => {
                    el.classList.remove("ring-2", "ring-indigo-500/40", "scale-[1.01]");
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
                  onIHaveThisItem={onIHaveThisItem}
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
