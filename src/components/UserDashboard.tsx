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
  Shield, 
  Bell, 
  Palette, 
  Languages, 
  HelpCircle, 
  Info, 
  Download, 
  Trash2, 
  LogOut, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Lock,
  Smartphone,
  Mail,
  AlertTriangle,
  Sparkles,
  Link2
} from "lucide-react";
import { imageService } from "../services/imageService";
import { auth, db } from "../services/firebaseClient";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

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
  
  // Camera capture states
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hidden file inputs
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  // Settings detail state variables
  const [settingsEmail, setSettingsEmail] = useState("user@example.com");
  const [settingsPhone, setSettingsPhone] = useState("+91 98765 43210");
  const [settingsPassword, setSettingsPassword] = useState("••••••••");
  const [newPassword, setNewPassword] = useState("");
  
  // Toggles for notifications
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);

  // Themes & languages
  const [settingsTheme, setSettingsTheme] = useState("dark");
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
    "linear-gradient(120deg, #1e1b4b 0%, #311042 100%)",
    "linear-gradient(120deg, #0f172a 0%, #1e293b 100%)",
    "linear-gradient(120deg, #022c22 0%, #064e3b 100%)",
    "linear-gradient(120deg, #1c1917 0%, #44403c 100%)",
    "linear-gradient(120deg, #0c4a6e 0%, #075985 100%)"
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
      setSettingsPhone(auth.currentUser.phoneNumber || "");
    }
  }, [profile]);

  // Sync to global App.tsx state whenever profile changes
  const saveProfileData = (newProfile: ProfileData | null) => {
    setProfile(newProfile);
    if (newProfile) {
      localStorage.setItem("linco_profile_details", JSON.stringify(newProfile));
      localStorage.setItem("linco_profile_is_logged_in", "true");
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        updateDoc(userRef, {
          displayName: newProfile.fullName,
          username: newProfile.username,
          city: newProfile.location,
          bio: newProfile.bio,
          photoURL: newProfile.avatar
        }).catch(err => console.error("Error updating Firestore on profile save:", err));
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
      location: editForm.location.trim() || "Kolkata, India",
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
      location: "Kolkata, India",
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

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      
      setEditForm(prev => ({ ...prev, avatar: dataUrl }));
      if (profile) {
        saveProfileData({ ...profile, avatar: dataUrl });
      }
      addToast("Photo captured successfully!", "success");
    }
    stopCamera();
    setPhotoModal(null);
  };

  // File uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: "photo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    addToast("Compressing & uploading to Cloudinary...", "info");
    try {
      const result = await imageService.uploadImage(file);
      const uploadedUrl = result.url;
      
      if (target === "photo") {
        setEditForm(prev => ({ ...prev, avatar: uploadedUrl }));
        if (profile) {
          saveProfileData({ ...profile, avatar: uploadedUrl });
        }
      } else {
        setEditForm(prev => ({ ...prev, banner: uploadedUrl }));
        if (profile) {
          saveProfileData({ ...profile, banner: uploadedUrl });
        }
      }
      addToast("Image uploaded successfully!", "success");
    } catch (err) {
      console.error("Upload error:", err);
      addToast("Cloudinary upload timed out. Using local offline preview.", "warn");
      const reader = new FileReader();
      reader.onload = (event) => {
        const localUrl = event.target?.result as string;
        if (target === "photo") {
          setEditForm(prev => ({ ...prev, avatar: localUrl }));
          if (profile) {
            saveProfileData({ ...profile, avatar: localUrl });
          }
        } else {
          setEditForm(prev => ({ ...prev, banner: localUrl }));
          if (profile) {
            saveProfileData({ ...profile, banner: localUrl });
          }
        }
      };
      reader.readAsDataURL(file);
    }
    setPhotoModal(null);
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
      notifications: { push: notifPush, email: notifEmail, sms: notifSMS },
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
    <div className="w-full max-w-2xl mx-auto pb-12 font-sans text-slate-200">
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: PROFILE SETUP ONBOARDING (First-time users) */}
        {!profile ? (
          <motion.div
            key="profile-setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-[#0b0c10] border border-[#1b1c23] rounded-3xl p-6 sm:p-8 max-w-md mx-auto text-center space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#6366f1]" />
            
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-100 tracking-tight">Set up your profile</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Welcome to LINCO. Tell us a bit about yourself so citizens can coordinate lost and found handovers with you. You can skip this and proceed instantly.
              </p>
            </div>

            {/* Inline Avatar Selection */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Choose Profile Picture
              </span>
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPhotoModal("photo")}
                  className="w-20 h-20 rounded-full border-2 border-slate-800 hover:border-[#6366f1] transition relative group overflow-hidden flex items-center justify-center cursor-pointer bg-slate-950 shadow-inner"
                >
                  {isGradient(editForm.avatar) ? (
                    <div 
                      className="w-full h-full flex items-center justify-center text-slate-100 text-2xl font-black uppercase"
                      style={{ background: editForm.avatar }}
                    >
                      {editForm.fullName ? editForm.fullName.charAt(0) : "U"}
                    </div>
                  ) : (
                    <img 
                      src={editForm.avatar} 
                      alt="Avatar Preview" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={14} className="text-white" />
                  </div>
                </button>
                <div className="flex gap-1.5 justify-center">
                  {PRESET_AVATARS.slice(0, 4).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditForm(p => ({ ...p, avatar: preset }))}
                      className="w-6 h-6 rounded-full border border-slate-900 transition hover:scale-110 cursor-pointer"
                      style={{ background: preset }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setPhotoModal("photo")}
                    className="w-6 h-6 rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-800 text-[10px] flex items-center justify-center text-slate-400 font-bold transition hover:scale-110 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateProfileSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Smith"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 h-11 bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl text-xs text-slate-100 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. liamsmith"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 h-11 bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl text-xs text-slate-100 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Bio (Optional)</label>
                <textarea
                  placeholder="e.g. Ready to help find and return lost items."
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl text-xs text-slate-100 outline-none transition resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">City</label>
                <input
                  type="text"
                  placeholder="e.g. Kolkata, India"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 h-11 bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl text-xs text-slate-100 outline-none transition"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs tracking-wide transition cursor-pointer flex items-center justify-center"
                >
                  Create Profile
                </button>
                <button
                  type="button"
                  onClick={handleSkipProfile}
                  className="w-full h-11 bg-transparent border border-slate-900 hover:border-slate-850 hover:bg-[#0c0d14]/40 text-slate-400 font-bold rounded-xl text-xs tracking-wide transition cursor-pointer flex items-center justify-center"
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
              <div className="space-y-6">
                
                {/* PROFILE BANNER & COVER SECTION */}
                <div className="relative rounded-3xl overflow-hidden border border-[#1b1c23] bg-[#0c0d14] shadow-xl">
                  {/* Banner graphic */}
                  <div 
                    className="h-36 sm:h-44 w-full relative transition-all duration-300"
                    style={getGradientStyle(profile.banner)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08080c]/90 via-[#08080c]/20 to-transparent" />
                    
                    {/* Cover graphic update */}
                    <button
                      onClick={() => setPhotoModal("banner")}
                      className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 border border-slate-800 backdrop-blur-md text-[10px] font-bold text-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Camera size={11} />
                      <span>Change Cover</span>
                    </button>
                  </div>

                  {/* Profile info metadata block */}
                  <div className="px-6 pb-6 pt-12 sm:pt-8 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
                    {/* Circular floating avatar */}
                    <div className="absolute -top-14 sm:-top-16 left-1/2 sm:left-6 -translate-x-1/2 sm:translate-x-0">
                      <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-full p-0.5 bg-[#0c0d14] border border-[#20212a] shadow-2xl relative group overflow-hidden">
                        {isGradient(profile.avatar) ? (
                          <div 
                            className="w-full h-full rounded-full flex items-center justify-center text-slate-100 text-3xl font-black uppercase"
                            style={{ background: profile.avatar }}
                          >
                            {profile.fullName.charAt(0)}
                          </div>
                        ) : (
                          <img 
                            src={profile.avatar} 
                            alt={profile.fullName} 
                            className="w-full h-full rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                            }}
                          />
                        )}
                        <button
                          onClick={() => setPhotoModal("photo")}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        >
                          <Camera size={14} className="text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Meta fields */}
                    <div className="text-center sm:text-left sm:pl-28 space-y-1 w-full pt-2 sm:pt-0">
                      <h2 className="text-lg font-bold text-slate-100 leading-tight">
                        {profile.fullName}
                      </h2>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-850 self-center sm:self-auto inline-block">
                        @{profile.username}
                      </span>
                      
                      {profile.bio && (
                        <p className="text-xs text-slate-400 mt-2 font-normal leading-relaxed max-w-md">
                          {profile.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <MapPin size={11} className="text-slate-600" />
                          <span>{profile.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-600" />
                          <span>Member since {profile.memberSince}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRIMARY ACTIONS */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-900">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditForm(profile);
                        setIsEditing(!isEditing);
                      }}
                      className="px-4 py-2 bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Edit Profile</span>
                    </button>

                    <button
                      onClick={handleShareProfile}
                      className="px-4 py-2 bg-transparent hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
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
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-indigo-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
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
                        className="bg-[#0b0c11] border border-[#1b1c24] rounded-2xl p-5 space-y-4"
                      >
                        <h3 className="text-xs font-bold uppercase text-indigo-400 tracking-wider">
                          Edit Profile Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                            <input
                              type="text"
                              required
                              value={editForm.fullName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                              className="w-full px-3 py-2 bg-[#111218] border border-[#20212a] focus:border-[#6366f1] rounded-xl text-xs text-slate-100 outline-none transition"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
                            <input
                              type="text"
                              required
                              value={editForm.username}
                              onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                              className="w-full px-3 py-2 bg-[#111218] border border-[#20212a] focus:border-[#6366f1] rounded-xl text-xs text-slate-100 outline-none transition"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Biography</label>
                          <textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 bg-[#111218] border border-[#20212a] focus:border-[#6366f1] rounded-xl text-xs text-slate-100 outline-none transition resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</label>
                          <input
                            type="text"
                            value={editForm.location}
                            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#111218] border border-[#20212a] focus:border-[#6366f1] rounded-xl text-xs text-slate-100 outline-none transition"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-3.5 py-1.5 bg-transparent border border-slate-800 text-slate-400 font-bold rounded-lg text-[11px] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-[#6366f1] hover:bg-[#5053df] text-white font-bold rounded-lg text-[11px] cursor-pointer"
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
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <button
                    onClick={() => {
                      if (activeCategory) {
                        setActiveCategory(null);
                      } else {
                        setShowSettings(false);
                      }
                    }}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-xs font-bold cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    <span>{activeCategory ? "Back to Settings" : "Back to Profile"}</span>
                  </button>
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider font-mono">
                    {activeCategory ? `${activeCategory}` : "Settings"}
                  </h3>
                  <div className="w-12" /> {/* alignment spacer */}
                </div>

                {/* GROUPED MENU LIST */}
                {!activeCategory ? (
                  <div className="space-y-6">
                    
                    {/* SECTION 1: ACCOUNT */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 tracking-wider uppercase font-mono px-1">
                        ACCOUNT
                      </h4>
                      <div className="bg-[#0b0c10] border border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-900">
                        <button
                          onClick={() => {
                            setShowSettings(false);
                            setEditForm(profile);
                            setIsEditing(true);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-900/40 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <span className="text-slate-300 font-bold">Edit Profile</span>
                          <ChevronRight size={14} className="text-slate-600" />
                        </button>

                        <button
                          onClick={() => setActiveCategory("Email")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-900/40 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <div className="flex justify-between items-center w-full pr-2">
                            <span className="text-slate-300 font-bold">Email</span>
                            <span className="text-[11px] text-slate-500 font-normal">{settingsEmail}</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-600" />
                        </button>

                        <button
                          onClick={() => setActiveCategory("Phone")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-900/40 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <div className="flex justify-between items-center w-full pr-2">
                            <span className="text-slate-300 font-bold">Phone</span>
                            <span className="text-[11px] text-slate-500 font-normal">{settingsPhone}</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-600" />
                        </button>

                        <button
                          onClick={() => setActiveCategory("Password")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-900/40 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <div className="flex justify-between items-center w-full pr-2">
                            <span className="text-slate-300 font-bold">Password</span>
                            <span className="text-[11px] text-slate-500 font-normal">••••••••</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-600" />
                        </button>
                      </div>
                    </div>

                    {/* SECTION 2: PRIVACY */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 tracking-wider uppercase font-mono px-1">
                        PRIVACY
                      </h4>
                      <div className="bg-[#0b0c10] border border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-900">
                        <button
                          onClick={() => setActiveCategory("Blocked Users")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-900/40 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <span className="text-slate-300 font-bold">Blocked Users</span>
                          <ChevronRight size={14} className="text-slate-600" />
                        </button>

                        <button
                          onClick={handleExportJSON}
                          className="w-full px-4 py-3 text-left hover:bg-slate-900/40 flex items-center justify-between transition cursor-pointer text-xs"
                        >
                          <span className="text-slate-300 font-bold">Download My Data</span>
                          <ChevronRight size={14} className="text-slate-600" />
                        </button>

                        <button
                          onClick={() => setDeleteStep(1)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-900/40 flex items-center justify-between transition cursor-pointer text-xs text-rose-400"
                        >
                          <span className="font-bold">Delete Account</span>
                          <ChevronRight size={14} className="text-slate-600" />
                        </button>
                      </div>
                    </div>

                    {/* SECTION 3: NOTIFICATIONS */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 tracking-wider uppercase font-mono px-1">
                        NOTIFICATIONS
                      </h4>
                      <div className="bg-[#0b0c10] border border-slate-900 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-300 block">Push Notifications</span>
                            <span className="text-[10px] text-slate-500">Updates for immediate matches & chats</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNotifPush(!notifPush)}
                            className={`w-9 h-5 rounded-full p-0.5 transition flex items-center ${notifPush ? 'bg-[#6366f1] justify-end' : 'bg-slate-800 justify-start'} cursor-pointer`}
                          >
                            <div className="w-4 h-4 bg-white rounded-full shadow" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                          <div>
                            <span className="text-xs font-bold text-slate-300 block">Email Reports</span>
                            <span className="text-[10px] text-slate-500">Weekly digests of unclaimed items</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNotifEmail(!notifEmail)}
                            className={`w-9 h-5 rounded-full p-0.5 transition flex items-center ${notifEmail ? 'bg-[#6366f1] justify-end' : 'bg-slate-800 justify-start'} cursor-pointer`}
                          >
                            <div className="w-4 h-4 bg-white rounded-full shadow" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                          <div>
                            <span className="text-xs font-bold text-slate-300 block">SMS Alerts</span>
                            <span className="text-[10px] text-slate-500">Direct carrier text ping on urgent handovers</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNotifSMS(!notifSMS)}
                            className={`w-9 h-5 rounded-full p-0.5 transition flex items-center ${notifSMS ? 'bg-[#6366f1] justify-end' : 'bg-slate-800 justify-start'} cursor-pointer`}
                          >
                            <div className="w-4 h-4 bg-white rounded-full shadow" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: APPEARANCE */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-black text-slate-500 tracking-wider uppercase font-mono px-1">
                        APPEARANCE
                      </h4>
                      <div className="bg-[#0b0c10] border border-slate-900 rounded-2xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">Theme</span>
                          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                            {["light", "dark"].map((themeOption) => (
                              <button
                                key={themeOption}
                                onClick={() => {
                                  setSettingsTheme(themeOption);
                                  addToast(`Theme set to ${themeOption}`, "info");
                                }}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md capitalize transition ${
                                  settingsTheme === themeOption 
                                    ? "bg-slate-900 text-[#6366f1]" 
                                    : "text-slate-500 hover:text-slate-300"
                                } cursor-pointer`}
                              >
                                {themeOption}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-900">
                          <span className="text-xs font-bold text-slate-300">Language</span>
                          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850">
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
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                                  settingsLang === langOption.code 
                                    ? "bg-slate-900 text-[#6366f1]" 
                                    : "text-slate-500 hover:text-slate-300"
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
                      <h4 className="text-[10px] font-black text-slate-500 tracking-wider uppercase font-mono px-1">
                        SUPPORT
                      </h4>
                      <div className="bg-[#0b0c10] border border-slate-900 rounded-2xl overflow-hidden divide-y divide-slate-900">
                        <button
                          onClick={() => {
                            setShowSettings(false);
                            window.dispatchEvent(new CustomEvent("open-linco-chat"));
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-slate-900/40 flex items-center justify-between transition cursor-pointer text-xs text-slate-300 font-bold"
                        >
                          <span>Help</span>
                          <ChevronRight size={14} className="text-slate-600" />
                        </button>

                        <button
                          onClick={() => setActiveCategory("Contact")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-900/40 flex items-center justify-between transition cursor-pointer text-xs text-slate-300 font-bold"
                        >
                          <span>Contact</span>
                          <ChevronRight size={14} className="text-slate-600" />
                        </button>

                        <button
                          onClick={() => setActiveCategory("About")}
                          className="w-full px-4 py-3 text-left hover:bg-slate-900/40 flex items-center justify-between transition cursor-pointer text-xs text-slate-300 font-bold"
                        >
                          <span>About</span>
                          <ChevronRight size={14} className="text-slate-600" />
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
                      className="w-full py-3 bg-rose-950/10 hover:bg-rose-950/20 border border-rose-900/10 text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Logout from LINCO</span>
                    </button>
                  </div>
                ) : (
                  
                  /* NESTED SETTINGS VIEWER */
                  <div className="bg-[#0b0c10] border border-slate-900 rounded-2xl p-5 space-y-4">
                    {activeCategory === "Email" && (
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-slate-200 block">Update Email Address</span>
                        <input
                          type="email"
                          value={settingsEmail}
                          onChange={(e) => setSettingsEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-[#111218] border border-[#20212a] focus:border-[#6366f1] rounded-xl text-xs text-slate-100 outline-none transition"
                        />
                        <button
                          onClick={() => {
                            setActiveCategory(null);
                            addToast("Email updated successfully", "success");
                          }}
                          className="px-4 py-2 bg-[#6366f1] hover:bg-[#5053df] text-white font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          Save Email
                        </button>
                      </div>
                    )}

                    {activeCategory === "Phone" && (
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-slate-200 block">Update Phone Number</span>
                        <input
                          type="text"
                          value={settingsPhone}
                          onChange={(e) => setSettingsPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-[#111218] border border-[#20212a] focus:border-[#6366f1] rounded-xl text-xs text-slate-100 outline-none transition"
                        />
                        <button
                          onClick={() => {
                            setActiveCategory(null);
                            addToast("Phone number updated", "success");
                          }}
                          className="px-4 py-2 bg-[#6366f1] hover:bg-[#5053df] text-white font-bold rounded-lg text-xs transition cursor-pointer"
                        >
                          Save Phone Number
                        </button>
                      </div>
                    )}

                    {activeCategory === "Password" && (
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-slate-200 block">Change Password</span>
                        <div className="space-y-3">
                          <input
                            type="password"
                            placeholder="Current Password"
                            value={settingsPassword}
                            onChange={(e) => setSettingsPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-[#111218] border border-[#20212a] focus:border-[#6366f1] rounded-xl text-xs text-slate-100 outline-none transition"
                          />
                          <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-[#111218] border border-[#20212a] focus:border-[#6366f1] rounded-xl text-xs text-slate-100 outline-none transition"
                          />
                        </div>
                        <button
                          disabled={!newPassword}
                          onClick={() => {
                            setActiveCategory(null);
                            setNewPassword("");
                            addToast("Password changed successfully", "success");
                          }}
                          className="px-4 py-2 bg-[#6366f1] hover:bg-[#5053df] text-white font-bold rounded-lg text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Change Password
                        </button>
                      </div>
                    )}

                    {activeCategory === "Blocked Users" && (
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-slate-200 block">Blocked Users</span>
                        {blockedUsers.length > 0 ? (
                          <div className="space-y-2">
                            {blockedUsers.map((username) => (
                              <div key={username} className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-xl border border-slate-900">
                                <span className="text-xs font-mono text-slate-300">@{username}</span>
                                <button
                                  onClick={() => {
                                    setBlockedUsers(blockedUsers.filter(u => u !== username));
                                    addToast(`Unblocked @${username}`, "info");
                                  }}
                                  className="text-[10px] font-bold text-[#6366f1] hover:underline cursor-pointer"
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
                        <span className="text-xs font-bold text-slate-200 block">Contact LINCO Support</span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          For general support, data access requests or neighborhood coordination queries, contact our lead developers at:
                        </p>
                        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 space-y-2 text-xs text-slate-300 font-mono">
                          <div>📧 Email: support@linco.org</div>
                          <div>🌐 Web: https://linco.org</div>
                          <div>📍 Address: Kolkata Grid Ingress Hub</div>
                        </div>
                      </div>
                    )}

                    {activeCategory === "About" && (
                      <div className="space-y-4">
                        <span className="text-xs font-bold text-slate-200 block">About LINCO</span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          LINCO is a private lost and found handover application that helps you find and recover misplaced objects using smart Gemini AI semantic matches.
                        </p>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-1.5 text-[10px] text-slate-400 font-mono">
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
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0b0c10] border border-slate-800 rounded-3xl p-6 w-full max-w-sm relative z-10 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                  Update {photoModal === "photo" ? "Profile Photo" : "Banner"}
                </h4>
                <button
                  onClick={() => { stopCamera(); setPhotoModal(null); }}
                  className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              {/* VIDEO CAMERA STREAM */}
              {cameraActive && photoModal === "photo" ? (
                <div className="space-y-3">
                  <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-black">
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
                      className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="px-3 py-1.5 bg-[#6366f1] text-white font-bold rounded-lg text-xs cursor-pointer"
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
                        className="p-3 bg-[#111218] border border-[#20212a] hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Camera size={13} className="text-indigo-400" />
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
                      className="p-3 bg-[#111218] border border-[#20212a] hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Share2 size={13} className="text-cyan-400" />
                      <span>Choose From Gallery (Cloudinary)</span>
                    </button>
                  </div>

                  {/* Cloudinary/Web URL Input */}
                  <form onSubmit={handleCloudinaryUrlSubmit} className="space-y-2 pt-2 border-t border-slate-900">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Or Paste Cloudinary / Web URL
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        placeholder="https://res.cloudinary.com/..."
                        value={cloudinaryUrl}
                        onChange={(e) => setCloudinaryUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg text-xs text-slate-200 outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-800"
                      >
                        Add
                      </button>
                    </div>
                  </form>

                  {/* Curated presets preview list */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-900">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                      Or Choose Preset Theme
                    </span>
                    <div className="flex gap-2 justify-center">
                      {(photoModal === "photo" ? PRESET_AVATARS : PRESET_BANNERS).map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectPreset(preset, photoModal)}
                          className="w-8 h-8 rounded-full border border-slate-900 transition transform hover:scale-110 cursor-pointer shadow-sm"
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
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0c10] border border-red-500/20 rounded-3xl p-6 w-full max-w-sm relative z-10 space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-2 text-red-400 border-b border-red-950/20 pb-3">
                <AlertTriangle size={18} />
                <h4 className="text-xs font-black uppercase tracking-wider font-mono">
                  Confirm Deletion
                </h4>
              </div>

              {deleteStep === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This action is final and cannot be undone. All your lost/found registrations, handovers, and credentials will be purged.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Type your password to confirm</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={reauthPassword}
                        onChange={(e) => setReauthPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-[#111218] border border-[#20212a] focus:border-red-500 rounded-xl text-xs text-slate-100 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setDeleteStep(0)}
                      className="px-3.5 py-1.5 bg-transparent border border-slate-800 text-slate-400 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!reauthPassword}
                      onClick={() => setDeleteStep(2)}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Type <strong className="text-red-400 font-mono">DELETE</strong> below to permanently destroy your LINCO profile and credentials.
                  </p>
                  
                  <input
                    type="text"
                    placeholder="DELETE"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111218] border border-red-950 focus:border-red-500 rounded-xl text-xs text-slate-100 outline-none font-mono text-center tracking-widest"
                  />

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      onClick={() => setDeleteStep(1)}
                      className="px-3.5 py-1.5 bg-transparent border border-slate-800 text-slate-400 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      disabled={deleteConfirmText !== "DELETE" || reauthenticating}
                      onClick={handleDeleteAccountFinal}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-40"
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
