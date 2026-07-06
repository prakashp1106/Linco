/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { Post, AIMatch, Claim, PotentialMatch, LincoNotification } from "./src/types.js";
import { Firestore } from "firebase-admin/firestore";
import { db } from "./src/services/firebaseAdmin.js";
import { v2 as cloudinary } from "cloudinary";

import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcrypt";
import { z } from "zod";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Gemini SDK with telemetry User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const app = express();
const PORT = 3000;

// Secure Headers with Helmet configured for iframe embedding & Leaflet map tile rendering
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://apis.mappls.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com", "https://apis.mappls.com"],
        imgSrc: [
          "'self'", 
          "data:", 
          "blob:", 
          "https://*.openstreetmap.org", 
          "https://unpkg.com", 
          "https://apis.mappls.com", 
          "https://*.mappls.com", 
          "https://*.google.com",
          "https://*.googleapis.com",
          "https://res.cloudinary.com"
        ],
        connectSrc: [
          "'self'", 
          "https://nominatim.openstreetmap.org", 
          "https://apis.mappls.com", 
          "https://*.mappls.com", 
          "https://generativelanguage.googleapis.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameAncestors: ["'self'", "*"], // Required for AI Studio iframe preview
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// Express rate limiting to guard against API spam/brute-force
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again later." },
});

app.use("/api/", apiLimiter);

// Set high body limits to allow base64 images to pass through
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

const DB_PATH = path.join(process.cwd(), "posts_db.json");
const BIN_URL = "https://api.jsonbin.io/v3/b/6a415800da38895dfe0c5f53";
const BIN_KEY = "$2a$10$Ijx3FPrXZXYTxhztjdE6ludnpXv78iRcdz3iGTNspFT9ey3PHMttW";

// Seed initial realistic data
const initialPosts: Post[] = [
  {
    id: "1719680000000",
    item: "Brown Leather Wallet",
    details: "Contains a college ID card for Rahul Sharma, a metro card, and some cash. Has a small bronze eagle emblem on the bottom right.",
    type: "Lost",
    address: "FC Road Canteen, near Symbiosis College",
    reward: "500",
    contact: "9876543210",
    category: "Wallet / Purse",
    urgency: "Contains ID",
    image: null,
    status: "Active",
    views: 12,
    created: 1719680000000,
    timestamp: "29 Jun 2026, 12:30 PM",
  },
  {
    id: "1719681000000",
    item: "Black Lenovo Laptop Charger",
    details: "Lenovo 65W USB-C charger found plugged into the desk in the corner. Has a small green sticker tape on the brick adapter.",
    type: "Found",
    address: "Central Library Study Room C",
    contact: "9123456789",
    category: "Electronics",
    urgency: "Normal",
    image: null,
    status: "Active",
    views: 4,
    created: 1719681000000,
    timestamp: "29 Jun 2026, 01:45 PM",
  },
  {
    id: "1719682000000",
    item: "Stray Golden Retriever Puppy",
    details: "Friendly golden puppy wearing a red collar but no tag. Found wandering in the children's park. Super energetic and safe with me.",
    type: "Found",
    address: "Millennium Park Sector 4",
    contact: "9012345678",
    category: "Pet",
    urgency: "Urgent",
    image: null,
    status: "Active",
    views: 31,
    created: 1719682000000,
    timestamp: "29 Jun 2026, 03:15 PM",
  },
  {
    id: "1719683000000",
    item: "Silver Casio G-Shock Watch",
    details: "Waterproof metal strap digital watch. Model G-5600. It has a tiny scratch on the upper-left bezel.",
    type: "Lost",
    address: "FC Road Sports Arena, near basketball court",
    reward: "1000",
    contact: "9988776655",
    category: "Electronics",
    urgency: "Normal",
    image: null,
    status: "Active",
    views: 18,
    created: 1719683000000,
    timestamp: "29 Jun 2026, 04:50 PM",
  }
];

// Local File DB Fallback mechanism
const FALLBACK_DB_PATH = path.join(process.cwd(), "uploads", "fallback_db.json");

// Ensure uploads directory exists
if (!fs.existsSync(path.join(process.cwd(), "uploads"))) {
  fs.mkdirSync(path.join(process.cwd(), "uploads"), { recursive: true });
}

// Initial structure for fallback file
function initFallbackDB() {
  if (!fs.existsSync(FALLBACK_DB_PATH)) {
    fs.writeFileSync(
      FALLBACK_DB_PATH,
      JSON.stringify({ posts: initialPosts, matches: {}, claims: [] }, null, 2)
    );
  }
}
initFallbackDB();

let useLocalFallback = false;
let lastFirestoreError: string | null = null;
let lastFirestoreErrorDetails: string | null = null;

// Initialize and verify Firestore
try {
  if (!db) {
    throw new Error("Firestore client not initialized.");
  }
  console.log("[DIAGNOSTIC-STARTUP] Firebase production Firestore instance loaded. Testing collection access...");
} catch (error: any) {
  lastFirestoreError = error.message || String(error);
  if (error && typeof error === "object") {
    lastFirestoreErrorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
  }
  console.error("[DIAGNOSTIC-STARTUP] Failed to load production Firestore instance, enabling local fallback:", error);
  useLocalFallback = true;
}

// Function to read local fallback file
function readLocalDB() {
  initFallbackDB();
  try {
    const raw = fs.readFileSync(FALLBACK_DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read local fallback DB:", err);
    return { posts: initialPosts, matches: {}, claims: [] };
  }
}

// Function to write to local fallback file
function writeLocalDB(data: any) {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write local fallback DB:", err);
  }
}

// Helper to seed initial posts if Firestore collection is empty
async function seedFirestoreIfNeeded() {
  if (useLocalFallback || !db) return;
  try {
    console.log("[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before querying for seeding check");
    const postsSnapshot = await db.collection("posts").limit(1).get();
    if (postsSnapshot.empty) {
      console.log("Firestore 'posts' collection is empty. Seeding initial posts...");
      const batch = db.batch();
      for (const p of initialPosts) {
        console.log(`[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before writing seed post ${p.id}`);
        const docRef = db.collection("posts").doc(p.id);
        batch.set(docRef, p);
      }
      await batch.commit();
      console.log("Successfully seeded initial posts in Firestore.");
    }
  } catch (err: any) {
    lastFirestoreError = err.message || String(err);
    if (err && typeof err === "object") {
      lastFirestoreErrorDetails = JSON.stringify(err, Object.getOwnPropertyNames(err));
    }
    console.error("Failed to check or seed Firestore, enabling local file database fallback:", err);
    useLocalFallback = true;
  }
}

// Helper to load posts database directly and exclusively from Firestore (or fallback JSON)
async function readDBAsync(): Promise<{ posts: Post[]; matches: Record<string, AIMatch[]>; claims: Claim[] }> {
  console.log(`[DIAGNOSTIC-DB] readDBAsync invoked.`);
  await seedFirestoreIfNeeded();

  if (useLocalFallback) {
    console.log("[DIAGNOSTIC-DB] Reading from local file fallback database...");
    const local = readLocalDB();
    return {
      posts: local.posts || [],
      matches: local.matches || {},
      claims: []
    };
  }

  try {
    // Fetch posts
    console.log("[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before querying");
    const postsSnapshot = await db!.collection("posts").get();
    const posts: Post[] = [];
    postsSnapshot.forEach(doc => {
      posts.push(doc.data() as Post);
    });
    console.log(`[DIAGNOSTIC-DB] Fetched ${posts.length} posts successfully from Firestore.`);

    // Sort posts by created descending (newest first)
    posts.sort((a, b) => b.created - a.created);

    // Fetch matches
    console.log("[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'matches' before querying");
    const matchesSnapshot = await db!.collection("matches").get();
    const matches: Record<string, AIMatch[]> = {};
    matchesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data && Array.isArray(data.list)) {
        matches[doc.id] = data.list;
      }
    });
    console.log(`[DIAGNOSTIC-DB] Fetched ${Object.keys(matches).length} matches successfully from Firestore.`);

    // Do NOT fetch global claims to avoid leakage. Return empty array instead.
    const claims: Claim[] = [];

    return { posts, matches, claims };
  } catch (err: any) {
    console.error("Firestore readDBAsync failed, falling back to local file DB:", err);
    useLocalFallback = true;
    const local = readLocalDB();
    return {
      posts: local.posts || [],
      matches: local.matches || {},
      claims: []
    };
  }
}

