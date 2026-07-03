/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { Post, AIMatch } from "./src/types.js";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcrypt";
import { z } from "zod";

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
          "https://*.googleapis.com"
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

// Initialize Firestore
let db: Firestore | null = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  let databaseId: string | undefined;
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    databaseId = config.firestoreDatabaseId;
  }
  
  if (getApps().length === 0) {
    initializeApp();
  }
  
  if (databaseId) {
    db = getFirestore(databaseId);
    console.log(`Initialized Firestore with databaseId: ${databaseId}`);
  } else {
    db = getFirestore();
    console.log("Initialized Firestore with default database");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin, running in hybrid mode:", error);
}

// Memory cache of DB data
let memoryCache: { posts: Post[]; matches: Record<string, AIMatch[]> } | null = null;

// Helper to save to local file cache
function saveLocalBackup(data: { posts: Post[]; matches: Record<string, AIMatch[]> }) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    console.log("Saved local backup to", DB_PATH);
  } catch (err) {
    console.error("Failed to write local backup:", err);
  }
}

// Helper to read from local file cache
function readLocalBackup(): { posts: Post[]; matches: Record<string, AIMatch[]> } | null {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.posts)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Failed to read local backup:", err);
  }
  return null;
}

// Helper to load from JSONBin
async function readFromJSONBin(): Promise<{ posts: Post[]; matches: Record<string, AIMatch[]> } | null> {
  try {
    console.log("Attempting to load data from JSONBin...");
    const res = await fetch(BIN_URL, {
      headers: {
        "X-Master-Key": BIN_KEY
      }
    });
    if (!res.ok) {
      console.error("JSONBin read failed with status:", res.status);
      return null;
    }
    const data: any = await res.json();
    if (data && data.record && Array.isArray(data.record.posts)) {
      console.log(`Successfully loaded ${data.record.posts.length} posts from JSONBin!`);
      return data.record;
    }
    return null;
  } catch (err) {
    console.error("Failed to read from JSONBin:", err);
    return null;
  }
}

// Helper to save to JSONBin
async function writeToJSONBin(data: { posts: Post[]; matches: Record<string, AIMatch[]> }): Promise<boolean> {
  try {
    console.log("Attempting to sync data to JSONBin...");
    const res = await fetch(BIN_URL, {
      method: "PUT",
      headers: {
        "X-Master-Key": BIN_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      console.log("Successfully synchronized data to JSONBin!");
      return true;
    }
    console.error("JSONBin write failed with status:", res.status);
    return false;
  } catch (err) {
    console.error("Failed to write to JSONBin:", err);
    return false;
  }
}

// Helper to seed initial posts if Firestore collection is empty
async function seedFirestoreIfNeeded() {
  if (!db) return;
  try {
    const postsSnapshot = await db.collection("posts").limit(1).get();
    if (postsSnapshot.empty) {
      console.log("Firestore 'posts' collection is empty. Seeding initial posts...");
      const batch = db.batch();
      for (const p of initialPosts) {
        const docRef = db.collection("posts").doc(p.id);
        batch.set(docRef, p);
      }
      await batch.commit();
      console.log("Successfully seeded initial posts in Firestore.");
    }
  } catch (err) {
    console.error("Failed to check or seed Firestore:", err);
  }
}

// Helper to load posts database
async function readDBAsync(): Promise<{ posts: Post[]; matches: Record<string, AIMatch[]> }> {
  // 1. Try Firestore if available
  if (db) {
    try {
      await seedFirestoreIfNeeded();

      // Fetch posts
      const postsSnapshot = await db.collection("posts").get();
      const posts: Post[] = [];
      postsSnapshot.forEach(doc => {
        posts.push(doc.data() as Post);
      });

      // Sort posts by created descending (newest first)
      posts.sort((a, b) => b.created - a.created);

      // Fetch matches
      const matchesSnapshot = await db.collection("matches").get();
      const matches: Record<string, AIMatch[]> = {};
      matchesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data && Array.isArray(data.list)) {
          matches[doc.id] = data.list;
        }
      });

      const data = { posts, matches };
      memoryCache = data;
      saveLocalBackup(data); // Sync local file backup
      return data;
    } catch (err) {
      console.error("Firestore read error, attempting cloud fallback (JSONBin):", err);
    }
  }

  // 2. Fall back to JSONBin
  const binData = await readFromJSONBin();
  if (binData) {
    memoryCache = binData;
    saveLocalBackup(binData); // Sync local file backup
    return binData;
  }

  // 3. Fall back to local backup file
  const localData = readLocalBackup();
  if (localData) {
    console.log("Using local database backup.");
    memoryCache = localData;
    return localData;
  }

  // 4. Default fallback to initial hardcoded seed posts
  console.log("No cloud or local database accessible. Falling back to memory cache / initial seed data.");
  if (memoryCache) return memoryCache;
  const fallbackData = { posts: initialPosts, matches: {} };
  memoryCache = fallbackData;
  return fallbackData;
}

