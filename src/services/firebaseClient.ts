import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  browserLocalPersistence, 
  browserPopupRedirectResolver 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } from "firebase/app-check";
import fileConfig from "../../firebase-applet-config.json";

// Merge environment variables and fallback JSON configuration
const metaEnv = (import.meta as any).env || {};

// Helper to cleanse environment variables that might be literally "undefined", "null" or empty strings
const cleanConfigValue = (envVal: any, fileVal: any): string => {
  if (
    envVal === undefined || 
    envVal === null || 
    envVal === "undefined" || 
    envVal === "null" || 
    String(envVal).trim() === ""
  ) {
    return fileVal || "";
  }
  return String(envVal);
};

const firebaseConfig = {
  apiKey: cleanConfigValue(metaEnv.VITE_FIREBASE_API_KEY, fileConfig.apiKey),
  authDomain: cleanConfigValue(metaEnv.VITE_FIREBASE_AUTH_DOMAIN, fileConfig.authDomain),
  projectId: cleanConfigValue(metaEnv.VITE_FIREBASE_PROJECT_ID, fileConfig.projectId),
  storageBucket: cleanConfigValue(metaEnv.VITE_FIREBASE_STORAGE_BUCKET, fileConfig.storageBucket),
  messagingSenderId: cleanConfigValue(metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID, fileConfig.messagingSenderId),
  appId: cleanConfigValue(metaEnv.VITE_FIREBASE_APP_ID, fileConfig.appId)
};

console.log("[FirebaseClient] Active configuration loaded and sanitized:", {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 6)}...` : "MISSING",
  authDomain: firebaseConfig.authDomain || "MISSING",
  projectId: firebaseConfig.projectId || "MISSING",
  storageBucket: firebaseConfig.storageBucket || "MISSING",
  messagingSenderId: firebaseConfig.messagingSenderId || "MISSING",
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.slice(0, 10)}...` : "MISSING",
  source: metaEnv.VITE_FIREBASE_API_KEY ? "environment_variables" : "config_file"
});

// Validate Firebase config presence
const isConfigValid = 
  !!(firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId);

if (!isConfigValid) {
  console.error(
    "CRITICAL FIREBASE CONFIGURATION ERROR: \n" +
    "Firebase config is missing or invalid in both environment variables and firebase-applet-config.json. \n" +
    "Please verify VITE_FIREBASE_API_KEY or your config file settings."
  );
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase App Check Initialization (Separating Dev/Debug tokens from Production)
let appCheck: any = null;
if (typeof window !== "undefined" && isConfigValid) {
  try {
    const recaptchaSiteKey = metaEnv.VITE_RECAPTCHA_V3_SITE_KEY;
    const isDebugMode = metaEnv.DEV || metaEnv.VITE_FIREBASE_APPCHECK_DEBUG === "true";
    const debugToken = metaEnv.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;

    if (isDebugMode && debugToken) {
      // In local development or testing with debug token
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }

    if (recaptchaSiteKey) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log("[FirebaseClient] Firebase App Check initialized with ReCaptchaV3 provider.");
    } else {
      console.log("[FirebaseClient] App Check running in standby mode (VITE_RECAPTCHA_V3_SITE_KEY not configured).");
    }
  } catch (appCheckErr) {
    console.warn("[FirebaseClient] App Check initialization skipped/failed gracefully:", appCheckErr);
  }
}

// Explicitly initialize Auth using modern Firebase v10+ initializeAuth pattern with injected dependencies
let auth;
try {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
  console.log("[FirebaseClient] Auth initialized successfully via initializeAuth with browserLocalPersistence and browserPopupRedirectResolver.");
} catch (e) {
  auth = getAuth(app);
  console.log("[FirebaseClient] Auth instance retrieved via getAuth(app) - already initialized.");
}

const db = getFirestore(app);

export { app, auth, db, appCheck, isConfigValid };