// AI Matching Engine
async function runAIMatch(newPost: Post, allPosts: Post[]): Promise<AIMatch[]> {
  const oppType = newPost.type === "Lost" ? "Found" : "Lost";
  const candidates = allPosts.filter(
    (p) => p.type === oppType && p.status === "Active" && p.id !== newPost.id
  );
  if (candidates.length === 0) return [];

  try {
    const listString = candidates
      .map(
        (p, i) =>
          `[Index:${i} ID:${p.id}] Item: ${p.item} | Category: ${p.category} | Details: ${p.details} | Location: ${p.address}`
      )
      .join("\n");

    const prompt = `You are an AI Lost & Found matching engine.
New item posted:
[${newPost.type}] Item: ${newPost.item} | Category: ${newPost.category} | Description: ${newPost.details} | Location: ${newPost.address}

Existing candidates of the opposite type (${oppType}):
${listString}

Task: Compare the new item with all candidates. Determine if any could represent the same physical item.
Only match items that share highly compatible descriptions, colors, categories, or locations. For example, a "Lenovo charger" does not match a "Casio Watch".
Assign a confidence score (from 50 to 100) and a clear, brief, 1-2 sentence match explanation.
Only return matches with a confidence score above 60%.

Return ONLY a valid JSON array of match results. Do not include any markdown, backticks, or extra commentary.
Expected format:
[
  {
    "id": "matching_candidate_ID_string",
    "score": 85,
    "reason": "Explain why they match, referencing compatible details (e.g., both mention Symbiosis College area and brown leather with eagle detail)."
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "[]";
    const cleanedText = text.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleanedText);
    
    if (Array.isArray(parsed)) {
      return parsed
        .map((m) => {
          const cand = candidates.find((c) => c.id === m.id);
          if (!cand) return null;
          return {
            id: cand.id,
            item: cand.item,
            contact: cand.contact,
            score: Number(m.score) || 70,
            reason: String(m.reason),
          };
        })
        .filter((m): m is AIMatch => m !== null);
    }
  } catch (err) {
    console.error("AI matching error:", err);
  }
  return [];
}

// --- LINCO SMART AI MATCH ENGINE ---
let matchThreshold = 80;

interface AIFeatures {
  itemName: string;
  category: string;
  brand: string;
  primaryColor: string;
  secondaryColor: string;
  material: string;
  size: string;
  shape: string;
  uniqueIdentifiers: string;
  timelineHints: string;
  imageDescription: string;
  hasImage: boolean;
}

// Haversine distance on server
function calculateHaversineDistance(lat1?: number, lon1?: number, lat2?: number, lon2?: number): number | null {
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

// Date proximity score (0 to 100)
function calculateDateProximityScore(created1: number, created2: number): number {
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

// Location score based on distance
function calculateLocationScore(distance: number | null): number {
  if (distance === null) return 50; // Neutral fallback if coordinates are missing
  if (distance <= 0.5) return 100;
  if (distance <= 1) return 95;
  if (distance <= 3) return 85;
  if (distance <= 7) return 70;
  if (distance <= 15) return 50;
  if (distance <= 30) return 30;
  return 10;
}

// On-demand AI feature extraction
async function extractAIFeatures(post: Post): Promise<AIFeatures> {
  const defaultFeatures: AIFeatures = {
    itemName: post.item,
    category: post.category,
    brand: "unknown",
    primaryColor: "unknown",
    secondaryColor: "unknown",
    material: "unknown",
    size: "unknown",
    shape: "unknown",
    uniqueIdentifiers: "none",
    timelineHints: "none",
    imageDescription: "",
    hasImage: !!post.image
  };

  if (!process.env.GEMINI_API_KEY) {
    console.warn(`[AI-MATCH] GEMINI_API_KEY missing. Skipping AI-based feature extraction for post ${post.id}.`);
    return defaultFeatures;
  }

  try {
    let parts: any[] = [];
    if (post.image) {
      const matches = post.image.match(/^data:(.*?);base64,(.*)$/);
      if (matches) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    }

    const prompt = `You are a forensic detail extraction engine for a Lost and Found platform called LINCO.
Analyze the following post details and the optional image. Extract the specific metadata requested in the JSON schema.
Post Details:
- Item: ${post.item}
- Category: ${post.category}
- Description: ${post.details}
- Location: ${post.address}

Extract and output ONLY a valid JSON object matching the following structure. Do NOT include markdown blocks.
{
  "itemName": "Specific 2-4 word clean name of the item (e.g., iPhone 13 Pro, Casio Watch)",
  "category": "Standard category matching the item",
  "brand": "The brand name if discernible, or 'unknown'",
  "primaryColor": "The dominant color of the item (e.g. Red, Black, Gold, Silver), or 'unknown'",
  "secondaryColor": "The secondary accent color of the item, or 'unknown'",
  "material": "The material (e.g. Leather, Plastic, Aluminium, Glass, Canvas), or 'unknown'",
  "size": "The size details if described (e.g. 6.1-inch, Medium, Size 9, Large), or 'unknown'",
  "shape": "The general shape (e.g. Rectangular, Round, Square, Oval), or 'unknown'",
  "uniqueIdentifiers": "Any distinct stickers, scratches, engravings, cracks, serial numbers, keychains, phone cases, or specific accessories mentioned, or 'none'",
  "timelineHints": "Specific details about when or how it was lost/found (e.g., fell out of bag, left on table 4, active during heavy rain), or 'none'",
  "imageDescription": "A concise visual description under 40 words based on the attached image if one exists. Focus on logos, specific damage, background, or visual markings."
}`;

    parts.push({ text: prompt });

    const text = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: parts,
        });
        return response.text || "{}";
      },
      JSON.stringify(defaultFeatures),
      `extract-features-${post.id}`
    );

    const cleanedText = text.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleanedText);
    return {
      itemName: parsed.itemName || defaultFeatures.itemName,
      category: parsed.category || defaultFeatures.category,
      brand: parsed.brand || defaultFeatures.brand,
      primaryColor: parsed.primaryColor || defaultFeatures.primaryColor,
      secondaryColor: parsed.secondaryColor || defaultFeatures.secondaryColor,
      material: parsed.material || defaultFeatures.material,
      size: parsed.size || defaultFeatures.size,
      shape: parsed.shape || defaultFeatures.shape,
      uniqueIdentifiers: parsed.uniqueIdentifiers || defaultFeatures.uniqueIdentifiers,
      timelineHints: parsed.timelineHints || defaultFeatures.timelineHints,
      imageDescription: parsed.imageDescription || defaultFeatures.imageDescription,
      hasImage: !!post.image
    };

  } catch (err) {
    console.error(`[AI-MATCH] Feature extraction failed for post ${post.id}:`, err);
    return defaultFeatures;
  }
}

// Compare two posts using pre-extracted features
async function comparePostsForMatch(postA: Post, postB: Post): Promise<PotentialMatch | null> {
  const lostPost = postA.type === "Lost" ? postA : postB;
  const foundPost = postA.type === "Found" ? postA : postB;

  const distance = calculateHaversineDistance(lostPost.latitude, lostPost.longitude, foundPost.latitude, foundPost.longitude);
  const dateScore = calculateDateProximityScore(lostPost.created, foundPost.created);
  const locScore = calculateLocationScore(distance);

  const defaultMatch: PotentialMatch = {
    matchId: `${lostPost.id}_${foundPost.id}`,
    lostPostId: lostPost.id,
    foundPostId: foundPost.id,
    matchScore: 0,
    matchBreakdown: {
      category: 0,
      item: 0,
      brand: 0,
      colors: 0,
      description: 0,
      image: 0,
      material: 0,
      size: 0,
      shape: 0,
      location: locScore,
      dateProximity: dateScore,
      timeline: 50,
      identifiers: 0
    },
    createdAt: Date.now(),
    status: "Active",
    reviewed: false,
    notificationsSent: true,
    lastUpdated: Date.now(),
    reason: "Match analysis unavailable"
  };

  if (!process.env.GEMINI_API_KEY) {
    console.warn("[AI-MATCH] GEMINI_API_KEY missing. Skipping smart comparison.");
    return null;
  }

  try {
    const prompt = `You are the Core Forensic Matching Engine of LINCO.
Compare the following Lost and Found posts and determine if they represent the same physical item.

Lost Post:
- Item: ${lostPost.item}
- Category: ${lostPost.category}
- Details: ${lostPost.details}
- Location: ${lostPost.address}
- Pre-extracted Features: ${JSON.stringify(lostPost.aiFeatures || {})}

Found Post:
- Item: ${foundPost.item}
- Category: ${foundPost.category}
- Details: ${foundPost.details}
- Location: ${foundPost.address}
- Pre-extracted Features: ${JSON.stringify(foundPost.aiFeatures || {})}

Additional Pre-computed Metrics:
- Location Distance Score: ${locScore}% (Distance: ${distance !== null ? distance.toFixed(2) + " km" : "unknown"})
- Date Proximity Score: ${dateScore}%

Task:
Calculate a confidence score (from 0 to 100) and a detailed breakdown of parameters.
Only match items that share highly compatible descriptions, colors, categories, or unique details. Highly prioritize unique markings, stickers, serial numbers, accessories, or specific scratches/engravings (if they match, score them extremely high). If they clearly represent different items (e.g. a red phone and a black wallet), the overall score should be very low.

Return ONLY a valid JSON object. Do NOT include markdown blocks.
Expected JSON format:
{
  "matchScore": 87,
  "matchBreakdown": {
    "category": 95,
    "item": 90,
    "brand": 100,
    "colors": 85,
    "description": 80,
    "image": 90,
    "material": 95,
    "size": 85,
    "shape": 90,
    "location": ${locScore},
    "dateProximity": ${dateScore},
    "timeline": 85,
    "identifiers": 90
  },
  "reason": "Explain in exactly 2 clear, scannable sentences why these listings match. Reference brand name, visual features, unique identifiers, and locations."
}`;

    const text = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        return response.text || "{}";
      },
      JSON.stringify({
        matchScore: 0,
        matchBreakdown: defaultMatch.matchBreakdown,
        reason: "Match analysis timed out"
      }),
      `compare-match-${lostPost.id}-${foundPost.id}`
    );

    const cleanedText = text.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleanedText);

    if (typeof parsed.matchScore === "number") {
      return {
        matchId: `${lostPost.id}_${foundPost.id}`,
        lostPostId: lostPost.id,
        foundPostId: foundPost.id,
        matchScore: parsed.matchScore,
        matchBreakdown: {
          category: parsed.matchBreakdown?.category ?? 50,
          item: parsed.matchBreakdown?.item ?? 50,
          brand: parsed.matchBreakdown?.brand ?? 50,
          colors: parsed.matchBreakdown?.colors ?? 50,
          description: parsed.matchBreakdown?.description ?? 50,
          image: parsed.matchBreakdown?.image ?? 0,
          material: parsed.matchBreakdown?.material ?? 50,
          size: parsed.matchBreakdown?.size ?? 50,
          shape: parsed.matchBreakdown?.shape ?? 50,
          location: parsed.matchBreakdown?.location ?? locScore,
          dateProximity: parsed.matchBreakdown?.dateProximity ?? dateScore,
          timeline: parsed.matchBreakdown?.timeline ?? 50,
          identifiers: parsed.matchBreakdown?.identifiers ?? 0
        },
        createdAt: Date.now(),
        status: "Active",
        reviewed: false,
        notificationsSent: true,
        lastUpdated: Date.now(),
        reason: parsed.reason || "Matched by LINCO Smart AI"
      };
    }
  } catch (err) {
    console.error(`Error comparing posts ${postA.id} and ${postB.id}:`, err);
  }
  return null;
}

// Background matching orchestration engine
async function runSmartMatchEngine(newPost: Post) {
  try {
    console.log(`[AI-MATCH-ENGINE] Starting Smart AI Match Engine for post ${newPost.id}...`);

    // 1. Extract aiFeatures for the new post if missing
    if (!newPost.aiFeatures) {
      newPost.aiFeatures = await extractAIFeatures(newPost);
      if (useLocalFallback) {
        const local = readLocalDB();
        const postIndex = local.posts.findIndex((p: any) => p.id === newPost.id);
        if (postIndex !== -1) {
          local.posts[postIndex].aiFeatures = newPost.aiFeatures;
          writeLocalDB(local);
        }
      } else {
        await db.collection("posts").doc(newPost.id).update({ aiFeatures: newPost.aiFeatures });
      }
    }

    // 2. Fetch all candidates of the opposite type that are ACTIVE
    let posts: Post[] = [];
    if (useLocalFallback) {
      const local = readLocalDB();
      posts = local.posts || [];
    } else {
      const snapshot = await db.collection("posts").get();
      snapshot.forEach(doc => {
        posts.push(doc.data() as Post);
      });
    }

    const oppType = newPost.type === "Lost" ? "Found" : "Lost";
    const candidates = posts.filter(
      (p) => p.type === oppType && p.status === "Active" && p.id !== newPost.id
    );

    console.log(`[AI-MATCH-ENGINE] Found ${candidates.length} active candidate posts of opposite type (${oppType})`);

    for (const cand of candidates) {
      // Lazy extract aiFeatures for candidate if missing
      if (!cand.aiFeatures) {
        cand.aiFeatures = await extractAIFeatures(cand);
        if (useLocalFallback) {
          const local = readLocalDB();
          const postIndex = local.posts.findIndex((p: any) => p.id === cand.id);
          if (postIndex !== -1) {
            local.posts[postIndex].aiFeatures = cand.aiFeatures;
            writeLocalDB(local);
          }
        } else {
          await db.collection("posts").doc(cand.id).update({ aiFeatures: cand.aiFeatures });
        }
      }

      // Check if match already exists
      const matchId = newPost.type === "Lost" ? `${newPost.id}_${cand.id}` : `${cand.id}_${newPost.id}`;
      let existingMatch = false;

      if (useLocalFallback) {
        const local = readLocalDB();
        existingMatch = (local.potentialMatches || []).some((m: any) => m.matchId === matchId);
      } else {
        const doc = await db.collection("matches").doc(matchId).get();
        existingMatch = doc.exists;
      }

      if (existingMatch) {
        console.log(`[AI-MATCH-ENGINE] Match ${matchId} already exists. Skipping.`);
        continue;
      }

      // Compare!
      const potentialMatch = await comparePostsForMatch(newPost, cand);
      if (potentialMatch) {
        const meetsThreshold = potentialMatch.matchScore >= matchThreshold;
        console.log(`[AI-MATCH-ENGINE] Computed score for ${matchId}: ${potentialMatch.matchScore}% (meets threshold: ${meetsThreshold})`);

        if (meetsThreshold) {
          // Save potential match
          if (useLocalFallback) {
            const local = readLocalDB();
            if (!local.potentialMatches) local.potentialMatches = [];
            local.potentialMatches.push(potentialMatch);
            writeLocalDB(local);
          } else {
            await db.collection("matches").doc(potentialMatch.matchId).set(potentialMatch);
          }

          // Build notifications for both users immediately
          const lostUserMsg = `Great news! LINCO AI found a possible match for your lost '${newPost.type === "Lost" ? newPost.item : cand.item}'.`;
          const foundUserMsg = `Someone may be looking for the '${newPost.type === "Found" ? newPost.item : cand.item}' you found.`;

          const notifLost: LincoNotification = {
            id: `notif_lost_${potentialMatch.matchId}`,
            postId: potentialMatch.lostPostId,
            message: lostUserMsg,
            createdAt: Date.now(),
            read: false,
            type: "match",
            matchId: potentialMatch.matchId
          };

          const notifFound: LincoNotification = {
            id: `notif_found_${potentialMatch.matchId}`,
            postId: potentialMatch.foundPostId,
            message: foundUserMsg,
            createdAt: Date.now(),
            read: false,
            type: "match",
            matchId: potentialMatch.matchId
          };

          if (useLocalFallback) {
            const local = readLocalDB();
            if (!local.notifications) local.notifications = [];
            local.notifications.push(notifLost);
            local.notifications.push(notifFound);
            writeLocalDB(local);
          } else {
            await db.collection("notifications").doc(notifLost.id).set(notifLost);
            await db.collection("notifications").doc(notifFound.id).set(notifFound);
          }

          // Update legacy matches to keep original card alerts functional!
          const lostPostObj = newPost.type === "Lost" ? newPost : cand;
          const foundPostObj = newPost.type === "Found" ? newPost : cand;

          const legacyMatch: AIMatch = {
            id: foundPostObj.id,
            item: foundPostObj.item,
            contact: foundPostObj.contact,
            score: potentialMatch.matchScore,
            reason: potentialMatch.reason
          };

          await updateLegacyMatchesForPost(lostPostObj.id, legacyMatch);
          
          const oppLegacyMatch: AIMatch = {
            id: lostPostObj.id,
            item: lostPostObj.item,
            contact: lostPostObj.contact,
            score: potentialMatch.matchScore,
            reason: potentialMatch.reason
          };
          await updateLegacyMatchesForPost(foundPostObj.id, oppLegacyMatch);
        }
      }
    }

  } catch (err) {
    console.error("[AI-MATCH-ENGINE] Error running smart match engine:", err);
  }
}

// Helper to append legacy matches
async function updateLegacyMatchesForPost(postId: string, newLegacyMatch: AIMatch) {
  try {
    if (useLocalFallback) {
      const local = readLocalDB();
      if (!local.matches) local.matches = {};
      const list = local.matches[postId] || [];
      if (!list.some((m: any) => m.id === newLegacyMatch.id)) {
        list.push(newLegacyMatch);
        local.matches[postId] = list;
        writeLocalDB(local);
      }
    } else {
      const docRef = db.collection("matches").doc(postId);
      const doc = await docRef.get();
      let list: AIMatch[] = [];
      if (doc.exists) {
        const data = doc.data();
        if (data && Array.isArray(data.list)) {
          list = data.list;
        }
      }
      if (!list.some(m => m.id === newLegacyMatch.id)) {
        list.push(newLegacyMatch);
        await docRef.set({ list });
      }
    }
  } catch (err) {
    console.error(`[AI-MATCH-ENGINE] Failed to update legacy matches for post ${postId}:`, err);
  }
}

// --- API ROUTES ---

// Proxy for MapmyIndia / Nominatim Autocomplete AutoSuggest
app.get("/api/maps/autosuggest", async (req, res) => {
  try {
    const query = req.query.query as string;
    if (!query || !query.trim()) {
      return res.json({ suggestedLocations: [] });
    }

    const apiKey = "gotklovuwdujpswuvxrfqwrecuoqfnycpqpy";
    let results: any[] = [];
    let mapplsSuccess = false;

    // 1. Try MapmyIndia first
    try {
      const mapplsUrl = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/autoSuggest?query=${encodeURIComponent(query)}`;
      const response = await fetch(mapplsUrl, {
        headers: {
          "Referer": "https://apis.mappls.com"
        }
      });
      if (response.ok) {
        const data: any = await response.json();
        if (data && data.suggestedLocations && data.suggestedLocations.length > 0) {
          results = data.suggestedLocations.map((item: any) => ({
            placeName: item.placeName || item.formatted_address || item.placeAddress || "Location",
            placeAddress: item.placeAddress || item.formatted_address || item.placeName || "",
            latitude: item.latitude !== undefined ? item.latitude : item.lat,
            longitude: item.longitude !== undefined ? item.longitude : item.lng,
            eLoc: item.eLoc || String(Math.random())
          }));
          mapplsSuccess = results.length > 0;
        }
      }
    } catch (err) {
      console.error("Server MapmyIndia AutoSuggest Proxy Error, falling back to Nominatim:", err);
    }

    // 2. Fall back to OpenStreetMap Nominatim if MapmyIndia failed or returned no results
    if (!mapplsSuccess) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=10`;
        const response = await fetch(nominatimUrl, {
          headers: {
            "User-Agent": "LincoAILostAndFound/1.0",
            "Accept-Language": "en-IN,en;q=0.9"
          }
        });
        if (response.ok) {
          const data: any = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            results = data.map((item: any) => {
              const parts = item.display_name.split(",");
              const name = parts[0]?.trim() || "Location";
              const address = parts.slice(1).join(",").trim() || item.display_name;
              return {
                placeName: name,
                placeAddress: address || item.display_name,
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                eLoc: item.place_id ? String(item.place_id) : String(Math.random())
              };
            });
          }
        }
      } catch (err) {
        console.error("Server Nominatim AutoSuggest Proxy Error:", err);
      }
    }

    res.json({ suggestedLocations: results });
  } catch (globalErr: any) {
    console.error("Global AutoSuggest Proxy Error:", globalErr);
    res.status(500).json({ error: globalErr.message || "Failed to search location" });
  }
});

// Proxy for MapmyIndia / Nominatim Reverse Geocoding
app.get("/api/maps/revgeocode", async (req, res) => {
  try {
    const lat = req.query.lat as string;
    const lng = req.query.lng as string;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat or lng" });
    }

    const apiKey = "gotklovuwdujpswuvxrfqwrecuoqfnycpqpy";
    let addressText = "";
    let mapplsSuccess = false;

    // 1. Try MapmyIndia first
    try {
      const mapplsUrl = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/rev_geocode?lat=${lat}&lng=${lng}`;
      const response = await fetch(mapplsUrl, {
        headers: {
          "Referer": "https://apis.mappls.com"
        }
      });
      if (response.ok) {
        const data: any = await response.json();
        if (data && data.results && data.results.length > 0) {
          const result = data.results[0];
          addressText = result.formatted_address || result.formattedAddress || [
            result.poi,
            result.street,
            result.subLocality,
            result.locality,
            result.district,
            result.state
          ].filter(Boolean).join(", ");
          if (addressText) mapplsSuccess = true;
        }
      }
    } catch (err) {
      console.error("Server MapmyIndia Reverse Geocoding Error, falling back to Nominatim:", err);
    }

    // 2. Fall back to OpenStreetMap Nominatim if MapmyIndia failed or returned no address
    if (!mapplsSuccess) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const response = await fetch(nominatimUrl, {
          headers: {
            "User-Agent": "LincoAILostAndFound/1.0",
            "Accept-Language": "en-IN,en;q=0.9"
          }
        });
        if (response.ok) {
          const data: any = await response.json();
          if (data && data.display_name) {
            addressText = data.display_name;
          }
        }
      } catch (err) {
        console.error("Server Nominatim Reverse Geocoding Error:", err);
      }
    }

    res.json({ results: [{ formatted_address: addressText || "Unknown Location" }] });
  } catch (globalErr: any) {
    console.error("Global Reverse Geocoding Proxy Error:", globalErr);
    res.status(500).json({ error: globalErr.message || "Failed to reverse geocode" });
  }
});