// Synchronous version for backwards compatibility where async is difficult
function readDB(): { posts: Post[]; matches: Record<string, AIMatch[]> } {
  if (memoryCache) return memoryCache;
  return { posts: initialPosts, matches: {} };
}

// Helper to save posts database to both cloud and local cache asynchronously
async function writeDBAsync(data: { posts: Post[]; matches: Record<string, AIMatch[]> }) {
  memoryCache = data;
  
  // 1. Always save a local file backup
  saveLocalBackup(data);
  
  // 2. Attempt Firestore sync if db exists
  let firestoreSuccess = false;
  if (db) {
    try {
      const postsSnapshot = await db.collection("posts").get();
      const existingPostIds = postsSnapshot.docs.map(doc => doc.id);
      const currentPostIds = new Set(data.posts.map(p => p.id));
      
      const batch = db.batch();
      
      // Delete posts that are no longer present
      for (const id of existingPostIds) {
        if (!currentPostIds.has(id)) {
          batch.delete(db.collection("posts").doc(id));
          batch.delete(db.collection("matches").doc(id));
        }
      }
      
      // Write/update current posts
      for (const post of data.posts) {
        const docRef = db.collection("posts").doc(post.id);
        batch.set(docRef, post);
      }
      
      // Write/update matches
      for (const [postId, list] of Object.entries(data.matches)) {
        const docRef = db.collection("matches").doc(postId);
        batch.set(docRef, { list });
      }
      
      await batch.commit();
      console.log("Successfully synchronized data to Firestore!");
      firestoreSuccess = true;
    } catch (err) {
      console.error("Error syncing to Firestore:", err);
    }
  }

  // 3. Sync to JSONBin as a reliable cloud fallback
  await writeToJSONBin(data);
}

// Sync fallback wrapper
function writeDB(data: { posts: Post[]; matches: Record<string, AIMatch[]> }) {
  writeDBAsync(data).catch(err => console.error("Async write error:", err));
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

// Base64 Image Upload & Storage Endpoint (Replaces heavy base64 storage in db)
app.post("/api/upload", async (req, res) => {
  try {
    const { image, thumbnail } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image base64 data required" });
    }

    // Process main image
    const mainMatches = image.match(/^data:image\/(.*?);base64,(.*)$/);
    if (!mainMatches) {
      return res.status(400).json({ error: "Invalid main image base64 format" });
    }
    const mainExt = mainMatches[1];
    const mainBuffer = Buffer.from(mainMatches[2], "base64");
    
    // Validate file size (max 5MB after decoding)
    if (mainBuffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large. Max size is 5MB." });
    }

    const mainFilename = `img_${crypto.randomUUID()}.${mainExt === "jpeg" || mainExt === "jpg" ? "jpg" : "png"}`;
    const mainFilePath = path.join(UPLOADS_DIR, mainFilename);
    fs.writeFileSync(mainFilePath, mainBuffer);

    let thumbnailUrl = `/uploads/${mainFilename}`;

    // Process thumbnail if provided
    if (thumbnail) {
      const thumbMatches = thumbnail.match(/^data:image\/(.*?);base64,(.*)$/);
      if (thumbMatches) {
        const thumbExt = thumbMatches[1];
        const thumbBuffer = Buffer.from(thumbMatches[2], "base64");
        const thumbFilename = `thumb_${crypto.randomUUID()}.${thumbExt === "jpeg" || thumbExt === "jpg" ? "jpg" : "png"}`;
        const thumbFilePath = path.join(UPLOADS_DIR, thumbFilename);
        fs.writeFileSync(thumbFilePath, thumbBuffer);
        thumbnailUrl = `/uploads/${thumbFilename}`;
      }
    }

    res.json({
      url: `/uploads/${mainFilename}`,
      thumbnailUrl: thumbnailUrl
    });
  } catch (error: any) {
    console.error("Image upload processing error:", error);
    res.status(500).json({ error: error.message || "Failed to process image upload" });
  }
});

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Load all posts & matches
app.get("/api/posts", async (req, res) => {
  const dbData = await readDBAsync();
  res.json(dbData);
});

