import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import fileConfig from "../../firebase-applet-config.json";

// Merge environment variables and fallback JSON configuration
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || fileConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || fileConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || fileConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || fileConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || fileConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || fileConfig.appId,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || fileConfig.firestoreDatabaseId || "ai-studio-lincoailostfound-abf2a1c3-66b5-4e75-b14f-eeee113d7949"
};

console.log("[FirebaseClient] Active configuration loaded:", {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 6)}...` : "MISSING",
  authDomain: firebaseConfig.authDomain || "MISSING",
  projectId: firebaseConfig.projectId || "MISSING",
  storageBucket: firebaseConfig.storageBucket || "MISSING",
  messagingSenderId: firebaseConfig.messagingSenderId || "MISSING",
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.slice(0, 10)}...` : "MISSING",
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
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
const auth = getAuth(app);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

export { app, auth, db, isConfigValid };

