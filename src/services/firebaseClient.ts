import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Validate Firebase config presence
const isConfigValid = 
  !!(firebaseConfig && 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId);

if (!isConfigValid) {
  console.error(
    "CRITICAL FIREBASE CONFIGURATION ERROR: \n" +
    "Firebase config is missing or invalid in firebase-applet-config.json. \n" +
    "Please run 'set_up_firebase' or configure your credentials in firebase-applet-config.json."
  );
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || "ai-studio-lincoailostfound-abf2a1c3-66b5-4e75-b14f-eeee113d7949");

export { app, auth, db, isConfigValid };
