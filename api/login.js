// api/login.js - Secure REST Framework (No Service Account Required)
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { email, hashedPassword } = req.body;
    const apiKey = process.env.FIREBASE_PUBLIC_API_KEY;
    const dbUrl = process.env.FIREBASE_DATABASE_URL?.replace(/\/$/, "");

    try {
        if (!apiKey || !dbUrl) {
            throw new Error("Missing variables on Vercel settings.");
        }

        // 1. Authenticate user against Google identity platform
        const identityFetch = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: hashedPassword, returnSecureToken: true }),
        });

        const identityData = await identityFetch.json();
        if (!identityFetch.ok) throw new Error(identityData.error?.message || "Invalid email or password.");

        const userId = identityData.localId;
        const idToken = identityData.idToken;

        // 2. Fetch corresponding authorization settings via Realtime Database REST Endpoint
        const dbFetch = await fetch(`${dbUrl}/users/${userId}.json?auth=${idToken}`);
        const profile = dbFetch.ok ? await dbFetch.json() : null;
        
        const activeRole = profile?.role || 'student';
        const accountStatus = profile?.status || 'active';

        if (accountStatus === 'banned' || accountStatus === 'suspended') {
            return res.status(403).json({ success: false, message: '🔒 This account node has been suspended.' });
        }

        return res.status(200).json({
            success: true,
            token: idToken,
            userId: userId,
            role: activeRole
        });

    } catch (error) {
        console.error("Login Endpoint Crash:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};