// --- INPUT VALIDATION SCHEMAS (ZOD) ---
const createPostSchema = z.object({
  item: z.string().min(1, "Item name is required").max(100),
  details: z.string().min(1, "Details/description is required").max(1000),
  type: z.enum(["Lost", "Found"]),
  address: z.string().min(1, "Location address is required").max(300),
  reward: z.string().optional().nullable(),
  contact: z.string().min(1, "Contact details are required"),
  category: z.string().min(1, "Category is required"),
  urgency: z.enum(["Normal", "Urgent", "Contains ID", "Medical"]).optional().nullable(),
  image: z.string().nullable().optional(),
  securityPin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits").optional(),
});

const actionPinSchema = z.object({
  securityPin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically with safe cache controls
app.use("/uploads", express.static(UPLOADS_DIR, {
  maxAge: "7d",
  etag: true
}));

// Helper to extract Cloudinary public ID from its URL
function getPublicIdFromUrl(url: string): string | null {
  if (!url || !url.includes("cloudinary.com")) return null;
  try {
    const parts = url.split("/image/upload/");
    if (parts.length < 2) return null;
    const afterUpload = parts[1]; // e.g. "v123456/folder/public_id.jpg"
    const remainingParts = afterUpload.split("/");
    if (remainingParts[0].startsWith("v") && /^\d+$/.test(remainingParts[0].substring(1))) {
      remainingParts.shift();
    }
    const publicIdWithExt = remainingParts.join("/");
    const dotIndex = publicIdWithExt.lastIndexOf(".");
    if (dotIndex !== -1) {
      return publicIdWithExt.substring(0, dotIndex);
    }
    return publicIdWithExt;
  } catch (error) {
    console.error("Error parsing Cloudinary URL:", error);
    return null;
  }
}

// Helper to delete a Cloudinary image by its URL
async function deleteCloudinaryImage(url: string | null | undefined) {
  if (!url) return;
  const publicId = getPublicIdFromUrl(url);
  if (publicId) {
    try {
      console.log(`Attempting to delete Cloudinary image with public ID: ${publicId}`);
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`Cloudinary deletion result for ${publicId}:`, result);
    } catch (err) {
      console.error(`Failed to delete Cloudinary image with URL ${url}:`, err);
    }
  }
}

// Base64 Image Upload & Storage Endpoint (Replaces heavy base64 storage in db)
app.post("/api/upload", async (req, res) => {
  try {
    const { image, thumbnail } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image base64 data required" });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ error: "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET." });
    }

    // Upload main image to Cloudinary
    console.log("Uploading main image to Cloudinary...");
    const mainUpload = await cloudinary.uploader.upload(image, {
      folder: "linco/posts",
    });
    
    let thumbnailUrl = mainUpload.secure_url;
    
    // Upload thumbnail to Cloudinary if provided
    if (thumbnail) {
      try {
        console.log("Uploading thumbnail to Cloudinary...");
        const thumbUpload = await cloudinary.uploader.upload(thumbnail, {
          folder: "linco/thumbnails",
        });
        thumbnailUrl = thumbUpload.secure_url;
      } catch (thumbErr) {
        console.error("Cloudinary thumbnail upload error:", thumbErr);
        // Fall back to main image URL if thumbnail upload fails
      }
    }

    console.log("Successfully uploaded to Cloudinary! URLs:", { url: mainUpload.secure_url, thumbnailUrl });

    res.json({
      url: mainUpload.secure_url,
      thumbnailUrl: thumbnailUrl
    });
  } catch (error: any) {
    console.error("Image upload processing error:", error);
    res.status(500).json({ error: error.message || "Failed to process image upload" });
  }
});

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    time: new Date().toISOString(),
    firestore: {
      initialized: !!db,
      lastError: lastFirestoreError,
      lastErrorDetails: lastFirestoreErrorDetails
    }
  });
});

