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
  onUnlockPost?: (id: string, e: React.MouseEvent) => void;
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
  onUnlockPost,
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
      <div className="bg-[#07070a]/90 p-4 rounded-2xl border border-[#161621] shadow-2xl backdrop-blur-xl">
        {/* Search Bar */}
        <div className="relative mb-3 flex items-center">
          <Search className="absolute left-4 text-slate-500" size={13} />
          <input
            type="text"
            placeholder="Search matching item names, tags, colors, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10.5 pr-4 py-2.5 rounded-xl bg-[#030304]/90 border border-[#1c1c26] focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/55 outline-none text-[12px] font-medium text-slate-100 transition-all duration-150 placeholder:text-slate-600"
          />
        </div>

        {/* Sub Filters Row */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          {/* Type Toggles */}
          <div className="flex bg-[#030304]/90 p-1 rounded-xl border border-[#161621]">
            {["All", "Lost", "Found"].map((type) => (
              <button
                key={type}
                onClick={() => setFeedTypeFilter(type as any)}
                className={`text-[10px] font-sans font-bold px-3 py-1.5 rounded-lg uppercase transition-all duration-150 tracking-wider cursor-pointer active:scale-95 ${
                  feedTypeFilter === type
                    ? "bg-[#161621] text-indigo-400 font-extrabold border border-[#232332]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 items-center">
            {/* Category Filter dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-[10px] font-sans font-bold px-3 py-1.5 bg-[#030304]/90 border border-[#1c1c26] rounded-xl text-slate-300 outline-none cursor-pointer hover:border-[#232332] transition duration-150"
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
              className="text-[10px] font-sans font-bold px-3 py-1.5 bg-[#030304]/90 border border-[#1c1c26] rounded-xl text-slate-300 outline-none cursor-pointer hover:border-[#232332] transition duration-150"
            >
              <option value="All">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Sort Filter dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-[10px] font-sans font-bold px-3 py-1.5 bg-[#030304]/90 border border-[#1c1c26] rounded-xl text-slate-300 outline-none cursor-pointer hover:border-[#232332] transition duration-150"
            >
              <option value="new">Newest First</option>
              <option value="old">Oldest First</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>

          {/* List/Map View Toggle */}
          <div className="flex bg-[#030304]/90 p-1 rounded-xl border border-[#161621] shadow-md">
            <button
              type="button"
              onClick={() => setFeedViewMode("list")}
              className={`text-[9px] font-sans font-extrabold px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1 uppercase tracking-wider cursor-pointer active:scale-95 ${
                feedViewMode === "list"
                  ? "bg-[#161621] text-indigo-400 font-black border border-[#232332]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <List size={11} /> List
            </button>
            <button
              type="button"
              onClick={() => setFeedViewMode("map")}
              className={`text-[9px] font-sans font-extrabold px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1 uppercase tracking-wider cursor-pointer active:scale-95 ${
                feedViewMode === "map"
                  ? "bg-[#161621] text-indigo-400 font-black border border-[#232332]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <IconMap size={11} /> Map
            </button>
          </div>
        </div>
      </div>

      {/* Feed posts list */}
      {loadingPosts ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-[#07070a]/60 border border-[#161621] rounded-3xl p-6 relative overflow-hidden space-y-4 shadow-sm animate-pulse">
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
      ) : filteredPosts.length === 0 ? (
        <div className="bg-[#07070a]/40 border border-[#1c1c26] rounded-2xl p-14 text-center text-slate-400 shadow-md">
          <p className="text-sm font-medium mb-5">No cataloged lost or found item listings match those filter values.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFeedTypeFilter("All");
              setCategoryFilter("All");
              setCityFilter("All");
            }}
            className="px-4.5 py-2.5 rounded-xl bg-[#030304] text-xs font-mono font-bold text-slate-300 hover:text-white border border-[#1c1c26] hover:bg-[#12121a] transition cursor-pointer active:scale-95"
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
              onUnlockPost={onUnlockPost}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Simple visual alias for the MapIcon component since "Map" name might conflict with JavaScript Map built-in
const IconMap = MapIcon;
