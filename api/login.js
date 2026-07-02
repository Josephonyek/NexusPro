// api/login.js - Fixed CommonJS Version
const { adminAuth, adminDb } = require("./firebaseAdmin.js");

module.exports = async function handler(req, res) {
    // Enable Cross-Origin Resource Sharing flags safely
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { email, hashedPassword } = req.body;

    try {
        const apiKey = process.env.FIREBASE_PUBLIC_API_KEY;
        if (!apiKey) {
            throw new Error("Server Misconfiguration: FIREBASE_PUBLIC_API_KEY variable is missing on Vercel settings.");
        }

        // Exchange credentials securely with Google Identity platform
        const identityFetch = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            body: JSON.stringify({ email, password: hashedPassword, returnSecureToken: true }),
            headers: { 'Content-Type': 'application/json' }
        });

        const identityData = await identityFetch.json();
        if (!identityFetch.ok) {
            throw new Error(identityData.error?.message || "Invalid Email or Password Combination.");
        }

        // Look up corresponding authorization flags from Realtime Database node
        const userRef = adminDb.ref(`users/${identityData.localId}`);
        const snapshot = await userRef.once('value');
        const profile = snapshot.val() || {};

        if (profile.status === 'banned' || profile.status === 'suspended') {
            return res.status(403).json({ success: false, message: '🔒 This account node has been suspended.' });
        }

        return res.status(200).json({
            success: true,
            token: identityData.idToken,
            userId: identityData.localId,
            role: profile.role || 'student'
        });

    } catch (error) {
        console.error("Login Route Failure:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};
