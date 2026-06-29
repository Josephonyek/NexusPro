// api/firebaseAdmin.js
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL
};

// Prevent duplicate initialization crashes during warm reloads
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
}

export const adminAuth = getAuth(app);
export const adminDb = getDatabase(app);
