// api/login.js - Connected directly to your Vercel Variables
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { email, hashedPassword } = req.body;
    
    // MATCHING YOUR VERCEL PANEL SCREENSHOT:
    const apiKey = process.env.FIREBASE_API_KEY; 
    const dbUrl = process.env.FIREBASE_BASE_URL?.replace(/\/$/, "");

    try {
        if (!apiKey || !dbUrl) {
            throw new Error("Missing variable mapping links inside the Vercel cloud dashboard container setup.");
        }

        // 1. Exchange security keys directly via web identity frameworks
        const identityResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: hashedPassword, returnSecureToken: true }),
        });

        const identityData = await identityResponse.json();
        if (!identityResponse.ok) throw new Error(identityData.error?.message || "Invalid Email or Password credentials provided.");

        const userId = identityData.localId;
        const idToken = identityData.idToken;

        // 2. Perform metadata clearance check against real-time node structures
        const dbResponse = await fetch(`${dbUrl}/users/${userId}.json?auth=${idToken}`);
        const profile = dbResponse.ok ? await dbResponse.json() : null;
        
        const activeRole = profile?.role || 'student';
        const accountStatus = profile?.status || 'active';

        if (accountStatus === 'banned' || accountStatus === 'suspended') {
            return res.status(403).json({ success: false, message: '🔒 This account has been flagged and suspended.' });
        }

        return res.status(200).json({
            success: true,
            token: idToken,
            userId: userId,
            role: activeRole
        });

    } catch (error) {
        console.error("Login Endpoint Fault Intercepted:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};
