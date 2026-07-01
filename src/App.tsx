/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Sparkles,
  Mic,
  MicOff,
  Camera,
  Calendar,
  MapPin,
  User,
  CheckCircle2,
  Trash2,
  Share2,
  HelpCircle,
  Send,
  RefreshCw,
  AlertTriangle,
  X,
  Lock,
  ShieldCheck,
  Award,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Post, AIMatch, UrgencyType, Category, UrgencyInfo } from "./types";
import { InteractiveMap, MiniMap } from "./components/LeafletMap";

// --- END-TO-END CRYPTO ENGINES (WEB CRYPTO API) ---
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 50000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptContact(contact: string, pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(contact)
  );
  // Combine salt, iv, and ciphertext into hex representations
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const ciphertextHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `ENC:${saltHex}:${ivHex}:${ciphertextHex}`;
}

async function decryptContact(encryptedStr: string, pin: string): Promise<string> {
  if (!encryptedStr || !encryptedStr.startsWith("ENC:")) {
    // Return raw if it's a legacy unencrypted post
    return encryptedStr;
  }
  const parts = encryptedStr.split(":");
  if (parts.length !== 4) throw new Error("Invalid encrypted format");
  
  const salt = new Uint8Array(parts[1].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const iv = new Uint8Array(parts[2].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const ciphertext = new Uint8Array(parts[3].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  
  const key = await deriveKey(pin, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

const CATEGORIES: Category[] = [
  { id: "Electronics", emoji: "📱" },
  { id: "Documents", emoji: "📄" },
  { id: "Wallet / Purse", emoji: "👛" },
  { id: "Keys", emoji: "🔑" },
  { id: "Pet", emoji: "🐶" },
  { id: "Bag / Luggage", emoji: "💼" },
  { id: "Jewelry", emoji: "💍" },
  { id: "ID / Card", emoji: "🆔" },
  { id: "Vehicle", emoji: "🚗" },
  { id: "Clothing", emoji: "👕" },
  { id: "Other", emoji: "📦" },
];

const URGENCY_LEVELS: UrgencyInfo[] = [
  { id: "Normal", cls: "text-cyan-400 border-cyan-500/20 bg-cyan-950/20", color: "#22d3ee", bgColor: "rgba(6, 182, 212, 0.1)" },
  { id: "Urgent", cls: "text-amber-400 border-amber-500/20 bg-amber-950/20", color: "#fbbf24", bgColor: "rgba(245, 158, 11, 0.1)" },
  { id: "Contains ID", cls: "text-pink-400 border-pink-500/20 bg-pink-950/20", color: "#f472b6", bgColor: "rgba(236, 72, 153, 0.1)" },
  { id: "Medical", cls: "text-red-400 border-red-500/20 bg-red-950/20", color: "#f87171", bgColor: "rgba(239, 68, 68, 0.1)" },
];

const CITIES = ["Pune", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Noida", "Gurgaon"];

// Canvas Component for starry drifting particles
const CanvasParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    interface Particle {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    const count = 50;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    let animationId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${p.opacity})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-60" />;
};

// Custom Toasts Implementation
interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warn" | "error";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "feed" | "about">("home");
  const [posts, setPosts] = useState<Post[]>([]);
  const [matches, setMatches] = useState<Record<string, AIMatch[]>>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [backendStatus, setBackendStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Stats Counters
  const [stats, setStats] = useState({ total: 0, lost: 0, found: 0, resolved: 0 });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [feedTypeFilter, setFeedTypeFilter] = useState<"All" | "Lost" | "Found">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"new" | "old" | "views">("new");

  // Form States
  const [fItem, setFItem] = useState("");
  const [fDetails, setFDetails] = useState("");
  const [fType, setFType] = useState<"Lost" | "Found" | "">("");
  const [fAddress, setFAddress] = useState("");
  const [fReward, setFReward] = useState("");
  const [fContact, setFContact] = useState("");
  const [fSecurityPin, setFSecurityPin] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fUrgency, setFUrgency] = useState<UrgencyType>("Normal");
  const [fImage, setFImage] = useState<string | null>(null);
  const [fTimeline, setFTimeline] = useState("");
  const [fLat, setFLat] = useState<number | undefined>(undefined);
  const [fLng, setFLng] = useState<number | undefined>(undefined);

  // Safety & Unlocked features
  const [unlockedPosts, setUnlockedPosts] = useState<string[]>([]);
  const [pinModal, setPinModal] = useState<{ isOpen: boolean; postId: string; actionType: "delete" | "resolve"; actualPin: string; } | null>(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [decryptedContacts, setDecryptedContacts] = useState<Record<string, string>>({});
  const [decryptPinEntered, setDecryptPinEntered] = useState("");
  const [isPinVerifiedSuccessfully, setIsPinVerifiedSuccessfully] = useState(false);

  // AI Feature Loading Indicator States
  const [photoLoading, setPhotoLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Suggested values / detector states
  const [rewardReason, setRewardReason] = useState("");
  const [timelineResult, setTimelineResult] = useState("");

  // Claim Modal States
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimingPost, setClaimingPost] = useState<Post | null>(null);
  const [claimQuestions, setClaimQuestions] = useState<string[]>([]);
  const [claimAnswers, setClaimAnswers] = useState<string[]>(["", ""]);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimResult, setClaimResult] = useState<{
    verified: boolean;
    confidence: number;
    message: string;
  } | null>(null);

  // Success Banner State
  const [banner, setBanner] = useState<{ show: boolean; title: string; subtitle: string; icon: string } | null>(null);

  // Typewriter Hero Animation Hook
  const [typewriterText, setTypewriterText] = useState("");
  useEffect(() => {
    const messages = [
      "Lost something? We'll match it. 🔍",
      "Found something? Return it instantly. 🤝",
      "Powered by Gemini AI. Driven by Community. ✨",
      "Your missing item is closer than you think.",
    ];
    let msgIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingTimer: NodeJS.Timeout;

    const tick = () => {
      const currentMessage = messages[msgIndex];
      if (!isDeleting) {
        setTypewriterText(currentMessage.slice(0, charIndex + 1));
        charIndex++;
        if (charIndex >= currentMessage.length) {
          isDeleting = true;
          typingTimer = setTimeout(tick, 2500); // pause at full word
          return;
        }
      } else {
        setTypewriterText(currentMessage.slice(0, charIndex - 1));
        charIndex--;
        if (charIndex <= 0) {
          isDeleting = false;
          msgIndex = (msgIndex + 1) % messages.length;
          typingTimer = setTimeout(tick, 500); // pause before typing next
          return;
        }
      }
      typingTimer = setTimeout(tick, isDeleting ? 30 : 60);
    };

    typingTimer = setTimeout(tick, 1000);
    return () => clearTimeout(typingTimer);
  }, []);

  // Show Toast Toast Notification helper
  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Load posts database from Express Backend
  const loadPosts = async () => {
    setBackendStatus("connecting");
    try {
      const response = await fetch("/api/posts");
      if (!response.ok) throw new Error("Could not reach backend");
      const data = await response.json();
      setPosts(data.posts || []);
      setMatches(data.matches || {});
      setBackendStatus("live");
    } catch (err) {
      console.error(err);
      setBackendStatus("offline");
      addToast("Backend offline. Retrying connection...", "warn");
    } finally {
      setLoadingPosts(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadPosts();
    // Poll the feed every 30 seconds to catch matches/updates
    const interval = setInterval(() => {
      loadPosts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update Stats Counters when posts change
  useEffect(() => {
    setStats({
      total: posts.length,
      lost: posts.filter((p) => p.type === "Lost").length,
      found: posts.filter((p) => p.type === "Found").length,
      resolved: posts.filter((p) => p.status === "Resolved").length,
    });
  }, [posts]);

  // Dynamic SEO, Meta tags & Schema.org JSON-LD Structured Data
  useEffect(() => {
    let title = "LINCO AI | Smart AI Lost & Found Portal";
    let desc = "LINCO AI is a community-driven Lost & Found portal powered by Google Gemini. Report lost keys, wallets, phones and get verified matches instantly.";
    let ldJson: any = null;

    if (claimingPost) {
      const typeStr = claimingPost.type === "Lost" ? "Lost" : "Found";
      title = `${typeStr}: ${claimingPost.item} in ${claimingPost.address} | LINCO AI`;
      desc = `Verify/Claim ${claimingPost.type.toLowerCase()} ${claimingPost.item} in ${claimingPost.address}. Details: ${claimingPost.details.slice(0, 150)}`;
      ldJson = {
        "@context": "https://schema.org",
        "@type": "Thing",
        "name": claimingPost.item,
        "description": claimingPost.details,
        "location": {
          "@type": "Place",
          "name": claimingPost.address,
          "address": claimingPost.address
        },
        "identifier": claimingPost.id,
        "url": window.location.href
      };
    } else if (cityFilter && cityFilter !== "All") {
      title = `Lost & Found Items in ${cityFilter} | LINCO AI`;
      desc = `Browse recently lost and found items in ${cityFilter} area. Register your missing keys, bags, wallets, phones, or electronics to initiate Gemini matching.`;
      
      const cityPosts = posts.filter(p => p.address.toLowerCase().includes(cityFilter.toLowerCase()));
      ldJson = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": `Lost and Found Items in ${cityFilter}`,
        "description": desc,
        "numberOfItems": cityPosts.length,
        "itemListElement": cityPosts.slice(0, 10).map((p, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": p.item,
          "description": p.details,
          "url": `${window.location.href}?id=${p.id}`
        }))
      };
    } else if (categoryFilter && categoryFilter !== "All") {
      title = `Lost & Found ${categoryFilter} | LINCO AI`;
      desc = `View recently lost and found ${categoryFilter} listings on LINCO AI. Fast AI-assisted claims and verification.`;
    } else if (searchQuery.trim()) {
      title = `Search: "${searchQuery}" | LINCO AI`;
      desc = `Search results for "${searchQuery}" on LINCO AI lost & found directory.`;
    } else {
      // General landing page schema
      ldJson = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "LINCO AI",
        "url": window.location.origin,
        "description": desc,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${window.location.origin}/?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      };
    }

    // Apply Page Title
    document.title = title;
    
    // Apply Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    // Inject JSON-LD Schema.org script block
    let scriptTag = document.getElementById("linco-jsonld-schema") as HTMLScriptElement;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = "linco-jsonld-schema";
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    
    if (ldJson) {
      scriptTag.text = JSON.stringify(ldJson, null, 2);
    } else {
      scriptTag.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "LINCO AI",
        "url": window.location.origin,
        "logo": `${window.location.origin}/logo.png`,
        "description": "AI-powered Local Community Lost & Found Directory"
      }, null, 2);
    }
  }, [claimingPost, cityFilter, categoryFilter, searchQuery, posts]);

  // Form Field Validation Check
  const validateForm = (): boolean => {
    if (!fItem.trim()) {
      addToast("Item name is required", "warn");
      return false;
    }
    if (!fCategory) {
      addToast("Please select an item category", "warn");
      return false;
    }
    if (!fDetails.trim()) {
      addToast("Please provide details/description", "warn");
      return false;
    }
    if (!fType) {
      addToast("Specify if you Lost or Found this item", "warn");
      return false;
    }
    if (!fAddress.trim()) {
      addToast("Location is required", "warn");
      return false;
    }
    if (!fContact.trim() || !/^\d{10}$/.test(fContact.replace(/\D/g, ""))) {
      addToast("Enter a valid 10-digit mobile number for WhatsApp contact", "warn");
      return false;
    }
    if (!fSecurityPin.trim() || !/^\d{4}$/.test(fSecurityPin.trim())) {
      addToast("Please set a 4-digit Security PIN for your safety", "warn");
      return false;
    }
    return true;
  };

  // Post Submission
  const handleSubmitPost = async () => {
    if (!validateForm()) return;

    const plainContact = fContact.trim().replace(/\D/g, "");
    const pin = fSecurityPin.trim();

    addToast("Encrypting your contact details locally using AES-GCM...", "info");

    let encryptedContact = plainContact;
    try {
      encryptedContact = await encryptContact(plainContact, pin);
    } catch (err) {
      console.error("Local client-side encryption failed:", err);
      addToast("Encryption warning: falling back to standard storage", "warn");
    }

    const payload = {
      item: fItem.trim(),
      details: fDetails.trim(),
      type: fType,
      address: fAddress.trim(),
      reward: fType === "Lost" ? fReward.trim() : "",
      contact: encryptedContact,
      maskedContact: "+91 ******" + plainContact.slice(-2),
      securityPin: pin,
      category: fCategory,
      urgency: fUrgency,
      image: fImage,
      latitude: fLat,
      longitude: fLng,
    };

    addToast("Publishing post & launching Gemini AI matcher...", "info");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Publishing failed");
      const res = await response.json();

      if (res.success) {
        // Trigger Success banner temporarily
        setBanner({
          show: true,
          title: "Post Published Successfully!",
          subtitle: payload.type === "Lost" 
            ? "Your item is now indexed. Gemini is currently scanning all found items for matches..." 
            : "Thank you for being a good citizen! Gemini is scanning lost posts to contact the owner...",
          icon: payload.type === "Lost" ? "🔍" : "🤝",
        });

        // Clear Form fields
        setFItem("");
        setFDetails("");
        setFType("");
        setFAddress("");
        setFReward("");
        setFContact("");
        setFSecurityPin("");
        setFCategory("");
        setFUrgency("Normal");
        setFImage(null);
        setFTimeline("");
        setFLat(undefined);
        setFLng(undefined);
        setRewardReason("");
        setTimelineResult("");

        // Refresh feed & redirect to Feed page after delay
        setTimeout(() => {
          setBanner(null);
          loadPosts();
          setActiveTab("feed");
        }, 3200);
      }
    } catch (err: any) {
      addToast("Error publishing post: " + (err.message || err), "error");
    }
  };

  // Image base64 loading
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast("Images must be under 5 MB to keep uploads snappy", "warn");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // AI Quick Fill via Image Analysis
  const handlePhotoAIAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast("Image size exceeds 5MB limit", "warn");
      return;
    }

    setPhotoLoading(true);
    addToast("Uploading photo & running Gemini Vision scanner...", "info");

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setFImage(base64); // display in form

      try {
        const response = await fetch("/api/ai/quick-fill-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Gemini Image Reader failed");

        if (data.item) setFItem(data.item);
        if (data.description) setFDetails(data.description);
        if (data.category) {
          const matchedCat = CATEGORIES.find((c) => c.id.toLowerCase() === data.category.toLowerCase());
          if (matchedCat) setFCategory(matchedCat.id);
        }
        addToast("Gemini auto-filled item description and category from your photo!", "success");
      } catch (err: any) {
        addToast("Photo AI Reading failed: " + err.message, "error");
        console.error(err);
      } finally {
        setPhotoLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Web Speech API Voice Listening Integration
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addToast("Voice Speech Input is only fully supported on Google Chrome mobile/desktop", "warn");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.continuous = false;
    rec.interimResults = false;

    setVoiceActive(true);
    addToast("Microphone active. Describe your item naturally (color, brand, where lost)...", "info");

    rec.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceActive(false);
      setVoiceLoading(true);
      addToast("Gemini is dissecting speech details...", "info");

      try {
        const response = await fetch("/api/ai/quick-fill-voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Gemini voice parsing failed");

        if (data.item) setFItem(data.item);
        if (data.description) setFDetails(data.description);
        if (data.category) {
          const matchedCat = CATEGORIES.find((c) => c.id.toLowerCase() === data.category.toLowerCase());
          if (matchedCat) setFCategory(matchedCat.id);
        }
        addToast("Gemini populated the form from your voice input!", "success");
      } catch (err: any) {
        setFDetails(transcript);
        addToast("Voice processed as raw: " + err.message, "info");
      } finally {
        setVoiceLoading(false);
      }
    };

    rec.onerror = (e: any) => {
      setVoiceActive(false);
      addToast("Speech recognition stopped or denied: " + e.error, "warn");
    };

    rec.onend = () => {
      setVoiceActive(false);
    };

    rec.start();
  };

  // AI Description Enhancer
  const handleEnhanceDescription = async () => {
    if (!fDetails.trim()) {
      addToast("Write some raw details first to let Gemini enhance them!", "warn");
      return;
    }

    setEnhanceLoading(true);
    addToast("Enhancing details with professional attributes...", "info");

    try {
      const response = await fetch("/api/ai/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: fItem, category: fCategory, description: fDetails }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Enhancement failed");

      if (data.description) {
        setFDetails(data.description);
        addToast("Gemini polished your description!", "success");
      }
    } catch (err: any) {
      addToast("Polishing details failed: " + err.message, "error");
    } finally {
      setEnhanceLoading(false);
    }
  };

  // AI Reward Estimator Suggestion
  const handleSuggestReward = async () => {
    if (!fItem.trim()) {
      addToast("Enter an item name first to estimate its reward!", "warn");
      return;
    }

    setRewardLoading(true);
    addToast("Calculating safe finder reward metrics...", "info");

    try {
      const response = await fetch("/api/ai/suggest-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: fItem, description: fDetails }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Estimation failed");

      if (data.min !== undefined) {
        setFReward(String(data.min));
        setRewardReason(data.reason);
        addToast("Finder reward proposal generated!", "success");
      }
    } catch (err: any) {
      addToast("Estimating reward failed: " + err.message, "error");
    } finally {
      setRewardLoading(false);
    }
  };

  // AI Timeline Reconstructor
  const handleAnalyzeTimeline = async () => {
    if (!fTimeline.trim()) {
      addToast("Describe your day's journey to trace the loss timeline", "warn");
      return;
    }

    setTimelineLoading(true);
    addToast("Deducing probable drop spots using spatial reasoning...", "info");

    try {
      const response = await fetch("/api/ai/reconstruct-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: fItem, timeline: fTimeline }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Trace failed");

      if (data.analysis) {
        setTimelineResult(data.analysis);
        addToast("Trace analysis completed!", "success");
      }
    } catch (err: any) {
      addToast("Tracer failed: " + err.message, "error");
    } finally {
      setTimelineLoading(false);
    }
  };

  // View Increment
  const handleIncrementViews = async (id: string) => {
    try {
      await fetch(`/api/posts/${id}/view`, { method: "POST" });
      // Local state increment to prevent laggy rendering
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, views: (p.views || 0) + 1 } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Mark Resolved
  const handleMarkResolved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    setPinModal({
      isOpen: true,
      postId: id,
      actionType: "resolve",
      actualPin: post.securityPin || "1234",
    });
    setEnteredPin("");
  };

  // Delete Post
  const handleDeletePost = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const post = posts.find((p) => p.id === id);
    if (!post) return;
    setPinModal({
      isOpen: true,
      postId: id,
      actionType: "delete",
      actualPin: post.securityPin || "1234",
    });
    setEnteredPin("");
  };

  // PIN Verification and execution of Safe Actions
  const handleVerifyPinAndExecute = async () => {
    if (!pinModal) return;
    const { postId, actionType, actualPin } = pinModal;
    const expectedPin = actualPin || "1234";

    if (enteredPin !== expectedPin) {
      addToast("Wrong PIN!", "error");
      window.alert("Wrong PIN!");
      return;
    }

    if (actionType === "delete") {
      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ securityPin: enteredPin }),
        });
        if (!response.ok) throw new Error("Delete failed");
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        addToast("Post deleted successfully", "info");
      } catch (err) {
        addToast("Error deleting post", "error");
      }
    } else if (actionType === "resolve") {
      try {
        const response = await fetch(`/api/posts/${postId}/resolve`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ securityPin: enteredPin }),
        });
        if (!response.ok) throw new Error("Failed to resolve");
        const data = await response.json();
        if (data.success) {
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, status: "Resolved" } : p))
          );
          addToast("Congratulations on recovering this item!", "success");
        }
      } catch (err) {
        addToast("Error marking post resolved", "error");
      }
    }
    setPinModal(null);
  };

  // Share/Copy Post
  const handleSharePost = (p: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    const isUnlocked = unlockedPosts.includes(p.id);
    const displayContact = isUnlocked 
      ? (decryptedContacts[p.id] || p.contact) 
      : (p.maskedContact || "+91 ******" + (p.contact.startsWith("ENC:") ? "XX" : p.contact.slice(-2)));

    const shareText = `🔍 LINCO Lost & Found 🔍\n\n📢 Status: ${p.type === "Lost" ? "🚨 LOST" : "✅ FOUND"}\n📦 Item: ${p.item}\n📍 Location: ${p.address}\n📝 Description: ${p.details}${p.reward ? `\n💰 Reward Offered: ₹${p.reward}` : ""}\n\n📱 Contact via WhatsApp at: wa.me/91${displayContact}\n\n— Tracked on LINCO AI`;
    
    navigator.clipboard.writeText(shareText)
      .then(() => {
        addToast("Post template copied! Paste on WhatsApp groups.", "success");
      })
      .catch(() => addToast("Copy failed, please retry", "error"));
  };

  // Launch AI Verification Flow
  const handleStartClaim = async (p: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setClaimingPost(p);
    setClaimAnswers(["", ""]);
    setClaimResult(null);
    setShowClaimModal(true);
    setClaimLoading(true);
    setDecryptPinEntered("");
    setIsPinVerifiedSuccessfully(false);

    try {
      const response = await fetch("/api/ai/generate-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: p.item, description: p.details }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not formulate questions");

      if (Array.isArray(data) && data.length > 0) {
        setClaimQuestions(data);
      } else {
        throw new Error("No questions returned");
      }
    } catch (err: any) {
      addToast(`Questions Bypassed: ${err.message}`, "warn");
      setClaimQuestions(["Can you describe any unique scratches, contents, or branding?", "Where and around what time did you lose this item?"]);
    } finally {
      setClaimLoading(false);
    }
  };

  // Submit Verification Claims
  const handleSubmitClaimAnswers = async () => {
    if (!claimingPost) return;
    if (claimAnswers.some((a) => !a.trim())) {
      addToast("Please answer both questions to verify your claim", "warn");
      return;
    }

    setClaimLoading(true);

    try {
      const response = await fetch("/api/ai/verify-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: claimingPost.item,
          description: claimingPost.details,
          questions: claimQuestions,
          answers: claimAnswers,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verification processing failed");

      setClaimResult({
        verified: data.verified,
        confidence: data.confidence || 0,
        message: data.message,
      });

      if (data.verified) {
        addToast("AI Quiz Passed! Please enter the Security PIN to decrypt contact details.", "success");
      } else {
        addToast("Verification failed. Please review answers.", "error");
      }
    } catch (err: any) {
      addToast("Error validating claim: " + err.message, "error");
    } finally {
      setClaimLoading(false);
    }
  };

  // Decrypt contact locally using Web Crypto API
  const handleDecryptContact = async () => {
    if (!claimingPost) return;
    if (!decryptPinEntered.trim() || !/^\d{4}$/.test(decryptPinEntered.trim())) {
      addToast("Please enter a valid 4-digit Security PIN", "warn");
      return;
    }

    setClaimLoading(true);
    try {
      const isLegacy = !claimingPost.contact.startsWith("ENC:");
      let decrypted = "";
      if (isLegacy) {
        if (decryptPinEntered !== (claimingPost.securityPin || "1234")) {
          throw new Error("Incorrect Security PIN");
        }
        decrypted = claimingPost.contact;
      } else {
        decrypted = await decryptContact(claimingPost.contact, decryptPinEntered);
      }

      // Success!
      setDecryptedContacts((prev) => ({ ...prev, [claimingPost.id]: decrypted }));
      setUnlockedPosts((prev) => [...prev, claimingPost.id]);
      setIsPinVerifiedSuccessfully(true);
      addToast("Contact details decrypted successfully! Connection unlocked.", "success");
    } catch (err) {
      console.error(err);
      addToast("Incorrect Security PIN! Decryption failed.", "error");
    } finally {
      setClaimLoading(false);
    }
  };

  // Filters logic
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
    <div className="relative min-h-screen text-slate-100 font-sans pb-16 bg-grid-pattern">
      {/* Background stars, gradient mesh & rotating blurs */}
      <CanvasParticles />
      <div className="fixed -top-[20%] -left-[20%] w-[60vw] h-[60vw] bg-radial from-cyan-500/10 via-transparent to-transparent blur-[120px] pointer-events-none z-0 animate-orb-slow-1" />
      <div className="fixed -bottom-[20%] -right-[20%] w-[50vw] h-[50vw] bg-radial from-violet-600/10 via-transparent to-transparent blur-[120px] pointer-events-none z-0 animate-orb-slow-2" />
      <div className="fixed top-[40%] left-[35%] w-[35vw] h-[35vw] bg-radial from-pink-500/5 via-transparent to-transparent blur-[100px] pointer-events-none z-0 animate-orb-slow-3" />

      {/* Premium Desktop Side Glow Spots */}
      <div className="hidden xl:block fixed top-1/4 -left-[10vw] w-[35vw] h-[35vw] bg-radial from-cyan-500/15 to-transparent blur-[140px] pointer-events-none z-0" />
      <div className="hidden xl:block fixed top-1/3 -right-[10vw] w-[35vw] h-[35vw] bg-radial from-violet-600/15 to-transparent blur-[140px] pointer-events-none z-0" />

      {/* FLOATING SYNC CONNECTION BAR */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#020817]/85 border border-slate-800 backdrop-blur-xl text-xs shadow-2xl transition-all">
        <span className={`w-2 h-2 rounded-full ${
          backendStatus === "live" ? "bg-emerald-400 animate-pulse" : 
          backendStatus === "connecting" ? "bg-amber-400 animate-pulse" : "bg-red-400"
        }`} />
        <span className="text-slate-400 font-medium tracking-wide">
          {backendStatus === "live" ? "Gemini Synced" : 
           backendStatus === "connecting" ? "Linking Cloud..." : "Connection Lost"}
        </span>
      </div>

      {/* TOAST SYSTEM CONTAINER */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-3.5 rounded-xl border backdrop-blur-lg flex justify-between items-start gap-2 shadow-2xl pointer-events-auto ${
                t.type === "success" ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-300" :
                t.type === "warn" ? "bg-amber-950/40 border-amber-500/20 text-amber-300" :
                t.type === "error" ? "bg-red-950/40 border-red-500/20 text-red-300" :
                "bg-cyan-950/40 border-cyan-500/20 text-cyan-300"
              }`}
            >
              <div className="flex gap-2">
                <span className="text-sm mt-0.5">
                  {t.type === "success" ? "✅" : t.type === "warn" ? "⚠️" : t.type === "error" ? "❌" : "ℹ️"}
                </span>
                <span className="text-xs font-medium leading-relaxed">{t.message}</span>
              </div>
              <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="text-slate-400 hover:text-slate-200 transition">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HERO HERO CONTAINER */}
      <header className="relative z-10 max-w-5xl lg:max-w-6xl mx-auto px-4 pt-10 text-center select-none">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/5 border border-cyan-500/20 text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Realtime Lost & Found Directory
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-6xl md:text-7xl font-display font-extrabold tracking-tighter leading-none bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-500 bg-[size:200%] animate-shimmer text-transparent bg-clip-text"
        >
          LINCO
        </motion.h1>

        <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-500/50 uppercase mt-1 mb-3">
          Locate · Identify · Notify · Connect · Owner
        </p>

        {/* Typewriter message */}
        <div className="h-6 flex justify-center items-center">
          <p className="text-xs text-slate-400 font-medium">
            {typewriterText}
            <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-pulse" />
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 justify-center my-4 opacity-85">
          {["🧠 Gemini Match", "🎙️ Voice Input", "📸 Photo Analyzer", "🗺️ Timeline Detective", "🔐 Verification Proofs"].map((badge, idx) => (
            <span key={idx} className="text-[9px] font-medium px-2 py-1 bg-slate-900/50 border border-slate-800 rounded-full text-slate-400">
              {badge}
            </span>
          ))}
        </div>

        {/* Grid Statistics Counters */}
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto mt-6">
          {[
            { label: "Total", value: stats.total, color: "text-slate-100" },
            { label: "Lost", value: stats.lost, color: "text-rose-400" },
            { label: "Found", value: stats.found, color: "text-emerald-400" },
            { label: "Resolved", value: stats.resolved, color: "text-violet-400" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-900 rounded-xl p-2.5 text-center transition hover:border-slate-800/80">
              <span className={`text-xl font-extrabold block ${stat.color}`}>{stat.value}</span>
              <span className="text-[8px] tracking-wider text-slate-500 uppercase block font-semibold mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Sticky Tab Navigation Section */}
      <nav className="sticky top-0 z-30 max-w-2xl mx-auto px-4 py-4 mt-6">
        <div className="flex gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-900 backdrop-blur-xl shadow-xl">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "home" ? "bg-slate-900 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Plus size={14} /> Post Item
          </button>
          <button
            onClick={() => {
              setActiveTab("feed");
              loadPosts();
            }}
            className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "feed" ? "bg-slate-900 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Search size={14} /> Feed ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "about" ? "bg-slate-900 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Info size={14} /> About LINCO
          </button>
        </div>
      </nav>

      {/* Main Container wrap */}
      <main className="relative z-10 max-w-5xl lg:max-w-6xl mx-auto px-4 pb-12">
        {/* SUCCESS BANNER OVERLAY */}
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-gradient-to-br from-cyan-950/40 via-slate-950/60 to-violet-950/40 border border-cyan-500/30 p-5 rounded-2xl text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 to-violet-500" />
            <div className="text-4xl mb-2 animate-bounce">{banner.icon}</div>
            <h3 className="text-base font-bold font-display text-cyan-300">{banner.title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{banner.subtitle}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* 1. CREATE POST TAB */}
          {activeTab === "home" && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-xl relative"
            >
              <div className="absolute top-0 right-10 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full" />
              <h2 className="text-2xl md:text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-6 pb-2 border-b border-slate-900">
                Publish a New Item Post
              </h2>

              {/* AI QUICK FILL ACTIONS CONTAINER */}
              <div className="mb-8 p-5 md:p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/10 via-slate-950/40 to-cyan-950/10 relative overflow-hidden">
                <span className="absolute top-0 right-0 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/20 border-b border-l border-violet-500/10 text-violet-300 rounded-bl-xl">
                  ⚡ Smart Assist
                </span>
                <div className="flex items-center gap-1.5 text-sm md:text-base font-extrabold text-violet-400 uppercase tracking-wider mb-1">
                  <Sparkles size={16} /> Gemini AI Quick Fill
                </div>
                <p className="text-xs md:text-sm text-slate-400 mb-4 font-medium">
                  Upload a photo or speak naturally — Gemini will instantly auto-fill the entire form.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-xs md:text-sm font-extrabold text-violet-300 hover:text-violet-100 transition duration-200 cursor-pointer text-center">
                    <Camera size={16} className={photoLoading ? "animate-spin" : ""} />
                    {photoLoading ? "Reading photo..." : "Analyze Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoAIAnalysis}
                      className="hidden"
                      disabled={photoLoading}
                    />
                  </label>

                  <button
                    onClick={handleVoiceInput}
                    disabled={voiceLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs md:text-sm font-extrabold transition duration-200 text-center ${
                      voiceActive
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse-ring"
                        : "bg-rose-600/10 hover:bg-rose-600/20 border-rose-500/20 text-rose-300 hover:text-rose-100"
                    }`}
                  >
                    {voiceActive ? <MicOff size={16} /> : <Mic size={16} className={voiceLoading ? "animate-spin" : ""} />}
                    {voiceLoading ? "Deducing..." : voiceActive ? "Stop Speaking" : "Speak Voice"}
                  </button>
                </div>
              </div>

              {/* Responsive 2-Column Grid on Desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
                
                {/* COLUMN 1: Item Details */}
                <div className="space-y-5">
                  {/* Form Category selection */}
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFCategory(cat.id)}
                          className={`text-xs md:text-sm px-3 py-2 rounded-xl border transition duration-150 font-bold ${
                            fCategory === cat.id
                              ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow"
                              : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800"
                          }`}
                        >
                          {cat.emoji} {cat.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Item Title Input */}
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Item Name / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Silver Casio G-Shock G-5600"
                      value={fItem}
                      onChange={(e) => setFItem(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-sm md:text-base text-slate-200 transition duration-150 font-medium placeholder:text-slate-600"
                    />
                  </div>

                  {/* Description Details Input with Gemini Enhance */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider">
                        Detailed Description
                      </label>
                      <button
                        type="button"
                        onClick={handleEnhanceDescription}
                        disabled={enhanceLoading}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase transition duration-150 disabled:opacity-50"
                      >
                        <Sparkles size={13} className={enhanceLoading ? "animate-spin" : ""} />
                        Polished with AI
                      </button>
                    </div>
                    <textarea
                      placeholder="Describe color, model numbers, unique scratches, contents inside, lock-screen layout..."
                      rows={4}
                      value={fDetails}
                      onChange={(e) => setFDetails(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-sm md:text-base text-slate-200 transition duration-150 resize-y leading-relaxed font-medium placeholder:text-slate-600"
                    />
                  </div>

                  {/* Urgency selection */}
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                      Urgency Level
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {URGENCY_LEVELS.map((urg) => (
                        <button
                          key={urg.id}
                          type="button"
                          onClick={() => setFUrgency(urg.id)}
                          className={`text-[10px] md:text-xs font-bold py-2.5 rounded-xl border text-center transition duration-150 uppercase tracking-wider ${
                            fUrgency === urg.id
                              ? `${urg.cls} border-opacity-100 scale-[1.02]`
                              : "bg-slate-950/40 border-slate-900 text-slate-500 hover:border-slate-800"
                          }`}
                        >
                          {urg.id}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lost or Found State Toggle */}
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                      What happened?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFType("Lost")}
                        className={`py-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition duration-200 ${
                          fType === "Lost"
                            ? "bg-rose-950/20 border-rose-500/40 text-rose-300"
                            : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800"
                        }`}
                      >
                        <span className="text-2xl">🚨</span>
                        <span className="text-sm font-extrabold font-display">I Lost Something</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFType("Found")}
                        className={`py-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition duration-200 ${
                          fType === "Found"
                            ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                            : "bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800"
                        }`}
                      >
                        <span className="text-2xl">🤝</span>
                        <span className="text-sm font-extrabold font-display">I Found Something</span>
                      </button>
                    </div>
                  </div>

                  {/* Photo Attachment upload */}
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                      Image Attachment (Optional)
                    </label>
                    {fImage ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-h-52 group">
                        <img src={fImage} alt="Attachment Preview" className="w-full h-52 object-cover" />
                        <button
                          type="button"
                          onClick={() => setFImage(null)}
                          className="absolute top-3 right-3 p-2 rounded-xl bg-[#020817]/85 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-800 hover:border-cyan-500/30 rounded-2xl cursor-pointer bg-slate-950/20 hover:bg-slate-950/40 transition duration-150 text-center">
                        <span className="text-3xl mb-1.5">🖼️</span>
                        <span className="text-xs md:text-sm text-slate-300 font-bold">Upload Photo Attachment</span>
                        <span className="text-xs text-slate-500 mt-1 font-medium">Max file size: 5 MB</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* COLUMN 2: Location and Security details */}
                <div className="space-y-5">
                  {/* Location Input */}
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
                      {fType === "Lost" ? "Where did you lose it?" : fType === "Found" ? "Where did you find it?" : "Approximate Location"}
                    </label>
                    <input
                      type="text"
                      placeholder="Area, landmark, building, city (e.g. FC Road near Starbucks, Pune)"
                      value={fAddress}
                      onChange={(e) => setFAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-sm md:text-base text-slate-200 transition duration-150 font-medium placeholder:text-slate-600"
                    />
                  </div>

                  {/* Interactive Location Map (Leaflet.js OpenStreetMap) */}
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                      📍 Pin Exact Location on Map
                    </label>
                    <InteractiveMap lat={fLat} lng={fLng} onChange={(lat, lng) => {
                      setFLat(lat);
                      setFLng(lng);
                    }} />
                  </div>

                  {/* WhatsApp Mobile Number Input */}
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
                      WhatsApp Contact Mobile Number (10 digits)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-slate-500 text-sm md:text-base font-bold">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={fContact}
                        onChange={(e) => setFContact(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-sm md:text-base text-slate-200 transition duration-150 font-mono tracking-wider"
                      />
                    </div>
                  </div>

                  {/* Security PIN Field */}
                  <div>
                    <label className="block text-xs md:text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Security PIN (4-digit numeric)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="e.g. 1234"
                      value={fSecurityPin}
                      onChange={(e) => setFSecurityPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-cyan-500/40 outline-none text-sm md:text-base text-slate-200 transition duration-150 font-mono tracking-widest"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                      Required to delete or mark this post as resolved later.
                    </p>
                  </div>

                  {/* Reward estimation Box (Only for Lost) */}
                  {fType === "Lost" && (
                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs md:text-sm font-bold text-amber-300 uppercase tracking-wider">
                          Reward (optional INR Amount)
                        </label>
                        <button
                          type="button"
                          onClick={handleSuggestReward}
                          disabled={rewardLoading}
                          className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-amber-400 hover:text-amber-300 uppercase transition"
                        >
                          <Award size={13} className={rewardLoading ? "animate-spin" : ""} />
                          {rewardLoading ? "Calculating..." : "AI Reward Assist"}
                        </button>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-4 text-amber-500 text-sm md:text-base font-bold">₹</span>
                        <input
                          type="text"
                          placeholder="e.g. 500"
                          value={fReward}
                          onChange={(e) => setFReward(e.target.value.replace(/\D/g, ""))}
                          className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-900 focus:border-amber-500/40 outline-none text-sm md:text-base text-amber-200 font-mono transition duration-150"
                        />
                      </div>
                      {rewardReason && (
                        <p className="text-xs text-amber-300/80 leading-relaxed mt-2.5 italic font-medium">
                          💡 Suggestion: {rewardReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* TIMELINE RECONSTRUCTOR DETECTIVE BLOCK (Only for Lost) */}
                  {fType === "Lost" && (
                    <div className="p-4 rounded-2xl border border-amber-500/10 bg-amber-950/5">
                      <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold text-amber-400 uppercase tracking-wider mb-1">
                        <Clock size={15} /> Timeline Reconstructor
                      </div>
                      <p className="text-xs text-slate-400 mb-3 font-medium">
                        Describe your daily route to let Gemini trace the most probable coordinates where you dropped your item.
                      </p>
                      <textarea
                        placeholder="e.g. Left home at 9:00 AM, caught public bus #104, reached campus canteen around 12:30 PM..."
                        rows={2}
                        value={fTimeline}
                        onChange={(e) => setFTimeline(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-xl bg-slate-950/80 border border-slate-900 focus:border-amber-500/30 outline-none resize-none leading-relaxed text-slate-300 font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleAnalyzeTimeline}
                        disabled={timelineLoading}
                        className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-xs md:text-sm font-extrabold text-slate-950 hover:text-black shadow transition duration-150 flex items-center justify-center gap-1.5"
                      >
                        {timelineLoading ? <RefreshCw size={14} className="animate-spin" /> : "🔍 Trace Timeline coordinates"}
                      </button>

                      {timelineResult && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-3.5 p-3.5 bg-[#020817]/80 rounded-xl border border-amber-500/20"
                        >
                          <div className="text-[10px] md:text-xs font-bold text-amber-400 flex items-center gap-1 mb-1.5 uppercase tracking-wider">
                            🕵️ Detective Deduces
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed italic font-medium">
                            "{timelineResult}"
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitPost}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-extrabold hover:text-black font-display text-base md:text-lg tracking-wide shadow-lg hover:shadow-cyan-500/15 transform hover:-translate-y-0.5 transition duration-150 cursor-pointer"
              >
                Publish Lost / Found Post
              </button>
            </motion.div>
          )}

          {/* 2. DIRECTORY FEED TAB */}
          {activeTab === "feed" && (
            <motion.div
              key="feed-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {/* Sticky Filter Bar */}
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-900 shadow-xl backdrop-blur-xl">
                {/* Search Bar */}
                <div className="relative mb-3 flex items-center">
                  <Search className="absolute left-3.5 text-slate-500" size={15} />
                  <input
                    type="text"
                    placeholder="Search item names, color descriptions, locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-900 focus:border-cyan-500/40 outline-none text-xs text-slate-200 transition"
                  />
                </div>

                {/* Sub Filters Row */}
                <div className="flex flex-wrap gap-1.5 items-center justify-between">
                  {/* Type Toggles */}
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-900">
                    {["All", "Lost", "Found"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFeedTypeFilter(type as any)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase transition tracking-wider ${
                          feedTypeFilter === type
                            ? "bg-slate-900 text-white"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Category Filter dropdown */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-[10px] font-bold px-2 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 outline-none cursor-pointer hover:border-slate-800 transition"
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
                    className="text-[10px] font-bold px-2 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 outline-none cursor-pointer hover:border-slate-800 transition"
                  >
                    <option value="All">All Cities</option>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>
                        📍 {city}
                      </option>
                    ))}
                  </select>

                  {/* Sort Filter dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-[10px] font-bold px-2 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-400 outline-none cursor-pointer hover:border-slate-800 transition"
                  >
                    <option value="new">Newest First</option>
                    <option value="old">Oldest First</option>
                    <option value="views">Most Viewed</option>
                  </select>
                </div>
              </div>

              {/* Feed posts list */}
              {loadingPosts ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-slate-900/40 border border-slate-900/80 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                      {/* Top Row Skeleton */}
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-900/60">
                        <div className="flex gap-2">
                          <div className="h-4 w-12 bg-slate-800/80 rounded-full" />
                          <div className="h-4 w-20 bg-slate-800/80 rounded-full" />
                        </div>
                        <div className="h-4 w-8 bg-slate-800/80 rounded" />
                      </div>
                      {/* Title Skeleton */}
                      <div className="h-5 bg-slate-800/80 rounded w-1/3 mb-2.5" />
                      {/* Details Lines Skeletons */}
                      <div className="space-y-2 mb-3">
                        <div className="h-3 bg-slate-800/60 rounded w-full" />
                        <div className="h-3 bg-slate-800/60 rounded w-5/6" />
                      </div>
                      {/* Metadata Row Skeleton */}
                      <div className="flex gap-3 mb-4">
                        <div className="h-3 w-16 bg-slate-800/40 rounded" />
                        <div className="h-3 w-24 bg-slate-800/40 rounded" />
                      </div>
                      {/* Buttons Skeleton */}
                      <div className="flex gap-2">
                        <div className="h-8 bg-slate-800/80 rounded-xl flex-1" />
                        <div className="h-8 bg-slate-800/80 rounded-xl w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="bg-slate-950/20 border border-slate-900/60 rounded-2xl p-12 text-center text-slate-500">
                  <p className="text-sm mb-4">No lost or found item listings matching those filters.</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFeedTypeFilter("All");
                      setCategoryFilter("All");
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredPosts.map((p, idx) => {
                    const isLost = p.type === "Lost";
                    const itemCat = CATEGORIES.find((c) => c.id === p.category);
                    const isResolved = p.status === "Resolved";
                    const postMatches = matches[p.id] || [];

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                        onClick={() => handleIncrementViews(p.id)}
                        className={`bg-slate-950/40 hover:bg-slate-950/60 border rounded-2xl p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/5 hover:border-slate-800/80 cursor-pointer relative overflow-hidden group ${
                          isLost ? "border-l-4 border-l-rose-500 border-slate-900/80" : "border-l-4 border-l-emerald-500 border-slate-900/80"
                        } ${isResolved ? "opacity-70 border-l-slate-600" : ""} ${postMatches.length > 0 ? "border-r border-r-violet-500/20 shadow-lg shadow-violet-950/5" : ""}`}
                      >
                        {/* Top Metadata Row */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-slate-900">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Type badge */}
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 ${
                              isLost ? "bg-rose-950/40 text-rose-300 border border-rose-500/20" : "bg-emerald-950/40 text-emerald-300 border border-emerald-500/20"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLost ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : "bg-emerald-500 shadow-[0_0_8px_#10b981]"}`} />
                              {isLost ? "Lost" : "Found"}
                            </span>
                            {/* Category badge */}
                            {itemCat && (
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-800/80 text-slate-400 rounded-full">
                                {itemCat.emoji} {itemCat.id}
                              </span>
                            )}
                            {/* Urgency tag */}
                            {p.urgency && p.urgency !== "Normal" && (
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-900 border border-slate-800/80 text-rose-400 rounded-full animate-pulse">
                                ⚡ {p.urgency}
                              </span>
                            )}
                            {/* Resolved badge */}
                            {isResolved && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 bg-violet-950/40 text-violet-300 border border-violet-500/20 rounded-full uppercase tracking-wider">
                                ✅ Resolved
                              </span>
                            )}
                          </div>

                          {/* Post Actions for owners */}
                          <div className="flex items-center gap-1">
                            {!isResolved && (
                              <button
                                onClick={(e) => handleMarkResolved(p.id, e)}
                                title="Mark as Resolved"
                                className="p-1 rounded bg-violet-950/40 hover:bg-violet-950/80 border border-violet-500/20 text-violet-300 hover:text-white transition duration-150"
                              >
                                <CheckCircle2 size={12} />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeletePost(p.id, e)}
                              title="Delete Listing"
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-500 hover:text-rose-400 transition duration-150"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-display font-bold text-slate-100 group-hover:text-cyan-300 transition duration-150 mb-1.5 leading-snug">
                          {p.item}
                        </h3>

                        {/* Optional Image */}
                        {p.image && (
                          <div className="my-3 rounded-xl overflow-hidden max-h-44 border border-slate-900">
                            <img src={p.image} alt="Found item" className="w-full h-44 object-cover" />
                          </div>
                        )}

                        {/* Description Details */}
                        <p className="text-xs text-slate-400 leading-relaxed mb-3 break-words">
                          {p.details}
                        </p>

                        {/* Optional MiniMap Location Pin */}
                        {p.latitude && p.longitude && (
                          <div className="my-3 rounded-xl overflow-hidden pointer-events-none select-none relative">
                            <MiniMap lat={p.latitude} lng={p.longitude} />
                          </div>
                        )}

                        {/* Spacers & Views Row */}
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500 mb-4 font-mono">
                          <span className="flex items-center gap-1"><MapPin size={11} className="text-slate-600" /> {p.address}</span>
                          <span className="flex items-center gap-1"><Calendar size={11} className="text-slate-600" /> {p.timestamp}</span>
                          <span>👀 {p.views || 0} views</span>
                          {p.reward && <span className="text-amber-400 font-bold">💰 Reward Offered: ₹{p.reward}</span>}
                          <span className="flex items-center gap-1">
                            <span>📞</span>
                            {unlockedPosts.includes(p.id) ? (
                              <span className="text-emerald-400 font-bold bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                +91 {decryptedContacts[p.id] || p.contact}
                              </span>
                            ) : (
                              <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {p.maskedContact || "+91 ******" + (p.contact.startsWith("ENC:") ? "XX" : p.contact.slice(-2))}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Action Buttons: WhatsApp and Claim */}
                        <div className="flex gap-2">
                          {!unlockedPosts.includes(p.id) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToast(`Please click '${isLost ? "Verify" : "Claim"}' and pass the AI verification quiz to unlock this WhatsApp button!`, "info");
                              }}
                              className="flex-1 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-500 hover:text-slate-400 transition duration-150 flex items-center justify-center gap-1.5 text-xs text-center select-none cursor-not-allowed"
                            >
                              🔒 WhatsApp Locked ({isLost ? "Verify" : "Claim"} first)
                            </button>
                          ) : (
                            <a
                              href={`https://wa.me/91${decryptedContacts[p.id] || p.contact}?text=Hi! I saw your ${p.type} item listing on LINCO for '${p.item}'. Let's connect!`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold hover:text-black transition duration-150 flex items-center justify-center gap-1.5 text-xs text-center shadow shadow-emerald-950/20"
                            >
                              💬 Contact on WhatsApp
                            </a>
                          )}

                          {/* Claim Ownership verification Flow button */}
                          {!isResolved && !unlockedPosts.includes(p.id) && (
                            <button
                              onClick={(e) => handleStartClaim(p, e)}
                              className="px-3 py-2 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-xs font-bold text-violet-300 hover:text-violet-100 transition duration-150 flex items-center justify-center gap-1 text-center"
                            >
                              <ShieldCheck size={14} /> {isLost ? "Verify" : "Claim"}
                            </button>
                          )}

                          {/* Share button */}
                          <button
                            onClick={(e) => handleSharePost(p, e)}
                            title="Share/Copy Template"
                            className="p-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition duration-150 flex items-center justify-center"
                          >
                            <Share2 size={13} />
                          </button>
                        </div>

                        {/* ACTIVE GOOGLE GEMINI AI MATCH ALERTS (DISPLAYED INSIDE POST CARD) */}
                        {postMatches.length > 0 && (
                          <div className="mt-4 p-3.5 rounded-xl border border-violet-500/30 bg-violet-950/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 px-2 py-0.5 bg-violet-500/20 text-[7px] font-bold tracking-widest text-violet-300 rounded-bl-lg uppercase">
                              AI Match
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-violet-300 uppercase tracking-wider mb-2">
                              <Sparkles size={11} className="text-violet-400" /> Gemini matched this listing!
                            </div>
                            
                            <div className="space-y-2.5">
                              {postMatches.map((match, mIdx) => (
                                <div key={mIdx} className="p-2.5 bg-[#020817]/60 rounded-lg border border-slate-900 flex gap-3 items-start">
                                  {/* Percentage Circle Ring */}
                                  <div className="flex-shrink-0 relative w-11 h-11 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-full font-mono text-[10px] font-extrabold text-violet-400 shadow-inner">
                                    {match.score}%
                                  </div>
                                  
                                  <div className="flex-1">
                                    <h4 className="text-xs font-bold text-slate-200 mb-0.5">{match.item}</h4>
                                    <p className="text-[10px] text-slate-400 leading-normal mb-1.5">{match.reason}</p>
                                    <a
                                      href={`https://wa.me/91${match.contact}?text=Hi! LINCO AI automatically matched our posts. I believe your listing for '${match.item}' matches my post. Let's arrange a handover!`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold rounded-md bg-violet-600 hover:bg-violet-500 text-slate-950 hover:text-black transition duration-150"
                                    >
                                      Contact Match Owner <ChevronRight size={10} />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* 3. ABOUT TAB */}
          {activeTab === "about" && (
            <motion.div
              key="about-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {/* Product Info */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
                <h2 className="text-base font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-3">
                  About LINCO Smart Technology
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  LINCO is a professional, community-first web platform leveraging advanced Gemini Large Language Models to match lost items with finders securely, instantly, and with zero friction.
                </p>

                {/* Grid features */}
                <div className="space-y-3">
                  {[
                    { title: "Gemini Match Engine", desc: "Cross-analyzes post descriptions, categories, and locations to highlight overlapping listings with confidence scores." },
                    { title: "Secure Ownership Verification", desc: "Generates custom questions based on secret markings, only allowing true owners to coordinate handovers." },
                    { title: "AI Voice & Image Fill", desc: "Avoid complex typing. Gemini reads photos or voice inputs to automatically categorise and describe details." },
                    { title: "WhatsApp Direct Connect", desc: "No custom logins, accounts, or emails required. Instantly start coordinating via WhatsApp links." },
                  ].map((feat, idx) => (
                    <div key={idx} className="flex gap-2.5 p-3 rounded-xl border border-slate-900 bg-slate-950/20">
                      <span className="text-sm">⚡</span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{feat.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs FAQ Section */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 shadow-xl backdrop-blur-xl">
                <h2 className="text-base font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-4">
                  Frequently Asked Questions
                </h2>
                
                <div className="space-y-3.5">
                  {[
                    { q: "Is LINCO free to use?", a: "Yes! LINCO is 100% free and open to everyone without advertisements or account requirements." },
                    { q: "How does AI Claim Verification work?", a: "When you tap Claim on a found item, Gemini generates specific questions that only the owner can answer. Gemini then scores the answers to verify authenticity." },
                    { q: "Do I need to sign up?", a: "No signup is needed. You connect directly via WhatsApp links, keeping things simple, fast, and secure." },
                    { q: "Are my contact numbers secure?", a: "Yes. Mobile numbers are stored in our local database only to render direct WhatsApp links, which are shared exclusively with claimants." },
                  ].map((faq, idx) => (
                    <div key={idx} className="pb-3 border-b border-slate-900 last:border-0 last:pb-0">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        <span>❓</span> {faq.q}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* SECURITY PIN VERIFICATION MODAL */}
      <AnimatePresence>
        {pinModal && pinModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-950 border border-rose-500/30 rounded-2xl p-5 md:p-6 w-full max-w-sm shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setPinModal(null)}
                className="absolute top-3 right-3 p-1 rounded hover:bg-slate-900 text-slate-400 transition"
              >
                <X size={15} />
              </button>

              <div className="flex items-center gap-1 text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
                <Lock size={14} /> Security Verification
              </div>
              <h3 className="text-sm font-display font-bold text-slate-100 mb-1">
                Enter Security PIN
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                Please enter the 4-digit Security PIN to {pinModal.actionType === "delete" ? "permanently delete" : "mark this post as resolved"}.
              </p>

              <div className="space-y-4">
                <div>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                    value={enteredPin}
                    onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 focus:border-rose-500/40 outline-none text-center text-lg font-bold tracking-widest text-slate-200 transition duration-150"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setPinModal(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyPinAndExecute}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-950 font-extrabold hover:text-black transition cursor-pointer text-xs"
                  >
                    Verify & Proceed
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLAIM OWNERSHIP VERIFICATION MODAL */}
      <AnimatePresence>
        {showClaimModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-950 border border-violet-500/30 rounded-2xl p-5 md:p-6 w-full max-w-sm shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowClaimModal(false)}
                className="absolute top-3 right-3 p-1 rounded hover:bg-slate-900 text-slate-400 transition"
              >
                <X size={15} />
              </button>

              <div className="flex items-center gap-1 text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">
                <ShieldCheck size={14} /> Ownership Verification
              </div>
              <h3 className="text-base font-display font-bold text-slate-100 mb-1">
                Prove ownership of {claimingPost?.item}
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                To prevent spam and fake claims, Gemini has scanned the item details to compose specific verification questions.
              </p>

              {/* Loader */}
              {claimLoading && (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  <RefreshCw className="animate-spin inline-block mb-2 text-violet-400" size={18} />
                  <p>Processing with Gemini AI...</p>
                </div>
              )}

              {/* Questions Answer Area */}
              {!claimLoading && !claimResult && (
                <div className="space-y-4">
                  {claimQuestions.map((q, idx) => (
                    <div key={idx}>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 leading-relaxed">
                        Q{idx + 1}: {q}
                      </label>
                      <input
                        type="text"
                        placeholder="Provide details..."
                        value={claimAnswers[idx]}
                        onChange={(e) => {
                          const updated = [...claimAnswers];
                          updated[idx] = e.target.value;
                          setClaimAnswers(updated);
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-900 focus:border-violet-500/30 outline-none text-xs text-slate-200 transition duration-150"
                      />
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowClaimModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitClaimAnswers}
                      className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-slate-950 font-extrabold hover:text-black transition cursor-pointer text-xs"
                    >
                      Submit Answers
                    </button>
                  </div>
                </div>
              )}

              {/* Results screen */}
              {!claimLoading && claimResult && (
                <div className="text-center py-2">
                  <div className={`text-4xl mb-2 ${claimResult.verified ? "animate-bounce" : "animate-pulse"}`}>
                    {claimResult.verified ? "🎉" : "❌"}
                  </div>
                  
                  {/* Matching score ring */}
                  <div className="my-3 flex items-center justify-center">
                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-mono text-base font-extrabold shadow-inner ${
                      claimResult.verified ? "border-emerald-500/80 text-emerald-400" : "border-rose-500/80 text-rose-400"
                    }`}>
                      {claimResult.confidence}%
                    </div>
                  </div>

                  <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${
                    claimResult.verified ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {claimResult.verified ? "AI Verification Passed!" : "Verification Failed"}
                  </h4>
                  
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-4 px-1 bg-slate-950 p-2.5 rounded-lg border border-slate-900">
                    {claimResult.message}
                  </p>

                  {claimResult.verified && claimingPost && (
                    <div className="mb-4 text-left border border-slate-900 bg-slate-950/60 p-3 rounded-xl space-y-3 animate-fadeIn">
                      {!isPinVerifiedSuccessfully ? (
                        <>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                            <Lock size={12} /> End-to-End Encrypted Contact
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            This post's contact information is fully encrypted on the browser using AES-GCM. To unlock and view, please enter the post's 4-digit Security PIN:
                          </p>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="Enter 4-digit Security PIN"
                            value={decryptPinEntered}
                            onChange={(e) => setDecryptPinEntered(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-violet-500/40 outline-none text-center text-sm font-bold tracking-widest text-slate-200 transition duration-150"
                          />
                          <button
                            onClick={handleDecryptContact}
                            className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-slate-950 font-bold hover:text-black transition text-xs cursor-pointer"
                          >
                            🔓 Decrypt & Unlock Contact
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            <ShieldCheck size={12} /> Connection Securely Decrypted!
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed">
                            Decryption successful! The contact number has been safely unlocked in your browser. You can now tap below to coordinate with them.
                          </p>
                          <div className="text-xs font-mono font-bold text-slate-200 bg-emerald-950/20 p-2 rounded border border-emerald-500/10 text-center">
                            Unlocked Number: +91 {decryptedContacts[claimingPost.id]}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {claimResult.verified && claimingPost && isPinVerifiedSuccessfully && (
                      <a
                        href={`https://wa.me/91${decryptedContacts[claimingPost.id] || claimingPost.contact}?text=Hi! I successfully passed the LINCO Gemini Ownership Verification for your found item '${claimingPost.item}' (with ${claimResult.confidence}% match). Let's coordinate the handover!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold hover:text-black transition flex items-center justify-center gap-1 text-xs"
                      >
                        Contact Finder on WhatsApp <ExternalLink size={12} />
                      </a>
                    )}
                    <button
                      onClick={() => setShowClaimModal(false)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition text-xs font-bold"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative z-10 max-w-5xl lg:max-w-6xl mx-auto px-4 pt-12 pb-6 text-center text-slate-600 border-t border-slate-900/40 select-none">
        <h4 className="text-sm font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-violet-500 mb-1">
          LINCO AI
        </h4>
        <p className="text-[10px] text-slate-500 font-medium">
          © 2026 Prakash Pathak · Proudly Empowering Secure Communities.
        </p>
      </footer>
    </div>
  );
}
