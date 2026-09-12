import React, { useState, useEffect, useRef } from "react";
import { 
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  User,
  MapPin,
  AlignLeft,
  Camera,
  Upload
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { auth, db, isConfigValid } from "../services/firebaseClient";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { imageService } from "../services/imageService";
import { LincoLogo } from "./LincoLogo";
import { LincoAvatar } from "./LincoAvatar";
import { requestGenuineLocation } from "../utils/geolocation";
import { DEFAULT_USER_LOCATION } from "../constants";

interface AuthFlowProps {
  onLoginSuccess: (fullName: string, email: string) => void;
  addToast: (message: string, type: "info" | "success" | "warn" | "error") => void;
  onSplashEnd?: () => void;
  isSplashOnly?: boolean;
  initialScreen?: ScreenType;
}

type ScreenType = 
  | "splash" 
  | "welcome" 
  | "login" 
  | "signup" 
  | "forgot_password"
  | "profile_setup";

export function AuthFlow({ 
  onLoginSuccess, 
  addToast,
  onSplashEnd,
  isSplashOnly = false,
  initialScreen = "welcome"
}: AuthFlowProps) {
  const [screen, setScreen] = useState<ScreenType>(initialScreen);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // Profile Setup Form state
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("linear-gradient(135deg, #6366f1 0%, #a855f7 100%)");
  const [username, setUsername] = useState("");



  // Hidden inputs & stream states for profile setup
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Splash Screen automatic transition
  useEffect(() => {
    if (screen === "splash") {
      const timer = setTimeout(() => {
        if (isSplashOnly) {
          onSplashEnd?.();
        } else {
          setScreen("welcome");
          onSplashEnd?.();
        }
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [screen, isSplashOnly, onSplashEnd]);

  // Clear errors on screen change
  const navigateTo = (nextScreen: ScreenType) => {
    console.log(`[AuthFlow] [navigateTo] Transitioning from "${screen}" to "${nextScreen}"`);
    setErrors({});
    setLoading(false);
    setScreen(nextScreen);
  };



  // Handle Redirect Result on Mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("[AuthFlow] Redirect sign-in result retrieved successfully:", result.user.uid);
          setLoading(true);
          const profile = await ensureUserProfile(result.user, "google.com");
          const formattedDate = profile.createdAt ? new Date(profile.createdAt).toLocaleString("en-US", { month: "long", year: "numeric" }) : "July 2026";
          const localProfile = {
            fullName: profile.displayName || "Verified User",
            username: profile.username || "user",
            bio: profile.bio || "Lost & Found helper on LINCO",
            location: profile.city || DEFAULT_USER_LOCATION,
            memberSince: formattedDate,
            avatar: profile.photoURL || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            banner: "linear-gradient(120deg, #1e1b4b 0%, #311042 100%)"
          };
          localStorage.setItem("linco_profile_details", JSON.stringify(localProfile));
          localStorage.setItem("linco_profile_is_logged_in", "true");
          addToast("Successfully signed in with Google!", "success");
          onLoginSuccess(localProfile.fullName, result.user.email || `${localProfile.username}@linco.org`);
        }
      } catch (err: any) {
        console.error("[AuthFlow] Error handling redirect sign-in:", err);
        addToast(getAuthErrorMessage(err), "error");
      } finally {
        setLoading(false);
      }
    };
    handleRedirectResult();
  }, []);

  const generateUniqueUsername = async (displayNameVal?: string, emailVal?: string, phoneVal?: string, uidVal?: string): Promise<string> => {
    let base = "";
    if (displayNameVal) {
      base = displayNameVal;
    } else if (emailVal) {
      base = emailVal.split("@")[0];
    } else if (phoneVal) {
      base = phoneVal.replace(/[^0-9]/g, "");
    } else if (uidVal) {
      base = uidVal.slice(0, 8);
    } else {
      base = "user";
    }

    let clean = base
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9_\-]/g, "");

    if (clean.length === 0) {
      clean = "user";
    }

    if (clean.length > 25) {
      clean = clean.slice(0, 25);
    }

    let finalUsername = clean;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      try {
        const res = await fetch("/api/auth/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: finalUsername })
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.exists) {
            isUnique = true;
          } else {
            const suffix = Math.floor(100 + Math.random() * 900).toString();
            const availableLength = 25 - suffix.length;
            finalUsername = clean.slice(0, availableLength) + suffix;
          }
        } else {
          isUnique = true;
        }
      } catch (err) {
        console.error("Username uniqueness check error:", err);
        isUnique = true;
      }
      attempts++;
    }

    return finalUsername;
  };

  const ensureUserProfile = async (user: any, providerId: string, displayNameInput?: string) => {
    const userDocRef = doc(db, "users", user.uid);
    let userDoc;
    try {
      userDoc = await getDoc(userDocRef);
    } catch (err) {
      console.error("Error reading profile in ensureUserProfile:", err);
    }

    const emailVal = user.email || null;
    const phoneVal = user.phoneNumber || null;
    const displayNameVal = displayNameInput || user.displayName || (emailVal ? emailVal.split("@")[0] : null) || "Verified User";

    if (!userDoc || !userDoc.exists()) {
      console.log(`[ensureUserProfile] Profile missing for UID: ${user.uid}. Generating new profile...`);
      const generatedUsername = await generateUniqueUsername(displayNameVal, emailVal, phoneVal, user.uid);
      const defaultProfile = {
        uid: user.uid,
        displayName: displayNameVal,
        username: generatedUsername,
        email: emailVal,
        phoneNumber: phoneVal,
        photoURL: user.photoURL || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        bio: "Lost & Found helper on LINCO",
        city: DEFAULT_USER_LOCATION,
        createdAt: Date.now(),
        provider: providerId,
        lastLogin: Date.now()
      };

      try {
        await setDoc(userDocRef, defaultProfile);
        console.log("[ensureUserProfile] Profile created successfully.");
        return defaultProfile;
      } catch (writeErr) {
        console.error("[ensureUserProfile] Failed to write profile to Firestore:", writeErr);
        return defaultProfile;
      }
    } else {
      const existingData = userDoc.data();
      const updatePayload: any = {
        lastLogin: Date.now()
      };

      if (!existingData.provider) {
        updatePayload.provider = providerId;
      }
      if (emailVal && !existingData.email) {
        updatePayload.email = emailVal;
      }
      if (phoneVal && !existingData.phoneNumber) {
        updatePayload.phoneNumber = phoneVal;
      }

      try {
        await setDoc(userDocRef, updatePayload, { merge: true });
        console.log("[ensureUserProfile] Profile updated with lastLogin.");
      } catch (writeErr) {
        console.error("[ensureUserProfile] Failed to update profile merge:", writeErr);
      }

      return { ...existingData, ...updatePayload };
    }
  };

  const handleGoogleSignIn = async () => {
    console.log("[AuthFlow] [handleGoogleSignIn] Initiated.");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      console.log("[AuthFlow] [handleGoogleSignIn] Attempting signInWithPopup...");
      const result = await signInWithPopup(auth, provider);
      console.log("[AuthFlow] [handleGoogleSignIn] signInWithPopup successful:", result.user.uid);
      const profile = await ensureUserProfile(result.user, "google.com");
      
      const formattedDate = profile.createdAt ? new Date(profile.createdAt).toLocaleString("en-US", { month: "long", year: "numeric" }) : "July 2026";
      const localProfile = {
        fullName: profile.displayName || "Verified User",
        username: profile.username || "user",
        bio: profile.bio || "Lost & Found helper on LINCO",
        location: profile.city || DEFAULT_USER_LOCATION,
        memberSince: formattedDate,
        avatar: profile.photoURL || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        banner: "linear-gradient(120deg, #1e1b4b 0%, #311042 100%)"
      };
      localStorage.setItem("linco_profile_details", JSON.stringify(localProfile));
      localStorage.setItem("linco_profile_is_logged_in", "true");
      addToast("Successfully signed in with Google!", "success");
      onLoginSuccess(localProfile.fullName, result.user.email || `${localProfile.username}@linco.org`);
    } catch (popupErr: any) {
      console.warn("[AuthFlow] [handleGoogleSignIn] signInWithPopup failed/blocked:", popupErr);
      
      const isRedirectFallbackNeeded = 
        popupErr.code === "auth/popup-blocked" || 
        popupErr.code === "auth/popup-closed-by-user" || 
        popupErr.code === "auth/cancelled-popup-request" ||
        popupErr.code === "auth/network-request-failed" ||
        popupErr.message?.includes("iframe") ||
        popupErr.message?.includes("popup");

      if (isRedirectFallbackNeeded) {
        addToast("Popup blocked or failed. Falling back to secure redirect sign-in...", "info");
        console.log("[AuthFlow] [handleGoogleSignIn] Falling back to signInWithRedirect...");
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectErr: any) {
          console.error("[AuthFlow] [handleGoogleSignIn] signInWithRedirect failed:", redirectErr);
          addToast(getAuthErrorMessage(redirectErr), "error");
        }
      } else {
        addToast(getAuthErrorMessage(popupErr), "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuthClick = () => {
    try {
      alert("Coming Soon");
    } catch (e) {
      console.warn("Alert blocked:", e);
    }
    addToast("Phone Authentication will be available in a future update.", "info");
  };

  const getAuthErrorMessage = (err: any): string => {
    if (!err || !err.code) return err?.message || "An unexpected error occurred.";
    switch (err.code) {
      case "auth/invalid-email":
        return "The email address is not valid.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Incorrect email or password. Please try again.";
      case "auth/email-already-in-use":
        return "An account with this email address already exists.";
      case "auth/weak-password":
        return "The password is too weak. It must be at least 6 characters.";
      case "auth/network-request-failed":
        if (typeof window !== "undefined" && window.self !== window.top) {
          return "Google Sign-In is restricted inside preview panels due to third-party cookie restrictions. Please click the 'Open in New Tab' icon at the top right of the preview panel to sign in successfully.";
        }
        return "Network connection error. Please check your internet connection.";
      case "auth/too-many-requests":
        return "Too many failed login attempts. Please try again later or reset your password.";
      case "auth/operation-not-allowed":
        return "This authentication method is not enabled. Please enable it in the Firebase Console.";
      case "auth/requires-recent-login":
        return "This action requires recent authentication. Please log in again.";
      default:
        return err.message || "An error occurred during authentication.";
    }
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[DIAGNOSTIC] [handleEmailLogin] STARTED with input:", email);
    console.log("[AuthFlow] [handleEmailLogin] Attempting sign-in with:", email);
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email or Username is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      console.warn("[AuthFlow] [handleEmailLogin] Validation failed:", newErrors);
      setErrors(newErrors);
      addToast("Please check your login details.", "error");
      return;
    }

    try {
      setLoading(true);
      let targetEmail = email.trim();

      // Check if the input is a username (no @ symbol)
      if (!targetEmail.includes("@")) {
        console.log("[AuthFlow] [handleEmailLogin] Treating input as username. Attempting resolution...");
        try {
          const res = await fetch("/api/auth/resolve-username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: targetEmail.toLowerCase() })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.email) {
              console.log("[AuthFlow] [handleEmailLogin] Username resolved to email successfully.");
              targetEmail = data.email;
            } else {
              throw new Error("No email found for this username");
            }
          } else {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || "Incorrect username/email or password.");
          }
        } catch (resolveErr: any) {
          console.error("Username resolution failed:", resolveErr);
          addToast(resolveErr.message || "Incorrect username/email or password.", "error");
          setErrors({ email: resolveErr.message || "Incorrect username/email or password." });
          return;
        }
      } else {
        if (!validateEmail(targetEmail)) {
          setErrors({ email: "Please enter a valid email address" });
          addToast("Please enter a valid email address.", "error");
          return;
        }
      }

      console.log("[AuthFlow] [handleEmailLogin] Requesting Firebase Auth email/password verification with resolved email:", targetEmail);
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      const user = userCredential.user;
      console.log("[AuthFlow] [handleEmailLogin] Firebase Auth successful. User details:", {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      });
      
      const userDocRef = doc(db, "users", user.uid);
      console.log("[AuthFlow] [handleEmailLogin] Fetching user profile from Firestore at users/" + user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Backward compatibility: store email field in user profile if missing
        if (!userData.email) {
          console.log("[AuthFlow] [handleEmailLogin] Legacy user profile missing email field. Merging email field...");
          try {
            await setDoc(userDocRef, { email: user.email || targetEmail }, { merge: true });
            userData.email = user.email || targetEmail;
          } catch (writeErr) {
            console.error("Failed to merge email field for legacy user profile:", writeErr);
          }
        }

        console.log("[AuthFlow] [handleEmailLogin] Firestore profile found:", userData);
        const formattedDate = userData.createdAt ? new Date(userData.createdAt).toLocaleString("en-US", { month: "long", year: "numeric" }) : "July 2026";
        const localProfile = {
          fullName: userData.displayName || user.displayName || "Verified User",
          username: userData.username || user.email?.split("@")[0] || "user",
          bio: userData.bio || "Lost & Found helper on LINCO",
          location: userData.city || DEFAULT_USER_LOCATION,
          memberSince: formattedDate,
          avatar: userData.photoURL || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          banner: "linear-gradient(120deg, #1e1b4b 0%, #311042 100%)"
        };
        localStorage.setItem("linco_profile_details", JSON.stringify(localProfile));
        localStorage.setItem("linco_profile_is_logged_in", "true");
        addToast("Successfully signed in!", "success");
        onLoginSuccess(localProfile.fullName, targetEmail);
      } else {
        console.log("[AuthFlow] [handleEmailLogin] Firestore profile does not exist. Creating default profile...");
        const defaultUsername = user.email?.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || `user_${user.uid.slice(0, 5)}`;
        const defaultProfile = {
          uid: user.uid,
          displayName: user.displayName || "Verified User",
          username: defaultUsername,
          email: user.email || targetEmail,
          bio: "Lost & Found helper on LINCO",
          city: DEFAULT_USER_LOCATION,
          photoURL: user.photoURL || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          createdAt: Date.now()
        };
        await setDoc(userDocRef, defaultProfile);
        console.log("[AuthFlow] [handleEmailLogin] Default profile saved successfully to Firestore.");
        
        const localProfile = {
          fullName: defaultProfile.displayName,
          username: defaultProfile.username,
          bio: defaultProfile.bio,
          location: defaultProfile.city,
          memberSince: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
          avatar: defaultProfile.photoURL,
          banner: "linear-gradient(120deg, #1e1b4b 0%, #311042 100%)"
        };
        localStorage.setItem("linco_profile_details", JSON.stringify(localProfile));
        localStorage.setItem("linco_profile_is_logged_in", "true");
        addToast("Successfully signed in!", "success");
        onLoginSuccess(defaultProfile.displayName, targetEmail);
      }
    } catch (err: any) {
      console.error("[AuthFlow] [handleEmailLogin] Login failed:", err);
      addToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[DIAGNOSTIC] [handleSignup] STARTED with name:", fullName, "email:", email, "username:", username);
    console.log("[AuthFlow] [handleSignup] Initiating Email Registration. Full Name:", fullName, "Email:", email, "Username:", username);
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      newErrors.username = "Username is required";
    } else if (!/^[a-z0-9_\-]+$/.test(cleanUsername)) {
      newErrors.username = "Username can only contain lowercase letters, numbers, underscores, or hyphens";
    } else {
      try {
        setLoading(true);
        const checkRes = await fetch("/api/auth/check-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: cleanUsername })
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.exists) {
            newErrors.username = "Username is already taken";
          }
        }
      } catch (fetchErr) {
        console.error("Username uniqueness check error:", fetchErr);
      } finally {
        setLoading(false);
      }
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!acceptPrivacy) {
      newErrors.privacy = "You must accept the Privacy Policy to continue";
    }

    if (Object.keys(newErrors).length > 0) {
      console.warn("[AuthFlow] [handleSignup] Registration validation failed:", newErrors);
      setErrors(newErrors);
      addToast("Please resolve all validation errors.", "error");
      return;
    }

    try {
      setLoading(true);
      console.log("[AuthFlow] [handleSignup] Dispatching createUserWithEmailAndPassword command to Firebase...");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("[AuthFlow] [handleSignup] Firebase registration successful. User UID:", user.uid);
      
      // Auto-create initial user doc
      const userDocRef = doc(db, "users", user.uid);
      const defaultProfile = {
        uid: user.uid,
        displayName: fullName.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        bio: "Lost & Found helper on LINCO",
        city: DEFAULT_USER_LOCATION,
        photoURL: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        createdAt: Date.now()
      };
      
      console.log("[AuthFlow] [handleSignup] Writing default user profile to Firestore path: users/" + user.uid);
      await setDoc(userDocRef, defaultProfile);
      console.log("[AuthFlow] [handleSignup] Default profile created successfully in database.");
      
      const localProfile = {
        fullName: defaultProfile.displayName,
        username: defaultProfile.username,
        bio: defaultProfile.bio,
        location: defaultProfile.city,
        memberSince: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
        avatar: defaultProfile.photoURL,
        banner: "linear-gradient(120deg, #1e1b4b 0%, #311042 100%)"
      };
      localStorage.setItem("linco_profile_details", JSON.stringify(localProfile));
      localStorage.setItem("linco_profile_is_logged_in", "true");
      
      addToast("Account registered! Now let's set up your profile.", "success");
      setUsername(cleanUsername);
      navigateTo("profile_setup");
    } catch (err: any) {
      console.error("[AuthFlow] [handleSignup] Registration failed:", err);
      addToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AuthFlow] [handleForgotPasswordSubmit] Requesting password reset email for:", email);
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      console.warn("[AuthFlow] [handleForgotPasswordSubmit] Forgot password validation failed:", newErrors);
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      console.log("[AuthFlow] [handleForgotPasswordSubmit] Contacting Firebase sendPasswordResetEmail...");
      await sendPasswordResetEmail(auth, email);
      console.log("[AuthFlow] [handleForgotPasswordSubmit] Firebase successfully sent reset link email to:", email);
      addToast("Password reset link sent! Check your inbox.", "success");
      navigateTo("login");
    } catch (err: any) {
      console.error("[AuthFlow] [handleForgotPasswordSubmit] Password reset failed:", err);
      addToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 300, height: 300, facingMode: "user" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera stream access failed:", err);
      addToast("Webcam unavailable. Falling back to file chooser.", "warn");
      setCameraActive(false);
      fileInputRef.current?.click();
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
      setAvatarUrl(dataUrl);
      addToast("Photo captured successfully!", "success");
    }
    stopCamera();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addToast("Compressing & uploading to Cloudinary...", "info");
    try {
      const result = await imageService.uploadImage(file);
      setAvatarUrl(result.url);
      addToast("Image uploaded successfully!", "success");
    } catch (err) {
      console.error("Upload error:", err);
      addToast("Cloudinary upload failed. Using offline local preview.", "warn");
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");
    if (!fullName.trim() || !cleanUsername || !city.trim()) {
      addToast("Full Name, Username, and City are required.", "error");
      return;
    }

    console.log("[AuthFlow] [handleProfileSetupSubmit] Attempting profile setup submit...");

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No active user session found.");
      }

      // Unique username validation
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", cleanUsername));
      
      const querySnapshot = await getDocs(q);
      
      let isUnique = true;
      querySnapshot.forEach((doc) => {
        if (doc.id !== user.uid) {
          isUnique = false;
        }
      });
      
      if (!isUnique) {
        addToast("This username is already taken. Please choose another one.", "error");
        setErrors(prev => ({ ...prev, username: "Username is already taken" }));
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const existingData = userDocSnap.exists() ? userDocSnap.data() : null;

      const profilePayload: any = {
        displayName: fullName.trim(),
        username: cleanUsername,
        city: city.trim(),
        bio: bio.trim(),
        photoURL: avatarUrl,
        updatedAt: Date.now()
      };

      // Only set createdAt and uid if they do not already exist to preserve the original profile creation metadata
      if (!existingData || !existingData.createdAt) {
        profilePayload.createdAt = Date.now();
      }
      if (!existingData || !existingData.uid) {
        profilePayload.uid = user.uid;
      }

      await setDoc(userDocRef, profilePayload, { merge: true });

      const memberSinceTimestamp = existingData?.createdAt || profilePayload.createdAt || Date.now();
      const formattedDate = new Date(memberSinceTimestamp).toLocaleString("en-US", { month: "long", year: "numeric" });
      const localProfile = {
        fullName: profilePayload.displayName,
        username: profilePayload.username,
        bio: profilePayload.bio || "Lost & Found helper on LINCO",
        location: profilePayload.city,
        memberSince: formattedDate,
        avatar: profilePayload.photoURL || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        banner: "linear-gradient(120deg, #1e1b4b 0%, #311042 100%)"
      };

      localStorage.setItem("linco_profile_details", JSON.stringify(localProfile));
      localStorage.setItem("linco_profile_is_logged_in", "true");

      addToast("Profile created successfully! Welcome to LINCO.", "success");
      onLoginSuccess(profilePayload.displayName, user.email || `${profilePayload.username}@linco.org`);
    } catch (err: any) {
      console.error("Profile Setup Error:", err);
      addToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs overflow-y-auto px-4 py-8">
      {/* Main card viewport */}
      <div className="relative w-full max-w-[420px] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-center min-h-[500px] z-10 pointer-events-auto">
        
        {!isConfigValid && (
          <div className="absolute top-0 inset-x-0 bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 z-30 flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block">Firebase Config Missing</span>
              <span className="text-amber-700 text-[11px]">Verify firebase-applet-config.json in workspace.</span>
            </div>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          
          {/* 1. SPLASH SCREEN */}
          {screen === "splash" && (
            <div
              key="splash"
              className="flex flex-col items-center justify-center p-8 text-center space-y-6 relative z-20 pointer-events-auto"
            >
              <LincoLogo variant="stacked" size="hero" animated showTagline taglineText="Because every lost thing has a story." />

              {/* Progress Indicator */}
              <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden relative mt-4">
                <div 
                  className="absolute top-0 bottom-0 w-1/2 bg-indigo-600 rounded-full animate-pulse"
                  style={{ left: "25%" }}
                />
              </div>
            </div>
          )}

          {/* 2. WELCOME SCREEN */}
          {screen === "welcome" && (
            <div
              key="welcome"
              className="flex flex-col justify-between p-8 space-y-8 h-full relative z-20 pointer-events-auto animate-fade-in"
            >
              {/* Header */}
              <div className="text-center space-y-2 pt-2">
                <LincoLogo variant="stacked" size="lg" className="mb-2" />
                <p className="text-xs text-slate-600 leading-relaxed max-w-[290px] mx-auto">
                  Recover lost belongings safely through trusted citizens and intelligent verification.
                </p>
              </div>

              {/* Button Actions */}
              <div className="space-y-2.5">
                {/* Email */}
                <button
                  disabled={loading}
                  onClick={() => navigateTo("signup")}
                  className="w-full h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Mail size={14} className="text-indigo-600 shrink-0" />
                  <span>Get Started with Email</span>
                </button>

                {/* Google */}
                <button
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="w-full h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.93 1 12 1 7.24 1 3.2 3.73 1.24 7.74l3.8 2.95C5.93 7.33 8.74 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.45c-.28 1.47-1.11 2.72-2.35 3.55l3.65 2.83c2.14-1.97 3.39-4.88 3.39-8.48z" />
                    <path fill="#FBBC05" d="M5.04 10.69C4.81 11.39 4.69 12.13 4.69 12s.12 1.31.35 2.01l-3.8 2.95C.44 15.42 0 13.76 0 12s.44-3.42 1.24-4.96l3.8 2.95z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.96-1.08 7.95-2.91l-3.65-2.83c-1.01.68-2.31 1.08-3.91 1.08-3.26 0-6.07-2.29-7.05-5.36l-3.8 2.95C3.2 20.27 7.24 23 12 23z" />
                  </svg>
                  <span>{loading ? "Connecting..." : "Continue with Google"}</span>
                </button>

                {/* Phone Coming Soon */}
                <button
                  type="button"
                  onClick={handlePhoneAuthClick}
                  className="w-full h-11 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-xs transition flex items-center justify-center gap-2.5 cursor-pointer group shadow-2xs"
                >
                  <svg className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-slate-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12" y2="18.01" />
                  </svg>
                  <span>Continue with Phone</span>
                </button>
              </div>

              {/* Navigation Footer */}
              <div className="text-center pt-2 pb-1 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Already have an account?{" "}
                  <button 
                    onClick={() => navigateTo("login")}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer hover:underline ml-1"
                  >
                    Sign In
                  </button>
                </span>
              </div>
            </div>
          )}

          {/* 3. LOGIN SCREEN */}
          {screen === "login" && (
            <div
              key="login"
              className="p-8 space-y-6 relative z-20 pointer-events-auto"
            >
              {/* Back Button */}
              <button 
                onClick={() => navigateTo("welcome")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition inline-flex items-center justify-center cursor-pointer border border-slate-200 shadow-2xs"
              >
                <ArrowLeft size={14} />
              </button>

              <div className="space-y-1">
                <h2 className="font-bold text-lg text-slate-900">Welcome Back</h2>
                <p className="text-xs text-slate-500">Sign in to your LINCO account to resume tracking.</p>
              </div>

              <form onSubmit={(e) => handleEmailLogin(e)} className="space-y-4 pt-1">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Email or Username</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 z-10 pointer-events-none">
                      <Mail size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="you@domain.com or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none placeholder:text-slate-400 transition shadow-2xs ${errors.email ? "border-rose-500 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors.email}</span>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700 block">Password</label>
                    <button
                      type="button"
                      onClick={() => navigateTo("forgot_password")}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 z-10 pointer-events-none">
                      <Lock size={14} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-11! pr-11! h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none placeholder:text-slate-400 transition shadow-2xs ${errors.password ? "border-rose-500 focus:border-rose-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-100"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors.password}</span>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-60"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Sign In</span>
                </button>
              </form>

              {/* Create Account link */}
              <div className="text-center pt-1">
                <span className="text-xs text-slate-500">
                  New to LINCO?{" "}
                  <button
                    onClick={() => navigateTo("signup")}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer hover:underline ml-1"
                  >
                    Create Account
                  </button>
                </span>
              </div>
            </div>
          )}

          {/* 4. SIGNUP SCREEN */}
          {screen === "signup" && (
            <div
              key="signup"
              className="p-8 space-y-5 relative z-20 pointer-events-auto"
            >
              {/* Back Button */}
              <button 
                onClick={() => navigateTo("welcome")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition inline-flex items-center justify-center cursor-pointer border border-slate-200 shadow-2xs"
              >
                <ArrowLeft size={14} />
              </button>

              <div className="space-y-1">
                <h2 className="font-bold text-lg text-slate-900">Create Account</h2>
                <p className="text-xs text-slate-500">Join the smart local recovery network.</p>
              </div>

              <form onSubmit={(e) => handleSignup(e)} className="space-y-3 pt-1">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Full Name</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 z-10 pointer-events-none">
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none placeholder:text-slate-400 transition shadow-2xs ${errors.fullName ? "border-rose-500 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.fullName && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors.fullName}</span>
                  )}
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Username</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 z-10 pointer-events-none">
                      <Sparkles size={14} className="text-slate-400" />
                    </span>
                    <input
                      type="text"
                      placeholder="john_doe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none placeholder:text-slate-400 transition shadow-2xs ${errors.username ? "border-rose-500 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.username && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors.username}</span>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 z-10 pointer-events-none">
                      <Mail size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none placeholder:text-slate-400 transition shadow-2xs ${errors.email ? "border-rose-500 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors.email}</span>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Password</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 z-10 pointer-events-none">
                      <Lock size={14} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-11! pr-11! h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none placeholder:text-slate-400 transition shadow-2xs ${errors.password ? "border-rose-500 focus:border-rose-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded hover:bg-slate-100"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors.password}</span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Confirm Password</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 z-10 pointer-events-none">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none placeholder:text-slate-400 transition shadow-2xs ${errors.confirmPassword ? "border-rose-500 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors.confirmPassword}</span>
                  )}
                </div>

                {/* Privacy checkbox */}
                <div className="space-y-1 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptPrivacy}
                      onChange={(e) => setAcceptPrivacy(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500/30 w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                    />
                    <span className="text-[11px] text-slate-600 leading-normal select-none group-hover:text-slate-900 transition-colors">
                      I accept the <span className="text-indigo-600 hover:underline font-semibold">Privacy Policy</span> and consent to encrypted data sharing.
                    </span>
                  </label>
                  {errors.privacy && (
                    <span className="text-[11px] text-rose-600 block font-semibold">{errors.privacy}</span>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs mt-2 disabled:opacity-60"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Create Account</span>
                </button>
              </form>

              {/* Already have an account */}
              <div className="text-center pt-1">
                <span className="text-xs text-slate-500">
                  Already registered?{" "}
                  <button
                    onClick={() => navigateTo("login")}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer hover:underline ml-1"
                  >
                    Sign In
                  </button>
                </span>
              </div>
            </div>
          )}

          {/* 7. FORGOT PASSWORD SCREEN */}
          {screen === "forgot_password" && (
            <div
              key="forgot_password"
              className="p-8 space-y-6 relative z-20 pointer-events-auto"
            >
              {/* Back Button */}
              <button 
                onClick={() => navigateTo("login")}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition inline-flex items-center justify-center cursor-pointer border border-slate-200 shadow-2xs"
              >
                <ArrowLeft size={14} />
              </button>

              <div className="space-y-1">
                <h2 className="font-bold text-lg text-slate-900">Reset Password</h2>
                <p className="text-xs text-slate-500">We'll transmit a secure recovery connection link to retrieve control of your profile.</p>
              </div>

              <form onSubmit={(e) => handleForgotPasswordSubmit(e)} className="space-y-4 pt-1">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block">Email Address</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 z-10 pointer-events-none">
                      <Mail size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none placeholder:text-slate-400 transition shadow-2xs ${errors.email ? "border-rose-500 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-[11px] text-rose-600 font-semibold">{errors.email}</span>
                  )}
                </div>

                {/* Send recovery link button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs mt-2 disabled:opacity-60"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Send Reset Link</span>
                </button>
              </form>

              {/* Back to sign in option */}
              <div className="text-center pt-2">
                <button
                  onClick={() => navigateTo("login")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}

          {/* 8. PROFILE SETUP SCREEN */}
          {screen === "profile_setup" && (
            <div
              key="profile_setup"
              className="p-8 space-y-5 relative z-20 pointer-events-auto"
            >
              <div className="space-y-1 text-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center mx-auto mb-1.5">
                  <User size={18} className="text-indigo-600" />
                </div>
                <h2 className="font-bold text-lg text-slate-900">Set Up Your Profile</h2>
                <p className="text-xs text-slate-500 leading-normal">
                  Complete your profile so citizens can coordinate handovers with you.
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="flex flex-col items-center space-y-2.5">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-full border border-slate-200 hover:border-indigo-500 transition overflow-hidden flex items-center justify-center bg-slate-100 cursor-pointer shadow-2xs"
                  >
                    <LincoAvatar
                      src={avatarUrl}
                      name={fullName || "User"}
                      size="lg"
                      className="w-full h-full"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startCamera}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white border border-slate-200 hover:border-indigo-500 transition text-slate-600 hover:text-slate-900 cursor-pointer shadow-2xs z-10"
                  >
                    <Camera size={11} />
                  </button>
                </div>

                {cameraActive ? (
                  <div className="space-y-2 w-full flex flex-col items-center">
                    <div className="relative w-40 aspect-square rounded-xl overflow-hidden border border-slate-200 bg-black shadow-2xs">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover scale-x-[-1]" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-2.5 py-1 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer shadow-2xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-2xs"
                      >
                        Take Snapshot
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload size={12} className="text-indigo-600" />
                      <span>Choose Photo</span>
                    </button>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <form onSubmit={(e) => handleProfileSetupSubmit(e)} className="space-y-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Full Name (Required)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 z-10 pointer-events-none">
                      <User size={13} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-11! pr-4 h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none transition shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Username (Required)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 text-xs font-mono z-10 pointer-events-none">@</span>
                    <input
                      type="text"
                      placeholder="rahul_sharma"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-11! pr-4 h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none transition shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 block">City / Neighborhood (Required)</label>
                    <button
                      type="button"
                      onClick={async () => {
                        addToast("Detecting your location...", "info");
                        const res = await requestGenuineLocation();
                        const detectedLocation = res?.city || res?.formattedAddress;
                        if (detectedLocation) {
                          setCity(detectedLocation);
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
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 z-10 pointer-events-none">
                      <MapPin size={13} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Bandra, Mumbai or Indiranagar, Bengaluru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-11! pr-4 h-11 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none transition shadow-2xs"
                      required
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Short Bio (Optional)</label>
                  <div className="relative flex items-start">
                    <span className="absolute left-3.5 top-3 text-slate-400 z-10 pointer-events-none">
                      <AlignLeft size={13} />
                    </span>
                    <textarea
                      placeholder="Tell us a bit about your neighborhood or typical routes..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      className="w-full pl-11! pr-4 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl outline-none resize-none transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs mt-2 disabled:opacity-60"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Complete Profile Setup</span>
                </button>
              </form>
            </div>
          )}



        </AnimatePresence>

      </div>
    </div>
  );
}
