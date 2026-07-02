// api/firebaseAdmin.js - Fixed CommonJS Version
const admin = require("firebase-admin");

// Pull environmental properties natively from the Vercel hosting platform
const projectId = process.env.FIREBASE_PROJECT_ID;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

// Prevent duplicate app initialization crashes on serverless execution loops
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: projectId,
        databaseURL: databaseURL
    });
}

const adminAuth = admin.auth();
const adminDb = admin.database();

module.exports = { adminAuth, adminDb };