// Submit a new post
app.post("/api/posts", async (req, res) => {
  try {
    // 1. Zod input validation
    const parsedData = createPostSchema.parse(req.body);

    const dbData = await readDBAsync();
    const now = Date.now();

    // 2. Cryptographically hash the security PIN on the server
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
      timestamp: new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };

    // Add new post to the front of the list
    dbData.posts.unshift(newPost);
    writeDB(dbData);

    // Trigger asynchronous AI Match in background so the user gets instant form response
    res.json({ success: true, post: newPost });

    // Perform the matching
    runAIMatch(newPost, dbData.posts)
      .then(async (newMatches) => {
         if (newMatches.length > 0) {
           const freshDbData = await readDBAsync();
           freshDbData.matches[newPost.id] = newMatches;
           await writeDBAsync(freshDbData);
           console.log(`AI Matches found for post ${newPost.id}:`, newMatches);
         }
      })
      .catch((err) => console.error("Async matching fail:", err));

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: (err as any).errors });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Mark post as Resolved
app.put("/api/posts/:id/resolve", async (req, res) => {
  try {
    const { id } = req.params;
    const { securityPin } = actionPinSchema.parse(req.body);

    const dbData = await readDBAsync();
    const post = dbData.posts.find((p) => p.id === id);
    if (post) {
      const expectedPin = post.securityPin || "1234";
      
      // Backward compatibility check for plain vs bcrypt hash
      const isPinValid = expectedPin.startsWith("$2b$") || expectedPin.startsWith("$2a$")
        ? await bcrypt.compare(securityPin, expectedPin)
        : expectedPin === securityPin;

      if (!isPinValid) {
        return res.status(403).json({ error: "Wrong PIN!" });
      }
      post.status = "Resolved";
      writeDB(dbData);
      res.json({ success: true, post });
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: (err as any).errors });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Increment post view count
app.post("/api/posts/:id/view", async (req, res) => {
  const { id } = req.params;
  const dbData = await readDBAsync();
  const post = dbData.posts.find((p) => p.id === id);
  if (post) {
    post.views = (post.views || 0) + 1;
    writeDB(dbData);
    res.json({ success: true, views: post.views });
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// Delete a post
app.delete("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { securityPin } = actionPinSchema.parse(req.body);

    const dbData = await readDBAsync();
    const post = dbData.posts.find((p) => p.id === id);
    if (post) {
      const expectedPin = post.securityPin || "1234";

      // Backward compatibility check for plain vs bcrypt hash
      const isPinValid = expectedPin.startsWith("$2b$") || expectedPin.startsWith("$2a$")
        ? await bcrypt.compare(securityPin, expectedPin)
        : expectedPin === securityPin;

      if (!isPinValid) {
        return res.status(403).json({ error: "Wrong PIN!" });
      }
      dbData.posts = dbData.posts.filter((p) => p.id !== id);
      delete dbData.matches[id];
      writeDB(dbData);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: (err as any).errors });
    }
    res.status(500).json({ error: err.message || "Internal server error" });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, { text: prompt }],
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json|```/gi, "").trim();
    res.json(JSON.parse(cleanedText));
  } catch (err: any) {
    console.error("AI photo analyze error:", err);
    res.status(500).json({ error: err.message || "AI image reading failed" });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json|```/gi, "").trim();
    res.json(JSON.parse(cleanedText));
  } catch (err: any) {
    console.error("AI voice fill error:", err);
    res.status(500).json({ error: err.message || "AI voice decoding failed" });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ description: response.text?.trim() || description });
  } catch (err: any) {
    console.error("AI enhance error:", err);
    res.status(500).json({ error: err.message || "AI enhancement failed" });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text?.trim() || "" });
  } catch (err: any) {
    console.error("AI timeline error:", err);
    res.status(500).json({ error: err.message || "AI timeline analysis failed" });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json|```/gi, "").trim();
    res.json(JSON.parse(cleanedText));
  } catch (err: any) {
    console.error("AI reward suggest error:", err);
    res.status(500).json({ error: err.message || "AI reward suggestion failed" });
  }
});

// 6. Generate Verification Questions
app.post("/api/ai/generate-verification", requireGeminiApiKey, async (req, res) => {
  try {
    const { item, description } = req.body;
    if (!item || !description) return res.status(400).json({ error: "Item and description required" });

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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "[]";
    const cleanedText = text.replace(/```json|```/gi, "").trim();
    res.json(JSON.parse(cleanedText));
  } catch (err: any) {
    console.error("AI generate verification error:", err);
    res.status(500).json({ error: err.message || "AI verification generator failed" });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json|```/gi, "").trim();
    res.json(JSON.parse(cleanedText));
  } catch (err: any) {
    console.error("AI claim verify error:", err);
    res.status(500).json({ error: err.message || "AI claim verification failed" });
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: systemInstruction,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json|```/gi, "").trim();
    res.json(JSON.parse(cleanedText));
  } catch (err: any) {
    console.error("LincoSaathii Error:", err);
    res.status(500).json({ error: err.message || "LincoSaathii had an issue." });
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
