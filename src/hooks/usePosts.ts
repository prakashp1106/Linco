/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { Post, AIMatch } from "../types";
import { apiService } from "../services/api";
import { dbService } from "../services/db";

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [matches, setMatches] = useState<Record<string, AIMatch[]>>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [backendStatus, setBackendStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [unlockedPosts, setUnlockedPosts] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, lost: 0, found: 0, resolved: 0 });

  const loadPosts = useCallback(async (showSilentLoading = false) => {
    if (!showSilentLoading) setLoadingPosts(true);
    setBackendStatus("connecting");
    try {
      const data = await apiService.getPosts();
      setPosts(data.posts || []);
      setMatches(data.matches || {});
      setBackendStatus("live");
    } catch (err) {
      console.error("Error loading posts:", err);
      setBackendStatus("offline");
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  // Poll database every 30 seconds
  useEffect(() => {
    loadPosts();
    const interval = setInterval(() => {
      loadPosts(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadPosts]);

  // Sync Stats on change
  useEffect(() => {
    setStats({
      total: posts.length,
      lost: posts.filter((p) => p.type === "Lost").length,
      found: posts.filter((p) => p.type === "Found").length,
      resolved: posts.filter((p) => p.status === "Resolved").length,
    });
  }, [posts]);

  // Load unlocked contacts on mount
  useEffect(() => {
    setUnlockedPosts(dbService.getUnlockedPosts());
  }, []);

  const unlockPost = useCallback((postId: string) => {
    dbService.saveUnlockedPost(postId);
    setUnlockedPosts(dbService.getUnlockedPosts());
  }, []);

  const submitPost = useCallback(async (postData: Partial<Post> & { securityPin?: string }) => {
    const res = await apiService.createPost(postData);
    if (res.success) {
      await loadPosts(true);
    }
    return res;
  }, [loadPosts]);

  const resolvePost = useCallback(async (id: string, pin: string) => {
    const res = await apiService.resolvePost(id, pin);
    if (res.success) {
      await loadPosts(true);
    }
    return res;
  }, [loadPosts]);

  const deletePost = useCallback(async (id: string, pin: string) => {
    const res = await apiService.deletePost(id, pin);
    if (res.success) {
      await loadPosts(true);
    }
    return res;
  }, [loadPosts]);

  const incrementPostViews = useCallback(async (id: string) => {
    try {
      const res = await apiService.incrementView(id);
      if (res.success) {
        setPosts((currentPosts) =>
          currentPosts.map((p) => (p.id === id ? { ...p, views: res.views } : p))
        );
      }
    } catch (error) {
      console.error("Failed to increment views:", error);
    }
  }, []);

  return {
    posts,
    matches,
    loadingPosts,
    backendStatus,
    unlockedPosts,
    stats,
    unlockPost,
    loadPosts,
    submitPost,
    resolvePost,
    deletePost,
    incrementPostViews,
  };
}
