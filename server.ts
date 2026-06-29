/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { Post, AIMatch } from "./src/types.js";

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

// Memory cache of DB data
let memoryCache: { posts: Post[]; matches: Record<string, AIMatch[]> } | null = null;

// Helper to load posts database (with cloud JSONBin backup + local file sync)
async function readDBAsync(): Promise<{ posts: Post[]; matches: Record<string, AIMatch[]> }> {
  if (memoryCache) {
    return memoryCache;
  }

  // 1. Try JSONBin (Cloud Storage)
  try {
    const response = await fetch(`${BIN_URL}/latest`, {
      headers: {
        "X-Master-Key": BIN_KEY,
        "X-Bin-Meta": "false"
      }
    });
    if (response.ok) {
      const cloudData = await response.json() as any;
      if (cloudData && Array.isArray(cloudData.posts)) {
        console.log("Successfully loaded data from cloud JSONBin!");
        memoryCache = {
          posts: cloudData.posts,
          matches: cloudData.matches || {}
        };
        // Update local file for redundancy
        fs.writeFileSync(DB_PATH, JSON.stringify(memoryCache, null, 2), "utf-8");
        return memoryCache;
      }
    }
  } catch (err) {
    console.warn("Could not reach JSONBin cloud database, falling back to local storage:", err);
  }

  // 2. Fallback to Local posts_db.json
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      memoryCache = JSON.parse(data);
      return memoryCache!;
    }
  } catch (err) {
    console.error("Error reading local posts_db.json:", err);
  }

  // 3. Fallback to Seed Initial Data
  const dbData = { posts: initialPosts, matches: {} };
  memoryCache = dbData;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), "utf-8");
  } catch (err) {
    console.error("Error creating initial posts_db.json:", err);
  }
  return dbData;
}

// Synchronous version for backwards compatibility where async is difficult, but we prefer async
function readDB(): { posts: Post[]; matches: Record<string, AIMatch[]> } {
  if (memoryCache) return memoryCache;
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      memoryCache = JSON.parse(data);
      return memoryCache!;
    }
  } catch (err) {
    console.error("Sync read fallback error:", err);
  }
  return { posts: initialPosts, matches: {} };
}

// Helper to save posts database to both cloud and local cache asynchronously
async function writeDBAsync(data: { posts: Post[]; matches: Record<string, AIMatch[]> }) {
  memoryCache = data;
  
  // 1. Save Locally
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local posts_db.json:", err);
  }

  // 2. Save to JSONBin Cloud
  try {
    const response = await fetch(BIN_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": BIN_KEY
      },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      console.log("Successfully saved and synced data to cloud JSONBin!");
    } else {
      console.warn("Failed to sync data to JSONBin cloud:", response.statusText);
    }
  } catch (err) {
    console.error("Error syncing to JSONBin cloud database:", err);
  }
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
    const { item, details, type, address, reward, contact, category, urgency, image } = req.body;
    
    if (!item || !details || !type || !address || !contact || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const dbData = readDB();
    const now = Date.now();
    
    const newPost: Post = {
      id: now.toString(),
      item,
      details,
      type,
      address,
      reward: reward || "",
      contact,
      category,
      urgency: urgency || "Normal",
      image: image || null,
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
      .then((newMatches) => {
        if (newMatches.length > 0) {
          const freshDbData = readDB();
          freshDbData.matches[newPost.id] = newMatches;
          writeDB(freshDbData);
          console.log(`AI Matches found for post ${newPost.id}:`, newMatches);
        }
      })
      .catch((err) => console.error("Async matching fail:", err));

  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Mark post as Resolved
app.put("/api/posts/:id/resolve", (req, res) => {
  const { id } = req.params;
  const dbData = readDB();
  const post = dbData.posts.find((p) => p.id === id);
  if (post) {
    post.status = "Resolved";
    writeDB(dbData);
    res.json({ success: true, post });
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// Increment post view count
app.post("/api/posts/:id/view", (req, res) => {
  const { id } = req.params;
  const dbData = readDB();
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
app.delete("/api/posts/:id", (req, res) => {
  const { id } = req.params;
  const dbData = readDB();
  dbData.posts = dbData.posts.filter((p) => p.id !== id);
  delete dbData.matches[id];
  writeDB(dbData);
  res.json({ success: true });
});

// --- AI ENDPOINTS (SECURE & SERVER-SIDE) ---

// 1. Photo Analyzer
app.post("/api/ai/quick-fill-photo", async (req, res) => {
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
app.post("/api/ai/quick-fill-voice", async (req, res) => {
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
app.post("/api/ai/enhance-description", async (req, res) => {
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
app.post("/api/ai/reconstruct-timeline", async (req, res) => {
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
app.post("/api/ai/suggest-reward", async (req, res) => {
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
app.post("/api/ai/generate-verification", async (req, res) => {
  try {
    const { item, description } = req.body;
    if (!item || !description) return res.status(400).json({ error: "Item and description required" });

    const prompt = `Generate exactly 2 short, clever ownership verification questions for a found item.
The questions must be answerable ONLY by the genuine owner who had it daily.
Ask about unique, secret features NOT obvious from a distance, such as a specific sticker, scratch location, lock-screen wallpaper, specific app layout, contents of a pocket, or internal brand labels.
Item: "${item}"
Found Description: "${description}"

Return ONLY a valid JSON array of exactly 2 strings. Do not include markdown backticks.
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
app.post("/api/ai/verify-claim", async (req, res) => {
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
