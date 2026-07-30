// api/login.js - Secure Production Endpoint
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { email, hashedPassword } = req.body;

    // Load exclusively from environment variables
    const apiKey = process.env.FIREBASE_API_KEY;
    const dbUrl = process.env.FIREBASE_BASE_URL ? process.env.FIREBASE_BASE_URL.replace(/\/$/, "") : null;

    // Guard against unconfigured environment variables
    if (!apiKey || !dbUrl) {
        console.error("Server misconfiguration: Missing FIREBASE_API_KEY or FIREBASE_BASE_URL.");
        return res.status(500).json({ success: false, message: "Internal server authentication setup error." });
    }

    try {
        // 1. Authenticate credentials via REST API
        const identityResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: hashedPassword, returnSecureToken: true }),
        });

        const identityData = await identityResponse.json();
        if (!identityResponse.ok) throw new Error(identityData.error?.message || "Invalid Email or Password credentials.");

        const userId = identityData.localId;
        const idToken = identityData.idToken;

        // 2. Fetch user details from Realtime Database
        const dbResponse = await fetch(`${dbUrl}/users/${userId}.json?auth=${idToken}`);
        const profile = dbResponse.ok ? await dbResponse.json() : null;
        
        const activeRole = profile?.role || 'student';
        const accountStatus = profile?.status || 'active';

        if (accountStatus === 'banned' || accountStatus === 'suspended') {
            return res.status(403).json({ success: false, message: '🔒 This account has been suspended.' });
        }

        return res.status(200).json({
            success: true,
            token: idToken,
            userId: userId,
            role: activeRole
        });

    } catch (error) {
        console.error("Login Endpoint Fault:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};
