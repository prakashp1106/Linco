/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, List, Map as MapIcon } from "lucide-react";
import { Post, AIMatch } from "../types";
import { CATEGORIES, CITIES } from "../constants";
import { PostCard } from "./PostCard";
import { FeedMap } from "./LeafletMap";
import { ErrorBoundary } from "./ErrorBoundary";

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
}

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
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [feedTypeFilter, setFeedTypeFilter] = useState<"All" | "Lost" | "Found">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"new" | "old" | "views">("new");
  const [feedViewMode, setFeedViewMode] = useState<"list" | "map">("list");

  // Filter & sorting calculations
  const filteredPosts = posts.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.item.toLowerCase().includes(q) ||
      p.details.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q);

    const matchesType = feedTypeFilter === "All" || p.type === feedTypeFilter;
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;
    const matchesCity = cityFilter === "All" || p.address.toLowerCase().includes(cityFilter.toLowerCase());

    return matchesSearch && matchesType && matchesCategory && matchesCity;
  }).sort((a, b) => {
    if (sortBy === "old") return a.created - b.created;
    if (sortBy === "views") return (b.views || 0) - (a.views || 0);
    return b.created - a.created; // newest
  });

  return (
    <div className="space-y-4" id="feed-list-section">
      {/* Sticky Filter Bar */}
      <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-900 shadow-xl backdrop-blur-xl">
        {/* Search Bar */}
        <div className="relative mb-3 flex items-center">
          <Search className="absolute left-3.5 text-slate-500" size={15} />
          <input
            type="text"
            placeholder="Search item names, color descriptions, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-200 transition"
          />
        </div>

        {/* Sub Filters Row */}
        <div className="flex flex-wrap gap-1.5 items-center justify-between">
          {/* Type Toggles */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-900">
            {["All", "Lost", "Found"].map((type) => (
              <button
                key={type}
                onClick={() => setFeedTypeFilter(type as any)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase transition tracking-wider cursor-pointer ${
                  feedTypeFilter === type
                    ? "bg-slate-900 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Category Filter dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-[10px] font-bold px-2 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 outline-none cursor-pointer hover:border-slate-800 transition"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}
              </option>
            ))}
          </select>

          {/* City/Area Filter dropdown */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="text-[10px] font-bold px-2 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 outline-none cursor-pointer hover:border-slate-800 transition"
          >
            <option value="All">All Cities</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                📍 {city}
              </option>
            ))}
          </select>

          {/* Sort Filter dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-[10px] font-bold px-2 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 outline-none cursor-pointer hover:border-slate-800 transition"
          >
            <option value="new">Newest First</option>
            <option value="old">Oldest First</option>
            <option value="views">Most Viewed</option>
          </select>

          {/* List/Map View Toggle */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-900 shadow-md">
            <button
              type="button"
              onClick={() => setFeedViewMode("list")}
              className={`text-[9px] font-extrabold px-2 py-1 rounded transition flex items-center gap-1 uppercase tracking-wider cursor-pointer ${
                feedViewMode === "list"
                  ? "bg-slate-900 text-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <List size={10} /> List
            </button>
            <button
              type="button"
              onClick={() => setFeedViewMode("map")}
              className={`text-[9px] font-extrabold px-2 py-1 rounded transition flex items-center gap-1 uppercase tracking-wider cursor-pointer ${
                feedViewMode === "map"
                  ? "bg-slate-900 text-cyan-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <IconMap size={10} /> Map
            </button>
          </div>
        </div>
      </div>

      {/* Feed posts list */}
      {loadingPosts ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-950/40 border border-slate-900/80 rounded-3xl p-5 md:p-6 relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-900/60">
                <div className="flex gap-2">
                  <div className="h-5 w-16 rounded-full bg-slate-900 animate-pulse" />
                  <div className="h-5 w-24 rounded-full bg-slate-900 animate-pulse" />
                </div>
                <div className="h-6 w-16 rounded-lg bg-slate-900 animate-pulse" />
              </div>
              <div className="h-6 w-1/3 rounded-lg bg-slate-900 animate-pulse" />
              <div className="space-y-2.5">
                <div className="h-4 w-full rounded-lg bg-slate-900 animate-pulse" />
                <div className="h-4 w-5/6 rounded-lg bg-slate-900 animate-pulse" />
              </div>
              <div className="flex gap-4">
                <div className="h-4 w-24 rounded-lg bg-slate-900 animate-pulse" />
                <div className="h-4 w-24 rounded-lg bg-slate-900 animate-pulse" />
              </div>
              <div className="flex gap-2.5 pt-1">
                <div className="h-10 rounded-xl bg-slate-900 animate-pulse flex-1" />
                <div className="h-10 rounded-xl bg-slate-900 animate-pulse w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-slate-950/20 border border-slate-900/60 rounded-2xl p-12 text-center text-slate-500">
          <p className="text-sm mb-4">No lost or found item listings matching those filters.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFeedTypeFilter("All");
              setCategoryFilter("All");
              setCityFilter("All");
            }}
            className="px-4 py-2 rounded-lg bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : feedViewMode === "map" ? (
        <ErrorBoundary fallbackTitle="Feed Map Rendering Error">
          <FeedMap 
            posts={filteredPosts} 
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
        <div className="space-y-3.5">
          {filteredPosts.map((p, idx) => (
            <PostCard
              key={p.id}
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Simple visual alias for the MapIcon component since "Map" name might conflict with JavaScript Map built-in
const IconMap = MapIcon;
