import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronLeft, 
  ArrowLeft, 
  Phone, 
  Chrome, 
  Smartphone, 
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
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
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
  | "phone_login" 
  | "otp_verification" 
  | "forgot_password"
  | "profile_setup";

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
  
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  useEffect(() => {
    const checkRedirect = async () => {
      console.log("[AuthFlow] [checkRedirect] Checking Google redirect authentication result...");
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          console.log("[AuthFlow] [checkRedirect] User verified from Google redirect:", {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
          addToast("Signed in successfully with Google!", "success");
          
          const userDocRef = doc(db, "users", user.uid);
          console.log("[AuthFlow] [checkRedirect] Fetching user doc in Firestore for UID:", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("[AuthFlow] [checkRedirect] User Firestore doc exists:", userData);
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
            onLoginSuccess(localProfile.fullName, user.email || "guardian@gmail.com");
          } else {
            console.log("[AuthFlow] [checkRedirect] User Firestore doc does not exist, creating default profile.");
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
            await setDoc(userDocRef, defaultProfile);
            console.log("[AuthFlow] [checkRedirect] Created Firestore default profile at path:", `users/${user.uid}`);
            
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
            onLoginSuccess(defaultProfile.displayName, user.email || "guardian@gmail.com");
          }
        } else {
          console.log("[AuthFlow] [checkRedirect] No pending redirect credentials or user found.");
        }
      } catch (err: any) {
        console.error("[AuthFlow] [checkRedirect] Google Redirect result verification failed:", {
          code: err.code,
          message: err.message,
          error: err
        });
        addToast(getAuthErrorMessage(err), "error");
      }
    };
    checkRedirect();
  }, []);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AuthFlow] [handleEmailLogin] Attempting sign-in with email:", email);
    alert("Entered handleEmailLogin");
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
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
      console.log("[AuthFlow] [handleEmailLogin] Requesting Firebase Auth email/password verification...");
      alert("handleEmailLogin: BEFORE signInWithEmailAndPassword");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      alert("handleEmailLogin: AFTER signInWithEmailAndPassword");
      const user = userCredential.user;
      console.log("[AuthFlow] [handleEmailLogin] Firebase Auth successful. User details:", {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified
      });
      
      const userDocRef = doc(db, "users", user.uid);
      console.log("[AuthFlow] [handleEmailLogin] Fetching user profile from Firestore at users/" + user.uid);
      alert("handleEmailLogin: BEFORE getDoc for users/" + user.uid);
      const userDoc = await getDoc(userDocRef);
      alert("handleEmailLogin: AFTER getDoc for users/" + user.uid);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
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
        onLoginSuccess(localProfile.fullName, email);
      } else {
        console.log("[AuthFlow] [handleEmailLogin] Firestore profile does not exist. Creating default profile...");
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
        alert("handleEmailLogin: BEFORE setDoc for users/" + user.uid);
        await setDoc(userDocRef, defaultProfile);
        alert("handleEmailLogin: AFTER setDoc for users/" + user.uid);
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
        onLoginSuccess(defaultProfile.displayName, email);
      }
    } catch (err: any) {
      console.error("[AuthFlow] [handleEmailLogin] Email Login failed with exception:", {
        code: err.code,
        message: err.message,
        error: err
      });
      alert("handleEmailLogin ERROR: " + (err.message || String(err)));
      addToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AuthFlow] [handleSignup] Initiating Email Registration. Full Name:", fullName, "Email:", email);
    alert("Entered handleSignup");
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
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
      alert("handleSignup: BEFORE createUserWithEmailAndPassword");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      alert("handleSignup: AFTER createUserWithEmailAndPassword");
      const user = userCredential.user;
      console.log("[AuthFlow] [handleSignup] Firebase registration successful. User UID:", user.uid);
      
      // Auto-create initial user doc
      const defaultUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const userDocRef = doc(db, "users", user.uid);
      const defaultProfile = {
        uid: user.uid,
        displayName: fullName.trim(),
        username: defaultUsername,
        bio: "Lost & Found helper on LINCO",
        city: "Kolkata, India",
        photoURL: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        createdAt: Date.now()
      };
      
      console.log("[AuthFlow] [handleSignup] Writing default user profile to Firestore path: users/" + user.uid);
      alert("handleSignup: BEFORE setDoc for users/" + user.uid);
      await setDoc(userDocRef, defaultProfile);
      alert("handleSignup: AFTER setDoc for users/" + user.uid);
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
      setUsername(defaultUsername);
      navigateTo("profile_setup");
    } catch (err: any) {
      console.error("[AuthFlow] [handleSignup] Email Registration failed with exception:", {
        code: err.code,
        message: err.message,
        error: err
      });
      alert("handleSignup ERROR: " + (err.message || String(err)));
      addToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AuthFlow] [handlePhoneSubmit] Requesting SMS verification for Country Code:", countryCode, "Phone:", phoneNumber);
    alert("Entered handlePhoneSubmit");
    const newErrors: Record<string, string> = {};

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required";
    } else if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    }

    if (Object.keys(newErrors).length > 0) {
      console.warn("[AuthFlow] [handlePhoneSubmit] Phone submission validation failed:", newErrors);
      setErrors(newErrors);
      addToast("Please enter a valid phone number.", "error");
      return;
    }

    try {
      setLoading(true);
      const formatPhone = countryCode + cleanPhone;
      console.log("[AuthFlow] [handlePhoneSubmit] Initializing invisible RecaptchaVerifier...", {
        authType: typeof auth,
        authExists: !!auth,
        formatPhone,
        recaptchaId: "recaptcha-container",
        containerExists: !!document.getElementById("recaptcha-container")
      });

      const recaptchaContainer = document.getElementById("recaptcha-container");
      if (!recaptchaContainer) {
        throw new Error("Critical Error: recaptcha-container element not found in DOM.");
      }

      if (!(window as any).recaptchaVerifier) {
        console.log("[AuthFlow] [handlePhoneSubmit] Creating new RecaptchaVerifier instance with correct parameters (auth, container, config)...");
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible"
        });
        console.log("[AuthFlow] [handlePhoneSubmit] RecaptchaVerifier constructed successfully.");
      } else {
        console.log("[AuthFlow] [handlePhoneSubmit] Reusing existing RecaptchaVerifier instance from window.");
      }
      const appVerifier = (window as any).recaptchaVerifier;
      
      console.log("[AuthFlow] [handlePhoneSubmit] Sending Firebase OTP verification to number:", formatPhone);
      alert("handlePhoneSubmit: BEFORE signInWithPhoneNumber");
      const confirmation = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      alert("handlePhoneSubmit: AFTER signInWithPhoneNumber");
      (window as any).confirmationResult = confirmation;
      
      addToast(`OTP code sent successfully to ${countryCode} ${cleanPhone}!`, "success");
      navigateTo("otp_verification");
    } catch (error: any) {
      console.error("Firebase Auth Error");
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      console.error("Custom Data:", error.customData);
      console.error("Stack:", error.stack);
      // Clear instance on error so next attempt can retry fresh
      (window as any).recaptchaVerifier = null;
      alert("handlePhoneSubmit ERROR: " + (error.message || String(error)));
      addToast(getAuthErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanVal.slice(-1);
    setOtp(newOtp);

    // Focus next
    if (index < 5 && cleanVal) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    console.log("[AuthFlow] [handleOtpVerify] Attempting OTP Verification. Submitted Code:", enteredOtp);
    alert("Entered handleOtpVerify");
    
    if (enteredOtp.length < 6) {
      console.warn("[AuthFlow] [handleOtpVerify] Code is less than 6 digits:", enteredOtp);
      addToast("Please enter the full 6-digit verification code.", "error");
      return;
    }

    try {
      setLoading(true);
      const confirmation = (window as any).confirmationResult;
      console.log("[AuthFlow] [handleOtpVerify] Fetching active phone authentication confirmation session...");
      if (!confirmation) {
        console.error("[AuthFlow] [handleOtpVerify] confirmationResult is missing from window global object.");
        throw new Error("No active phone verification session found. Please request a new OTP.");
      }
      console.log("[AuthFlow] [handleOtpVerify] Sending confirmation.confirm with code to Firebase Auth...");
      
      alert("handleOtpVerify: BEFORE confirmation.confirm");
      const result = await confirmation.confirm(enteredOtp);
      alert("handleOtpVerify: AFTER confirmation.confirm");
      const user = result.user;
      console.log("[AuthFlow] [handleOtpVerify] Phone code verified successfully! User UID:", user.uid, "Phone:", user.phoneNumber);
      
      const userDocRef = doc(db, "users", user.uid);
      console.log("[AuthFlow] [handleOtpVerify] Checking Firestore for existing phone profile at users/" + user.uid);
      
      alert("handleOtpVerify: BEFORE getDoc for users/" + user.uid);
      const userDoc = await getDoc(userDocRef);
      alert("handleOtpVerify: AFTER getDoc for users/" + user.uid);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("[AuthFlow] [handleOtpVerify] Firestore profile found:", userData);
        const formattedDate = userData.createdAt ? new Date(userData.createdAt).toLocaleString("en-US", { month: "long", year: "numeric" }) : "July 2026";
        const localProfile = {
          fullName: userData.displayName || user.displayName || "Verified User",
          username: userData.username || `phone_user_${user.uid.slice(0, 5)}`,
          bio: userData.bio || "Lost & Found helper on LINCO",
          location: userData.city || "Kolkata, India",
          memberSince: formattedDate,
          avatar: userData.photoURL || "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          banner: "linear-gradient(120deg, #1e1b4b 0%, #311042 100%)"
        };
        localStorage.setItem("linco_profile_details", JSON.stringify(localProfile));
        localStorage.setItem("linco_profile_is_logged_in", "true");
        addToast("Phone verified and signed in successfully!", "success");
        onLoginSuccess(localProfile.fullName, `${localProfile.username}@linco.org`);
      } else {
        console.log("[AuthFlow] [handleOtpVerify] Firestore profile does not exist. Creating default profile...");
        const defaultUsername = `user_${user.uid.slice(0, 5)}`;
        const defaultProfile = {
          uid: user.uid,
          displayName: "Phone User",
          username: defaultUsername,
          bio: "Lost & Found helper on LINCO",
          city: "Kolkata, India",
          photoURL: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          createdAt: Date.now()
        };
        alert("handleOtpVerify: BEFORE setDoc for users/" + user.uid);
        await setDoc(userDocRef, defaultProfile);
        alert("handleOtpVerify: AFTER setDoc for users/" + user.uid);
        console.log("[AuthFlow] [handleOtpVerify] Default phone user profile created successfully in database.");
        
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
        addToast("Phone verified and signed in successfully!", "success");
        onLoginSuccess(defaultProfile.displayName, `${defaultProfile.username}@linco.org`);
      }
    } catch (error: any) {
      console.error("[AuthFlow] [handleOtpVerify] OTP Verification failed with exception:", {
        code: error.code,
        message: error.message,
        error: error
      });
      alert("handleOtpVerify ERROR: " + (error.message || String(error)));
      addToast(getAuthErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AuthFlow] [handleForgotPasswordSubmit] Requesting password reset email for:", email);
    alert("Entered handleForgotPasswordSubmit");
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
      alert("handleForgotPasswordSubmit: BEFORE sendPasswordResetEmail");
      await sendPasswordResetEmail(auth, email);
      alert("handleForgotPasswordSubmit: AFTER sendPasswordResetEmail");
      console.log("[AuthFlow] [handleForgotPasswordSubmit] Firebase successfully sent reset link email to:", email);
      addToast("Password reset link sent! Check your inbox.", "success");
      navigateTo("login");
    } catch (err: any) {
      console.error("[AuthFlow] [handleForgotPasswordSubmit] Password reset failed with exception:", {
        code: err.code,
        message: err.message,
        error: err
      });
      alert("handleForgotPasswordSubmit ERROR: " + (err.message || String(err)));
      addToast(getAuthErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const isMobileBrowser = (): boolean => {
    if (typeof window === "undefined" || !window.navigator) return false;
    const ua = window.navigator.userAgent || "";
    console.log("[AuthFlow] [isMobileBrowser] UserAgent string detected:", ua);
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|SamsungBrowser|Mobile|CriOS/i.test(ua);
  };

  const handleGoogleLogin = async () => {
    console.log("STEP 1: Google button clicked");
    console.log("[AuthFlow] [handleGoogleLogin] Requesting Google authentication...");
    alert("Entered handleGoogleLogin");
    try {
      setLoading(true);
      console.log("STEP 2: Creating GoogleAuthProvider");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const isMobile = isMobileBrowser();
      console.log(`[AuthFlow] [handleGoogleLogin] Device detection: isMobile=${isMobile}, userAgent="${navigator.userAgent}"`);

      if (isMobile) {
        console.log("STEP 3: Starting authentication");
        console.log("[AuthFlow] [handleGoogleLogin] Mobile browser detected. Triggering signInWithRedirect...");
        alert("handleGoogleLogin: BEFORE signInWithRedirect");
        await signInWithRedirect(auth, provider);
        // Page will redirect, code execution stops here.
        return;
      }

      console.log("STEP 3: Starting authentication");
      console.log("[AuthFlow] [handleGoogleLogin] Desktop browser detected. Triggering signInWithPopup...");
      alert("handleGoogleLogin: BEFORE signInWithPopup");
      const result = await signInWithPopup(auth, provider);
      alert("handleGoogleLogin: AFTER signInWithPopup");
      console.log("STEP 4: Authentication success");
      const user = result.user;
      console.log("[AuthFlow] [handleGoogleLogin] Google Sign-In with popup verified successfully. User UID:", user.uid);
      
      const userDocRef = doc(db, "users", user.uid);
      console.log("[AuthFlow] [handleGoogleLogin] Checking Firestore for Google user at users/" + user.uid);
      alert("handleGoogleLogin: BEFORE getDoc for users/" + user.uid);
      const userDoc = await getDoc(userDocRef);
      alert("handleGoogleLogin: AFTER getDoc for users/" + user.uid);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("[AuthFlow] [handleGoogleLogin] Existing Google profile found:", userData);
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
        addToast("Successfully signed in with Google!", "success");
        onLoginSuccess(localProfile.fullName, user.email || "guardian@gmail.com");
      } else {
        console.log("[AuthFlow] [handleGoogleLogin] Google profile does not exist. Creating default Google user profile...");
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
        alert("handleGoogleLogin: BEFORE setDoc for users/" + user.uid);
        await setDoc(userDocRef, defaultProfile);
        alert("handleGoogleLogin: AFTER setDoc for users/" + user.uid);
        
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
        addToast("Successfully signed in with Google!", "success");
        onLoginSuccess(defaultProfile.displayName, user.email || "guardian@gmail.com");
      }
    } catch (err: any) {
      console.error("Firebase Auth Error");
      console.error("Code:", err.code);
      console.error("Message:", err.message);
      console.error("Custom Data:", err.customData);
      console.error("Stack:", err.stack);

      // Programmatically check if error is due to unauthorized domain or iframe/cookies block
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
      if (err.code === "auth/internal-error" || err.code === "auth/unauthorized-domain") {
        console.warn(
          `[AuthFlow] PROD ALERT: If you are seeing '${err.code}' on domain '${currentHost}', ` +
          `please verify that '${currentHost}' (e.g., lincoindia.onrender.com) is fully added ` +
          `to the "Authorized domains" list in your Firebase Console under Authentication > Settings > Authorized domains.`
        );
      }

      alert("handleGoogleLogin ERROR: " + (err.message || String(err)));
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
    alert("Entered handleProfileSetupSubmit");

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No active user session found.");
      }

      // Unique username validation
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", cleanUsername));
      
      alert("handleProfileSetupSubmit: BEFORE getDocs for unique username");
      const querySnapshot = await getDocs(q);
      alert("handleProfileSetupSubmit: AFTER getDocs for unique username");
      
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
      const profilePayload = {
        uid: user.uid,
        displayName: fullName.trim(),
        username: cleanUsername,
        city: city.trim(),
        bio: bio.trim(),
        photoURL: avatarUrl,
        createdAt: Date.now()
      };

      alert("handleProfileSetupSubmit: BEFORE setDoc for profile");
      await setDoc(userDocRef, profilePayload);
      alert("handleProfileSetupSubmit: AFTER setDoc for profile");

      const formattedDate = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
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
      alert("handleProfileSetupSubmit ERROR: " + (err.message || String(err)));
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
              className="flex flex-col justify-between p-8 space-y-10 h-full relative z-20 pointer-events-auto"
            >
              {/* Header */}
              <div className="text-center space-y-3 pt-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mx-auto mb-2.5 shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-white/5">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-sans font-extrabold text-2xl tracking-tight text-slate-100">
                    Welcome to LINCO
                  </h2>
                  <p className="text-sm font-semibold text-indigo-400 tracking-wide">
                    Because every lost thing has a story.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[290px] mx-auto">
                    Recover lost belongings safely through trusted people and intelligent verification.
                  </p>
                </div>
              </div>

              {/* Button Actions */}
              <div className="space-y-4">
                {/* Google */}
                <button
                  disabled={loading}
                  onClick={(e) => {
                    console.log("[DEBUG] [Google Button] onClick/handleGoogleLogin clicked!");
                    alert("[DEBUG] [Google Button] onClick/handleGoogleLogin clicked!");
                    handleGoogleLogin();
                  }}
                  className="w-full h-12 rounded-2xl bg-[#090a0f] border border-[#1e202a] hover:border-slate-750 font-semibold text-xs text-slate-200 hover:text-white transition-all flex items-center justify-center gap-3.5 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-md pointer-events-auto"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-indigo-400" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                {/* Email */}
                <button
                  onClick={(e) => {
                    console.log("[DEBUG] [Email Button] onClick clicked!");
                    alert("[DEBUG] [Email Button] onClick clicked!");
                    navigateTo("signup");
                  }}
                  className="w-full h-12 rounded-2xl bg-[#090a0f] border border-[#1e202a] hover:border-slate-750 font-semibold text-xs text-slate-200 hover:text-white transition-all flex items-center justify-center gap-3.5 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md pointer-events-auto"
                >
                  <Mail size={16} className="text-cyan-400 shrink-0" />
                  <span>Continue with Email</span>
                </button>

                {/* Phone */}
                <button
                  onClick={(e) => {
                    console.log("[DEBUG] [Phone Button] onClick clicked!");
                    alert("[DEBUG] [Phone Button] onClick clicked!");
                    navigateTo("phone_login");
                  }}
                  className="w-full h-12 rounded-2xl bg-[#090a0f] border border-[#1e202a] hover:border-slate-750 font-semibold text-xs text-slate-200 hover:text-white transition-all flex items-center justify-center gap-3.5 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md pointer-events-auto"
                >
                  <Phone size={16} className="text-violet-400 shrink-0" />
                  <span>Continue with Phone Number</span>
                </button>
              </div>

              {/* Navigation Footer */}
              <div className="text-center pt-2 pb-2">
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
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Email Address</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                      <Mail size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="you@domain.com"
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
                    alert("[DEBUG] [Login Submit Button] onClick clicked!");
                  }}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 shadow-lg mt-2 cursor-pointer"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Sign In</span>
                </button>
              </form>

              {/* Dividers */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#1c1c2a]"></div>
                <span className="flex-shrink mx-3 text-[9px] font-black uppercase text-slate-600 font-mono">or connect with</span>
                <div className="flex-grow border-t border-[#1c1c2a]"></div>
              </div>

              {/* Alternate Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={(e) => {
                    console.log("[DEBUG] [Login Alt Google Button] onClick clicked!");
                    alert("[DEBUG] [Login Alt Google Button] onClick clicked!");
                    handleGoogleLogin();
                  }}
                  className="h-11 rounded-2xl bg-[#090a0f] border border-[#1e202a] hover:border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer pointer-events-auto"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  onClick={(e) => {
                    console.log("[DEBUG] [Login Alt Phone Button] onClick clicked!");
                    alert("[DEBUG] [Login Alt Phone Button] onClick clicked!");
                    navigateTo("phone_login");
                  }}
                  className="h-11 rounded-2xl bg-[#090a0f] border border-[#1e202a] hover:border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer pointer-events-auto"
                >
                  <Phone size={13} className="text-violet-400 shrink-0" />
                  <span>Phone</span>
                </button>
              </div>

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
                    alert("[DEBUG] [Signup Submit Button] onClick clicked!");
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

          {/* 5. PHONE LOGIN SCREEN */}
          {screen === "phone_login" && (
            <div
              key="phone_login"
              className="p-8 space-y-6 relative z-20 pointer-events-auto"
            >
              {/* Back Button */}
              <button 
                onClick={(e) => {
                  console.log("[DEBUG] [PhoneLogin Back Button] onClick clicked!");
                  navigateTo("welcome");
                }}
                className="p-2 rounded-xl bg-[#090a0f]/60 hover:bg-[#0c0d14] text-slate-400 hover:text-white transition inline-flex items-center justify-center cursor-pointer border border-[#1c1c2a] pointer-events-auto"
              >
                <ArrowLeft size={14} />
              </button>

              <div className="space-y-1.5">
                <h2 className="font-sans font-bold text-xl text-slate-100">Verify Your Number</h2>
                <p className="text-xs text-slate-400">We will transmit a 6-digit one-time password code to verify your profile.</p>
              </div>

              <form onSubmit={(e) => {
                console.log("[DEBUG] [PhoneLogin Form] onSubmit triggered!");
                handlePhoneSubmit(e);
              }} className="space-y-4 pt-1">
                {/* Phone Form Field */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono block">Mobile Phone Number</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-20 bg-[#09090c] border border-slate-900 text-xs text-slate-200 outline-none rounded-xl px-2 h-11 text-center font-semibold cursor-pointer focus:border-indigo-500"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+880">🇧🇩 +880</option>
                    </select>
                    <div className="relative flex-1 flex items-center">
                      <span className="absolute left-3.5 text-slate-500 z-10 pointer-events-none">
                        <Phone size={14} />
                      </span>
                      <input
                        type="tel"
                        placeholder="98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={`w-full h-11 pl-11! pr-4 text-xs text-white bg-[#09090c] border border-slate-900 focus:border-indigo-500 rounded-xl outline-none placeholder-slate-500 transition-all ${errors.phone ? "border-rose-500/50 focus:border-rose-500" : ""}`}
                      />
                    </div>
                  </div>
                  {errors.phone && (
                    <span className="text-[10px] text-rose-400 font-medium">{errors.phone}</span>
                  )}
                </div>

                {/* Privacy Assurance info */}
                <div className="p-3 bg-indigo-950/25 border border-indigo-500/10 rounded-xl flex gap-3">
                  <Shield size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Your number is always masked and securely hashed. We only decrypt when matches are approved.
                  </p>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={loading}
                  onClick={() => console.log("[DEBUG] [PhoneLogin Submit Button] onClick clicked!")}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 shadow-lg mt-2 cursor-pointer"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Send OTP</span>
                </button>
              </form>

              {/* Footer link to Welcome */}
              <div className="text-center pt-2">
                <button
                  onClick={(e) => {
                    console.log("[DEBUG] [PhoneLogin ChangeOption Button] onClick clicked!");
                    navigateTo("welcome");
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer pointer-events-auto"
                >
                  Change login option
                </button>
              </div>
            </div>
          )}

          {/* 6. OTP VERIFICATION SCREEN */}
          {screen === "otp_verification" && (
            <div
              key="otp_verification"
              className="p-8 space-y-6 relative z-20 pointer-events-auto"
            >
              {/* Back Button */}
              <button 
                onClick={(e) => {
                  console.log("[DEBUG] [Otp Back Button] onClick clicked!");
                  navigateTo("phone_login");
                }}
                className="p-2 rounded-xl bg-[#090a0f]/60 hover:bg-[#0c0d14] text-slate-400 hover:text-white transition inline-flex items-center justify-center cursor-pointer border border-[#1c1c2a] pointer-events-auto"
              >
                <ArrowLeft size={14} />
              </button>

              <div className="space-y-1.5">
                <h2 className="font-sans font-bold text-xl text-slate-100">Enter Verification Code</h2>
                <p className="text-xs text-slate-400">
                  We sent a 6-digit secure code to your device at <span className="text-indigo-300 font-semibold">{countryCode} {phoneNumber}</span>.
                </p>
              </div>

              <form onSubmit={(e) => {
                console.log("[DEBUG] [Otp Form] onSubmit triggered!");
                handleOtpVerify(e);
              }} className="space-y-5">
                {/* 6-Digit input layout */}
                <div className="flex gap-2 justify-between">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-11 h-12 text-center text-lg font-mono font-black border border-slate-900 bg-[#09090c] rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:scale-105 transition-all text-white p-0! flex items-center justify-center"
                    />
                  ))}
                </div>

                {/* Prompt instructions */}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Didn't receive code?</span>
                  <button
                    type="button"
                    onClick={() => {
                      console.log("[DEBUG] [Otp Resend Button] onClick clicked!");
                      addToast("New code dispatched!", "info");
                    }}
                    className="text-cyan-400 font-bold hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>

                <div className="p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-xl text-center">
                  <p className="text-[10px] text-slate-400 leading-normal">
                    💡 Simulated OTP bypass: enter any 6 digits (e.g., <strong className="text-cyan-400">123456</strong>) to verify immediately.
                  </p>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading}
                  onClick={() => console.log("[DEBUG] [Otp Submit Button] onClick clicked!")}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75 shadow-lg cursor-pointer"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>Verify OTP</span>
                </button>
              </form>
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

        </AnimatePresence>

      </div>
    </div>
  );
}
