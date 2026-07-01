/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { Post, AIMatch } from "./src/types.js";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

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

// Initialize Firestore
let db: Firestore;
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
  console.error("Failed to initialize Firebase Admin, falling back:", error);
  if (getApps().length === 0) {
    initializeApp();
  }
  db = getFirestore();
}

// Memory cache of DB data
let memoryCache: { posts: Post[]; matches: Record<string, AIMatch[]> } | null = null;

// Helper to seed initial posts if Firestore collection is empty
async function seedFirestoreIfNeeded() {
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
    return data;
  } catch (err) {
    console.error("Error reading from Firestore:", err);
    if (memoryCache) return memoryCache;
    return { posts: initialPosts, matches: {} };
  }
}

// Synchronous version for backwards compatibility where async is difficult
function readDB(): { posts: Post[]; matches: Record<string, AIMatch[]> } {
  if (memoryCache) return memoryCache;
  return { posts: initialPosts, matches: {} };
}

// Helper to save posts database to both cloud and local cache asynchronously
async function writeDBAsync(data: { posts: Post[]; matches: Record<string, AIMatch[]> }) {
  memoryCache = data;
  
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
  } catch (err) {
    console.error("Error syncing to Firestore:", err);
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
    const { item, details, type, address, reward, contact, category, urgency, image, securityPin } = req.body;
    
    if (!item || !details || !type || !address || !contact || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const dbData = await readDBAsync();
    const now = Date.now();
    
    const newPost: Post = {
      id: now.toString(),
      item,
      details,
      type,
      address,
      reward: reward || "",
      contact,
      securityPin: securityPin || "1234",
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
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Mark post as Resolved
app.put("/api/posts/:id/resolve", async (req, res) => {
  const { id } = req.params;
  const { securityPin } = req.body;
  const dbData = await readDBAsync();
  const post = dbData.posts.find((p) => p.id === id);
  if (post) {
    const expectedPin = post.securityPin || "1234";
    if (expectedPin !== securityPin) {
      return res.status(403).json({ error: "Wrong PIN!" });
    }
    post.status = "Resolved";
    writeDB(dbData);
    res.json({ success: true, post });
  } else {
    res.status(404).json({ error: "Post not found" });
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
  const { id } = req.params;
  const { securityPin } = req.body;
  const dbData = await readDBAsync();
  const post = dbData.posts.find((p) => p.id === id);
  if (post) {
    const expectedPin = post.securityPin || "1234";
    if (expectedPin !== securityPin) {
      return res.status(403).json({ error: "Wrong PIN!" });
    }
    dbData.posts = dbData.posts.filter((p) => p.id !== id);
    delete dbData.matches[id];
    writeDB(dbData);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Post not found" });
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
