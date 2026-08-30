/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MatchFactorBreakdown {
  category: number;
  item: number;
  brand: number;
  colors: number;
  description: number;
  image: number;
  material: number;
  size: number;
  shape: number;
  location: number;
  dateProximity: number;
  timeline: number;
  identifiers: number;
}

export const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "with", "of", "for", "and", "or", "is", "was", "to", "from", "by", "about", "that", "this", "my", "your", "their", "our", "mine", "some", "any"
]);

export const SYNONYM_GROUPS = [
  ["wallet", "purse", "pouch", "clutch", "handbag", "pocketbook", "leather wallet", "money bag", "billfold", "cardholder", "bifold", "trifold"],
  ["phone", "mobile", "smartphone", "cellphone", "cell", "device", "iphone", "android", "galaxy", "pixel", "telephone"],
  ["earbuds", "earphones", "headphones", "pods", "airpods", "buds", "headset"],
  ["watch", "wristwatch", "wrist watch", "wrist", "smartwatch", "tracker", "fitbit", "applewatch"],
  ["backpack", "schoolbag", "rucksack", "bag", "pack", "school bag", "duffel", "suitcase", "satchel"],
  ["laptop", "notebook", "computer", "macbook", "chromebook", "tablet", "ipad"],
  ["key", "keys", "keychain", "fob", "car key", "house key"],
  ["card", "id", "license", "badge", "passport", "cardholder", "permit", "document"],
  ["glasses", "sunglasses", "spectacles", "eyeglasses", "goggles", "shades", "specs"],
  ["ring", "band", "wedding ring", "engagement ring", "jewelry", "jewel"],
  ["necklace", "chain", "pendant", "choker"],
  ["bottle", "flask", "thermos", "tumbler", "canteen", "mug", "cup"],
  ["jacket", "coat", "hoodie", "sweater", "cardigan", "blazer", "outerwear", "windbreaker"]
];

export const DESCRIPTORS = new Set([
  "leather", "canvas", "plastic", "metal", "silicone", "gold", "silver", "wooden", "cotton", "polyester",
  "black", "white", "blue", "red", "green", "yellow", "pink", "purple", "orange", "brown", "grey", "gray",
  "small", "large", "medium", "big", "little", "tiny", "brand", "new", "old", "used", "school", "office", "work",
  "wrist", "smart", "metallic", "fabric", "nylon", "steel", "brass", "copper", "aluminum", "glass", "denim", "wool",
  "light", "dark", "bright", "matte", "glossy", "clear", "transparent"
]);

export const BRAND_WORDS = new Set([
  "samsung", "apple", "sony", "google", "nike", "adidas", "dell", "hp", "lenovo", "asus", 
  "nintendo", "playstation", "xbox", "casio", "rolex", "fossil", "seiko", "citizen", "bose",
  "sennheiser", "beats", "jbl", "anker", "fitbit", "garmin", "gopro", "canon", "nikon", "fujifilm", "gucci", "prada", 
  "chanel", "hermes", "coach", "michael", "kors", "titan", "fastrack"
]);

export function stem(word: string): string {
  let w = word.toLowerCase().trim();
  if (w.length <= 2) return w;
  
  if (w.endsWith("ies")) {
    w = w.slice(0, -3) + "y";
  } else if (/(?:ch|sh|ss|x|z)es$/.test(w)) {
    w = w.slice(0, -2);
  } else if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("as") && !w.endsWith("us") && !w.endsWith("is") && !w.endsWith("os")) {
    w = w.slice(0, -1);
  }
  
  if (w.endsWith("ing")) {
    w = w.slice(0, -3);
    if (w.endsWith("at") || w.endsWith("bl") || w.endsWith("iz")) {
      w += "e";
    }
  } else if (w.endsWith("ed")) {
    w = w.slice(0, -2);
  } else if (w.endsWith("ly")) {
    w = w.slice(0, -2);
  } else if (w.endsWith("er") && w.length > 4) {
    w = w.slice(0, -2);
  }
  
  return w;
}

export function levenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

