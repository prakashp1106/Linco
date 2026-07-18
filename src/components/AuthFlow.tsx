import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ArrowLeft, 
  Check, 
  Loader2, 
  Sparkles, 
  User, 
  Shield, 
  Info,
  MapPin,
  AlignLeft,
  Camera,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { auth, db, isConfigValid } from "../services/firebaseClient";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { imageService } from "../services/imageService";

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
  | "profile_setup"
  | "phone_auth";

export function AuthFlow({ 
  onLoginSuccess, 
  addToast,
  onSplashEnd,
  isSplashOnly = false,
  initialScreen = "splash"
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

  // Phone Auth State
  const [phoneRaw, setPhoneRaw] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otpCode, setOtpCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "verify">("input");
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

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

  // Phone Auth resend timer countdown
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle Redirect Result on Mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const { getRedirectResult } = await import("firebase/auth");
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
            location: profile.city || "Kolkata, India",
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
        city: "Kolkata, India",
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
        location: profile.city || "Kolkata, India",
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

  const initRecaptcha = () => {
    if ((window as any).recaptchaVerifier) {
      return (window as any).recaptchaVerifier;
    }
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: (response: any) => {
        console.log("Recaptcha verified:", response);
      },
      "expired-callback": () => {
        console.warn("Recaptcha expired.");
        addToast("Recaptcha expired. Please request a new OTP.", "warn");
      }
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanRaw = phoneRaw.trim().replace(/[^0-9]/g, "");
    if (!cleanRaw) {
      addToast("Phone number is required.", "error");
      return;
    }
    const cleanPhone = `${countryCode}${cleanRaw}`;
    if (!/^\+[1-9]\d{1,14}$/.test(cleanPhone)) {
      addToast("Invalid phone format. Please enter a valid number.", "error");
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const verifier = initRecaptcha();
      console.log("[AuthFlow] Requesting Phone SMS OTP for:", cleanPhone);
      const result = await signInWithPhoneNumber(auth, cleanPhone, verifier);
      console.log("[AuthFlow] SMS OTP Sent successfully.");
      setConfirmationResult(result);
      setPhoneStep("verify");
      setResendTimer(60);
      addToast("OTP code sent to your phone!", "success");
    } catch (err: any) {
      console.error("SMS OTP failed:", err);
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch {}
      }
      addToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      addToast("Please enter a valid 6-digit OTP code.", "error");
      return;
    }
    if (!confirmationResult) {
      addToast("Verification session lost. Please request OTP again.", "error");
      setPhoneStep("input");
      return;
    }

    setLoading(true);
    try {
      console.log("[AuthFlow] Verifying OTP Code:", otpCode);
      const credential = await confirmationResult.confirm(otpCode);
      const user = credential.user;
      console.log("[AuthFlow] OTP verified successfully for user:", user.uid);
      
      const profile = await ensureUserProfile(user, "phone");
      const formattedDate = profile.createdAt ? new Date(profile.createdAt).toLocaleString("en-US", { month: "long", year: "numeric" }) : "July 2026";
      const localProfile = {
        fullName: profile.displayName || "Verified User",
        username: profile.username || "user",
        bio: profile.bio || "Lost & Found helper on LINCO",
        location: profile.city || "Kolkata, India",
        memberSince: formattedDate,
        avatar: profile.photoURL || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        banner: "linear-gradient(120deg, #1e1b4b 0%, #311042 100%)"
      };
      localStorage.setItem("linco_profile_details", JSON.stringify(localProfile));
      localStorage.setItem("linco_profile_is_logged_in", "true");
      
      addToast("Successfully signed in with phone!", "success");
      onLoginSuccess(localProfile.fullName, user.email || `${localProfile.username}@linco.org`);
    } catch (err: any) {
      console.error("OTP verification failed:", err);
      addToast(err.code === "auth/invalid-verification-code" ? "Incorrect OTP code. Please try again." : getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
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
          location: userData.city || "Kolkata, India",
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
          city: "Kolkata, India",
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
        city: "Kolkata, India",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030304] overflow-y-auto px-4 py-8">
      {/* Invisible Recaptcha Container for Phone Authentication */}
      <div id="recaptcha-container" className="pointer-events-none absolute w-0 h-0 opacity-0 overflow-hidden"></div>

      {/* Decorative Blur Backgrounds */}
      <div className="fixed -top-[20%] -left-[20%] w-[70vw] h-[70vw] bg-radial from-indigo-600/15 via-transparent to-transparent blur-[130px] pointer-events-none z-0" />
      <div className="fixed -bottom-[20%] -right-[20%] w-[60vw] h-[60vw] bg-radial from-cyan-500/10 via-transparent to-transparent blur-[130px] pointer-events-none z-0" />

      {/* Main card viewport */}
      <div className="relative w-full max-w-[420px] bg-[#08080c]/80 border border-[#161621] rounded-[2.5rem] backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col justify-center min-h-[520px] z-10 pointer-events-auto">
        
        {!isConfigValid && (
          <div className="absolute top-0 inset-x-0 bg-red-950/40 border-b border-red-800/30 px-6 py-3 text-xs text-red-200 backdrop-blur-md z-30 flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block">Firebase Config Missing</span>
              <span className="text-red-300/80">Please verify <code className="font-mono bg-red-950/60 px-1 rounded">firebase-applet-config.json</code> in workspace.</span>
            </div>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          
          {/* 1. SPLASH SCREEN */}
          {screen === "splash" && (
            <div
              key="splash"
              className="flex flex-col items-center justify-center p-8 text-center space-y-8 relative z-20 pointer-events-auto"
            >
              <div className="relative flex flex-col items-center">
                {/* Subtle Glow Ring */}
                <div className="absolute w-24 h-24 rounded-full bg-indigo-500/10 blur-xl animate-pulse pointer-events-none" />
                <div className="w-20 h-20 rounded-2.5xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.25)] border border-indigo-400/20">
                  <Sparkles size={38} className="text-white" />
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="font-sans font-extrabold text-4xl tracking-tight text-white select-none drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  LINCO
                </h1>
                <p className="text-xs font-semibold text-indigo-400 tracking-wider uppercase font-mono">
                  Locate &bull; Verify &bull; Reunite
                </p>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed max-w-[220px] mx-auto">
                  Because every lost thing has a story.
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="w-28 h-1 bg-[#12121a] rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full animate-pulse"
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
              <div className="text-center space-y-3 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mx-auto mb-2.5 shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-white/5">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-sans font-extrabold text-2xl tracking-tight text-slate-100">
                    Welcome to LINCO
                  </h2>
                  <p className="text-xs font-semibold text-indigo-400 tracking-wide font-mono uppercase">
                    Locate &bull; Verify &bull; Reunite
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[290px] mx-auto">
                    Recover lost belongings safely through trusted citizens and intelligent verification.
                  </p>
                </div>
              </div>

              {/* Button Actions */}
              <div className="space-y-3">
                {/* Email */}
                <button
                  disabled={loading}
                  onClick={() => navigateTo("signup")}
                  className="w-full h-12 rounded-2xl bg-[#0d0e14] hover:bg-[#12131b] border border-[#1c1d29] text-white font-bold text-xs transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md pointer-events-auto"
                >
                  <Mail size={15} className="text-indigo-400 shrink-0" />
                  <span>Get Started with Email</span>
                </button>

                {/* Google */}
                <button
                  disabled={loading}
                  onClick={handleGoogleSignIn}
                  className="w-full h-12 rounded-2xl bg-[#0d0e14] hover:bg-[#12131b] border border-[#1c1d29] text-white font-bold text-xs transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md pointer-events-auto"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.93 1 12 1 7.24 1 3.2 3.73 1.24 7.74l3.8 2.95C5.93 7.33 8.74 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.45c-.28 1.47-1.11 2.72-2.35 3.55l3.65 2.83c2.14-1.97 3.39-4.88 3.39-8.48z" />
                    <path fill="#FBBC05" d="M5.04 10.69C4.81 11.39 4.69 12.13 4.69 12s.12 1.31.35 2.01l-3.8 2.95C.44 15.42 0 13.76 0 12s.44-3.42 1.24-4.96l3.8 2.95z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.96-1.08 7.95-2.91l-3.65-2.83c-1.01.68-2.31 1.08-3.91 1.08-3.26 0-6.07-2.29-7.05-5.36l-3.8 2.95C3.2 20.27 7.24 23 12 23z" />
                  </svg>
                  <span>{loading ? "Connecting..." : "Continue with Google"}</span>
                </button>

                {/* Phone */}
                <button
                  disabled={loading}
                  onClick={() => navigateTo("phone_auth")}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg pointer-events-auto"
                >
                  <svg className="w-4 h-4 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12" y2="18.01" />
                  </svg>
                  <span>Continue with Phone</span>
                </button>
              </div>

              {/* Navigation Footer */}
              <div className="text-center pt-2 pb-2 border-t border-[#161621]/40">
                <span className="text-[11px] text-slate-400 font-medium">
                  Already have an account?{" "}
                  <button 
                    onClick={(e) => {
                      console.log("[DEBUG] [SignIn Link] onClick clicked!");
                      navigateTo("login");
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer hover:underline ml-1 pointer-events-auto"
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
                onClick={(e) => {
                  console.log("[DEBUG] [Login Back Button] onClick clicked!");
                  navigateTo("welcome");
                }}
                className="p-2 rounded-xl bg-[#090a0f]/60 hover:bg-[#0c0d14] text-slate-400 hover:text-white transition inline-flex items-center justify-center cursor-pointer border border-[#1c1c2a] pointer-events-auto"
              >
                <ArrowLeft size={14} />
              </button>

              <div className="space-y-2">
                <h2 className="font-sans font-bold text-xl text-slate-100">Welcome Back</h2>
                <p className="text-xs text-slate-400">Sign in to your LINCO account to resume tracking.</p>
              </div>

              <form onSubmit={(e) => {
                console.log("[DEBUG] [Login Form] onSubmit triggered!");
                handleEmailLogin(e);
              }} className="space-y-4 pt-1">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Email or Username</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <Mail size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="you@domain.com or username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all ${errors.email ? "border-rose-500/50 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-[10px] text-rose-400 font-medium">{errors.email}</span>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        console.log("[DEBUG] [ForgotPassword Link] onClick clicked!");
                        navigateTo("forgot_password");
                      }}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <Lock size={14} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-11! pr-11! h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all ${errors.password ? "border-rose-500/50 focus:border-rose-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-500 hover:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-900/40"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-[10px] text-rose-400 font-medium">{errors.password}</span>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  onClick={() => {
                    console.log("[DEBUG] [Login Submit Button] onClick clicked!");
                  }}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 shadow-lg mt-2 cursor-pointer"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Sign In</span>
                </button>
              </form>

              {/* Create Account link */}
              <div className="text-center pt-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  New to LINCO?{" "}
                  <button
                    onClick={(e) => {
                      console.log("[DEBUG] [Login Footer CreateAccount Link] onClick clicked!");
                      navigateTo("signup");
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer hover:underline ml-1 pointer-events-auto"
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
                onClick={(e) => {
                  console.log("[DEBUG] [Signup Back Button] onClick clicked!");
                  navigateTo("welcome");
                }}
                className="p-2 rounded-xl bg-[#090a0f]/60 hover:bg-[#0c0d14] text-slate-400 hover:text-white transition inline-flex items-center justify-center cursor-pointer border border-[#1c1c2a] pointer-events-auto"
              >
                <ArrowLeft size={14} />
              </button>

              <div className="space-y-1">
                <h2 className="font-sans font-bold text-xl text-slate-100">Create Account</h2>
                <p className="text-xs text-slate-400">Join the smart local guardian network.</p>
              </div>

              <form onSubmit={(e) => {
                console.log("[DEBUG] [Signup Form] onSubmit triggered!");
                handleSignup(e);
              }} className="space-y-3.5 pt-1">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Full Name</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all ${errors.fullName ? "border-rose-500/50 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.fullName && (
                    <span className="text-[10px] text-rose-400 font-medium">{errors.fullName}</span>
                  )}
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Username</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <Sparkles size={14} className="text-slate-500" />
                    </span>
                    <input
                      type="text"
                      placeholder="john_doe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all ${errors.username ? "border-rose-500/50 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.username && (
                    <span className="text-[10px] text-rose-400 font-medium">{errors.username}</span>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Email Address</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <Mail size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all ${errors.email ? "border-rose-500/50 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-[10px] text-rose-400 font-medium">{errors.email}</span>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Password</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <Lock size={14} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-11! pr-11! h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all ${errors.password ? "border-rose-500/50 focus:border-rose-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-500 hover:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-900/40"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-[10px] text-rose-400 font-medium">{errors.password}</span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Confirm Password</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all ${errors.confirmPassword ? "border-rose-500/50 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-[10px] text-rose-400 font-medium">{errors.confirmPassword}</span>
                  )}
                </div>

                {/* Privacy checkbox */}
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptPrivacy}
                      onChange={(e) => setAcceptPrivacy(e.target.checked)}
                      className="mt-0.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500/30 w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                    />
                    <span className="text-[11px] text-slate-400 leading-normal select-none group-hover:text-slate-300 transition-colors">
                      I accept the <span className="text-indigo-400 hover:underline">Privacy Policy</span> and consent to encrypted data sharing.
                    </span>
                  </label>
                  {errors.privacy && (
                    <span className="text-[10px] text-rose-400 block font-medium">{errors.privacy}</span>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  onClick={() => {
                    console.log("[DEBUG] [Signup Submit Button] onClick clicked!");
                  }}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 shadow-lg mt-3 cursor-pointer pointer-events-auto"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Create Account</span>
                </button>
              </form>

              {/* Already have an account */}
              <div className="text-center pt-1.5">
                <span className="text-[11px] text-slate-400 font-medium">
                  Already registered?{" "}
                  <button
                    onClick={(e) => {
                      console.log("[DEBUG] [Signup AlreadyRegistered Button] onClick clicked!");
                      navigateTo("login");
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer hover:underline ml-1 pointer-events-auto"
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
                onClick={(e) => {
                  console.log("[DEBUG] [ForgotPassword Back Button] onClick clicked!");
                  navigateTo("login");
                }}
                className="p-2 rounded-xl bg-[#090a0f]/60 hover:bg-[#0c0d14] text-slate-400 hover:text-white transition inline-flex items-center justify-center cursor-pointer border border-[#1c1c2a] pointer-events-auto"
              >
                <ArrowLeft size={14} />
              </button>

              <div className="space-y-1.5">
                <h2 className="font-sans font-bold text-xl text-slate-100">Reset Password</h2>
                <p className="text-xs text-slate-400">We'll transmit a secure recovery connection link to retrieve control of your profile.</p>
              </div>

              <form onSubmit={(e) => {
                console.log("[DEBUG] [ForgotPassword Form] onSubmit triggered!");
                handleForgotPasswordSubmit(e);
              }} className="space-y-4 pt-1">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Email Address</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <Mail size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="name@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-11! pr-4 h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all ${errors.email ? "border-rose-500/50 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <span className="text-[10px] text-rose-400 font-medium">{errors.email}</span>
                  )}
                </div>

                {/* Send recovery link button */}
                <button
                  type="submit"
                  disabled={loading}
                  onClick={() => console.log("[DEBUG] [ForgotPassword Submit Button] onClick clicked!")}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 shadow-lg mt-2 cursor-pointer"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Send Reset Link</span>
                </button>
              </form>

              {/* Back to sign in option */}
              <div className="text-center pt-2">
                <button
                  onClick={(e) => {
                    console.log("[DEBUG] [ForgotPassword BackToSignIn Button] onClick clicked!");
                    navigateTo("login");
                  }}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer pointer-events-auto"
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
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mx-auto mb-1.5 shadow-sm animate-pulse">
                  <User size={18} className="text-white" />
                </div>
                <h2 className="font-sans font-bold text-xl text-slate-100">Set Up Your Profile</h2>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Complete your profile so citizens can coordinate handovers with you.
                </p>
              </div>

              {/* Avatar Selector */}
              <div className="flex flex-col items-center space-y-2.5">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-full border border-slate-800 hover:border-indigo-500 transition-all overflow-hidden flex items-center justify-center bg-slate-950/60 shadow-lg cursor-pointer"
                  >
                    {avatarUrl.startsWith("linear-gradient") ? (
                      <div 
                        className="w-full h-full flex items-center justify-center text-white text-xl font-black uppercase"
                        style={{ background: avatarUrl }}
                      >
                        {fullName ? fullName.charAt(0) : "U"}
                      </div>
                    ) : (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startCamera}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-500 transition-colors text-slate-400 hover:text-white cursor-pointer shadow"
                  >
                    <Camera size={11} />
                  </button>
                </div>

                {cameraActive ? (
                  <div className="space-y-2 w-full flex flex-col items-center">
                    <div className="relative w-40 aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-inner">
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
                        className="px-2.5 py-1 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                      >
                        Take Snapshot
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        console.log("[DEBUG] [ProfileSetup ChoosePhoto Button] onClick clicked!");
                        fileInputRef.current?.click();
                      }}
                      className="px-2.5 py-1 bg-[#101118] border border-[#1f202c] text-slate-300 font-bold rounded-lg text-[10px] cursor-pointer hover:border-slate-700 flex items-center gap-1"
                    >
                      <Upload size={10} className="text-cyan-400" />
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

              <form onSubmit={(e) => {
                console.log("[DEBUG] [ProfileSetup Form] onSubmit triggered!");
                handleProfileSetupSubmit(e);
              }} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Full Name (Required)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <User size={13} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-11! pr-4 h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Username (Required)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 text-xs font-mono z-10 pointer-events-none">@</span>
                    <input
                      type="text"
                      placeholder="rahul_sharma"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-11! pr-4 h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">City / Neighborhood (Required)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <MapPin size={13} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Kolkata, Salt Lake"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-11! pr-4 h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Short Bio (Optional)</label>
                  <div className="relative flex items-start">
                    <span className="absolute left-3.5 top-3 text-slate-500 z-10 pointer-events-none">
                      <AlignLeft size={13} />
                    </span>
                    <textarea
                      placeholder="Tell us a bit about your neighborhood or typical routes..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={2}
                      className="w-full pl-11! pr-4 py-2.5 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none resize-none transition-all"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  onClick={() => console.log("[DEBUG] [ProfileSetup Submit Button] onClick clicked!")}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 shadow-lg mt-3 cursor-pointer"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Complete Profile Setup</span>
                </button>
              </form>
            </div>
          )}

          {/* 9. PHONE AUTH SCREEN */}
          {screen === "phone_auth" && (
            <div
              key="phone_auth"
              className="p-8 space-y-6 relative z-20 pointer-events-auto"
            >
              {/* Back Button */}
              <button 
                onClick={() => {
                  if (phoneStep === "verify") {
                    setPhoneStep("input");
                  } else {
                    navigateTo("welcome");
                  }
                }}
                className="p-2 rounded-xl bg-[#090a0f]/60 hover:bg-[#0c0d14] text-slate-400 hover:text-white transition inline-flex items-center justify-center cursor-pointer border border-[#1c1c2a] pointer-events-auto"
              >
                <ArrowLeft size={14} />
              </button>

              <div className="space-y-1.5">
                <h2 className="font-sans font-bold text-xl text-slate-100">
                  {phoneStep === "input" ? "Phone Authentication" : "Enter Verification Code"}
                </h2>
                <p className="text-xs text-slate-400">
                  {phoneStep === "input" 
                    ? "Enter your mobile number to transmit a secure OTP code." 
                    : "We have transmitted a secure 6-digit OTP code to your mobile device."}
                </p>
              </div>

              {phoneStep === "input" ? (
                <form onSubmit={handleSendOTP} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Mobile Number</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="h-11 px-2.5 text-xs text-white bg-[#09090c] border border-slate-900 rounded-xl outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+880">+880 (BD)</option>
                        <option value="+977">+977 (NP)</option>
                        <option value="+65">+65 (SG)</option>
                        <option value="+971">+971 (AE)</option>
                      </select>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        value={phoneRaw}
                        onChange={(e) => setPhoneRaw(e.target.value.replace(/[^0-9]/g, ""))}
                        className="flex-1 px-4 h-11 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 shadow-lg mt-2 cursor-pointer"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    <span>Send Secure OTP</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                      className="w-full text-center h-11 text-lg font-bold tracking-[0.5em] text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all"
                      required
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Didn't receive code?</span>
                    {resendTimer > 0 ? (
                      <span className="font-mono text-indigo-400">Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 shadow-lg mt-2 cursor-pointer"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    <span>Verify Code</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