// Load all posts & matches directly from Firestore
app.get("/api/posts", async (req, res) => {
  try {
    const dbData = await readDBAsync();
    res.json(dbData);
  } catch (err: any) {
    console.error("GET /api/posts failed:", err);
    res.status(500).json({ error: err.message || "Failed to load posts from Firestore" });
  }
});

// --- NEW SMART AI MATCH ENGINE ENDPOINTS ---

// Fetch potential matches list
app.get("/api/matches", async (req, res) => {
  try {
    let matchesList: any[] = [];
    if (useLocalFallback) {
      const local = readLocalDB();
      matchesList = local.potentialMatches || [];
    } else {
      console.log("[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'matches' for Potential Matches list");
      const snapshot = await db!.collection("matches").get();
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter out legacy list documents (they have Array 'list', whereas individual matches have 'lostPostId' and 'foundPostId')
        if (data && data.lostPostId) {
          matchesList.push(data);
        }
      });
    }
    res.json({ success: true, matches: matchesList });
  } catch (err: any) {
    console.error("GET /api/matches failed:", err);
    res.status(500).json({ error: err.message || "Failed to load matches" });
  }
});

// Review/Dismiss potential match
app.post("/api/matches/:matchId/review", async (req, res) => {
  const { matchId } = req.params;
  const { reviewed, status } = req.body;
  try {
    if (useLocalFallback) {
      const local = readLocalDB();
      const match = (local.potentialMatches || []).find((m: any) => m.matchId === matchId);
      if (match) {
        if (reviewed !== undefined) match.reviewed = reviewed;
        if (status !== undefined) match.status = status;
        match.lastUpdated = Date.now();
        writeLocalDB(local);
      }
    } else {
      const docRef = db!.collection("matches").doc(matchId);
      const doc = await docRef.get();
      if (doc.exists) {
        const updateData: any = { lastUpdated: Date.now() };
        if (reviewed !== undefined) updateData.reviewed = reviewed;
        if (status !== undefined) updateData.status = status;
        await docRef.update(updateData);
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("Review match failed:", err);
    res.status(500).json({ error: err.message || "Failed to update match" });
  }
});

// Fetch notifications
app.get("/api/notifications", async (req, res) => {
  try {
    let notificationsList: any[] = [];
    if (useLocalFallback) {
      const local = readLocalDB();
      notificationsList = local.notifications || [];
    } else {
      console.log("[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'notifications'");
      const snapshot = await db!.collection("notifications").get();
      snapshot.forEach(doc => {
        notificationsList.push(doc.data());
      });
    }
    // Sort descending by creation date
    notificationsList.sort((a, b) => b.createdAt - a.createdAt);
    res.json({ success: true, notifications: notificationsList });
  } catch (err: any) {
    console.error("GET /api/notifications failed:", err);
    res.status(500).json({ error: err.message || "Failed to load notifications" });
  }
});

// Mark notification as read
app.post("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  try {
    if (useLocalFallback) {
      const local = readLocalDB();
      const notif = (local.notifications || []).find((n: any) => n.id === id);
      if (notif) {
        notif.read = true;
        writeLocalDB(local);
      }
    } else {
      await db!.collection("notifications").doc(id).update({ read: true });
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("Mark notification as read failed:", err);
    res.status(500).json({ error: err.message || "Failed to mark notification as read" });
  }
});

// Get Configuration
app.get("/api/config", (req, res) => {
  res.json({ success: true, matchThreshold });
});

// Update Configuration
app.post("/api/config", (req, res) => {
  const { threshold } = req.body;
  if (typeof threshold === "number" && threshold >= 0 && threshold <= 100) {
    matchThreshold = threshold;
    res.json({ success: true, matchThreshold });
  } else {
    res.status(400).json({ error: "Invalid threshold value. Must be between 0 and 100." });
  }
});

// Submit a new post and save directly/exclusively to Firestore
app.post("/api/posts", async (req, res) => {
  console.log("[DIAGNOSTIC-POST] POST /api/posts endpoint called.");
  try {
    if (!useLocalFallback && !db) {
      throw new Error("Firestore database is not initialized");
    }

    // 1. Zod input validation
    console.log("[DIAGNOSTIC-POST] Validating request body against createPostSchema...");
    const parsedData = createPostSchema.parse(req.body);
    console.log("[DIAGNOSTIC-POST] Zod validation passed. Parsing body parameters...");

    const now = Date.now();

    // 2. Cryptographically hash the security PIN on the server
    console.log("[DIAGNOSTIC-POST] Hashing post security PIN...");
    const plainPin = parsedData.securityPin || "1234";
    const hashedPin = await bcrypt.hash(plainPin, 10);
    
    const newPost: Post = {
      id: now.toString(),
      item: parsedData.item,
      details: parsedData.details,
      type: parsedData.type,
      address: parsedData.address,
      reward: parsedData.reward || "",
      contact: parsedData.contact,
      securityPin: hashedPin, // Store secure hashed PIN
      category: parsedData.category,
      urgency: parsedData.urgency || "Normal",
      image: parsedData.image || null,
      status: "Active",
      views: 0,
      created: now,
      timestamp: new Date(now).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }),
    };

    console.log(`[DIAGNOSTIC-POST] Created new post object (ID: ${newPost.id}). Details:`, {
      item: newPost.item,
      type: newPost.type,
      category: newPost.category,
      urgency: newPost.urgency
    });

    if (useLocalFallback) {
      const local = readLocalDB();
      local.posts.push(newPost);
      writeLocalDB(local);
      console.log("[DIAGNOSTIC-POST] Post saved successfully in Local Fallback File.");
    } else {
      console.log("[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before saving new post");
      await db!.collection("posts").doc(newPost.id).set(newPost);
      console.log("[DIAGNOSTIC-POST] Post saved successfully in Firestore.");
    }

    // Return success to the client
    res.json({ success: true, post: newPost });

    // Trigger asynchronous AI Match in background
    console.log("[DIAGNOSTIC-POST] Triggering background runSmartMatchEngine matching algorithm...");
    (async () => {
      try {
        await runSmartMatchEngine(newPost);
        console.log(`[DIAGNOSTIC-POST-BG] Smart AI matching complete.`);
      } catch (bgErr) {
        console.error("[DIAGNOSTIC-POST-BG] Smart background matching failed:", bgErr);
      }
    })();

  } catch (err: any) {
    console.error("[DIAGNOSTIC-POST] Error during post creation handler execution:", err);
    if (err instanceof z.ZodError) {
      console.warn("[DIAGNOSTIC-POST] Validation failed:", JSON.stringify((err as any).errors));
      return res.status(400).json({ error: "Validation error", details: (err as any).errors });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Mark post as Resolved directly in Firestore
app.put("/api/posts/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    const { securityPin } = actionPinSchema.parse(req.body);

    let post: Post | null = null;
    let local = useLocalFallback ? readLocalDB() : null;

    if (useLocalFallback) {
      post = local.posts.find((p: Post) => p.id === id) || null;
    } else {
      if (!db) {
        throw new Error("Firestore database is not initialized");
      }
      console.log(`[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before resolving post ${id}`);
      const docRef = db.collection("posts").doc(id);
      const doc = await docRef.get();
      if (doc.exists) {
        post = doc.data() as Post;
      }
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const expectedPin = post.securityPin || "1234";
    
    // Backward compatibility check for plain vs bcrypt hash
    const isPinValid = expectedPin.startsWith("$2b$") || expectedPin.startsWith("$2a$")
      ? await bcrypt.compare(securityPin, expectedPin)
      : expectedPin === securityPin;

    if (!isPinValid) {
      return res.status(403).json({ error: "Wrong PIN!" });
    }

    post.status = "Resolved";

    if (useLocalFallback) {
      const idx = local.posts.findIndex((p: Post) => p.id === id);
      if (idx !== -1) {
        local.posts[idx] = post;
        writeLocalDB(local);
      }
    } else {
      console.log(`[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before saving resolved status for post ${id}`);
      await db!.collection("posts").doc(id).set(post); // Update ONLY Firestore, wait for it to succeed
    }

    res.json({ success: true, post });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: (err as any).errors });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Generic update endpoint (PUT /api/posts/:id) updating ONLY Firestore
app.put("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let post: Post | null = null;
    let local = useLocalFallback ? readLocalDB() : null;

    if (useLocalFallback) {
      post = local.posts.find((p: Post) => p.id === id) || null;
    } else {
      if (!db) {
        throw new Error("Firestore database is not initialized");
      }
      console.log(`[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before updating post ${id}`);
      const docRef = db.collection("posts").doc(id);
      const doc = await docRef.get();
      if (doc.exists) {
        post = doc.data() as Post;
      }
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const { securityPin, ...otherFields } = req.body;

    if (securityPin) {
      const expectedPin = post.securityPin || "1234";
      const isPinValid = expectedPin.startsWith("$2b$") || expectedPin.startsWith("$2a$")
        ? await bcrypt.compare(securityPin, expectedPin)
        : expectedPin === securityPin;

      if (!isPinValid) {
        return res.status(403).json({ error: "Wrong PIN!" });
      }
    }

    const updatedPost: Post = {
      ...post,
      ...otherFields,
      id, // protect document ID
    };

    if (useLocalFallback) {
      const idx = local.posts.findIndex((p: Post) => p.id === id);
      if (idx !== -1) {
        local.posts[idx] = updatedPost;
        writeLocalDB(local);
      }
    } else {
      console.log(`[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before saving updated details for post ${id}`);
      await db!.collection("posts").doc(id).set(updatedPost); // Save ONLY to Firestore, wait for success
    }

    res.json({ success: true, post: updatedPost });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Increment post view count directly in Firestore
app.post("/api/posts/:id/view", async (req, res) => {
  try {
    const { id } = req.params;
    let post: Post | null = null;
    let local = useLocalFallback ? readLocalDB() : null;

    if (useLocalFallback) {
      post = local.posts.find((p: Post) => p.id === id) || null;
    } else {
      if (!db) {
        throw new Error("Firestore database is not initialized");
      }
      console.log(`[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before incrementing views for post ${id}`);
      const docRef = db.collection("posts").doc(id);
      const doc = await docRef.get();
      if (doc.exists) {
        post = doc.data() as Post;
      }
    }

    if (post) {
      const newViews = (post.views || 0) + 1;
      post.views = newViews;

      if (useLocalFallback) {
        const idx = local.posts.findIndex((p: Post) => p.id === id);
        if (idx !== -1) {
          local.posts[idx] = post;
          writeLocalDB(local);
        }
      } else {
        await db!.collection("posts").doc(id).update({ views: newViews });
      }
      res.json({ success: true, views: newViews });
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Delete a post directly and exclusively from Firestore
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { securityPin } = actionPinSchema.parse(req.body);

    let post: Post | null = null;
    let local = useLocalFallback ? readLocalDB() : null;

    if (useLocalFallback) {
      post = local.posts.find((p: Post) => p.id === id) || null;
    } else {
      if (!db) {
        throw new Error("Firestore database is not initialized");
      }
      console.log(`[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before deleting post ${id}`);
      const docRef = db.collection("posts").doc(id);
      const doc = await docRef.get();
      if (doc.exists) {
        post = doc.data() as Post;
      }
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const expectedPin = post.securityPin || "1234";

    // Backward compatibility check for plain vs bcrypt hash
    const isPinValid = expectedPin.startsWith("$2b$") || expectedPin.startsWith("$2a$")
      ? await bcrypt.compare(securityPin, expectedPin)
      : expectedPin === securityPin;

    if (!isPinValid) {
      return res.status(403).json({ error: "Wrong PIN!" });
    }

    // Delete the image from Cloudinary if it exists
    if (post.image) {
      await deleteCloudinaryImage(post.image);
    }

    if (useLocalFallback) {
      local.posts = local.posts.filter((p: Post) => p.id !== id);
      if (local.matches) {
        delete local.matches[id];
      }
      writeLocalDB(local);
    } else {
      // Delete directly from Firestore, and delete matches as well
      console.log(`[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'posts' before deleting document ${id}`);
      await db!.collection("posts").doc(id).delete();
      console.log(`[DIAGNOSTIC-FIRESTORE-QUERY] Accessing collection: 'matches' before deleting matches for post ${id}`);
      await db!.collection("matches").doc(id).delete().catch(() => {}); // ignore match doc deletion error if it didn't exist
    }

    res.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: (err as any).errors });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// --- GEMINI PRODUCTION ROBUSTNESS HELPERS ---

// Global Cache for verification questions to avoid duplicate API calls and support reuse
const verificationQuestionsCache = new Map<string, string[]>();

function getCacheKey(item: string, description: string, postId?: string): string {
  if (postId) {
    return `post_${postId.trim().toLowerCase()}`;
  }
  const normItem = (item || "").trim().toLowerCase();
  const normDesc = (description || "").trim().toLowerCase();
  return `${normItem}||${normDesc}`;
}

// Professional human-friendly contextual fallbacks (no raw JSON/technical messages)
function getProfessionalFallbackMessage(context: string): string {
  switch (context) {
    case "photo-fill":
      return "The AI was temporarily unable to read the details of this image. Please double-check your connection or enter the details manually.";
    case "voice-fill":
      return "The AI was temporarily unable to process your voice transcript. Please try again or enter the details manually.";
    case "enhance-description":
      return "The description enhancement service is temporarily busy. Your original description has been saved and is ready.";
    case "reconstruct-timeline":
      return "The AI timeline assistant is temporarily unreachable. Please trace your steps manually to locate your item.";
    case "suggest-reward":
      return "AI reward recommendations are temporarily unavailable. We suggest using a community-recommended range of ₹500 - ₹2,000 based on standard item values.";
    case "generate-verification":
      return "AI question generation is temporarily offline. We have prepared two general verification questions for you to use.";
    case "verify-claim":
      return "AI automated claim verification is temporarily unavailable. Your claim answers have been securely saved, and the owner will review them manually.";
    case "linco-saathii":
      return "LincoSaathii is currently taking a short breather. Please try typing your message again, or use the manual forms to report your item.";
    default:
      return "We are experiencing a temporary high volume of requests. Please try again in a moment, or continue manually.";
  }
}

// Reusable call wrapper with graceful 429 exponential backoff handling (2s, 5s, 10s)
async function callGeminiWithRetry<T>(
  apiCall: () => Promise<T>,
  fallbackValue: T | (() => T),
  contextName: string
): Promise<T> {
  const delays = [2000, 5000, 10000];
  let lastError: any = null;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await apiCall();
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err.message || err);
      const isRateLimit = errMsg.includes("429") || 
                          errMsg.toUpperCase().includes("RESOURCE_EXHAUSTED") ||
                          err.status === 429 || 
                          err.statusCode === 429;
      
      if (isRateLimit && attempt < delays.length) {
        const delay = delays[attempt];
        console.warn(`[GEMINI-RETRY] Rate limit (429) hit in ${contextName}. Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break; // Non-429 or exhausted all retries
      }
    }
  }

  console.error(`[GEMINI-FAILURE] Permanent failure in ${contextName}:`, lastError);
  
  if (typeof fallbackValue === "function") {
    return (fallbackValue as Function)();
  }
  return fallbackValue;
}

// --- SECURE SYSTEM-MEDIATED CLAIM WORKFLOW ENDPOINTS ---

// Helper to generate a 6-digit tracking code
function generateTrackingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // readable chars (no ambiguous ones like I, O, 0, 1)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. Submit a Claim
app.post("/api/posts/:id/claims", requireGeminiApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { claimantName, claimantContact, questions, answers } = req.body;

    if (!claimantName || !claimantContact || !questions || !answers) {
      return res.status(400).json({ error: "Missing required claim fields" });
    }

    // Load parent post
    let post: Post | null = null;
    if (useLocalFallback) {
      const local = readLocalDB();
      post = local.posts.find((p: Post) => p.id === id) || null;
    } else {
      const doc = await db!.collection("posts").doc(id).get();
      if (doc.exists) {
        post = doc.data() as Post;
      }
    }

    if (!post) {
      return res.status(404).json({ error: "Associated post not found" });
    }

    if (post.status === "Resolved") {
      return res.status(400).json({ error: "This post has already been resolved and is closed to new claims." });
    }

    // Call Gemini API to verify ownership based on answers
    const prompt = `Verify if a claimant is the true owner of a lost/found item based on their answers to verification questions.
Item Name: "${post.item}"
Item Detailed Description: "${post.details}"

Questions Asked and Claimant's Answers:
${questions.map((q: string, i: number) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || "No answer"}`).join("\n\n")}

Task: Evaluate if the answers indicate genuine ownership. Match confidence should be:
- 85-100% if details are exact (colors, brands, precise contents, unique stickers or marks).
- 60-80% if answers are plausible but slightly vague.
- Below 60% if there are mismatches or extremely vague answers.

Return ONLY a valid JSON object (no markdown backticks, no \`\`\`json blocks):
{
  "verified": true or false,
  "confidence": number from 0 to 100,
  "message": "A concise 1-2 sentence explanation of your decision."
}`;

    const defaultFallback = JSON.stringify({
      verified: false,
      confidence: 50,
      message: "AI automated verification is temporarily offline. Your claim was successfully registered, and the item reporter will review your answers manually."
    });

    const text = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        return response.text || "{}";
      },
      defaultFallback,
      "claims-submission"
    );

    const cleanedText = text.replace(/```json|```/gi, "").trim();
    let parsedResult = { verified: false, confidence: 50, message: "AI verification is temporarily busy. The owner will review your answers manually." };
    try {
      parsedResult = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Failed to parse Gemini verification result:", cleanedText, parseErr);
    }

    const claimId = "claim_" + Date.now().toString();
    const trackingCode = generateTrackingCode();

    const newClaim: Claim = {
      id: claimId,
      postId: post.id,
      postTitle: post.item,
      postType: post.type,
      claimantName,
      claimantContact,
      questions,
      answers,
      aiScore: parsedResult.confidence,
      aiReason: parsedResult.message,
      status: "Pending",
      created: Date.now(),
      timestamp: new Date().toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }),
      trackingCode,
    };

    if (useLocalFallback) {
      const local = readLocalDB();
      if (!local.claims) local.claims = [];
      local.claims.push(newClaim);
      writeLocalDB(local);
    } else {
      await db!.collection("claims").doc(claimId).set(newClaim);
    }

    console.log(`[CLAIM-SUBMIT] Claim ${claimId} submitted successfully with trackingCode: ${trackingCode}`);
    res.json({ success: true, claim: newClaim });
  } catch (err: any) {
    console.error("Failed to submit claim:", err);
    res.status(500).json({ error: getProfessionalFallbackMessage("verify-claim") });
  }
});

// 2. Get claims for a post (Requires Owner PIN)
app.post("/api/posts/:id/claims/list", async (req, res) => {
  try {
    const { id } = req.params;
    const { securityPin } = req.body;

    if (!securityPin) {
      return res.status(400).json({ error: "Post Security PIN is required" });
    }

    // Load parent post
    let post: Post | null = null;
    if (useLocalFallback) {
      const local = readLocalDB();
      post = local.posts.find((p: Post) => p.id === id) || null;
    } else {
      const doc = await db!.collection("posts").doc(id).get();
      if (doc.exists) {
        post = doc.data() as Post;
      }
    }

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Verify PIN
    const expectedPin = post.securityPin || "1234";
    const isPinValid = expectedPin.startsWith("$2b$") || expectedPin.startsWith("$2a$")
      ? await bcrypt.compare(securityPin, expectedPin)
      : expectedPin === securityPin;

    if (!isPinValid) {
      return res.status(403).json({ error: "Incorrect Security PIN. Access denied." });
    }

    // Fetch claims for this post
    let allClaims: Claim[] = [];
    if (useLocalFallback) {
      const local = readLocalDB();
      allClaims = local.claims || [];
    } else {
      const claimsSnapshot = await db!.collection("claims").where("postId", "==", id).get();
      claimsSnapshot.forEach(doc => {
        allClaims.push(doc.data() as Claim);
      });
    }

    const postClaims = allClaims.filter(c => c.postId === id);
    res.json({ success: true, claims: postClaims });
  } catch (err: any) {
    console.error("Failed to list claims:", err);
    res.status(500).json({ error: err.message || "Failed to list claims" });
  }
});

// 3. Track a Claim (Supports multi-device via Claim ID + Tracking Code)
app.get("/api/claims/track", async (req, res) => {
  try {
    const claimId = req.query.claimId as string;
    const code = req.query.code as string;
    const postId = req.query.postId as string;

    if (!claimId || !code) {
      return res.status(400).json({ error: "Claim ID and Tracking Code are required" });
    }

    let claim: Claim | null = null;
    if (useLocalFallback) {
      const local = readLocalDB();
      claim = local.claims?.find((c: Claim) => {
        if (postId && c.postId !== postId) return false;
        return c.id === claimId;
      }) || null;
    } else {
      if (postId) {
        const claimsSnapshot = await db!.collection("claims").where("postId", "==", postId).get();
        claimsSnapshot.forEach(doc => {
          const c = doc.data() as Claim;
          if (c.id === claimId) {
            claim = c;
          }
        });
      } else {
        const doc = await db!.collection("claims").doc(claimId).get();
        if (doc.exists) {
          claim = doc.data() as Claim;
        }
      }
    }

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    if (postId && claim.postId !== postId) {
      console.error(`[CLAIM-MISMATCH] Track Claim requested postId ${postId} but claim has postId ${claim.postId}`);
      return res.status(403).json({ error: "Claim does not belong to the specified post" });
    }

    if (claim.trackingCode.toUpperCase() !== code.trim().toUpperCase()) {
      return res.status(403).json({ error: "Incorrect Claim Tracking Code. Access denied." });
    }

    res.json({ success: true, claim });
  } catch (err: any) {
    console.error("Failed to track claim:", err);
    res.status(500).json({ error: err.message || "Failed to track claim" });
  }
});

// 4. Approve a Claim (Requires Owner PIN & includes client-decrypted Owner Contact detail)
app.post("/api/claims/:claimId/approve", async (req, res) => {
  try {
    const { claimId } = req.params;
    const { securityPin, revealedOwnerContact, postId } = req.body;

    if (!securityPin || !revealedOwnerContact || !postId) {
      return res.status(400).json({ error: "Security PIN, Owner Contact, and Post ID are required" });
    }

    // Load Claim
    let claim: Claim | null = null;
    let local = useLocalFallback ? readLocalDB() : null;

    if (useLocalFallback) {
      claim = local.claims?.find((c: Claim) => c.id === claimId && c.postId === postId) || null;
    } else {
      const claimsSnapshot = await db!.collection("claims").where("postId", "==", postId).get();
      claimsSnapshot.forEach(doc => {
        const c = doc.data() as Claim;
        if (c.id === claimId) {
          claim = c;
        }
      });
    }

    if (!claim) {
      return res.status(404).json({ error: "Claim not found under the specified post" });
    }

    // Defensive validation
    if (claim.postId !== postId) {
      console.error(`[CLAIM-MISMATCH] Claim ${claimId} has mismatched postId ${claim.postId} compared to requested postId ${postId}`);
      return res.status(400).json({ error: "Claim post ID mismatch" });
    }

    // Load parent post
    let post: Post | null = null;
    if (useLocalFallback) {
      post = local.posts.find((p: Post) => p.id === claim!.postId) || null;
    } else {
      const doc = await db!.collection("posts").doc(claim.postId).get();
      if (doc.exists) {
        post = doc.data() as Post;
      }
    }

    if (!post) {
      return res.status(404).json({ error: "Associated post not found" });
    }

    // Verify Owner PIN
    const expectedPin = post.securityPin || "1234";
    const isPinValid = expectedPin.startsWith("$2b$") || expectedPin.startsWith("$2a$")
      ? await bcrypt.compare(securityPin, expectedPin)
      : expectedPin === securityPin;

    if (!isPinValid) {
      return res.status(403).json({ error: "Incorrect Security PIN. Access denied." });
    }

    // Update claim status & owner contact details
    claim.status = "Approved";
    claim.revealedOwnerContact = revealedOwnerContact;

    if (useLocalFallback) {
      // Find and update claim
      const claimIdx = local.claims.findIndex((c: Claim) => c.id === claimId);
      if (claimIdx !== -1) local.claims[claimIdx] = claim;
      
      // Find and update post
      const postIdx = local.posts.findIndex((p: Post) => p.id === post!.id);
      if (postIdx !== -1) local.posts[postIdx] = post;

      writeLocalDB(local);
    } else {
      await db!.collection("claims").doc(claimId).set(claim);
      await db!.collection("posts").doc(post.id).set(post);
    }

    res.json({ success: true, claim, post });
  } catch (err: any) {
    console.error("Failed to approve claim:", err);
    res.status(500).json({ error: err.message || "Failed to approve claim" });
  }
});

// 5. Reject a Claim (Requires Owner PIN)
app.post("/api/claims/:claimId/reject", async (req, res) => {
  try {
    const { claimId } = req.params;
    const { securityPin, postId } = req.body;

    if (!securityPin || !postId) {
      return res.status(400).json({ error: "Security PIN and Post ID are required" });
    }

    // Load Claim
    let claim: Claim | null = null;
    let local = useLocalFallback ? readLocalDB() : null;

    if (useLocalFallback) {
      claim = local.claims?.find((c: Claim) => c.id === claimId && c.postId === postId) || null;
    } else {
      const claimsSnapshot = await db!.collection("claims").where("postId", "==", postId).get();
      claimsSnapshot.forEach(doc => {
        const c = doc.data() as Claim;
        if (c.id === claimId) {
          claim = c;
        }
      });
    }

    if (!claim) {
      return res.status(404).json({ error: "Claim not found under the specified post" });
    }

    // Defensive validation
    if (claim.postId !== postId) {
      console.error(`[CLAIM-MISMATCH] Claim ${claimId} has mismatched postId ${claim.postId} compared to requested postId ${postId}`);
      return res.status(400).json({ error: "Claim post ID mismatch" });
    }

    // Load parent post
    let post: Post | null = null;
    if (useLocalFallback) {
      post = local.posts.find((p: Post) => p.id === claim!.postId) || null;
    } else {
      const doc = await db!.collection("posts").doc(claim.postId).get();
      if (doc.exists) {
        post = doc.data() as Post;
      }
    }

    if (!post) {
      return res.status(404).json({ error: "Associated post not found" });
    }

    // Verify PIN
    const expectedPin = post.securityPin || "1234";
    const isPinValid = expectedPin.startsWith("$2b$") || expectedPin.startsWith("$2a$")
      ? await bcrypt.compare(securityPin, expectedPin)
      : expectedPin === securityPin;

    if (!isPinValid) {
      return res.status(403).json({ error: "Incorrect Security PIN. Access denied." });
    }

    // Update claim status
    claim.status = "Rejected";

    if (useLocalFallback) {
      const claimIdx = local.claims.findIndex((c: Claim) => c.id === claimId);
      if (claimIdx !== -1) local.claims[claimIdx] = claim;
      writeLocalDB(local);
    } else {
      await db!.collection("claims").doc(claimId).set(claim);
    }

    res.json({ success: true, claim });
  } catch (err: any) {
    console.error("Failed to reject claim:", err);
    res.status(500).json({ error: err.message || "Failed to reject claim" });
  }
});

// --- AI ENDPOINTS (SECURE & SERVER-SIDE) ---

// Middleware to verify Gemini API Key exists
function requireGeminiApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(400).json({
      error: "GEMINI_API_KEY is not configured in your environment. Please open your Render Dashboard (render.com), go to your Web Service, click 'Environment', click 'Add Environment Variable', set Key as 'GEMINI_API_KEY' and Value as your Gemini API Key from Google AI Studio. Click save to redeploy and activate LINCO AI features!"
    });
  }
  next();
}

// 1. Photo Analyzer
app.post("/api/ai/quick-fill-photo", requireGeminiApiKey, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Image base64 data required" });

    // Separate mimeType and base64 parts
    const matches = image.match(/^data:(.*?);base64,(.*)$/);
    if (!matches) return res.status(400).json({ error: "Invalid base64 image string" });

    const mimeType = matches[1];
    const base64Data = matches[2];

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const prompt = `Analyze this lost/found item photo. Identify the core item and fill out the details.
Return ONLY a valid JSON object. Do not wrap in markdown \`\`\`json blocks.
The JSON object MUST have exactly these keys:
{
  "item": "2-4 word name of the item (e.g. Silver Casio Watch, Black Leather Wallet)",
  "category": "Choose exactly one from: Electronics, Documents, Wallet / Purse, Keys, Pet, Bag / Luggage, Jewelry, ID / Card, Vehicle, Clothing, Other",
  "description": "Specific visual description under 60 words focusing on colors, brand names, size, unique marks, textures, stickers, or scratches."
}`;

    const defaultFallback = JSON.stringify({
      item: "Lost/Found Item",
      category: "Other",
      description: "Photo analysis is temporarily busy. Please enter the details manually."
    });

    const text = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [imagePart, { text: prompt }],
        });
        return response.text || "{}";
      },
      defaultFallback,
      "photo-fill"
    );

    const cleanedText = text.replace(/```json|```/gi, "").trim();
    try {
      res.json(JSON.parse(cleanedText));
    } catch (err) {
      res.json(JSON.parse(defaultFallback));
    }
  } catch (err: any) {
    console.error("AI photo analyze error:", err);
    res.status(500).json({ error: getProfessionalFallbackMessage("photo-fill") });
  }
});

