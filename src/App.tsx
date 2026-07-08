/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Plus, 
  Info, 
  X, 
  Bell, 
  Home, 
  Sparkles, 
  Radar, 
  User,
  Menu,
  Settings,
  ShieldCheck,
  FileText,
  MessageSquare,
  Heart,
  LifeBuoy,
  ShieldAlert,
  ChevronRight
} from "lucide-react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

import { usePosts } from "./hooks/usePosts";
import { usePostForm } from "./hooks/usePostForm";
import { encryptContact, decryptContact } from "./services/encryptionService";
import { Post, AIMatch, PotentialMatch, LincoNotification } from "./types";
import { detectCategoryLocal, extractItemLocal, capitalizeItemName } from "./utils/extractor";
import { apiService } from "./services/api";
import { formatKolkataTimestamp } from "./utils/date";

// UI Components
import { CanvasParticles } from "./components/CanvasParticles";
import { CountUpStat } from "./components/CountUpStat";
import { PostForm } from "./components/PostForm";
import { FeedList } from "./components/FeedList";
import { AboutTab } from "./components/AboutTab";
import { LandingPage } from "./components/LandingPage";
import { LincoSaathiiChat } from "./components/LincoSaathiiChat";
import { PotentialMatches } from "./components/PotentialMatches";
import { NotificationCenter } from "./components/NotificationCenter";
import { PrivacyTrustCenter } from "./components/PrivacyTrustCenter";
import { UserDashboard } from "./components/UserDashboard";
import { CookieConsent } from "./components/CookieConsent";
import { AuthFlow } from "./components/AuthFlow";
import { auth, db } from "./services/firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Modals
import { PinModal } from "./components/PinModal";
import { ClaimModal } from "./components/ClaimModal";
import { QRModal } from "./components/QRModal";
import { OwnerClaimsDashboard } from "./components/OwnerClaimsDashboard";
import { ClaimTracker } from "./components/ClaimTracker";

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

  const form = usePostForm();

  const [activeTab, setActiveTab] = useState<"home" | "report" | "feed" | "about" | "matches" | "privacy-trust" | "dashboard">("home");
  const [privacySection, setPrivacySection] = useState<string>("privacy");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState(() => {
    try {
      const saved = localStorage.getItem("linco_profile_details");
      if (saved) {
        return JSON.parse(saved).avatar || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)";
      }
    } catch {}
    return "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)";
  });
  const [profileDetails, setProfileDetails] = useState(() => {
    try {
      const saved = localStorage.getItem("linco_profile_details");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          fullName: parsed.fullName || "",
          username: parsed.username || "",
          avatar: parsed.avatar || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          trustLevel: "Bronze Guardian"
        };
      }
    } catch {}
    return {
      fullName: "",
      username: "",
      avatar: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
      trustLevel: "Bronze Guardian"
    };
  });

  useEffect(() => {
    const syncProfile = () => {
      try {
        const saved = localStorage.getItem("linco_profile_details");
        const completionsSaved = localStorage.getItem("linco_profile_completions");
        
        let completions = { photo: true, email: true, phone: false, bio: true, report: false, review: false };
        if (completionsSaved) {
          completions = JSON.parse(completionsSaved);
        }
        
        let score = 350;
        if (completions.photo) score += 50;
        if (completions.email) score += 100;
        if (completions.phone) score += 100;
        if (completions.bio) score += 50;
        if (completions.report) score += 100;
        if (completions.review) score += 150;
        score = Math.min(score, 900);
        
        let levelName = "Bronze Guardian";
        if (score >= 800) levelName = "Ambassador";
        else if (score >= 650) levelName = "Platinum Guardian";
        else if (score >= 500) levelName = "Gold Guardian";
        else if (score >= 400) levelName = "Silver Guardian";
        else levelName = "Bronze Guardian";

        if (saved) {
          const parsed = JSON.parse(saved);
          setProfileDetails({
            fullName: parsed.fullName || "",
            username: parsed.username || "",
            avatar: parsed.avatar || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            trustLevel: levelName
          });
          setProfileAvatar(parsed.avatar || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)");
        } else {
          setProfileDetails({
            fullName: "",
            username: "",
            avatar: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            trustLevel: levelName
          });
          setProfileAvatar("linear-gradient(135deg, #6366f1 0%, #a855f7 100%)");
        }
      } catch (e) {
        console.error(e);
      }
    };
    syncProfile();
    window.addEventListener("storage", syncProfile);
    window.addEventListener("profile-updated", syncProfile);
    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("profile-updated", syncProfile);
    };
  }, [activeTab]);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("linco_profile_is_logged_in") === "true";
  });

  const [isSplashActive, setIsSplashActive] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        try {
          let userDoc = await getDoc(userDocRef);
          let userData = userDoc.exists() ? userDoc.data() : null;
          
          if (!userDoc.exists()) {
            // Auto-create missing Firestore document
            const defaultUsername = user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || `user_${user.uid.slice(0, 5)}`;
            const defaultProfile = {
              uid: user.uid,
              displayName: user.displayName || "Verified User",
              username: defaultUsername,
              bio: "Lost & Found helper on LINCO",
              city: "Kolkata, India",
              photoURL: user.photoURL || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              createdAt: Date.now()
            };
            try {
              await setDoc(userDocRef, defaultProfile);
              userDoc = await getDoc(userDocRef);
              userData = userDoc.exists() ? userDoc.data() : defaultProfile;
            } catch (writeErr) {
              console.error("Failed to auto-create user document in Firestore:", writeErr);
              // Fallback if rules or write fails initially
              userData = defaultProfile;
            }
          }
          
          if (userData) {
            const formattedDate = userData.createdAt ? new Date(userData.createdAt).toLocaleString("en-US", { month: "long", year: "numeric" }) : "July 2026";
            const localProfile = {
              fullName: userData.displayName || user.displayName || "Verified User",
              username: userData.username || user.email?.split("@")[0] || "user",
              bio: userData.bio || "Lost & Found helper on LINCO",
              location: userData.city || "Kolkata, India",
              memberSince: formattedDate,
              avatar: userData.photoURL || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              banner: "linear-gradient(120deg, #1e1b4b 0%, #311042 100%)"
            };
            localStorage.setItem("linco_profile_details", JSON.stringify(localProfile));
            localStorage.setItem("linco_profile_is_logged_in", "true");
            setIsLoggedIn(true);
            window.dispatchEvent(new Event("profile-updated"));
          }
        } catch (e) {
          console.error("Error reading Firestore profile:", e);
        }
      } else {
        localStorage.removeItem("linco_profile_details");
        localStorage.removeItem("linco_profile_is_logged_in");
        setIsLoggedIn(false);
        window.dispatchEvent(new Event("profile-updated"));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const syncLoginState = () => {
      setIsLoggedIn(localStorage.getItem("linco_profile_is_logged_in") === "true");
    };
    window.addEventListener("storage", syncLoginState);
    window.addEventListener("profile-updated", syncLoginState);
    return () => {
      window.removeEventListener("storage", syncLoginState);
      window.removeEventListener("profile-updated", syncLoginState);
    };
  }, []);

  const handleLoginSuccess = (name: string, emailStr: string) => {
    localStorage.setItem("linco_profile_is_logged_in", "true");
    setIsLoggedIn(true);
    window.dispatchEvent(new Event("profile-updated"));
  };

  const [activeMenuId, setActiveMenuId] = useState<string>("home");

  useEffect(() => {
    if (activeTab === "home") setActiveMenuId("home");
    else if (activeTab === "feed") setActiveMenuId("feed");
    else if (activeTab === "matches") setActiveMenuId("matches");
    else if (activeTab === "privacy-trust") setActiveMenuId("privacy");
    else if (activeTab === "about") setActiveMenuId("about");
  }, [activeTab]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [decryptedContacts, setDecryptedContacts] = useState<Record<string, string>>({});

  // New AI Match & Notification states
  const [notifications, setNotifications] = useState<LincoNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  
  // Modals state
  const [pinModal, setPinModal] = useState<{
    isOpen: boolean;
    postId: string;
    actionType: "delete" | "resolve" | "unlock";
  } | null>(null);

  const [claimingPost, setClaimingPost] = useState<Post | null>(null);
  const [claimingMatchedPostId, setClaimingMatchedPostId] = useState<string | undefined>(undefined);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Owner dashboard state
  const [managingPost, setManagingPost] = useState<Post | null>(null);
  const [showOwnerClaims, setShowOwnerClaims] = useState(false);

  // Claim tracking state
  const [showClaimTracker, setShowClaimTracker] = useState(false);
  const [trackerClaimId, setTrackerClaimId] = useState("");
  const [trackerCode, setTrackerCode] = useState("");

  const [qrModalPost, setQrModalPost] = useState<Post | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Computed unread notification count
  const userNotifications = notifications.filter((n) => unlockedPosts.includes(n.postId));
  const unreadCount = userNotifications.filter((n) => !n.read).length;

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

  // Fetch notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await apiService.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [loadNotifications]);

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

  // Support deep linking for Magic Claim Tracker Links (Device-Agnostic Status Check)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const claimId = urlParams.get("claimId");
    const code = urlParams.get("code");
    if (claimId && code) {
      setTrackerClaimId(claimId);
      setTrackerCode(code);
      setShowClaimTracker(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      addToast("Scanning Magic Link for Claim status check!", "success");
    }
  }, [addToast]);

  // Support changing tabs programmatically from child components via custom events
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        if (typeof customEvent.detail === "string") {
          setActiveTab(customEvent.detail as any);
        } else if (typeof customEvent.detail === "object") {
          if (customEvent.detail.tab) {
            setActiveTab(customEvent.detail.tab as any);
          }
          if (customEvent.detail.section) {
            setPrivacySection(customEvent.detail.section);
          }
        }
      }
    };
    window.addEventListener("change-tab", handleTabChange);
    return () => window.removeEventListener("change-tab", handleTabChange);
  }, []);

  // Form Submission callback
  const handleCreatePost = async (postFormInput: any) => {
    let finalItem = postFormInput.item ? postFormInput.item.trim() : "";
    let finalCategory = postFormInput.category;

    // Manual Item Name always has highest priority.
    const hasManualItem = finalItem !== "" && 
                           finalItem !== "Item Name" && 
                           !finalItem.toLowerCase().includes("unspecified");

    if (!hasManualItem) {
      // Voice transcript should only be used if Item Name is completely empty.
      if (postFormInput.details && postFormInput.details.trim() !== "") {
        addToast("Analyzing details & extracting real object name with AI...", "info");
        try {
          const aiRes = await apiService.quickFillVoice(postFormInput.details);
          if (aiRes && aiRes.item && !aiRes.item.toLowerCase().includes("unspecified") && !aiRes.item.toLowerCase().includes("spoken item")) {
            finalItem = capitalizeItemName(aiRes.item);
            if (aiRes.category) {
              finalCategory = aiRes.category;
            }
          } else {
            const localItem = extractItemLocal(postFormInput.details);
            if (localItem) {
              finalItem = capitalizeItemName(localItem);
            }
          }
        } catch (err) {
          console.error("AI extraction failed, using local fallback:", err);
          const localItem = extractItemLocal(postFormInput.details);
          if (localItem) {
            finalItem = capitalizeItemName(localItem);
          }
        }
      }
    }

    // Force strict category mapping based on user criteria:
    // Phone -> Electronics, Wallet -> Wallet / Purse, Laptop -> Electronics, Dog -> Pet, Keys -> Keys, Documents -> Documents
    const detectedCategory = detectCategoryLocal(postFormInput.details || "", finalItem || "");
    if (detectedCategory) {
      finalCategory = detectedCategory;
    }

    // If both are empty then display "Untitled Item".
    if (!finalItem || finalItem.trim() === "" || finalItem.toLowerCase().includes("unspecified") || finalItem === "Item Name") {
      finalItem = "Untitled Item";
    }

    const enrichedFormInput = {
      ...postFormInput,
      item: finalItem,
      category: finalCategory,
    };

    const plainContact = enrichedFormInput.contact.trim().replace(/\D/g, "");
    const pin = enrichedFormInput.securityPin.trim();

    addToast("Encrypting your contact details locally using AES-GCM...", "info");

    let encryptedContact = plainContact;
    try {
      encryptedContact = await encryptContact(plainContact, pin);
    } catch (err) {
      console.error("Local client-side encryption failed:", err);
      addToast("Encryption warning: falling back to standard storage", "warn");
    }

    const payload = {
      ...enrichedFormInput,
      contact: encryptedContact,
      maskedContact: "+91 ******" + plainContact.slice(-2),
    };

    addToast("Publishing post & launching Gemini AI matcher...", "info");

    try {
      const res = await submitPost(payload);
      if (res.success) {
        if (res.post?.id) {
          unlockPost(res.post.id);
          setDecryptedContacts((prev) => ({ ...prev, [res.post.id]: plainContact }));
        }

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
          // Let the user remain on report tab to explore the AI Recovery Intelligence Card
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

  const handleUnlockTrigger = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinModal({ isOpen: true, postId, actionType: "unlock" });
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
      } else if (actionType === "unlock") {
        const res = await apiService.verifyPin(postId, pinEntered);
        if (res.success) {
          const targetPost = posts.find((p) => p.id === postId);
          if (targetPost) {
            try {
              const decryptedNumber = await decryptContact(targetPost.contact, pinEntered);
              handleUnlockSuccess(postId, decryptedNumber);
            } catch (decErr) {
              console.error("Client-side decryption failed:", decErr);
              addToast("Decryption failed. Please make sure the PIN is correct.", "error");
              throw new Error("Unable to decrypt contact details.");
            }
          }
        }
      }
      setPinModal(null);
    } catch (err: any) {
      addToast(err.message || "Action failed", "error");
      throw err; // throw so PinModal error catch can display it in modal UI
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

    // Helper: Address Shortener (e.g., converts long address to Landmark + Neighborhood or Landmark + City)
    const getShortAddress = (addr: string): string => {
      if (!addr) return "Unknown Location";
      const parts = addr.split(",").map(item => item.trim()).filter(Boolean);
      if (parts.length <= 2) return addr;

      const isZip = (s: string) => /\d{5,}/.test(s);
      const isCountry = (s: string) => ["india", "usa", "uk", "germany", "canada"].includes(s.toLowerCase());

      const relevant = parts.filter(p => !isZip(p) && !isCountry(p));
      if (relevant.length <= 2) {
        return relevant.join(", ");
      }
      return `${relevant[0]}, ${relevant[1]}`;
    };

    let shortAddr = getShortAddress(p.address);
    if (shortAddr.length > 45) {
      shortAddr = shortAddr.substring(0, 42) + "...";
    }

    // Helper: Wrap text to fit canvas width
    const wrapTextToArray = (text: string, maxWidth: number, font: string): string[] => {
      ctx.font = font;
      const words = text.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let currentLine = "";

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = ctx.measureText(testLine).width;
        if (width > maxWidth) {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    };

    // Helper: Dynamic Space & Layout Calculator
    const computeLayout = (S: number, maxDescLines: number = 4) => {
      const titleFontSize = Math.round(36 * S);
      const descFontSize = Math.round(16 * S);
      const descLineHeight = Math.round(24 * S);
      const metaHeaderFontSize = Math.round(12 * S);
      const metaValueFontSize = Math.round(15 * S);
      const metaValueLineHeight = Math.round(20 * S);
      const rewardFontSize = Math.round(18 * S);
      const rewardHeight = Math.round(54 * S);

      const titleFont = `bold ${titleFontSize}px 'Inter', sans-serif`;
      const descFont = `500 ${descFontSize}px 'Inter', sans-serif`;
      const metaHeaderFont = `bold ${metaHeaderFontSize}px 'Inter', sans-serif`;
      const metaValueFont = `600 ${metaValueFontSize}px 'Inter', sans-serif`;

      // Wrap & compute Title
      const titleLines = wrapTextToArray(p.item, 640, titleFont);
      const titleHeight = titleLines.length * (titleFontSize + 8);

      const spacing1 = Math.round(15 * S);

      // Wrap & compute Description
      const descLinesAll = wrapTextToArray(p.details, 640, descFont);
      const actualMaxLines = Math.min(maxDescLines, descLinesAll.length);
      
      // Ellipsis on description if it exceeds bounds
      if (descLinesAll.length > actualMaxLines && actualMaxLines > 0) {
        let line = descLinesAll[actualMaxLines - 1];
        ctx.font = descFont;
        while (line.length > 0 && ctx.measureText(line + "...").width > 640) {
          line = line.substring(0, line.length - 1);
        }
        descLinesAll[actualMaxLines - 1] = line + "...";
      }
      const descLines = descLinesAll.slice(0, actualMaxLines);
      const descHeight = descLines.length * descLineHeight;

      const spacing2 = Math.round(20 * S);

      // Metadata section (Location & Date)
      const locLinesCol = wrapTextToArray(shortAddr, 280, metaValueFont);
      const formattedDate = formatKolkataTimestamp(p.created || p.timestamp);
      const dateLinesCol = wrapTextToArray(formattedDate, 280, metaValueFont);

      // Switch column format dynamically if scale is small or text wraps too much (avoid collision)
      const useSingleColumn = S < 0.85 || locLinesCol.length > 1 || dateLinesCol.length > 1;
      let metadataHeight = 0;
      let locLinesToRender: string[] = [];
      let dateLinesToRender: string[] = [];

      if (useSingleColumn) {
        locLinesToRender = wrapTextToArray(shortAddr, 640, metaValueFont);
        dateLinesToRender = wrapTextToArray(formattedDate, 640, metaValueFont);
        metadataHeight = metaHeaderFontSize + 4 + (locLinesToRender.length * metaValueLineHeight) + 12 + metaHeaderFontSize + 4 + (dateLinesToRender.length * metaValueLineHeight);
      } else {
        locLinesToRender = locLinesCol;
        dateLinesToRender = dateLinesCol;
        const maxLines = Math.max(locLinesToRender.length, dateLinesToRender.length);
        metadataHeight = metaHeaderFontSize + 4 + (maxLines * metaValueLineHeight);
      }

      let spacing3 = 0;
      let rewardTotalHeight = 0;
      if (p.reward) {
        spacing3 = Math.round(20 * S);
        rewardTotalHeight = rewardHeight;
      }

      const totalHeight = titleHeight + spacing1 + descHeight + spacing2 + metadataHeight + spacing3 + rewardTotalHeight;

      return {
        S,
        titleFontSize,
        descFontSize,
        descLineHeight,
        metaHeaderFontSize,
        metaValueFontSize,
        metaValueLineHeight,
        rewardFontSize,
        rewardHeight,
        titleFont,
        descFont,
        metaHeaderFont,
        metaValueFont,
        titleLines,
        titleHeight,
        spacing1,
        descLines,
        descHeight,
        spacing2,
        useSingleColumn,
        locLinesToRender,
        dateLinesToRender,
        metadataHeight,
        spacing3,
        totalHeight,
      };
    };

    // Find the perfect fitting layout (Scale from 1.0 down to 0.55; description lines from 4 down to 2)
    const findFittingLayout = () => {
      for (let dLines = 4; dLines >= 2; dLines--) {
        for (let s = 1.0; s >= 0.55; s -= 0.05) {
          const tempLayout = computeLayout(s, dLines);
          if (tempLayout.totalHeight <= 340) {
            return tempLayout;
          }
        }
      }
      return computeLayout(0.55, 2); // Absolute fallback
    };

    const layout = findFittingLayout();

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

    // --- 6. Content Area Drawing with Layout Engine ---
    let currentY = 240;

    // Draw Title Lines
    ctx.fillStyle = "#f8fafc";
    ctx.font = layout.titleFont;
    layout.titleLines.forEach((line) => {
      ctx.fillText(line, 80, currentY + layout.titleFontSize);
      currentY += layout.titleFontSize + 8;
    });

    currentY += layout.spacing1;

    // Draw Description Lines
    ctx.fillStyle = "#cbd5e1";
    ctx.font = layout.descFont;
    layout.descLines.forEach((line) => {
      ctx.fillText(line, 80, currentY + layout.descFontSize);
      currentY += layout.descLineHeight;
    });

    currentY += layout.spacing2;

    // Draw Metadata Section (Divider & Content)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, currentY - 10);
    ctx.lineTo(720, currentY - 10);
    ctx.stroke();

    if (layout.useSingleColumn) {
      // Stacked Location
      ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
      ctx.font = layout.metaHeaderFont;
      ctx.fillText("📍 LOCATION", 80, currentY + layout.metaHeaderFontSize);
      currentY += layout.metaHeaderFontSize + 4;

      ctx.fillStyle = "#f1f5f9";
      ctx.font = layout.metaValueFont;
      layout.locLinesToRender.forEach((line) => {
        ctx.fillText(line, 80, currentY + layout.metaValueFontSize);
        currentY += layout.metaValueLineHeight;
      });

      currentY += 12;

      // Stacked Date
      ctx.fillStyle = "rgba(139, 92, 246, 0.9)";
      ctx.font = layout.metaHeaderFont;
      ctx.fillText("📅 DATE REPORTED", 80, currentY + layout.metaHeaderFontSize);
      currentY += layout.metaHeaderFontSize + 4;

      ctx.fillStyle = "#f1f5f9";
      ctx.font = layout.metaValueFont;
      layout.dateLinesToRender.forEach((line) => {
        ctx.fillText(line, 80, currentY + layout.metaValueFontSize);
        currentY += layout.metaValueLineHeight;
      });
    } else {
      // Side-by-Side Location & Date
      const metaStartY = currentY;

      ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
      ctx.font = layout.metaHeaderFont;
      ctx.fillText("📍 LOCATION", 80, metaStartY + layout.metaHeaderFontSize);

      ctx.fillStyle = "#f1f5f9";
      ctx.font = layout.metaValueFont;
      let locY = metaStartY + layout.metaHeaderFontSize + 4;
      layout.locLinesToRender.forEach((line) => {
        ctx.fillText(line, 80, locY + layout.metaValueFontSize);
        locY += layout.metaValueLineHeight;
      });

      ctx.fillStyle = "rgba(139, 92, 246, 0.9)";
      ctx.font = layout.metaHeaderFont;
      ctx.fillText("📅 DATE REPORTED", 420, metaStartY + layout.metaHeaderFontSize);

      ctx.fillStyle = "#f1f5f9";
      ctx.font = layout.metaValueFont;
      let dateY = metaStartY + layout.metaHeaderFontSize + 4;
      layout.dateLinesToRender.forEach((line) => {
        ctx.fillText(line, 420, dateY + layout.metaValueFontSize);
        dateY += layout.metaValueLineHeight;
      });

      currentY += layout.metadataHeight;
    }

    // Draw Reward Box
    if (p.reward) {
      currentY += layout.spacing3;
      ctx.fillStyle = "rgba(245, 158, 11, 0.08)";
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(80, currentY, 640, layout.rewardHeight, 12) : ctx.rect(80, currentY, 640, layout.rewardHeight);
      ctx.fill();

      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${layout.rewardFontSize}px 'Inter', sans-serif`;
      ctx.fillText(`💰 REWARD OFFERED: ₹${p.reward}`, 110, currentY + layout.rewardHeight / 2 + layout.rewardFontSize / 2 - 2);
    }

    // --- 7. Dedicated Footer Area (Guaranteed Overlap Free) ---
    const footerTop = 590;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, footerTop);
    ctx.lineTo(720, footerTop);
    ctx.stroke();

    const qrX = 590;
    const qrY = 610;
    const qrSize = 120;
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

    ctx.fillStyle = "rgba(6, 182, 212, 0.85)";
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText("SECURED BY LINCO AI • GEMINI POWERED", 80, 630);

    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.font = "bold 11px 'Inter', sans-serif";
    ctx.fillText("Scan QR code to immediately verify or claim.", 80, 665);
    ctx.fillText("Visit linco.ai or contact the community.", 80, 690);

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

  const handleStartClaimTrigger = (p: Post, eventOrMatchedPostId?: React.MouseEvent | string) => {
    if (eventOrMatchedPostId && typeof eventOrMatchedPostId !== "string") {
      eventOrMatchedPostId.stopPropagation();
    }
    const matchedId = typeof eventOrMatchedPostId === "string" ? eventOrMatchedPostId : undefined;
    setClaimingPost(p);
    setClaimingMatchedPostId(matchedId);
    setShowClaimModal(true);
  };

  const handleUnlockSuccess = (postId: string, decryptedNumber: string) => {
    setDecryptedContacts((prev) => ({ ...prev, [postId]: decryptedNumber }));
    unlockPost(postId);
    addToast("Contact details decrypted successfully! Connection unlocked.", "success");
  };

  if (isSplashActive) {
    return (
      <div className="relative min-h-screen text-slate-100 font-sans pb-16 bg-dot-grid">
        <CanvasParticles />
        <AuthFlow 
          key="splash"
          onLoginSuccess={handleLoginSuccess} 
          addToast={addToast} 
          onSplashEnd={() => setIsSplashActive(false)}
          isSplashOnly={isLoggedIn}
        />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen text-slate-100 font-sans pb-16 bg-dot-grid">
        <CanvasParticles />
        
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

        <AuthFlow 
          key="login-flow"
          onLoginSuccess={handleLoginSuccess} 
          addToast={addToast} 
          initialScreen="welcome"
        />
      </div>
    );
  }

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

      {/* TOP APP BAR */}
      <header 
        className="fixed top-0 left-0 right-0 z-40 bg-[#08080c]/95 border-b border-[#161621] backdrop-blur-md px-4 py-3 flex items-center justify-between select-none"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
          height: "calc(env(safe-area-inset-top, 0px) + 3.75rem)",
        }}
      >
        {/* LEFT */}
        <div className="flex items-center gap-3 z-10">
          <button 
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-1 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
          <span 
            onClick={() => setActiveTab("home")}
            className="font-sans font-black text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-1.5 cursor-pointer"
          >
            LINCO
          </span>
        </div>

        {/* CENTER */}
        <div className="absolute left-1/2 -translate-x-1/2 font-sans font-black text-xs sm:text-sm tracking-widest text-slate-100 uppercase text-center select-none pointer-events-none">
          {activeTab === "home" && "Home"}
          {activeTab === "dashboard" && "Profile"}
          {activeTab === "report" && "Report"}
          {activeTab === "feed" && "Feed"}
          {activeTab === "matches" && "Matches"}
          {activeTab === "about" && "About"}
          {activeTab === "privacy-trust" && "Privacy & Security"}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3 z-10">
          {/* Notification Bell */}
          <button
            onClick={() => setNotificationsOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-rose-400 transition cursor-pointer relative"
            aria-label="Open notifications"
          >
            <Bell size={18} className="text-rose-500 hover:scale-105 transition-transform duration-150" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
            )}
          </button>

          {/* Profile Avatar */}
          <button
            onClick={() => {
              setActiveTab("dashboard");
              window.dispatchEvent(new CustomEvent("linco-navigate-dashboard", { detail: "profile" }));
            }}
            className="w-8 h-8 rounded-full overflow-hidden border border-[#232332] hover:border-indigo-400 transition cursor-pointer flex items-center justify-center text-slate-100 text-[10px] font-black uppercase"
            aria-label="View Profile"
            style={profileAvatar.startsWith("linear-gradient") ? { background: profileAvatar } : {}}
          >
            {profileAvatar.startsWith("linear-gradient") ? (
              profileDetails.fullName ? profileDetails.fullName.charAt(0) : "U"
            ) : (
              <img 
                src={profileAvatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
          </button>
        </div>
      </header>

      {/* SIDE NAVIGATION DRAWER */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] bg-[#08080c] border-r border-[#161621] shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-sans font-black text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    LINCO Menu
                  </span>
                  <button 
                    onClick={() => setDrawerOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Grouped Sidebar Sections */}
                {[
                  {
                    title: "DISCOVER",
                    items: [
                      { id: "home", label: "Home", icon: <Home size={16} />, action: () => setActiveTab("home") },
                      { id: "feed", label: "Community Feed", icon: <Search size={16} />, action: () => { setActiveTab("feed"); loadPosts(true); } },
                      { id: "matches", label: "AI Matches", icon: <Sparkles size={16} />, action: () => setActiveTab("matches") },
                    ]
                  },
                  {
                    title: "RECOVERY",
                    items: [
                      { id: "reports", label: "My Reports", icon: <FileText size={16} />, action: () => { setActiveTab("dashboard"); setTimeout(() => window.dispatchEvent(new CustomEvent("linco-navigate-dashboard", { detail: "reports" })), 50); } },
                      { id: "recovery-rooms", label: "Recovery Rooms", icon: <MessageSquare size={16} />, action: () => { setActiveTab("dashboard"); setTimeout(() => window.dispatchEvent(new CustomEvent("linco-navigate-dashboard", { detail: "recovery" })), 50); } },
                      { id: "saved-searches", label: "Saved Searches", icon: <Heart size={16} />, action: () => { setActiveTab("feed"); setTimeout(() => window.dispatchEvent(new CustomEvent("linco-navigate-feed", { detail: "saved" })), 50); } },
                    ]
                  },
                  {
                    title: "ACCOUNT",
                    items: [
                      { id: "settings", label: "Settings", icon: <Settings size={16} />, action: () => { setActiveTab("dashboard"); setTimeout(() => window.dispatchEvent(new CustomEvent("linco-navigate-dashboard", { detail: "settings" })), 50); } },
                      { id: "privacy", label: "Privacy & Security", icon: <ShieldCheck size={16} />, action: () => { setActiveTab("privacy-trust"); setPrivacySection("privacy"); } },
                      { id: "help", label: "Help & Support", icon: <LifeBuoy size={16} />, action: () => { window.dispatchEvent(new CustomEvent("open-linco-chat")); addToast("LincoSaathii Assistant active.", "info"); } },
                      { id: "about", label: "About LINCO", icon: <Info size={16} />, action: () => setActiveTab("about") },
                    ]
                  }
                ].map((section) => (
                  <div key={section.title} className="space-y-1.5">
                    <h4 className="text-[10px] font-black tracking-widest text-slate-500 font-mono px-3">
                      {section.title}
                    </h4>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isSelected = activeMenuId === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveMenuId(item.id);
                              item.action();
                              setDrawerOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                              isSelected 
                                ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/10 shadow-sm" 
                                : "text-slate-400 hover:text-slate-200 hover:bg-[#12121a]/30 border border-transparent"
                            } cursor-pointer`}
                          >
                            <span className={isSelected ? "text-indigo-400" : "text-slate-500"}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Drawer Bottom Panel */}
              <div className="flex flex-col border-t border-[#161621] bg-[#0c0c14]/30 p-4 space-y-3">
                {/* Profile Card */}
                {profileDetails.fullName ? (
                  <button
                    onClick={() => {
                      setActiveTab("dashboard");
                      setActiveMenuId("profile");
                      window.dispatchEvent(new CustomEvent("linco-navigate-dashboard", { detail: "profile" }));
                      setDrawerOpen(false);
                    }}
                    className="w-full text-left flex items-center justify-between p-2 rounded-xl hover:bg-slate-900/60 transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {profileDetails.avatar.startsWith("linear-gradient") ? (
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-100 text-xs font-black uppercase border border-[#232332]"
                          style={{ background: profileDetails.avatar }}
                        >
                          {profileDetails.fullName.charAt(0)}
                        </div>
                      ) : (
                        <img 
                          src={profileDetails.avatar} 
                          alt={profileDetails.fullName} 
                          className="w-9 h-9 rounded-full object-cover border border-[#232332]"
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-200 truncate leading-tight">
                          {profileDetails.fullName}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 group-hover:text-indigo-400 transition-colors flex items-center gap-0.5 font-bold">
                          View Profile <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveTab("dashboard");
                      setActiveMenuId("profile");
                      window.dispatchEvent(new CustomEvent("linco-navigate-dashboard", { detail: "profile" }));
                      setDrawerOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-900/60 transition group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 border border-[#232332]">
                      <User size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">Complete Profile</span>
                      <span className="text-[10px] text-slate-500">View Profile →</span>
                    </div>
                  </button>
                )}

                {/* Logout Option */}
                <button
                  onClick={async () => {
                    try {
                      console.log("[App] [Logout] Initiating Firebase Auth signOut...");
                      await signOut(auth);
                      console.log("[App] [Logout] Firebase Auth signOut complete.");
                      localStorage.removeItem("linco_profile_details");
                      localStorage.removeItem("linco_profile_is_logged_in");
                      window.dispatchEvent(new Event("storage"));
                      window.dispatchEvent(new Event("profile-updated"));
                      addToast("Successfully logged out.", "success");
                      setDrawerOpen(false);
                    } catch (err) {
                      console.error("[App] [Logout] Firebase Auth signOut failed:", err);
                      addToast("Error during sign out. Cleared local session.", "warn");
                      localStorage.removeItem("linco_profile_details");
                      localStorage.removeItem("linco_profile_is_logged_in");
                      window.dispatchEvent(new Event("storage"));
                      window.dispatchEvent(new Event("profile-updated"));
                      setDrawerOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold tracking-wide text-rose-400 hover:text-rose-300 hover:bg-rose-950/10 transition cursor-pointer"
                >
                  <ShieldAlert size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BOTTOM STICKY NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#07070a]/90 border-t border-[#161621] backdrop-blur-xl px-4 py-2 flex items-center justify-around select-none shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-md mx-auto flex gap-1 items-center justify-around">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "home" 
                ? "text-indigo-400" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Home size={18} className={activeTab === "home" ? "text-indigo-400" : "text-slate-500"} />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "report" 
                ? "text-indigo-400" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Plus size={18} className={activeTab === "report" ? "text-indigo-400" : "text-slate-500"} />
            <span>Report</span>
          </button>

          <button
            onClick={() => setActiveTab("matches")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all duration-200 cursor-pointer relative ${
              activeTab === "matches" 
                ? "text-indigo-400" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles size={18} className={activeTab === "matches" ? "text-indigo-400 animate-pulse" : "text-slate-500"} />
            <span>Matches</span>
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan-400 text-[7px] font-black text-slate-950 shadow-[0_0_8px_#06b6d4]">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setNotificationsOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all duration-200 cursor-pointer relative text-slate-400 hover:text-rose-400"
          >
            <Bell size={18} className="text-rose-500 hover:scale-105 transition-transform duration-150" />
            <span>Activity</span>
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[7px] font-black text-white shadow-[0_0_10px_#ef4444] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "dashboard" 
                ? "text-indigo-400" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <User size={18} className={activeTab === "dashboard" ? "text-indigo-400" : "text-slate-500"} />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {/* Main Content Layout */}
      <main 
        className="relative z-10 max-w-7xl mx-auto px-4 pb-12"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.75rem)",
        }}
      >
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

        <AnimatePresence mode="wait">
          {activeTab === "home" ? (
            <motion.div
              key="landing-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <LandingPage
                stats={stats}
                onNavigateToReport={(type) => {
                  if (type) {
                    form.setFType(type);
                  }
                  setActiveTab("report");
                }}
                onNavigateToFeed={() => {
                  setActiveTab("feed");
                  loadPosts(true);
                }}
                onNavigateToMatches={() => {
                  setActiveTab("matches");
                }}
                onOpenNotifications={() => {
                  setNotificationsOpen(true);
                }}
                onFocusAIAssistant={() => {
                  window.dispatchEvent(new CustomEvent("open-linco-chat"));
                }}
              />
            </motion.div>
          ) : activeTab === "privacy-trust" ? (
            <motion.div
              key="privacy-trust-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <PrivacyTrustCenter
                initialSection={privacySection}
                addToast={addToast}
                onClose={() => setActiveTab("home")}
              />
            </motion.div>
          ) : activeTab === "dashboard" ? (
            <motion.div
              key="user-dashboard-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <UserDashboard
                addToast={addToast}
                onNavigateToTab={(tab) => {
                  setActiveTab(tab as any);
                }}
                onOpenNotifications={() => {
                  setNotificationsOpen(true);
                }}
                stats={stats}
              />
            </motion.div>
          ) : (
            <motion.div
              key="app-core-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              <div className="lg:col-span-8 space-y-6">
                <AnimatePresence mode="wait">
                  {activeTab === "report" && (
                    <motion.div
                      key="report-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                    >
                      <PostForm form={form} onSubmit={handleCreatePost} />
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
                        onManageClaims={(post) => {
                          setManagingPost(post);
                          setShowOwnerClaims(true);
                        }}
                        onUnlockPost={handleUnlockTrigger}
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

                  {activeTab === "matches" && (
                    <motion.div
                      key="matches-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                    >
                      <PotentialMatches
                        posts={posts}
                        unlockedPosts={unlockedPosts}
                        onStartClaim={(post, matchedPostId) => handleStartClaimTrigger(post, matchedPostId)}
                        addToast={addToast}
                        initialSelectedMatchId={selectedMatchId}
                        onClearSelectedMatchId={() => setSelectedMatchId(null)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Persistent Sidebar Info Card & LincoSaathii Chatbot */}
              <div className="lg:col-span-4 space-y-6">
                <LincoSaathiiChat
                  onFieldUpdate={(fields) => {
                    if (fields.type) form.setFType(fields.type);
                    if (fields.item) form.setFItem(fields.item);
                    if (fields.category) form.setFCategory(fields.category);
                    if (fields.details) form.setFDetails(fields.details);
                    if (fields.urgency) form.setFUrgency(fields.urgency as any);
                    if (fields.address) form.setFAddress(fields.address);
                    if (fields.contact) form.setFContact(fields.contact);
                    if (fields.reward !== undefined) form.setFReward(fields.reward || "");
                    if (fields.securityPin) form.setFSecurityPin(fields.securityPin);
                    if (fields.image !== undefined) form.setFImage(fields.image);
                  }}
                  triggerSubmit={async () => {
                    if (!form.validateStep1()) {
                      addToast("Please fill in Step 1 (Basic Details) first!", "error");
                      form.setStep(1);
                      return;
                    }
                    if (!form.validateStep2()) {
                      addToast("Please choose a 4-Digit Security PIN in Step 2!", "error");
                      form.setStep(2);
                      return;
                    }
                    
                    const postData = {
                      item: form.fItem,
                      details: form.fDetails,
                      type: form.fType,
                      address: form.fAddress,
                      reward: form.fReward,
                      contact: form.fContact,
                      category: form.fCategory,
                      urgency: form.fUrgency,
                      image: form.fImage,
                      timeline: form.fTimeline,
                      latitude: form.fLat,
                      longitude: form.fLng,
                      securityPin: form.fSecurityPin || "0000",
                    };

                    try {
                      const res = await handleCreatePost(postData);
                      if (res && res.success) {
                        form.resetForm();
                      }
                    } catch (e) {
                      console.error("Auto submit failed:", e);
                    }
                  }}
                  currentState={{
                    type: (form.fType || "Lost") as "Lost" | "Found",
                    item: form.fItem,
                    category: form.fCategory,
                    details: form.fDetails,
                    urgency: form.fUrgency,
                    address: form.fAddress,
                    contact: form.fContact,
                    reward: form.fReward,
                    securityPin: form.fSecurityPin,
                    image: form.fImage,
                  }}
                />

                <div className="bg-[#07070a]/90 border border-[#161621] rounded-3xl p-5 md:p-6 shadow-xl backdrop-blur-xl space-y-4">
                  <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    🛡️ Trusted by Design
                  </h3>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-100 leading-snug">
                      Your identity stays private.
                    </p>
                    <p className="text-sm font-bold text-slate-400 leading-snug">
                      Your item doesn't.
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Trusted by communities. Powered by AI. Built for everyone.
                  </p>

                  <div className="space-y-2 pt-3 text-[11px] font-medium text-slate-300 border-t border-[#1c1c26]/60">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Private by Default</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Verified Claims</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>AI-Assisted Matching</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>Secure Communication</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#1c1c26]/60 text-[10px] font-bold uppercase tracking-wider">
                    <span className={`w-2 h-2 rounded-full ${backendStatus === "live" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500 animate-pulse"}`} />
                    <span className="text-slate-400 font-mono">
                      {backendStatus === "live" ? "Operational • All Systems Available" : "Reconnecting..."}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        matchedPostId={claimingMatchedPostId}
        onClose={() => {
          setShowClaimModal(false);
          setClaimingMatchedPostId(undefined);
        }}
      />

      <OwnerClaimsDashboard
        isOpen={showOwnerClaims}
        post={managingPost}
        onClose={() => {
          setShowOwnerClaims(false);
          setManagingPost(null);
        }}
        onPostUpdated={(updatedPost) => {
          // Silent refresh of postings to reflect changed resolved flags/details instantly
          loadPosts();
        }}
      />

      <ClaimTracker
        isOpen={showClaimTracker}
        onClose={() => {
          setShowClaimTracker(false);
          setTrackerClaimId("");
          setTrackerCode("");
        }}
        initialClaimId={trackerClaimId}
      />

      <QRModal
        isOpen={showQrModal}
        post={qrModalPost}
        onClose={() => setShowQrModal(false)}
      />

      <NotificationCenter
        unlockedPosts={unlockedPosts}
        onViewMatch={(matchId) => {
          setActiveTab("matches");
          setSelectedMatchId(matchId);
        }}
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onRefreshNotifications={loadNotifications}
        addToast={addToast}
        posts={posts}
        onOpenClaimTracker={(claimId) => {
          setTrackerClaimId(claimId);
          setShowClaimTracker(true);
        }}
        onOpenOwnerClaims={(post) => {
          setManagingPost(post);
          setShowOwnerClaims(true);
        }}
        onNavigateToTab={(tab) => {
          setActiveTab(tab as any);
        }}
      />

      <footer className="relative z-10 border-t border-[#161621] py-12 text-center select-none" id="app-footer">
        <div className="max-w-md mx-auto space-y-6 px-4">
          <div className="space-y-1.5">
            <h4 className="text-sm font-black tracking-[0.2em] text-slate-100 font-sans uppercase">LINCO</h4>
            <p className="text-[11px] text-slate-500 font-medium">Recovering what matters.</p>
            <p className="text-[10px] text-slate-400 font-normal leading-relaxed max-w-xs mx-auto">
              Trusted by communities.<br />
              Powered by AI.<br />
              Built for everyone.
            </p>
          </div>

          <nav 
            className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[11px] text-slate-400 font-medium font-sans"
            aria-label="Footer Navigation"
          >
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setActiveTab("privacy-trust"); setPrivacySection("privacy"); }}
              className="hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-1.5 py-0.5"
              aria-label="View Privacy Policy"
            >
              Privacy
            </button>
            <span className="text-slate-700" aria-hidden="true">•</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setActiveTab("privacy-trust"); setPrivacySection("terms"); }}
              className="hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-1.5 py-0.5"
              aria-label="View Terms and Conditions"
            >
              Terms
            </button>
            <span className="text-slate-700" aria-hidden="true">•</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setActiveTab("privacy-trust"); setPrivacySection("security"); }}
              className="hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-1.5 py-0.5"
              aria-label="View Security and Sessions"
            >
              Security
            </button>
            <span className="text-slate-700" aria-hidden="true">•</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setActiveTab("privacy-trust"); setPrivacySection("contact-team"); }}
              className="hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-1.5 py-0.5"
              aria-label="View Contact Support"
            >
              Contact
            </button>
            <span className="text-slate-700" aria-hidden="true">•</span>
            <a 
              href="https://www.linkedin.com/in/prakashpathak1306" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded px-1.5 py-0.5"
              aria-label="Connect with Prakash Pathak on LinkedIn (opens in a new tab)"
            >
              LinkedIn
            </a>
          </nav>

          <div className="pt-2 border-t border-[#1c1c26]/40 space-y-1 text-[10px] text-slate-500 font-medium">
            <p>© 2026 LINCO. All rights reserved.</p>
            <p className="text-slate-600 font-mono text-[9px]">Founded by Prakash Pathak</p>
          </div>
        </div>
      </footer>

      <CookieConsent
        onLearnMore={() => {
          setActiveTab("privacy-trust");
          setPrivacySection("privacy-center");
        }}
        addToast={addToast}
      />
    </div>
  );
}
