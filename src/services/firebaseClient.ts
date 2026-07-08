import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUsHs_E6jioC0VOeB8Z6vqj8XBKw75Gho",
  authDomain: "wise-leaf-ljp90.firebaseapp.com",
  projectId: "wise-leaf-ljp90",
  storageBucket: "wise-leaf-ljp90.firebasestorage.app",
  messagingSenderId: "49083692907",
  appId: "1:49083692907:web:464622fdb19a2801e07e2e"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = initializeFirestore(app, {}, "ai-studio-lincoailostfound-abf2a1c3-66b5-4e75-b14f-eeee113d7949");

export { app, auth, db };