// 2. Voice Input Fill
app.post("/api/ai/quick-fill-voice", requireGeminiApiKey, async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: "Transcript is required" });

    const prompt = `Translate and structure this spoken description of a lost or found item. Extract the item name, categorize it, and clean up the description.
Spoken: "${transcript}"

Return ONLY a valid JSON object. Do not wrap in markdown \`\`\`json blocks.
The JSON object MUST have exactly these keys:
{
  "item": "2-4 word precise item name",
  "category": "Choose exactly one from: Electronics, Documents, Wallet / Purse, Keys, Pet, Bag / Luggage, Jewelry, ID / Card, Vehicle, Clothing, Other",
  "description": "Specific, grammatically polished description under 70 words focusing on colors, brands, unique markings mentioned."
}`;

    const defaultFallback = JSON.stringify({
      item: "Spoken Item",
      category: "Other",
      description: transcript
    });

    const text = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        return response.text || "{}";
      },
      defaultFallback,
      "voice-fill"
    );

    const cleanedText = text.replace(/```json|```/gi, "").trim();
    try {
      res.json(JSON.parse(cleanedText));
    } catch (err) {
      res.json(JSON.parse(defaultFallback));
    }
  } catch (err: any) {
    console.error("AI voice fill error:", err);
    res.status(500).json({ error: getProfessionalFallbackMessage("voice-fill") });
  }
});

