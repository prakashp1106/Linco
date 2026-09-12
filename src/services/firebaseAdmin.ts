/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let db: Firestore | null = null;
let configDatabaseId = "";

try {
  console.log("[FIREBASE-INIT] Initializing single production Firebase Admin instance...");

  let configProjectId = "";
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      configProjectId = config.projectId || "";
      configDatabaseId = config.firestoreDatabaseId || "";
    }
  } catch (e) {
    console.error("[FIREBASE-INIT] Error reading firebase-applet-config.json:", e);
  }

  let app;
  const existingApps = getApps();

  if (existingApps.length === 0) {
    let projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    if (projectId && projectId.startsWith('"') && projectId.endsWith('"')) {
      projectId = projectId.slice(1, -1);
    }
    if (projectId && projectId.startsWith("'") && projectId.endsWith("'")) {
      projectId = projectId.slice(1, -1);
    }

    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    if (clientEmail && clientEmail.startsWith('"') && clientEmail.endsWith('"')) {
      clientEmail = clientEmail.slice(1, -1);
    }
    if (clientEmail && clientEmail.startsWith("'") && clientEmail.endsWith("'")) {
      clientEmail = clientEmail.slice(1, -1);
    }

    let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
    if (rawPrivateKey && rawPrivateKey.startsWith('"') && rawPrivateKey.endsWith('"')) {
      rawPrivateKey = rawPrivateKey.slice(1, -1);
    }
    if (rawPrivateKey && rawPrivateKey.startsWith("'") && rawPrivateKey.endsWith("'")) {
      rawPrivateKey = rawPrivateKey.slice(1, -1);
    }
    const privateKey = rawPrivateKey?.replace(/\\n/g, "\n").trim();

    if (!projectId && configProjectId) {
      projectId = configProjectId;
    }

    if (projectId && clientEmail && privateKey) {
      console.log(`[FIREBASE-INIT] Initializing with Service Account credentials. Project ID: ${projectId}`);
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log(`[FIREBASE-INIT] Instantiating Firestore on database: ${configDatabaseId || "default"}...`);
      db = getFirestore(app, configDatabaseId || undefined);
      console.log("[FIREBASE-INIT] Firestore database client ready.");
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      console.log(`[FIREBASE-INIT] Initializing with GOOGLE_APPLICATION_CREDENTIALS file. Project ID: ${projectId || "auto"}`);
      app = initializeApp(projectId ? { projectId } : undefined);
      db = getFirestore(app, configDatabaseId || undefined);
      console.log("[FIREBASE-INIT] Firestore database client ready.");
    } else {
      console.log("[FIREBASE-INIT] Service account credentials (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) not provided. Running in high-performance local database mode.");
      db = null;
    }
  } else {
    console.log("[FIREBASE-INIT] Reusing existing initialized App instance.");
    app = existingApps[0];
    db = getFirestore(app, configDatabaseId || undefined);
  }
} catch (error: any) {
  console.error("[FIREBASE-INIT] Critical Error initializing Firebase (will fall back to local file storage):", error);
  db = null;
}

export { db };
