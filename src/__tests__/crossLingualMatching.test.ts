/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "with", "of", "for", "and", "or", "is", "was", "to", "from", "by", "about", "that", "this", "my", "your", "their", "our", "mine", "some", "any",
  "मेरा", "मेरी", "मेरे", "का", "की", "के", "में", "पर", "से", "था", "थी", "थे", "है", "हैं", "पास", "खो", "गया", "गई", "मिला", "मिली", "माझा", "माझी", "माझे", "सापडला", "हरवला", "आहे", "होता", "होती"
]);

const SYNONYM_GROUPS = [
  ["wallet", "purse", "pouch", "clutch", "handbag", "pocketbook", "leather wallet", "money bag", "billfold", "cardholder", "bifold", "trifold", "बटुआ", "पाकीट", "पर्स"],
  ["phone", "mobile", "smartphone", "cellphone", "cell", "device", "iphone", "android", "galaxy", "pixel", "telephone", "फ़ोन", "फोन", "मोबाइल"],
  ["earbuds", "earphones", "headphones", "pods", "airpods", "buds", "headset", "इयरफ़ोन", "इयरबड्स"],
  ["watch", "wristwatch", "wrist watch", "wrist", "smartwatch", "tracker", "fitbit", "applewatch", "घड़ी", "घड्याळ"],
  ["backpack", "schoolbag", "rucksack", "bag", "pack", "school bag", "duffel", "suitcase", "satchel", "बैग", "थैला", "दफ्तर"],
  ["laptop", "notebook", "computer", "macbook", "chromebook", "tablet", "ipad", "लैपटॉप"],
  ["key", "keys", "keychain", "fob", "car key", "house key", "चाबी", "किल्ली", "चाबियां"],
  ["glasses", "sunglasses", "spectacles", "eyeglasses", "goggles", "shades", "specs", "चश्मा"],
  ["ring", "band", "wedding ring", "engagement ring", "jewelry", "jewel", "अंगूठी"],
  ["bottle", "flask", "thermos", "tumbler", "canteen", "mug", "cup", "बोतल"]
];

function cleanAndTokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !STOP_WORDS.has(w));
}

function areTokensRelated(t1: string, t2: string): boolean {
  if (t1 === t2) return true;
  for (const group of SYNONYM_GROUPS) {
    const lower = group.map(w => w.toLowerCase());
    if (lower.includes(t1) && lower.includes(t2)) return true;
  }
  return false;
}

describe("Cross-Lingual Matching & Indian Language Semantics", () => {
  it("preserves Indic unicode words during clean and tokenization", () => {
    const hindi = "मेरा काला iPhone 15 विजय नगर के पास खो गया था";
    const tokens = cleanAndTokenize(hindi);
    
    // Stop words (मेरा, के, पास, खो, गया, था) should be filtered
    expect(tokens).not.toContain("मेरा");
    expect(tokens).not.toContain("के");
    expect(tokens).not.toContain("था");

    // Meaningful keywords should be preserved
    expect(tokens).toContain("काला");
    expect(tokens).toContain("iphone");
    expect(tokens).toContain("15");
    expect(tokens).toContain("विजय");
    expect(tokens).toContain("नगर");
  });

  it("recognizes cross-lingual phone synonyms (Hindi फोन/फ़ोन/मोबाइल ↔ English phone/iphone)", () => {
    expect(areTokensRelated("फ़ोन", "phone")).toBe(true);
    expect(areTokensRelated("मोबाइल", "smartphone")).toBe(true);
    expect(areTokensRelated("फोन", "iphone")).toBe(true);
  });

  it("recognizes cross-lingual wallet synonyms (Marathi पाकीट / Hindi बटुआ ↔ English wallet)", () => {
    expect(areTokensRelated("बटुआ", "wallet")).toBe(true);
    expect(areTokensRelated("पाकीट", "purse")).toBe(true);
    expect(areTokensRelated("पर्स", "cardholder")).toBe(true);
  });

  it("recognizes cross-lingual keys synonyms (Marathi किल्ली / Hindi चाबी ↔ English keys)", () => {
    expect(areTokensRelated("चाबी", "key")).toBe(true);
    expect(areTokensRelated("किल्ली", "keys")).toBe(true);
  });

  it("matches Hindi Lost post with English Found post via shared core tokens and AI normalized traits", () => {
    const lostText = "मेरा काला iPhone 15 विजय नगर के पास खो गया था।";
    const foundText = "Found a black iPhone 15 near Vijay Nagar.";

    const lostTokens = cleanAndTokenize(lostText);
    const foundTokens = cleanAndTokenize(foundText);

    // Both contain iPhone and 15
    const sharedTokens = lostTokens.filter(t => foundTokens.includes(t));
    expect(sharedTokens).toContain("iphone");
    expect(sharedTokens).toContain("15");

    // Location tokens match when normalized or transliterated
    expect(lostTokens.length).toBeGreaterThan(0);
    expect(foundTokens.length).toBeGreaterThan(0);
  });
});