// 3. Description Enhancer
app.post("/api/ai/enhance-description", requireGeminiApiKey, async (req, res) => {
  try {
    const { item, category, description } = req.body;
    if (!description) return res.status(400).json({ error: "Description is required" });

    const prompt = `Improve this lost or found item description to make it highly professional, specific, clear, and easily searchable on a community platform. Include bullet points if helpful, but keep it under 80 words total. Plain English only.
Item Name: "${item || "Unspecified item"}"
Category: "${category || "Other"}"
Original Raw Description: "${description}"

Return ONLY the final enhanced description. Do not include introductory text, headers, or markdown backticks.`;

    const enhancedText = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        return response.text?.trim() || description;
      },
      description,
      "enhance-description"
    );

    res.json({ description: enhancedText });
  } catch (err: any) {
    console.error("AI enhance error:", err);
    res.status(500).json({ error: getProfessionalFallbackMessage("enhance-description") });
  }
});

// 4. Timeline Reconstructor
app.post("/api/ai/reconstruct-timeline", requireGeminiApiKey, async (req, res) => {
  try {
    const { item, timeline } = req.body;
    if (!timeline) return res.status(400).json({ error: "Timeline text is required" });

    const prompt = `You are a meticulous detective assisting someone in locating a lost item.
Item: "${item || "Lost item"}"
Description of their day: "${timeline}"

Perform a step-by-step logical reconstruction of their day to identify:
1) The most likely precise spot or location where they lost the item.
2) The most likely time window of when the loss occurred.
3) Helpful logical reasoning that they can act on immediately.

Be positive, logical, and concise. Keep your answer under 4 sentences total. Return the answer as clean plain text.`;

    const analysisText = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        return response.text?.trim() || "";
      },
      "Timeline analysis is temporarily offline. Please trace your steps manually or try again in a bit.",
      "reconstruct-timeline"
    );

    res.json({ analysis: analysisText });
  } catch (err: any) {
    console.error("AI timeline error:", err);
    res.status(500).json({ error: getProfessionalFallbackMessage("reconstruct-timeline") });
  }
});

