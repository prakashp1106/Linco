/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

let db: Firestore;
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
    } else if (projectId) {
      console.log(`[FIREBASE-INIT] Initializing with ADC. Project ID: ${projectId}`);
      app = initializeApp({
        projectId,
      });
    } else {
      console.log("[FIREBASE-INIT] Initializing with default Application Default Credentials (zero-config)...");
      app = initializeApp();
    }
  } else {
    console.log("[FIREBASE-INIT] Reusing existing initialized App instance.");
    app = existingApps[0];
  }

  // Use only getFirestore() with the default database
  console.log(`[FIREBASE-INIT] Instantiating Firestore on database: ${configDatabaseId || "default"}...`);
  db = getFirestore(app, configDatabaseId || undefined);
  console.log("[FIREBASE-INIT] Firestore database client ready.");
} catch (error: any) {
  console.error("[FIREBASE-INIT] Critical Error initializing Firebase:", error);
  throw error;
}

export { db };
