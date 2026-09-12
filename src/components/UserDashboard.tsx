/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User,
  MapPin,
  Calendar,
  Camera,
  Edit3,
  Share2,
  Settings,
  Download,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle
} from "lucide-react";
import { imageService } from "../services/imageService";
import { auth, db } from "../services/firebaseClient";
import { signOut, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { DEFAULT_USER_LOCATION } from "../constants";
import { LincoAvatar } from "./LincoAvatar";
import { requestGenuineLocation } from "../utils/geolocation";

interface UserDashboardProps {
  addToast: (msg: string, type: "success" | "info" | "warn" | "error") => void;
  onNavigateToTab: (tab: any) => void;
  onOpenNotifications: () => void;
  stats?: {
    total: number;
    lost: number;
    found: number;
    resolved: number;
  };
}

interface ProfileData {
  fullName: string;
  username: string;
  bio: string;
  location: string;
  memberSince: string;
  avatar: string;
  banner: string;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  addToast,
  onNavigateToTab,
  onOpenNotifications,
  stats = { total: 0, lost: 0, found: 0, resolved: 0 }
}) => {
  // Check if profile exists
  const [profile, setProfile] = useState<ProfileData | null>(() => {
    try {
      const saved = localStorage.getItem("linco_profile_details");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Profile Edit Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData>({
    fullName: "",
    username: "",
    bio: "",
    location: "",
    memberSince: "",
    avatar: "",
    banner: ""
  });

  // Photo Selector Modal
  const [photoModal, setPhotoModal] = useState<"photo" | "banner" | null>(null);
  
  // Custom Cloudinary/Web URL Input state
  const [cloudinaryUrl, setCloudinaryUrl] = useState("");
  const [avatarImgError, setAvatarImgError] = useState(false);
  
  // Camera capture states
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hidden file inputs
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Settings detail state variables
  const [settingsEmail, setSettingsEmail] = useState("user@example.com");
  const [settingsPassword, setSettingsPassword] = useState("••••••••");
  const [newPassword, setNewPassword] = useState("");
  
  // Toggles for notifications
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);

  // Themes & languages
  const [settingsTheme, setSettingsTheme] = useState("light");
  const [settingsLang, setSettingsLang] = useState("en");

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<string[]>(["spammer_john", "bot_acc_44"]);

  // Danger Zone double confirmation delete account state
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0); // 0: None, 1: Details info, 2: Final typed text confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthenticating, setReauthenticating] = useState(false);

  // Curated premium preset avatars & gradient banners
  const PRESET_AVATARS = [
    "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
    "linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)",
    "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)"
  ];

  const PRESET_BANNERS = [
    "linear-gradient(120deg, #e0e7ff 0%, #ede9fe 100%)",
    "linear-gradient(120deg, #f8fafc 0%, #e2e8f0 100%)",
    "linear-gradient(120deg, #ecfdf5 0%, #e0f2fe 100%)",
    "linear-gradient(120deg, #fff1f2 0%, #fef3c7 100%)",
    "linear-gradient(120deg, #f0f9ff 0%, #e0e7ff 100%)"
  ];

  // Sync edit form on load or profile change
  useEffect(() => {
    if (profile) {
      setEditForm(profile);
    } else {
      setEditForm({
        fullName: "",
        username: "",
        bio: "",
        location: "",
        memberSince: "",
        avatar: PRESET_AVATARS[0],
        banner: PRESET_BANNERS[0]
      });
    }
    if (auth.currentUser) {
      setSettingsEmail(auth.currentUser.email || "user@example.com");
    }
  }, [profile]);

  // Sync to global App.tsx state whenever profile changes
  const saveProfileData = async (newProfile: ProfileData | null) => {
    setProfile(newProfile);
    if (newProfile) {
      localStorage.setItem("linco_profile_details", JSON.stringify(newProfile));
      localStorage.setItem("linco_profile_is_logged_in", "true");
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, {
            displayName: newProfile.fullName,
            photoURL: newProfile.avatar
          });
        } catch (authErr) {
          console.warn("Could not update auth profile directly:", authErr);
        }

        const userRef = doc(db, "users", auth.currentUser.uid);
        try {
          await setDoc(userRef, {
            displayName: newProfile.fullName,
            username: newProfile.username,
            city: newProfile.location,
            bio: newProfile.bio,
            photoURL: newProfile.avatar,
            updatedAt: Date.now()
          }, { merge: true });
        } catch (err) {
          console.error("Error updating Firestore on profile save:", err);
        }
      }
    } else {
      localStorage.removeItem("linco_profile_details");
      localStorage.removeItem("linco_profile_is_logged_in");
      signOut(auth).catch(err => console.error("Error during Firebase signOut:", err));
    }
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("profile-updated"));
  };

  // Check custom navigation events
  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      const destination = customEvent.detail;
      if (destination === "settings") {
        setShowSettings(true);
        setActiveCategory(null);
      } else if (destination === "profile") {
        setShowSettings(false);
      }
    };
    window.addEventListener("linco-navigate-dashboard", handleNav);
    return () => window.removeEventListener("linco-navigate-dashboard", handleNav);
  }, []);

  // Handle Initial Profile Creation
  const handleCreateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.fullName.trim() || !editForm.username.trim()) {
      addToast("Full Name and Username are required", "error");
      return;
    }
    const today = new Date();
    const formattedDate = today.toLocaleString("en-US", { month: "long", year: "numeric" });
    const defaultProfile: ProfileData = {
      fullName: editForm.fullName.trim(),
      username: editForm.username.trim().toLowerCase().replace(/\s+/g, ""),
      bio: editForm.bio.trim() || "Lost & Found helper on LINCO",
      location: editForm.location.trim() || DEFAULT_USER_LOCATION,
      memberSince: formattedDate,
      avatar: editForm.avatar || PRESET_AVATARS[0],
      banner: editForm.banner || PRESET_BANNERS[0]
    };
    saveProfileData(defaultProfile);
    addToast("Profile created successfully! Welcome to LINCO.", "success");
  };

  // Handle Skip profile creation
  const handleSkipProfile = () => {
    const today = new Date();
    const formattedDate = today.toLocaleString("en-US", { month: "long", year: "numeric" });
    const skippedProfile: ProfileData = {
      fullName: "Guest Finder",
      username: "guest_finder_" + Math.floor(Math.random() * 1000),
      bio: "Ready to help recover lost items.",
      location: DEFAULT_USER_LOCATION,
      memberSince: formattedDate,
      avatar: PRESET_AVATARS[0],
      banner: PRESET_BANNERS[0]
    };
    saveProfileData(skippedProfile);
    addToast("Profile setup skipped. Temporary profile created.", "info");
  };

  // Handle Edit Save
  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.fullName.trim() || !editForm.username.trim()) {
      addToast("Full Name and Username are required", "error");
      return;
    }
    const updated = {
      ...profile,
      fullName: editForm.fullName.trim(),
      username: editForm.username.trim().toLowerCase().replace(/\s+/g, ""),
      bio: editForm.bio.trim(),
      location: editForm.location.trim()
    } as ProfileData;
    saveProfileData(updated);
    setIsEditing(false);
    addToast("Profile updated successfully", "success");
  };

  // Share profile
  const handleShareProfile = () => {
    if (!profile) return;
    const shareUrl = `${window.location.origin}/?profile=${profile.username}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      addToast("Profile link copied to clipboard!", "success");
    }).catch(() => {
      addToast("Failed to copy profile link", "error");
    });
  };

  // Camera integration
  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300, facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      addToast("Webcam unavailable. Falling back to local image gallery.", "warn");
      setCameraActive(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      
      addToast("Uploading captured photo to secure storage...", "info");
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl, thumbnail: dataUrl })
        });
        if (!response.ok) throw new Error("Server upload failed");
        const uploadResult = await response.json();
        const persistentUrl = uploadResult.url;

        setAvatarImgError(false);
        setEditForm(prev => ({ ...prev, avatar: persistentUrl }));
        if (profile) {
          await saveProfileData({ ...profile, avatar: persistentUrl });
        }
        addToast("Profile photo captured and saved successfully!", "success");
      } catch (err) {
        console.error("Webcam upload error:", err);
        addToast("Failed to upload captured photo. Please try file upload.", "error");
      }
    }
    stopCamera();
    setPhotoModal(null);
  };

  // File uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: "photo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    addToast(`Compressing & uploading ${target === "photo" ? "profile photo" : "banner"}...`, "info");
    try {
      const result = await imageService.uploadImage(file);
      const uploadedUrl = result.url;
      
      if (!uploadedUrl) {
        throw new Error("No URL returned from upload server");
      }

      setAvatarImgError(false);

      if (target === "photo") {
        setEditForm(prev => ({ ...prev, avatar: uploadedUrl }));
        if (profile) {
          await saveProfileData({ ...profile, avatar: uploadedUrl });
        }
      } else {
        setEditForm(prev => ({ ...prev, banner: uploadedUrl }));
        if (profile) {
          await saveProfileData({ ...profile, banner: uploadedUrl });
        }
      }
      addToast(`${target === "photo" ? "Profile picture" : "Banner"} uploaded & saved successfully!`, "success");
    } catch (err) {
      console.error("Upload error:", err);
      addToast("Image upload failed. Please try again with a valid JPG/PNG.", "error");
    } finally {
      if (e.target) {
        e.target.value = "";
      }
      setPhotoModal(null);
    }
  };

  // Paste direct Cloudinary/Web URL
  const handleCloudinaryUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudinaryUrl.trim()) return;

    if (photoModal === "photo") {
      setEditForm(prev => ({ ...prev, avatar: cloudinaryUrl.trim() }));
      if (profile) {
        saveProfileData({ ...profile, avatar: cloudinaryUrl.trim() });
      }
      addToast("Profile picture updated from URL!", "success");
    } else {
      setEditForm(prev => ({ ...prev, banner: cloudinaryUrl.trim() }));
      if (profile) {
        saveProfileData({ ...profile, banner: cloudinaryUrl.trim() });
      }
      addToast("Banner graphic updated from URL!", "success");
    }
    setCloudinaryUrl("");
    setPhotoModal(null);
  };

  // Choose preset avatar/banner gradient
  const selectPreset = (preset: string, target: "photo" | "banner") => {
    if (target === "photo") {
      setEditForm(prev => ({ ...prev, avatar: preset }));
      if (profile) {
        saveProfileData({ ...profile, avatar: preset });
      }
    } else {
      setEditForm(prev => ({ ...prev, banner: preset }));
      if (profile) {
        saveProfileData({ ...profile, banner: preset });
      }
    }
    setPhotoModal(null);
    addToast(`${target === "photo" ? "Avatar" : "Banner"} preset updated!`, "success");
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!profile) return;
    const reports = JSON.parse(localStorage.getItem("linco_db_posts") || "[]");
    const unlocked = JSON.parse(localStorage.getItem("linco_db_unlocked_posts") || "[]");
    const savedSearches = JSON.parse(localStorage.getItem("linco_saved_searches") || "[]");
    const settings = {
      notifications: { push: notifPush, email: notifEmail, sms: false },
      appearance: settingsTheme,
      language: settingsLang
    };

    const payload = {
      profile,
      reports: reports.filter((r: any) => unlocked.includes(r.id) || r.contact?.includes(profile.fullName)),
      savedSearches,
      settings,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linco_data_export_${profile.username}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("JSON data backup downloaded.", "success");
  };

  // Permanent Account Deletion
  const handleDeleteAccountFinal = () => {
    setReauthenticating(true);
    addToast("Deauthorizing session coordinates...", "info");
    
    setTimeout(() => {
      setReauthenticating(false);
      saveProfileData(null);
      setDeleteStep(0);
      setDeleteConfirmText("");
      setReauthPassword("");
      setShowSettings(false);
      addToast("Account permanently deleted.", "success");
    }, 1500);
  };

  // Helper to render gradients
  const getGradientStyle = (str: string) => {
    if (!str) return {};
    if (str.startsWith("linear-gradient")) {
      return { background: str };
    }
    return { backgroundImage: `url(${str})`, backgroundSize: "cover", backgroundPosition: "center" };
  };

  // Check if avatar is gradient
  const isGradient = (str: string) => {
    return str && str.startsWith("linear-gradient");
  };

  return (
    <div className="w-full max-w-2xl mx-auto pb-12 font-sans text-slate-800">
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: PROFILE SETUP ONBOARDING (First-time users) */}
        {!profile ? (
          <motion.div
            key="profile-setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-md mx-auto text-center space-y-5 shadow-sm relative overflow-hidden"
          >
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Set up your profile</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tell us a bit about yourself so citizens can coordinate lost and found handovers with you. You can skip this and proceed instantly.
              </p>
            </div>

            {/* Inline Avatar Selection */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-slate-700 block">
                Choose Profile Picture
              </span>
              <div className="flex flex-col items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPhotoModal("photo")}
                  className="w-20 h-20 rounded-full border border-slate-200 hover:border-indigo-500 transition relative group overflow-hidden flex items-center justify-center cursor-pointer bg-slate-100 shadow-2xs"
                >
                  <LincoAvatar
                    src={editForm.avatar}
                    name={editForm.fullName || "User"}
                    size="xl"
                    className="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                    <Camera size={16} className="text-white" />
                  </div>
                </button>
                <div className="flex gap-1.5 justify-center">
                  {PRESET_AVATARS.slice(0, 4).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditForm(p => ({ ...p, avatar: preset }))}
                      className="w-6 h-6 rounded-full border border-slate-200 transition hover:scale-105 cursor-pointer shadow-2xs"
                      style={{ background: preset }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setPhotoModal("photo")}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] flex items-center justify-center text-slate-600 font-medium transition cursor-pointer shadow-2xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateProfileSubmit} className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Smith"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3.5 h-11 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. liamsmith"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3.5 h-11 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Bio (Optional)</label>
                <textarea
                  placeholder="e.g. Ready to help find and return lost items."
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition resize-none shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">City</label>
                <input
                  type="text"
                  placeholder="e.g. Bandra, Mumbai or Indiranagar, Bengaluru"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3.5 h-11 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition shadow-2xs"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center justify-center shadow-2xs"
                >
                  Create Profile
                </button>
                <button
                  type="button"
                  onClick={handleSkipProfile}
                  className="w-full h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs transition cursor-pointer flex items-center justify-center shadow-2xs"
                >
                  Skip for Now
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          
          /* VIEW 2: PROFILE IS CREATED */
          <motion.div
            key="profile-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* SCREEN 2A: MODERN MINIMAL PROFILE PAGE */}
            {!showSettings ? (
              <div className="space-y-5">
                
                {/* PROFILE BANNER & COVER SECTION */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                  {/* Banner graphic */}
                  <div 
                    className="h-36 sm:h-44 w-full relative transition-all duration-300"
                    style={getGradientStyle(profile.banner)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
                    
                    {/* Cover graphic update */}
                    <button
                      onClick={() => setPhotoModal("banner")}
                      className="absolute top-3.5 right-3.5 bg-white/80 hover:bg-white border border-slate-200 backdrop-blur-xs text-[11px] font-semibold text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Camera size={12} />
                      <span>Change Cover</span>
                    </button>
                  </div>

                  {/* Profile info metadata block */}
                  <div className="px-6 pb-6 pt-12 sm:pt-6 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
                    {/* Circular floating avatar */}
                    <div className="absolute -top-14 sm:-top-16 left-1/2 sm:left-6 -translate-x-1/2 sm:translate-x-0">
                      <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-full p-0.5 bg-white border-2 border-slate-200 shadow-md relative group overflow-hidden flex items-center justify-center">
                        <LincoAvatar 
                          src={profile.avatar} 
                          name={profile.fullName} 
                          size="hero" 
                          className="w-full h-full" 
                        />
                        <button
                          onClick={() => setPhotoModal("photo")}
                          className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-10"
                          aria-label="Change Profile Photo"
                        >
                          <Camera size={16} className="text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Meta fields */}
                    <div className="text-center sm:text-left sm:pl-28 space-y-1 w-full pt-2 sm:pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                        <h2 className="text-lg font-bold text-slate-900 leading-tight">
                          {profile.fullName}
                        </h2>
                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 self-center sm:self-auto inline-block font-semibold">
                          @{profile.username}
                        </span>
                      </div>
                      
                      {profile.bio && (
                        <p className="text-xs text-slate-600 mt-1 font-normal leading-relaxed max-w-md">
                          {profile.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{profile.location ? profile.location : "Location not specified"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          <span>Member since {profile.memberSince}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* STATS OVERVIEW BAR */}
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-base font-bold text-slate-900">{stats.total}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Total Items</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-base font-bold text-rose-600">{stats.lost}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Lost</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-base font-bold text-emerald-600">{stats.found}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Found</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-2xs">
                    <div className="text-base font-bold text-indigo-600">{stats.resolved}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Resolved</div>
                  </div>
                </div>

                {/* PRIMARY ACTIONS */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditForm(profile);
                        setIsEditing(!isEditing);
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Edit3 size={13} />
                      <span>Edit Profile</span>
                    </button>

                    <button
                      onClick={handleShareProfile}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <Share2 size={13} />
                      <span>Share Profile</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowSettings(true);
                      setActiveCategory(null);
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Settings size={13} />
                    <span>Settings</span>
                  </button>
                </div>

                {/* SLIDING EDITOR FORM */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <form 
                        onSubmit={handleEditProfileSubmit} 
                        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm"
                      >
                        <h3 className="text-xs font-bold uppercase text-indigo-600 tracking-wider">
                          Edit Profile Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
                            <input
                              type="text"
                              required
                              value={editForm.fullName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition shadow-2xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">Username</label>
                            <input
                              type="text"
                              required
                              value={editForm.username}
                              onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition shadow-2xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 block">Biography</label>
                          <textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition resize-none shadow-2xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700 block">City / Neighborhood</label>
                            <button
                              type="button"
                              onClick={async () => {
                                addToast("Detecting your location...", "info");
                                const res = await requestGenuineLocation();
                                const detectedLocation = res?.city || res?.formattedAddress;
                                if (detectedLocation) {
                                  setEditForm(prev => ({ ...prev, location: detectedLocation }));
                                  addToast(`Location set to: ${detectedLocation}`, "success");
                                } else {
                                  addToast("Could not detect location. Please type your city.", "warn");
                                }
                              }}
                              className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer flex items-center gap-1 transition"
                            >
                              <MapPin size={11} /> Detect GPS
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. Bandra West, Mumbai"
                            value={editForm.location}
                            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition shadow-2xs"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs cursor-pointer hover:bg-slate-50 shadow-2xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-2xs"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            ) : (
              
              /* SCREEN 2B: GROUPED SETTINGS PAGE (Perfect Groupings) */
              <motion.div
                key="profile-settings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {/* Header Back Row */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <button
                    onClick={() => {
                      if (activeCategory) {
                        setActiveCategory(null);
                      } else {
                        setShowSettings(false);
                      }
                    }}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition text-xs font-semibold cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    <span>{activeCategory ? "Back to Settings" : "Back to Profile"}</span>
                  </button>
                  <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    {activeCategory ? `${activeCategory}` : "Settings"}
                  </h3>
                  <div className="w-12" /> {/* alignment spacer */}
                </div>

                {/* GROUPED MENU LIST */}
                {!activeCategory ? (
                  <div className="space-y-5">
                    
                    {/* SECTION 1: ACCOUNT */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                        Account
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
                        <button
                          onClick={() => {
                            setShowSettings(false);
                            setEditForm(profile);
                            setIsEditing(true);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <span className="text-slate-800 font-semibold">Edit Profile</span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                        <button
                          onClick={() => setActiveCategory("Email")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <div className="flex justify-between items-center w-full pr-2">
                            <span className="text-slate-800 font-semibold">Email</span>
                            <span className="text-xs text-slate-500">{settingsEmail}</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                        <button
                          onClick={() => setActiveCategory("Password")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <div className="flex justify-between items-center w-full pr-2">
                            <span className="text-slate-800 font-semibold">Password</span>
                            <span className="text-xs text-slate-500 font-mono">••••••••</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>
                      </div>
                    </div>

                    {/* SECTION 2: PRIVACY */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                        Privacy
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
                        <button
                          onClick={() => setActiveCategory("Blocked Users")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <span className="text-slate-800 font-semibold">Blocked Users</span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                        <button
                          onClick={handleExportJSON}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <span className="text-slate-800 font-semibold">Download My Data</span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                        <button
                          onClick={() => setDeleteStep(1)}
                          className="w-full px-4 py-3 text-left hover:bg-rose-50 flex items-center justify-between transition cursor-pointer text-xs text-rose-600"
                        >
                          <span className="font-semibold">Delete Account</span>
                          <ChevronRight size={14} className="text-rose-400" />
                        </button>
                      </div>
                    </div>

                    {/* SECTION 3: NOTIFICATIONS */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                        Notifications
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-slate-800 block">Push Notifications</span>
                            <span className="text-[11px] text-slate-500">Updates for immediate matches & chats</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNotifPush(!notifPush)}
                            className={`w-9 h-5 rounded-full p-0.5 transition flex items-center ${notifPush ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'} cursor-pointer`}
                          >
                            <div className="w-4 h-4 bg-white rounded-full shadow-2xs" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div>
                            <span className="text-xs font-semibold text-slate-800 block">Email Reports</span>
                            <span className="text-[11px] text-slate-500">Weekly digests of unclaimed items</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNotifEmail(!notifEmail)}
                            className={`w-9 h-5 rounded-full p-0.5 transition flex items-center ${notifEmail ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'} cursor-pointer`}
                          >
                            <div className="w-4 h-4 bg-white rounded-full shadow-2xs" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: APPEARANCE */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                        Appearance
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">Theme</span>
                          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            {["light", "dark"].map((themeOption) => (
                              <button
                                key={themeOption}
                                onClick={() => {
                                  setSettingsTheme(themeOption);
                                  addToast(`Theme set to ${themeOption}`, "info");
                                }}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md capitalize transition ${
                                  settingsTheme === themeOption 
                                    ? "bg-white text-indigo-600 shadow-2xs" 
                                    : "text-slate-500 hover:text-slate-800"
                                } cursor-pointer`}
                              >
                                {themeOption}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <span className="text-xs font-semibold text-slate-800">Language</span>
                          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            {[
                              { code: "en", label: "EN" },
                              { code: "hi", label: "हि" },
                              { code: "bn", label: "বা" }
                            ].map((langOption) => (
                              <button
                                key={langOption.code}
                                onClick={() => {
                                  setSettingsLang(langOption.code);
                                  addToast(`Language set to ${langOption.code === 'en' ? 'English' : langOption.code === 'hi' ? 'Hindi' : 'Bengali'}`, "info");
                                }}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                                  settingsLang === langOption.code 
                                    ? "bg-white text-indigo-600 shadow-2xs" 
                                    : "text-slate-500 hover:text-slate-800"
                                } cursor-pointer`}
                              >
                                {langOption.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 5: SUPPORT */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                        Support
                      </h4>
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
                        <button
                          onClick={() => {
                            setShowSettings(false);
                            window.dispatchEvent(new CustomEvent("open-linco-chat"));
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition cursor-pointer text-xs text-slate-800 font-semibold"
                        >
                          <span>Help & Assistant</span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                        <button
                          onClick={() => setActiveCategory("Contact")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition cursor-pointer text-xs text-slate-800 font-semibold"
                        >
                          <span>Contact</span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                        <button
                          onClick={() => setActiveCategory("About")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between transition cursor-pointer text-xs text-slate-800 font-semibold"
                        >
                          <span>About</span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>
                      </div>
                    </div>

                    {/* Explicit Logout Row */}
                    <button
                      onClick={() => {
                        saveProfileData(null);
                        setShowSettings(false);
                        addToast("Logged out successfully.", "success");
                      }}
                      className="w-full py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                    >
                      <LogOut size={13} />
                      <span>Logout from LINCO</span>
                    </button>
                  </div>
                ) : (
                  
                  /* NESTED SETTINGS VIEWER */
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                    {activeCategory === "Email" && (
                      <div className="space-y-4">
                        <span className="text-xs font-semibold text-slate-800 block">Update Email Address</span>
                        <input
                          type="email"
                          value={settingsEmail}
                          onChange={(e) => setSettingsEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition shadow-2xs"
                        />
                        <button
                          onClick={() => {
                            setActiveCategory(null);
                            addToast("Email updated successfully", "success");
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer shadow-2xs"
                        >
                          Save Email
                        </button>
                      </div>
                    )}

                    {activeCategory === "Password" && (
                      <div className="space-y-4">
                        <span className="text-xs font-semibold text-slate-800 block">Change Password</span>
                        <div className="space-y-3">
                          <input
                            type="password"
                            placeholder="Current Password"
                            value={settingsPassword}
                            onChange={(e) => setSettingsPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition shadow-2xs"
                          />
                          <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs text-slate-900 outline-none transition shadow-2xs"
                          />
                        </div>
                        <button
                          disabled={!newPassword}
                          onClick={() => {
                            setActiveCategory(null);
                            setNewPassword("");
                            addToast("Password changed successfully", "success");
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                        >
                          Change Password
                        </button>
                      </div>
                    )}

                    {activeCategory === "Blocked Users" && (
                      <div className="space-y-4">
                        <span className="text-xs font-semibold text-slate-800 block">Blocked Users</span>
                        {blockedUsers.length > 0 ? (
                          <div className="space-y-2">
                            {blockedUsers.map((username) => (
                              <div key={username} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="text-xs font-mono text-slate-700 font-medium">@{username}</span>
                                <button
                                  onClick={() => {
                                    setBlockedUsers(blockedUsers.filter(u => u !== username));
                                    addToast(`Unblocked @${username}`, "info");
                                  }}
                                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                                >
                                  Unblock
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No blocked users.</p>
                        )}
                      </div>
                    )}

                    {activeCategory === "Contact" && (
                      <div className="space-y-4">
                        <span className="text-xs font-semibold text-slate-800 block">Contact LINCO Support</span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          For general support, data access requests or neighborhood coordination queries, contact our team at:
                        </p>
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 shadow-2xs">
                          <div>📧 Email: support@linco.org</div>
                          <div>🌐 Web: https://linco.org</div>
                          <div>📍 Address: Local Community Safe Drop Point</div>
                        </div>
                      </div>
                    )}

                    {activeCategory === "About" && (
                      <div className="space-y-4">
                        <span className="text-xs font-semibold text-slate-800 block">About LINCO</span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          LINCO is a community lost and found handover application that helps you find and recover misplaced objects using smart Gemini AI semantic matches.
                        </p>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600 shadow-2xs">
                          <div>Application Version: v1.3.0 Stable</div>
                          <div>Infrastructure: Sandboxed Local Client</div>
                          <div>License: Apache-2.0 Open Source</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            )}

          </motion.div>
        )}

      </AnimatePresence>

      {/* PHOTO / BANNER UPLOAD MODAL */}
      <AnimatePresence>
        {photoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { stopCamera(); setPhotoModal(null); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm relative z-10 space-y-5 shadow-xl text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                  Update {photoModal === "photo" ? "Profile Photo" : "Banner"}
                </h4>
                <button
                  onClick={() => { stopCamera(); setPhotoModal(null); }}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              {/* VIDEO CAMERA STREAM */}
              {cameraActive && photoModal === "photo" ? (
                <div className="space-y-3">
                  <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-xl overflow-hidden border border-slate-200 bg-black shadow-2xs">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover scale-x-[-1]" 
                    />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={stopCamera}
                      className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer hover:bg-slate-200 shadow-2xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-2xs"
                    >
                      Capture Photo
                    </button>
                  </div>
                </div>
              ) : (
                
                <div className="space-y-4">
                  {/* Image Sources Options: Camera, Gallery, Cloudinary Url */}
                  <div className="grid grid-cols-1 gap-2">
                    {photoModal === "photo" && (
                      <button
                        onClick={startCamera}
                        className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                      >
                        <Camera size={14} className="text-indigo-600" />
                        <span>Use Camera Stream</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (photoModal === "photo") {
                          avatarFileInputRef.current?.click();
                        } else {
                          bannerFileInputRef.current?.click();
                        }
                      }}
                      className="p-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <Share2 size={14} className="text-indigo-600" />
                      <span>Choose From Gallery</span>
                    </button>
                  </div>

                  {/* Cloudinary/Web URL Input */}
                  <form onSubmit={handleCloudinaryUrlSubmit} className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Or Paste Image URL
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={cloudinaryUrl}
                        onChange={(e) => setCloudinaryUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:border-indigo-500 shadow-2xs"
                      />
                      <button
                        type="submit"
                        className="px-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 shadow-2xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </form>

                  {/* Curated presets preview list */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Or Choose Preset Theme
                    </span>
                    <div className="flex gap-2 justify-center">
                      {(photoModal === "photo" ? PRESET_AVATARS : PRESET_BANNERS).map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectPreset(preset, photoModal)}
                          className="w-8 h-8 rounded-full border border-slate-200 transition transform hover:scale-110 cursor-pointer shadow-2xs"
                          style={{ background: preset }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden inputs */}
      <input
        type="file"
        ref={avatarFileInputRef}
        accept="image/*"
        onChange={(e) => handleFileChange(e, "photo")}
        className="hidden"
      />
      <input
        type="file"
        ref={bannerFileInputRef}
        accept="image/*"
        onChange={(e) => handleFileChange(e, "banner")}
        className="hidden"
      />

      {/* DELETE ACCOUNT DOUBLE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deleteStep > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!reauthenticating) setDeleteStep(0); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-rose-200 rounded-2xl p-6 w-full max-w-sm relative z-10 space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-2 text-rose-600 border-b border-rose-100 pb-3">
                <AlertTriangle size={18} />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Confirm Deletion
                </h4>
              </div>

              {deleteStep === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This action is final and cannot be undone. All your lost/found registrations, handovers, and credentials will be purged.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 block">Type your password to confirm</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={reauthPassword}
                        onChange={(e) => setReauthPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-xs text-slate-900 outline-none shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setDeleteStep(0)}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs cursor-pointer hover:bg-slate-50 shadow-2xs"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!reauthPassword}
                      onClick={() => setDeleteStep(2)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs cursor-pointer disabled:opacity-40 shadow-2xs"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Type <strong className="text-rose-600 font-mono">DELETE</strong> below to permanently destroy your LINCO profile and credentials.
                  </p>
                  
                  <input
                    type="text"
                    placeholder="DELETE"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-rose-300 focus:border-rose-500 rounded-xl text-xs text-slate-900 outline-none font-mono text-center tracking-widest shadow-2xs"
                  />

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setDeleteStep(1)}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs cursor-pointer hover:bg-slate-50 shadow-2xs"
                    >
                      Back
                    </button>
                    <button
                      disabled={deleteConfirmText !== "DELETE" || reauthenticating}
                      onClick={handleDeleteAccountFinal}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs cursor-pointer disabled:opacity-40 shadow-2xs"
                    >
                      {reauthenticating ? "Deleting..." : "Permanently Delete"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