// 5. Suggest Reward
app.post("/api/ai/suggest-reward", requireGeminiApiKey, async (req, res) => {
  try {
    const { item, description } = req.body;
    if (!item) return res.status(400).json({ error: "Item name is required" });

    const prompt = `Suggest a fair, friendly reward amount in Indian Rupees (INR) for finding this lost item.
Item: "${item}"
Description: "${description || "No description provided."}"

Consider the average replacement value, emotional value, and finder motivation in India.
Return ONLY a valid JSON object (no markdown backticks):
{
  "min": 500,
  "max": 1500,
  "reason": "Brief, 1-sentence logical reason for this suggestion in Rupees (e.g., standard replacement is around ₹8,000, so a ₹1,000 finder reward is highly motivating)."
}`;

    const defaultFallback = JSON.stringify({
      min: 500,
      max: 1500,
      reason: "Reward suggest service is temporarily offline. We recommend ₹500 - ₹1,500 based on average lost item valuations."
    });

    const text = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        return response.text || "{}";
      },
      defaultFallback,
      "suggest-reward"
    );

    const cleanedText = text.replace(/```json|```/gi, "").trim();
    try {
      res.json(JSON.parse(cleanedText));
    } catch (err) {
      res.json(JSON.parse(defaultFallback));
    }
  } catch (err: any) {
    console.error("AI reward suggest error:", err);
    res.status(500).json({ error: getProfessionalFallbackMessage("suggest-reward") });
  }
});