export function calculateHaversineDistance(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number | null {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateDateProximityScore(created1: number, created2: number): number {
  const diffMs = Math.abs(created1 - created2);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 0.5) return 100;
  if (diffDays <= 1) return 95;
  if (diffDays <= 3) return 85;
  if (diffDays <= 7) return 70;
  if (diffDays <= 14) return 50;
  if (diffDays <= 30) return 30;
  return 15;
}

export function calculateLocationScore(distance: number | null): number {
  if (distance === null) return 50; // Neutral fallback
  if (distance <= 0.5) return 100;
  if (distance <= 1) return 95;
  if (distance <= 3) return 85;
  if (distance <= 7) return 70;
  if (distance <= 15) return 50;
  if (distance <= 30) return 30;
  return 10;
}

export function cleanAndTokenize(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter(w => !STOP_WORDS.has(w));
}

export function calculateJaccardSimilarity(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

export function areWordsRelated(w1: string, w2: string): boolean {
  const s1 = stem(w1);
  const s2 = stem(w2);
  if (s1 === s2) return true;
  
  for (const group of SYNONYM_GROUPS) {
    const groupStems = group.map(stem);
    if (groupStems.includes(s1) && groupStems.includes(s2)) {
      return true;
    }
  }
  
  if (s1.length > 3 && s2.length > 3) {
    if (s1.includes(s2) || s2.includes(s1)) return true;
    if (levenshteinDistance(s1, s2) <= 1) return true;
  }
  return false;
}

export function extractBrandAndModel(tokens: string[]): { brand?: string; model?: string } {
  let brand: string | undefined;
  let model: string | undefined;
  
  const modelRegex = /[a-z]\d|\d[a-z]|\d{2,}/i;
  
  for (const token of tokens) {
    if (BRAND_WORDS.has(token)) {
      brand = token;
    } else if (modelRegex.test(token)) {
      model = token;
    }
  }
  return { brand, model };
}

export function calculateLocalItemSimilarity(nameA: string, nameB: string): number {
  const cleanA = (nameA || "").toLowerCase().trim();
  const cleanB = (nameB || "").toLowerCase().trim();

  if (!cleanA || !cleanB) return 0;

  const tokensA = cleanAndTokenize(cleanA);
  const tokensB = cleanAndTokenize(cleanB);
  
  const stemsA = tokensA.map(stem);
  const stemsB = tokensB.map(stem);

  if (stemsA.length === 0 || stemsB.length === 0) return 0;

  if (stemsA.sort().join(" ") === stemsB.sort().join(" ")) {
    return 100;
  }

  for (const group of SYNONYM_GROUPS) {
    const groupStems = group.map(stem);
    const hasA = groupStems.some(s => stemsA.includes(s));
    const hasB = groupStems.some(s => stemsB.includes(s));
    if (hasA && hasB) {
      const isAOnlySynonym = stemsA.every(s => groupStems.includes(s) || DESCRIPTORS.has(s));
      const isBOnlySynonym = stemsB.every(s => groupStems.includes(s) || DESCRIPTORS.has(s));
      if (isAOnlySynonym && isBOnlySynonym) {
        return 95;
      }
    }
  }

  let matchedCount = 0;
  const usedB = new Set<number>();

  for (let i = 0; i < stemsA.length; i++) {
    const sA = stemsA[i];
    for (let j = 0; j < stemsB.length; j++) {
      if (usedB.has(j)) continue;
      const sB = stemsB[j];

      if (areWordsRelated(sA, sB)) {
        matchedCount++;
        usedB.add(j);
        break;
      }
    }
  }

  const overlapA = stemsA.length > 0 ? matchedCount / stemsA.length : 0;
  const overlapB = stemsB.length > 0 ? matchedCount / stemsB.length : 0;
  const maxOverlap = Math.max(overlapA, overlapB);
  const jaccard = calculateJaccardSimilarity(stemsA, stemsB);
  const dice = (2 * matchedCount) / (stemsA.length + stemsB.length);

  let score = Math.max(maxOverlap * 40 + dice * 60, dice * 100, jaccard * 100);

  const brandModelA = extractBrandAndModel(tokensA);
  const brandModelB = extractBrandAndModel(tokensB);

  if (brandModelA.brand && brandModelB.brand) {
    if (brandModelA.brand === brandModelB.brand) {
      score = Math.max(score, 85);
      if (brandModelA.model && brandModelB.model && brandModelA.model === brandModelB.model) {
        return 98;
      }
    } else {
      score = score * 0.5;
    }
  } else if (brandModelA.model && brandModelB.model && brandModelA.model === brandModelB.model) {
    score = Math.max(score, 88);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeOfflineConfidenceScore(
  itemScore: number,
  categoryScore: number,
  locationScore: number,
  dateScore: number,
  imageScore: number | null
): number {
  let score = 0;
  if (imageScore !== null) {
    score = (itemScore * 0.40) + (categoryScore * 0.20) + (locationScore * 0.20) + (dateScore * 0.10) + (imageScore * 0.10);
  } else {
    score = ((itemScore * 0.40) + (categoryScore * 0.20) + (locationScore * 0.20) + (dateScore * 0.10)) / 0.90;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}
