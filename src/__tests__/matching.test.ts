/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { 
  calculateLocalItemSimilarity, 
  calculateHaversineDistance, 
  calculateDateProximityScore,
  calculateLocationScore,
  computeOfflineConfidenceScore,
  stem,
  areWordsRelated,
  calculateJaccardSimilarity
} from "../utils/matchingEngine";

describe("LINCO AI & Local Matching Engine", () => {
  describe("Word Stemming and Semantic Relations", () => {
    it("stems plurals and suffixes accurately", () => {
      expect(stem("wallets")).toBe("wallet");
      expect(stem("phones")).toBe("phone");
      expect(stem("keys")).toBe("key");
      expect(stem("laptops")).toBe("laptop");
    });

    it("recognizes synonyms and variations across same item class", () => {
      expect(areWordsRelated("wallet", "purse")).toBe(true);
      expect(areWordsRelated("mobile", "smartphone")).toBe(true);
      expect(areWordsRelated("earbuds", "airpods")).toBe(true);
      expect(areWordsRelated("laptop", "macbook")).toBe(true);
    });

    it("computes accurate Jaccard token overlap", () => {
      const tokensA = ["black", "leather", "wallet"];
      const tokensB = ["leather", "wallet", "brown"];
      const jaccard = calculateJaccardSimilarity(tokensA, tokensB);
      expect(jaccard).toBe(2 / 4); // 0.5
    });
  });

  describe("Item Name Similarity", () => {
    it("scores identical items with maximum similarity", () => {
      const score = calculateLocalItemSimilarity("Titan Black Watch", "Titan Black Watch");
      expect(score).toBe(100);
    });

    it("scores synonym phrases highly (e.g. Leather Wallet vs Brown Purse)", () => {
      const score = calculateLocalItemSimilarity("Leather Wallet", "Leather Purse");
      expect(score).toBeGreaterThanOrEqual(90);
    });

    it("scores smartphone synonyms highly (e.g. Apple iPhone vs Apple Smartphone)", () => {
      const score = calculateLocalItemSimilarity("Apple iPhone 14", "Apple Smartphone 14");
      expect(score).toBeGreaterThanOrEqual(85);
    });

    it("penalizes brand mismatch (e.g. Apple vs Samsung)", () => {
      const appleScore = calculateLocalItemSimilarity("Apple iPhone 13", "Apple iPhone 13 Pro");
      const mismatchScore = calculateLocalItemSimilarity("Apple iPhone 13", "Samsung Galaxy S22");
      expect(appleScore).toBeGreaterThan(mismatchScore);
    });

    it("returns 0 for completely empty or irrelevant items", () => {
      expect(calculateLocalItemSimilarity("", "")).toBe(0);
      expect(calculateLocalItemSimilarity("Diamond Ring", "Honda Motorcycle Key")).toBeLessThan(30);
    });
  });

  describe("Haversine Distance & Spatial Scoring", () => {
    it("returns 0 km for identical coordinates", () => {
      const dist = calculateHaversineDistance(18.5204, 73.8567, 18.5204, 73.8567);
      expect(dist).toBe(0);
    });

    it("calculates realistic distance between Pune FC Road and Pune Railway Station (~4-5 km)", () => {
      // FC Road: ~18.5244, 73.8407; Pune Station: ~18.5284, 73.8744
      const dist = calculateHaversineDistance(18.5244, 73.8407, 18.5284, 73.8744);
      expect(dist).not.toBeNull();
      expect(dist!).toBeGreaterThan(2.5);
      expect(dist!).toBeLessThan(5.5);
    });

    it("evaluates location score based on proximity tiers", () => {
      expect(calculateLocationScore(0.2)).toBe(100); // within 500m
      expect(calculateLocationScore(0.8)).toBe(95);  // within 1km
      expect(calculateLocationScore(2.5)).toBe(85);  // within 3km
      expect(calculateLocationScore(12)).toBe(50);   // within 15km
      expect(calculateLocationScore(50)).toBe(10);   // distant
      expect(calculateLocationScore(null)).toBe(50); // neutral fallback
    });
  });

  describe("Date Proximity & Offline Confidence Composition", () => {
    it("calculates high proximity score for events within 24 hours", () => {
      const now = Date.now();
      const twelveHoursAgo = now - 12 * 60 * 60 * 1000;
      expect(calculateDateProximityScore(now, twelveHoursAgo)).toBe(100);
    });

    it("calculates accurate weighted offline confidence score", () => {
      // 40% item, 20% category, 20% location, 10% date (normalized without image)
      const conf = computeOfflineConfidenceScore(90, 100, 95, 100, null);
      expect(conf).toBeGreaterThanOrEqual(90);
      expect(conf).toBeLessThanOrEqual(100);
    });
  });
});