// 6. Generate Verification Questions
app.post("/api/ai/generate-verification", requireGeminiApiKey, async (req, res) => {
  try {
    const { item, description, postId } = req.body;
    if (!item || !description) return res.status(400).json({ error: "Item and description required" });

    // Check Cache first to prevent duplicates and support reuse
    const cacheKey = getCacheKey(item, description, postId);
    if (verificationQuestionsCache.has(cacheKey)) {
      console.log(`[VERIFICATION-QUESTIONS-CACHE] Cache HIT for: "${item}" (postId: ${postId})`);
      return res.json(verificationQuestionsCache.get(cacheKey));
    }

    const prompt = `Generate exactly 2 or 3 short, highly clever and specific ownership verification questions for this item.
The questions MUST be directly based on the unique details mentioned in the item's description (for example, if the description mentions colors, brands, specific cards inside, scratch marks, stickers, patterns, or exact locations, generate questions testing the claimant on those specific physical details, like "What is the color of the wallet's interior?" or "Which specific identification card was present inside?").
Do NOT generate generic questions. Keep the questions direct and hard to guess for an outsider, but easy for the true owner.
Item Name: "${item}"
Item Description: "${description}"

Return ONLY a valid JSON array of 2 or 3 strings. Do not include markdown backticks or block wrappers.
Format:
[
  "Specific Question 1?",
  "Specific Question 2?"
]`;

    const defaultFallback = JSON.stringify([
      "Can you describe any unique scratches, contents, or branding?",
      "Where and around what time did you lose or find this item?"
    ]);

    const text = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        return response.text || "[]";
      },
      defaultFallback,
      "generate-verification"
    );

    const cleanedText = text.replace(/```json|```/gi, "").trim();
    let questions: string[];
    try {
      questions = JSON.parse(cleanedText);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid format");
      }
    } catch (err) {
      questions = JSON.parse(defaultFallback);
    }

    // Cache the result so each post generates them only once and they're reused for future claims
    verificationQuestionsCache.set(cacheKey, questions);
    res.json(questions);
  } catch (err: any) {
    console.error("AI generate verification error:", err);
    res.status(500).json({ error: getProfessionalFallbackMessage("generate-verification") });
  }
});

// 7. Verify Answers
app.post("/api/ai/verify-claim", requireGeminiApiKey, async (req, res) => {
  try {
    const { item, description, questions, answers } = req.body;
    if (!questions || !answers) {
      return res.status(400).json({ error: "Questions and answers are required" });
    }

    const prompt = `Verify if a claimant is the true owner of a found item based on their answers to verification questions.
Found Item: "${item || "Unspecified"}"
Found Item Full Details: "${description}"

Questions Asked and Claimant's Answers:
${questions.map((q: string, i: number) => `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i] || "No answer"}`).join("\n\n")}

Task: Evaluate if the answers indicate genuine ownership. True owner answers should match the visual details perfectly or show high specific familiarity with contents, labels, or characteristics.
Return ONLY a valid JSON object (no markdown backticks):
{
  "verified": true or false,
  "confidence": number from 0 to 100 representing your verification score,
  "message": "A concise 1-2 sentence explanation of your matching decision and whether their answers aligned with the item details."
}`;

    const defaultFallback = JSON.stringify({
      verified: false,
      confidence: 50,
      message: "AI automated claim verification is temporarily offline. Your claim answers have been securely saved, and the owner will review them manually."
    });

    const text = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });
        return response.text || "{}";
      },
      defaultFallback,
      "verify-claim"
    );

    const cleanedText = text.replace(/```json|```/gi, "").trim();
    try {
      res.json(JSON.parse(cleanedText));
    } catch (err) {
      res.json(JSON.parse(defaultFallback));
    }
  } catch (err: any) {
    console.error("AI claim verify error:", err);
    res.status(500).json({ error: getProfessionalFallbackMessage("verify-claim") });
  }
});

// 8. LincoSaathii Chatbot Endpoint
app.post("/api/ai/linco-saathii", requireGeminiApiKey, async (req, res) => {
  try {
    const { history, currentState, message } = req.body;

    const systemInstruction = `You are "LincoSaathii", an ultra-friendly, empathetic AI Lost & Found companion for the platform "LINCO AI".
Your tone is like a supportive, close Indian friend (using words like "bhai", "yaar", "pareshan mat ho", "dost", "tension mat le").
You understand and converse beautifully in any Indian language/dialect/mix (Hindi, Hinglish, Marathi, Gujarati, English, Bhojpuri, etc.) depending on what the user speaks.

Your goals:
1. Empathize deeply with the user if they lost something, or congratulate/thank them warmly if they found something.
2. Step-by-step, converse naturally to discover the following 7 item details:
   - type (Must be exactly "Lost" or "Found")
   - item (A concise 2-4 word name of the item, e.g. "Silver Casio Watch")
   - category (Must map to EXACTLY one of: "Electronics", "Documents", "Wallet / Purse", "Keys", "Pet", "Bag / Luggage", "Jewelry", "ID / Card", "Vehicle", "Clothing", "Other")
   - details (Detailed description - visual details, brand, scratch marks, unique markings)
   - urgency (Must map to EXACTLY one of: "Normal", "Contains ID", "Urgent", "Critical")
   - address (Approximate location where it was lost or found)
   - contact (A 10-digit WhatsApp mobile number)

IMPORTANT RULES:
- Translate/convert all extracted details into clean, readable, professional ENGLISH when populating the "extractedFields" JSON block.
- Do NOT ask for all fields at once! Ask for them naturally, 1 or 2 at a time.
- If a field is already provided in the "Current Form State", don't ask for it again unless you need to clarify or refine it. Keep validating and accumulating.
- If the user provides a partial/unstructured message, extract what you can, translate it to English, and merge it with the current form state.
- Once all 7 fields have been fully extracted and validated:
  a) Set isReadyToPublish to true.
  b) Summarize the final collected details in a friendly, supportive way in the "reply" field.
  c) Ask the user for final confirmation: "Sab sahi hai na bhai? Main post publish kar doon?".
- If the user says "yes" or "haan publish kar do" or similar confirmation to publish AFTER isReadyToPublish was already true (or you're asking), return "shouldAutoSubmit": true in your JSON response, so the page automatically triggers the submission.

CURRENT FORM STATE (accumulated English values):
${JSON.stringify(currentState, null, 2)}

CHAT HISTORY:
${history.map((h: any) => `${h.role === 'user' ? 'User' : 'LincoSaathii'}: ${h.content}`).join('\n')}
User: ${message}

Task: Output a single, strictly valid JSON response containing exactly these keys:
{
  "reply": "your friendly, conversational response in the user's language/dialect",
  "extractedFields": {
    "type": "Lost" | "Found" | null,
    "item": "Item name in English" | null,
    "category": "Category name" | null,
    "details": "Details in English" | null,
    "urgency": "Urgency name" | null,
    "address": "Address in English" | null,
    "contact": "10-digit contact number" | null
  },
  "isReadyToPublish": true | false,
  "shouldAutoSubmit": true | false
}`;

    const defaultFallback = JSON.stringify({
      reply: "Suno bhai, server thoda busy lag raha hai. Par tum chinta mat karo, tension mat lo dost! Hum yahi hain, tum apna form manually bhi fill kar sakte ho ya thodi der me mujhse baat kar sakte ho.",
      extractedFields: null,
      isReadyToPublish: false,
      shouldAutoSubmit: false
    });

    const text = await callGeminiWithRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: systemInstruction,
          config: {
            responseMimeType: "application/json"
          }
        });
        return response.text || "{}";
      },
      defaultFallback,
      "linco-saathii"
    );

    const cleanedText = text.replace(/```json|```/gi, "").trim();
    try {
      res.json(JSON.parse(cleanedText));
    } catch (err) {
      res.json(JSON.parse(defaultFallback));
    }
  } catch (err: any) {
    console.error("LincoSaathii Error:", err);
    res.status(500).json({ error: getProfessionalFallbackMessage("linco-saathii") });
  }
});


// --- VITE MIDDLEWARE AND STATIC SERVING ---

async function startServer() {
  // Vite dev server setup
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LINCO Backend Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
