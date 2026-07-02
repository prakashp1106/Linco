/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const LOCAL_STORAGE_PREFIX = "linco_db_";

export const dbService = {
  /**
   * Get an item from localStorage with type safety
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
      if (stored === null) return defaultValue;
      return JSON.parse(stored) as T;
    } catch (e) {
      console.error(`Error reading key ${key} from local db:`, e);
      return defaultValue;
    }
  },

  /**
   * Save an item to localStorage
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving key ${key} to local db:`, e);
    }
  },

  /**
   * Clear an item
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    } catch (e) {
      console.error(`Error removing key ${key} from local db:`, e);
    }
  },

  /**
   * Helpers for common system objects
   */
  getUnlockedPosts(): string[] {
    return dbService.get<string[]>("unlocked_posts", []);
  },

  saveUnlockedPost(id: string): void {
    const unlocked = dbService.getUnlockedPosts();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      dbService.set("unlocked_posts", unlocked);
    }
  },

  getDraftPost(): any | null {
    return dbService.get<any | null>("post_draft", null);
  },

  saveDraftPost(draft: any): void {
    dbService.set("post_draft", draft);
  },

  clearDraftPost(): void {
    this.remove("post_draft");
  },
};
