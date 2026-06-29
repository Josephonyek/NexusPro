// api/login.js - Backend Node Endpoint Handler
import { adminAuth, adminDb } from "./firebaseAdmin.js";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    const { email, hashedPassword } = req.body;

    try {
        // Exchange secure credentials with Google identity verification endpoint engine
        const identityFetch = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_PUBLIC_API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({ email, password: hashedPassword, returnSecureToken: true }),
            headers: { 'Content-Type': 'application/json' }
        });

        const identityData = await identityFetch.json();
        if (!identityFetch.ok) throw new Error(identityData.error?.message || "Invalid Credentials");

        // Read metadata properties to extract user group permissions securely
        const userRef = adminDb.ref(`users/${identityData.localId}`);
        const snapshot = await userRef.once('value');
        const profile = snapshot.val() || {};

        if (profile.status === 'banned' || profile.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'This account node is suspended.' });
        }

        return res.status(200).json({
            success: true,
            token: identityData.idToken,
            userId: identityData.localId,
            role: profile.role || 'student'
        });

    } catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
    }
