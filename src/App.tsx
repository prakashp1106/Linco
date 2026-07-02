/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Info, X } from "lucide-react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

import { usePosts } from "./hooks/usePosts";
import { encryptContact } from "./services/encryptionService";
import { Post, AIMatch } from "./types";

// UI Components
import { CanvasParticles } from "./components/CanvasParticles";
import { CountUpStat } from "./components/CountUpStat";
import { PostForm } from "./components/PostForm";
import { FeedList } from "./components/FeedList";
import { AboutTab } from "./components/AboutTab";

// Modals
import { PinModal } from "./components/PinModal";
import { ClaimModal } from "./components/ClaimModal";
import { QRModal } from "./components/QRModal";

interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warn" | "error";
}

export default function App() {
  const {
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
  } = usePosts();

  const [activeTab, setActiveTab] = useState<"home" | "feed" | "about">("home");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [decryptedContacts, setDecryptedContacts] = useState<Record<string, string>>({});
  
  // Modals state
  const [pinModal, setPinModal] = useState<{
    isOpen: boolean;
    postId: string;
    actionType: "delete" | "resolve";
  } | null>(null);

  const [claimingPost, setClaimingPost] = useState<Post | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);

  const [qrModalPost, setQrModalPost] = useState<Post | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Banner announcement
  const [banner, setBanner] = useState<{ show: boolean; title: string; subtitle: string; icon: string } | null>(null);

  // Typewriter Hero Animation
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
          typingTimer = setTimeout(tick, 2500);
          return;
        }
      } else {
        setTypewriterText(currentMessage.slice(0, charIndex - 1));
        charIndex--;
        if (charIndex <= 0) {
          isDeleting = false;
          msgIndex = (msgIndex + 1) % messages.length;
          typingTimer = setTimeout(tick, 500);
          return;
        }
      }
      typingTimer = setTimeout(tick, isDeleting ? 30 : 60);
    };

    typingTimer = setTimeout(tick, 1000);
    return () => clearTimeout(typingTimer);
  }, []);

  // Show Toast Toast Notification helper
  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Support deep linking to open a specific post from QR code scans / URLs
  useEffect(() => {
    if (posts.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get("id");
      if (postId) {
        const foundPost = posts.find((p) => p.id === postId);
        if (foundPost) {
          setClaimingPost(foundPost);
          setActiveTab("feed");
          setShowClaimModal(true);
          window.history.replaceState({}, document.title, window.location.pathname);
          addToast(`Scanned QR Code for: ${foundPost.item}!`, "success");
        }
      }
    }
  }, [posts, addToast]);

  // Form Submission callback
  const handleCreatePost = async (postFormInput: any) => {
    const plainContact = postFormInput.contact.trim().replace(/\D/g, "");
    const pin = postFormInput.securityPin.trim();

    addToast("Encrypting your contact details locally using AES-GCM...", "info");

    let encryptedContact = plainContact;
    try {
      encryptedContact = await encryptContact(plainContact, pin);
    } catch (err) {
      console.error("Local client-side encryption failed:", err);
      addToast("Encryption warning: falling back to standard storage", "warn");
    }

    const payload = {
      ...postFormInput,
      contact: encryptedContact,
      maskedContact: "+91 ******" + plainContact.slice(-2),
    };

    addToast("Publishing post & launching Gemini AI matcher...", "info");

    try {
      const res = await submitPost(payload);
      if (res.success) {
        try {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {
          console.error("Confetti failed:", e);
        }

        setBanner({
          show: true,
          title: "Post Published Successfully!",
          subtitle: payload.type === "Lost"
            ? "Your item is now indexed. Gemini is currently scanning all found items for matches..."
            : "Thank you for being a good citizen! Gemini is scanning lost posts to contact the owner...",
          icon: payload.type === "Lost" ? "🔍" : "🤝",
        });

        setTimeout(() => {
          setBanner(null);
          setActiveTab("feed");
        }, 3200);

        return { success: true };
      }
    } catch (err: any) {
      addToast("Error publishing post: " + (err.message || err), "error");
      return { success: false, error: err.message };
    }
  };

  // Safe Post Resolution with PIN check
  const handleMarkResolvedTrigger = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinModal({ isOpen: true, postId: id, actionType: "resolve" });
  };

  const handleDeletePostTrigger = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinModal({ isOpen: true, postId: id, actionType: "delete" });
  };

  const handleVerifyPinAndExecute = async (pinEntered: string) => {
    if (!pinModal) return;
    const { postId, actionType } = pinModal;

    try {
      if (actionType === "delete") {
        const res = await deletePost(postId, pinEntered);
        if (res.success) {
          addToast("Post deleted successfully", "success");
        }
      } else if (actionType === "resolve") {
        const res = await resolvePost(postId, pinEntered);
        if (res.success) {
          addToast("Congratulations on recovering this item!", "success");
        }
      }
      setPinModal(null);
    } catch (err: any) {
      addToast(err.message || "Action failed", "error");
    }
  };

  // Share as Canvas Image Card with dynamic QR Code
  const handleShareAsImage = async (p: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    addToast("Generating your shareable image card...", "info");

    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      addToast("Failed to create canvas context", "error");
      return;
    }

    // 1. Draw gradient background
    const grad = ctx.createRadialGradient(400, 400, 50, 400, 400, 600);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#020817");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 800);

    // 2. Draw dot grid pattern
    ctx.fillStyle = "rgba(6, 182, 212, 0.05)";
    for (let x = 20; x < 800; x += 30) {
      for (let y = 20; y < 800; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Draw outer glowing border
    ctx.strokeStyle = p.type === "Lost" ? "rgba(239, 68, 68, 0.35)" : "rgba(16, 185, 129, 0.35)";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 720, 720);

    // Subtle inner cyan accents
    ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 50, 700, 700);

    // 4. Header Branding
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.fillText("LINCO AI", 80, 100);

    ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
    ctx.font = "bold 12px 'Inter', sans-serif";
    ctx.fillText("REALTIME LOST & FOUND DIRECTORY", 80, 125);

    // Decorative line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 150);
    ctx.lineTo(720, 150);
    ctx.stroke();

    // 5. Status Badge
    const isLost = p.type === "Lost";
    ctx.fillStyle = isLost ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";
    const badgeX = 80;
    const badgeY = 180;
    const badgeW = 125;
    const badgeH = 34;
    const badgeR = 8;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR) : ctx.rect(badgeX, badgeY, badgeW, badgeH);
    ctx.fill();

    ctx.strokeStyle = isLost ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isLost ? "#f87171" : "#34d399";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(isLost ? "🚨 LOST ITEM" : "🤝 FOUND ITEM", badgeX + badgeW/2, badgeY + 22);
    ctx.textAlign = "left";

    // Category Badge
    const catText = p.category ? `Category: ${p.category}` : "General Item";
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(220, badgeY, 180, badgeH, badgeR) : ctx.rect(220, badgeY, 180, badgeH);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.stroke();
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 11px 'Inter', sans-serif";
    ctx.fillText(catText, 240, badgeY + 21);

    // 6. Item Title
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 36px 'Inter', sans-serif";
    ctx.fillText(p.item, 80, 270);

    // 7. Details (Multiline Wrap)
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "500 17px 'Inter', sans-serif";

    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(" ");
      let line = "";
      let currentY = y;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + " ";
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      return currentY;
    };

    const detailsStartY = 320;
    const detailsEndY = wrapText(p.details, 80, detailsStartY, 640, 26);

    let metaY = detailsEndY + 50;
    if (metaY < 480) metaY = 480;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, metaY - 20);
    ctx.lineTo(720, metaY - 20);
    ctx.stroke();

    ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText("📍 LOCATION", 80, metaY);

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "600 16px 'Inter', sans-serif";
    ctx.fillText(p.address, 80, metaY + 28);

    ctx.fillStyle = "rgba(139, 92, 246, 0.9)";
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText("📅 DATE REPORTED", 420, metaY);

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "600 16px 'Inter', sans-serif";
    ctx.fillText(p.timestamp, 420, metaY + 28);

    if (p.reward) {
      const rewardY = metaY + 80;
      ctx.fillStyle = "rgba(245, 158, 11, 0.1)";
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(80, rewardY, 640, 60, 12) : ctx.rect(80, rewardY, 640, 60);
      ctx.fill();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.stroke();

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.fillText(`💰 REWARD OFFERED: ₹${p.reward}`, 110, rewardY + 36);
    }

    const qrX = 600;
    const qrY = 615;
    const qrSize = 110;
    const shareUrl = `${window.location.origin}/?id=${p.id}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        margin: 1,
        width: qrSize,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      });
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject();
      });

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 8) : ctx.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
      ctx.fill();

      ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    } catch (qrErr) {
      console.error("Failed to generate QR Code on image card:", qrErr);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.font = "bold 11px 'Inter', sans-serif";
    ctx.fillText("Scan QR code to immediately verify or claim.", 80, 680);
    ctx.fillText("Visit linco.ai or contact the community.", 80, 705);

    ctx.fillStyle = "rgba(6, 182, 212, 0.8)";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText("SECURED BY LINCO AI • GEMINI POWERED", 80, 735);

    setTimeout(() => {
      try {
        const link = document.createElement("a");
        link.download = `LINCO_${p.type.toUpperCase()}_${p.item.replace(/\s+/g, '_')}_QR.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        addToast("Shareable image with QR Code generated and downloaded! 🚀", "success");
      } catch (err) {
        console.error("Canvas export failed", err);
        addToast("Could not auto-download image, right click or retry", "error");
      }
    }, 100);
  };

  const handleShowQrCodeTrigger = (p: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setQrModalPost(p);
    setShowQrModal(true);
  };

  const handleSharePostText = (p: Post, e: React.MouseEvent) => {
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

  const handleStartClaimTrigger = (p: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setClaimingPost(p);
    setShowClaimModal(true);
  };

  const handleUnlockSuccess = (postId: string, decryptedNumber: string) => {
    setDecryptedContacts((prev) => ({ ...prev, [postId]: decryptedNumber }));
    unlockPost(postId);
    addToast("Contact details decrypted successfully! Connection unlocked.", "success");
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-sans pb-16 bg-dot-grid">
      <CanvasParticles />

      {/* Rotating blurs */}
      <div className="fixed -top-[20%] -left-[20%] w-[60vw] h-[60vw] bg-radial from-cyan-500/10 via-transparent to-transparent blur-[120px] pointer-events-none z-0 animate-orb-slow-1" />
      <div className="fixed -bottom-[20%] -right-[20%] w-[50vw] h-[50vw] bg-radial from-violet-600/10 via-transparent to-transparent blur-[120px] pointer-events-none z-0 animate-orb-slow-2" />
      <div className="fixed top-[40%] left-[35%] w-[35vw] h-[35vw] bg-radial from-pink-500/5 via-transparent to-transparent blur-[100px] pointer-events-none z-0 animate-orb-slow-3" />

      {/* TOAST NOTIFICATION CONTAINER */}
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
              <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="text-slate-400 hover:text-slate-200 transition cursor-pointer">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HERO CONTAINER */}
      <header className="relative z-10 max-w-5xl lg:max-w-6xl mx-auto px-4 pt-12 pb-6 text-center select-none overflow-visible">
        <div className="absolute inset-0 -top-40 max-h-[500px] bg-gradient-to-br from-cyan-500/5 via-violet-500/5 to-pink-500/5 blur-[120px] animate-pulse pointer-events-none z-0 opacity-80" />
        <div className="absolute left-1/4 top-10 w-[50%] h-[260px] bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-[100px] filter blur-[80px] animate-orb-slow-1 opacity-70 pointer-events-none z-0" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-950/40 to-violet-950/40 border border-cyan-500/30 text-[10px] font-extrabold text-cyan-300 uppercase tracking-widest mb-5 shadow-lg shadow-cyan-950/50 backdrop-blur-md relative overflow-hidden group"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#06b6d4]"></span>
          </span>
          <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">Realtime Lost &amp; Found Directory</span>
        </motion.div>

        <div className="relative inline-block my-1.5 z-10">
          <div className="absolute inset-0 -m-8 bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/15 rounded-full blur-3xl pointer-events-none" />
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-6xl md:text-7xl font-display font-extrabold tracking-tighter leading-none bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-500 bg-[size:200%] animate-shimmer text-transparent bg-clip-text relative z-10"
          >
            LINCO
          </motion.h1>
        </div>

        <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-500/50 uppercase mt-2 mb-4">
          Locate · Identify · Notify · Connect · Owner
        </p>

        {/* Typewriter text */}
        <div className="h-6 flex justify-center items-center mb-1">
          <p className="text-xs text-slate-400 font-medium">
            {typewriterText}
            <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-pulse" />
          </p>
        </div>

        {/* Statistics Counters */}
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto mt-6">
          {[
            { label: "Total", value: stats.total, color: "text-slate-100" },
            { label: "Lost", value: stats.lost, color: "text-rose-400" },
            { label: "Found", value: stats.found, color: "text-emerald-400" },
            { label: "Resolved", value: stats.resolved, color: "text-violet-400" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-950/40 border border-slate-900 rounded-xl p-2.5 text-center transition hover:border-slate-800/80 shadow-md">
              <CountUpStat value={stat.value} color={stat.color} />
              <span className="text-[8px] tracking-wider text-slate-500 uppercase block font-semibold mt-0.5">{stat.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Sticky Tab Navigation */}
      <nav className="sticky top-0 z-35 max-w-2xl mx-auto px-4 py-4 mt-6">
        <div className="flex gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-900 backdrop-blur-xl shadow-xl">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "home" ? "bg-slate-900 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Plus size={14} /> Post Item
          </button>
          <button
            onClick={() => {
              setActiveTab("feed");
              loadPosts(true);
            }}
            className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "feed" ? "bg-slate-900 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Search size={14} /> Feed ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`flex-1 py-2 rounded-lg font-display text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "about" ? "bg-slate-900 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Info size={14} /> About LINCO
          </button>
        </div>
      </nav>

      {/* Main Content Layout */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-12">
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-gradient-to-br from-cyan-950/40 via-slate-950/60 to-violet-950/40 border border-cyan-500/30 p-5 rounded-2xl text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-400 to-violet-500" />
            <div className="text-4xl mb-2 animate-bounce">{banner.icon}</div>
            <h3 className="text-base font-bold font-display text-cyan-300">{banner.title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{banner.subtitle}</p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === "home" && (
                <motion.div
                  key="home-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <PostForm onSubmit={handleCreatePost} />
                </motion.div>
              )}

              {activeTab === "feed" && (
                <motion.div
                  key="feed-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <FeedList
                    posts={posts}
                    matches={matches}
                    loadingPosts={loadingPosts}
                    unlockedPosts={unlockedPosts}
                    decryptedContacts={decryptedContacts}
                    onIncrementViews={incrementPostViews}
                    onMarkResolved={handleMarkResolvedTrigger}
                    onDeletePost={handleDeletePostTrigger}
                    onStartClaim={handleStartClaimTrigger}
                    onSharePost={handleSharePostText}
                    onShareAsImage={handleShareAsImage}
                    onShowQrCode={handleShowQrCodeTrigger}
                  />
                </motion.div>
              )}

              {activeTab === "about" && (
                <motion.div
                  key="about-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <AboutTab />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Persistent Sidebar Info Card */}
          <div className="lg:col-span-4 bg-slate-950/40 border border-slate-900 rounded-3xl p-5 md:p-6 shadow-xl backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 uppercase tracking-widest flex items-center gap-1.5">
              💡 Platform Health
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              LINCO AI database is secured using AES-GCM local client encryption. No plaintext mobile numbers are transmitted or stored.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-2.5 h-2.5 rounded-full ${backendStatus === "live" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500 animate-pulse"}`} />
              <span className="text-slate-300">
                Backend Status: {backendStatus === "live" ? "Live" : "Reconnecting..."}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Verification Modals */}
      <PinModal
        isOpen={!!pinModal}
        actionType={pinModal?.actionType || "resolve"}
        onClose={() => setPinModal(null)}
        onSubmit={handleVerifyPinAndExecute}
      />

      <ClaimModal
        isOpen={showClaimModal}
        claimingPost={claimingPost}
        onClose={() => setShowClaimModal(false)}
        onUnlockSuccess={handleUnlockSuccess}
      />

      <QRModal
        isOpen={showQrModal}
        post={qrModalPost}
        onClose={() => setShowQrModal(false)}
      />

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
